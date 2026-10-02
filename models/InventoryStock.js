const db = require('../config/db');

const filterTypes = new Set(['no_stok_in', 'no_penjualan', 'nama_barang']);

class InventoryStock {
    static isValidFilterType(filterType) {
        return filterTypes.has(filterType);
    }

    static async search(filterType, value) {
        if (!this.isValidFilterType(filterType)) {
            throw new Error('Jenis filter inventory tidak valid.');
        }

        let where;
        let params;
        if (filterType === 'no_stok_in') {
            where = `barang.KodeBarang IN (
                SELECT detail.KodeBarang
                FROM detailstokin detail
                WHERE detail.NoStokIn = ?
            )`;
            params = [value];
        } else if (filterType === 'no_penjualan') {
            where = `barang.KodeBarang IN (
                SELECT detail.KodeBarang
                FROM detailpenjualan detail
                WHERE detail.NoPenjualan = ?
            )`;
            params = [value];
        } else {
            where = 'barang.NamaBarang = ?';
            params = [value];
        }

        const [rows] = await db.query(
            `SELECT barang.KodeBarang AS kode_barang,
                    barang.NamaBarang AS nama_barang,
                    barang.Satuan AS satuan,
                    COALESCE(inventory.StokCurrent, 0) AS stok
             FROM masterbarang barang
             LEFT JOIN inventorystock inventory ON inventory.KodeBarang = barang.KodeBarang
             WHERE ${where}
             ORDER BY barang.NamaBarang, barang.KodeBarang`,
            params
        );
        return rows;
    }
}

module.exports = InventoryStock;
