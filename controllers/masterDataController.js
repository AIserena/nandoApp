const MasterData = require('../models/MasterData');

const definitions = {
    barang: {
        label: 'barang',
        key: 'kode_barang',
        fields: {
            kode_barang: { required: true, maxLength: 50 },
            nama_barang: { required: true, maxLength: 100 },
            satuan: { required: true, maxLength: 20 },
            satuan_harga: { required: true, numeric: true }
        }
    },
    supplier: {
        label: 'supplier',
        key: 'kode_supplier',
        fields: {
            kode_supplier: { required: true, maxLength: 50 },
            nama_supplier: { required: true, maxLength: 100 },
            no_telp: { maxLength: 20 },
            alamat: {}
        }
    },
    pelanggan: {
        label: 'pelanggan',
        key: 'kode_pelanggan',
        fields: {
            kode_pelanggan: { required: true, maxLength: 50 },
            nama_pelanggan: { required: true, maxLength: 100 },
            alamat: {}
        }
    }
};

function validateValues(definition, body, isCreate) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { error: 'Data tidak valid.' };
    }

    const values = {};
    for (const [field, options] of Object.entries(definition.fields)) {
        if (!isCreate && field === definition.key) continue;
        const value = body[field];
        if (value == null || value === '') {
            if (options.required) return { error: `${field} wajib diisi.` };
            values[field] = null;
            continue;
        }
        if (options.numeric) {
            const number = Number(value);
            if (!Number.isFinite(number) || number < 0 || number > 9999999999.99) {
                return { error: 'Harga satuan harus berupa angka nol atau lebih.' };
            }
            values[field] = number;
            continue;
        }
        if (typeof value !== 'string') {
            return { error: `${field} tidak valid.` };
        }
        const text = value.trim();
        if (!text && options.required) return { error: `${field} wajib diisi.` };
        if (options.maxLength && text.length > options.maxLength) {
            return { error: `${field} maksimal ${options.maxLength} karakter.` };
        }
        values[field] = text || null;
    }
    return { values };
}

function createMasterDataController(entity) {
    const definition = definitions[entity];
    if (!definition) throw new Error(`Master data tidak dikenal: ${entity}`);

    return {
        getAll: async (req, res) => {
            try {
                res.json({ status: 'Success', data: await MasterData.getAll(entity) });
            } catch (err) {
                console.error(`Gagal mengambil daftar ${definition.label}:`, err);
                res.status(500).json({ error: `Gagal mengambil daftar ${definition.label}.` });
            }
        },

        getById: async (req, res) => {
            try {
                const item = await MasterData.findById(entity, req.params.id);
                if (!item) return res.status(404).json({ error: `${definition.label} tidak ditemukan.` });
                res.json({ status: 'Success', data: item });
            } catch (err) {
                console.error(`Gagal mengambil detail ${definition.label}:`, err);
                res.status(500).json({ error: `Gagal mengambil detail ${definition.label}.` });
            }
        },

        create: async (req, res) => {
            const { values, error } = validateValues(definition, req.body, true);
            if (error) return res.status(400).json({ error });

            try {
                const id = await MasterData.create(entity, values);
                const item = await MasterData.findById(entity, id);
                res.status(201).json({ status: 'Success', data: item });
            } catch (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: `Kode ${definition.label} sudah digunakan.` });
                }
                console.error(`Gagal membuat ${definition.label}:`, err);
                res.status(500).json({ error: `Gagal membuat ${definition.label}.` });
            }
        },

        update: async (req, res) => {
            const { values, error } = validateValues(definition, req.body, false);
            if (error) return res.status(400).json({ error });

            try {
                const existing = await MasterData.findById(entity, req.params.id);
                if (!existing) return res.status(404).json({ error: `${definition.label} tidak ditemukan.` });
                await MasterData.update(entity, req.params.id, values);
                res.json({ status: 'Success', data: await MasterData.findById(entity, req.params.id) });
            } catch (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: `Kode ${definition.label} sudah digunakan.` });
                }
                console.error(`Gagal memperbarui ${definition.label}:`, err);
                res.status(500).json({ error: `Gagal memperbarui ${definition.label}.` });
            }
        },

        delete: async (req, res) => {
            try {
                const deleted = await MasterData.delete(entity, req.params.id);
                if (!deleted) return res.status(404).json({ error: `${definition.label} tidak ditemukan.` });
                res.json({ status: 'Success', message: `${definition.label} berhasil dihapus.` });
            } catch (err) {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    return res.status(409).json({ error: `${definition.label} masih dipakai transaksi sehingga tidak dapat dihapus.` });
                }
                console.error(`Gagal menghapus ${definition.label}:`, err);
                res.status(500).json({ error: `Gagal menghapus ${definition.label}.` });
            }
        }
    };
}

module.exports = createMasterDataController;
