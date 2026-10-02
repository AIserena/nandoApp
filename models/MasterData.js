const db = require('../config/db');

const entities = {
    barang: {
        table: 'masterbarang',
        keyColumn: 'KodeBarang',
        columns: {
            kode_barang: 'KodeBarang',
            nama_barang: 'NamaBarang',
            satuan: 'Satuan',
            satuan_harga: 'SatuanHarga'
        },
        select: 'masterbarang.KodeBarang AS id, masterbarang.KodeBarang AS kode_barang, masterbarang.NamaBarang AS nama_barang, masterbarang.Satuan AS satuan, masterbarang.SatuanHarga AS satuan_harga, masterbarang.SatuanHarga AS harga, masterbarang.SatuanHarga AS harga_jual, COALESCE(inventory.StokCurrent, 0) AS stok',
        joins: 'LEFT JOIN inventorystock AS inventory ON inventory.KodeBarang = masterbarang.KodeBarang',
        qualifiedTable: 'masterbarang'
    },
    supplier: {
        table: 'mastersupplier',
        keyColumn: 'KodeSupplier',
        columns: {
            kode_supplier: 'KodeSupplier',
            nama_supplier: 'NamaSupplier',
            no_telp: 'NoTelephone',
            alamat: 'Alamat'
        },
        select: 'KodeSupplier AS id, KodeSupplier AS kode_supplier, NamaSupplier AS nama_supplier, NoTelephone AS no_telp, Alamat AS alamat'
    },
    pelanggan: {
        table: 'masterpelanggan',
        keyColumn: 'KodePelanggan',
        columns: {
            kode_pelanggan: 'KodePelanggan',
            nama_pelanggan: 'NamaPelanggan',
            alamat: 'Alamat'
        },
        select: 'KodePelanggan AS id, KodePelanggan AS kode_pelanggan, NamaPelanggan AS nama_pelanggan, Alamat AS alamat'
    }
};

class MasterData {
    static getConfig(entity) {
        const config = entities[entity];
        if (!config) throw new Error(`Master data tidak dikenal: ${entity}`);
        return config;
    }

    static async getAll(entity) {
        const config = this.getConfig(entity);
        const table = config.qualifiedTable || config.table;
        const [rows] = await db.query(
            `SELECT ${config.select} FROM ?? ${config.joins || ''} ORDER BY ??.??`,
            [config.table, table, config.keyColumn]
        );
        return rows;
    }

    static async findById(entity, id) {
        const config = this.getConfig(entity);
        const table = config.qualifiedTable || config.table;
        const [rows] = await db.query(
            `SELECT ${config.select} FROM ?? ${config.joins || ''} WHERE ??.?? = ?`,
            [config.table, table, config.keyColumn, id]
        );
        return rows[0];
    }

    static async create(entity, values) {
        const config = this.getConfig(entity);
        const columns = Object.keys(config.columns);
        const dbColumns = columns.map(column => config.columns[column]);
        const placeholders = dbColumns.map(() => '?').join(', ');
        const [result] = await db.query(
            `INSERT INTO ?? (${dbColumns.map(() => '??').join(', ')}) VALUES (${placeholders})`,
            [config.table, ...dbColumns, ...columns.map(column => values[column])]
        );
        return values[columns[0]] || result.insertId;
    }

    static async update(entity, id, values) {
        const config = this.getConfig(entity);
        const columns = Object.keys(values);
        const assignments = columns.map(() => '?? = ?').join(', ');
        const params = columns.flatMap(column => [config.columns[column], values[column]]);
        await db.query(
            `UPDATE ?? SET ${assignments} WHERE ?? = ?`,
            [config.table, ...params, config.keyColumn, id]
        );
    }

    static async delete(entity, id) {
        const config = this.getConfig(entity);
        const [result] = await db.query(
            'DELETE FROM ?? WHERE ?? = ?',
            [config.table, config.keyColumn, id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = MasterData;
