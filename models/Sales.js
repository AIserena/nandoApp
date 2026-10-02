const db = require('../config/db');

class Sales {
    static async getAll() {
        const [rows] = await db.query(
            `SELECT NoPenjualan AS no_penjualan, Tanggal AS tanggal
             FROM penjualan
             ORDER BY Tanggal DESC, NoPenjualan DESC`
        );
        return rows;
    }

    static async findById(noPenjualan) {
        const [headers] = await db.query(
            `SELECT p.NoPenjualan AS no_penjualan, p.Tanggal AS tanggal,
                    p.KodePelanggan AS kode_pelanggan, pelanggan.NamaPelanggan AS nama_pelanggan,
                    p.GrandTotal AS grand_total
             FROM penjualan p
             LEFT JOIN masterpelanggan pelanggan ON pelanggan.KodePelanggan = p.KodePelanggan
             WHERE p.NoPenjualan = ?`,
            [noPenjualan]
        );
        if (!headers.length) return null;

        const [details] = await db.query(
            `SELECT d.KodeBarang AS kode_barang, barang.NamaBarang AS nama_barang,
                    barang.Satuan AS satuan, d.Qty AS qty,
                    d.SatuanHarga AS satuan_harga, d.Subtotal AS subtotal
             FROM detailpenjualan d
             LEFT JOIN masterbarang barang ON barang.KodeBarang = d.KodeBarang
             WHERE d.NoPenjualan = ?
             ORDER BY d.IDDetail`,
            [noPenjualan]
        );
        return { ...headers[0], details };
    }

    static async create({ no_penjualan, tanggal, kode_pelanggan, items }) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const productCodes = [...new Set(items.map(item => item.kode_barang))].sort();
            const productState = new Map();
            let grandTotalCents = 0;

            for (const code of productCodes) {
                const [products] = await connection.query(
                    `SELECT barang.NamaBarang AS nama_barang, barang.SatuanHarga AS satuan_harga,
                            COALESCE(inventory.StokCurrent, 0) AS stok
                     FROM masterbarang barang
                     LEFT JOIN inventorystock inventory ON inventory.KodeBarang = barang.KodeBarang
                     WHERE barang.KodeBarang = ?
                     FOR UPDATE`,
                    [code]
                );
                if (!products.length) {
                    const error = new Error(`Barang ${code} tidak ditemukan.`);
                    error.statusCode = 400;
                    throw error;
                }
                productState.set(code, {
                    ...products[0],
                    stok: Number(products[0].stok),
                    satuan_harga: Number(products[0].satuan_harga)
                });
            }

            const normalizedItems = items.map(item => {
                const product = productState.get(item.kode_barang);
                const satuanHargaCents = Math.round(product.satuan_harga * 100);
                const subtotalCents = item.qty * satuanHargaCents;
                grandTotalCents += subtotalCents;
                return {
                    ...item,
                    product,
                    satuan_harga: satuanHargaCents / 100,
                    subtotal: subtotalCents / 100
                };
            });

            const quantityByCode = new Map();
            normalizedItems.forEach(item => {
                quantityByCode.set(
                    item.kode_barang,
                    (quantityByCode.get(item.kode_barang) || 0) + item.qty
                );
            });
            for (const [code, qty] of quantityByCode) {
                const product = productState.get(code);
                if (product.stok < qty) {
                    const error = new Error(`Stok ${product.nama_barang} tidak cukup. Tersedia ${product.stok}.`);
                    error.statusCode = 409;
                    throw error;
                }
            }

            if (!Number.isSafeInteger(grandTotalCents) || grandTotalCents > 999999999999) {
                const error = new Error('Grand total melebihi batas maksimum transaksi.');
                error.statusCode = 400;
                throw error;
            }
            const grandTotal = grandTotalCents / 100;

            await connection.query(
                `INSERT INTO penjualan (NoPenjualan, Tanggal, KodePelanggan, GrandTotal, is_synced)
                 VALUES (?, ?, ?, ?, 0)`,
                [no_penjualan, tanggal, kode_pelanggan, grandTotal]
            );

            for (const item of normalizedItems) {
                await connection.query(
                    `INSERT INTO detailpenjualan (NoPenjualan, KodeBarang, Qty, SatuanHarga, Subtotal)
                     VALUES (?, ?, ?, ?, ?)`,
                    [no_penjualan, item.kode_barang, item.qty, item.satuan_harga, item.subtotal]
                );
            }

            for (const [code, qty] of quantityByCode) {
                const product = productState.get(code);
                const closingStock = product.stok - qty;
                await connection.query(
                    'UPDATE inventorystock SET StokCurrent = ? WHERE KodeBarang = ?',
                    [closingStock, code]
                );
                await connection.query(
                    `INSERT INTO inventorylog
                        (KodeBarang, JenisTransaksi, NoReferensi, QtyMasuk, QtyKeluar, StokAwal, StokAkhir, Keterangan)
                     VALUES (?, 'penjualan', ?, 0, ?, ?, ?, ?)`,
                    [
                        code,
                        no_penjualan,
                        qty,
                        product.stok,
                        closingStock,
                        `Penjualan ${no_penjualan}`
                    ]
                );
            }

            await connection.commit();
            return { no_penjualan, grand_total: grandTotal };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }
}

module.exports = Sales;
