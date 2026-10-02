const db = require('../config/db');

class StockIn {
    static async getAll() {
        const [rows] = await db.query(
            `SELECT s.NoStokIn AS no_stok_in, s.Tanggal AS tanggal
             FROM stokin s
             ORDER BY s.Tanggal DESC, s.NoStokIn DESC`
        );
        return rows;
    }

    static async findById(noStokIn) {
        const [headers] = await db.query(
            `SELECT s.NoStokIn AS no_stok_in, s.Tanggal AS tanggal,
                    s.KodeSupplier AS kode_supplier, supplier.NamaSupplier AS nama_supplier,
                    s.GrandTotal AS grand_total
             FROM stokin s
             LEFT JOIN mastersupplier supplier ON supplier.KodeSupplier = s.KodeSupplier
             WHERE s.NoStokIn = ?`,
            [noStokIn]
        );
        if (!headers.length) return null;

        const [details] = await db.query(
            `SELECT d.KodeBarang AS kode_barang, barang.NamaBarang AS nama_barang,
                    barang.Satuan AS satuan, d.Qty AS qty,
                    d.SatuanHarga AS satuan_harga, d.Subtotal AS subtotal
             FROM detailstokin d
             LEFT JOIN masterbarang barang ON barang.KodeBarang = d.KodeBarang
             WHERE d.NoStokIn = ?
             ORDER BY d.IDDetail`,
            [noStokIn]
        );
        return { ...headers[0], details };
    }

    static async create({ no_stok_in, tanggal, kode_supplier, items }) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const grandTotalCents = items.reduce(
                (total, item) => total + item.qty * Math.round(item.satuan_harga * 100),
                0
            );
            const grandTotal = grandTotalCents / 100;
            await connection.query(
                `INSERT INTO stokin (NoStokIn, Tanggal, KodeSupplier, GrandTotal, is_synced)
                 VALUES (?, ?, ?, ?, 0)`,
                [no_stok_in, tanggal, kode_supplier, grandTotal]
            );

            for (const item of items) {
                const [products] = await connection.query(
                    'SELECT KodeBarang FROM masterbarang WHERE KodeBarang = ?',
                    [item.kode_barang]
                );
                if (!products.length) {
                    const error = new Error(`Barang ${item.kode_barang} tidak ditemukan.`);
                    error.statusCode = 400;
                    throw error;
                }

                const subtotal = item.qty * Math.round(item.satuan_harga * 100) / 100;
                await connection.query(
                    `INSERT INTO detailstokin (NoStokIn, KodeBarang, Qty, SatuanHarga, Subtotal)
                     VALUES (?, ?, ?, ?, ?)`,
                    [no_stok_in, item.kode_barang, item.qty, item.satuan_harga, subtotal]
                );

                const [stocks] = await connection.query(
                    'SELECT StokCurrent FROM inventorystock WHERE KodeBarang = ? FOR UPDATE',
                    [item.kode_barang]
                );
                const openingStock = stocks.length ? Number(stocks[0].StokCurrent) : 0;
                const closingStock = openingStock + item.qty;
                if (stocks.length) {
                    await connection.query(
                        'UPDATE inventorystock SET StokCurrent = ? WHERE KodeBarang = ?',
                        [closingStock, item.kode_barang]
                    );
                } else {
                    await connection.query(
                        'INSERT INTO inventorystock (KodeBarang, StokCurrent) VALUES (?, ?)',
                        [item.kode_barang, closingStock]
                    );
                }

                await connection.query(
                    `INSERT INTO inventorylog
                        (KodeBarang, JenisTransaksi, NoReferensi, QtyMasuk, QtyKeluar, StokAwal, StokAkhir, Keterangan)
                     VALUES (?, 'Stokin', ?, ?, 0, ?, ?, ?)`,
                    [
                        item.kode_barang,
                        no_stok_in,
                        item.qty,
                        openingStock,
                        closingStock,
                        `Stok In ${no_stok_in}`
                    ]
                );
            }

            await connection.commit();
            return { no_stok_in, grand_total: grandTotal };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }
}

module.exports = StockIn;
