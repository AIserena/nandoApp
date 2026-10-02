const StockIn = require('../models/StockIn');

exports.getAllStokIn = async (req, res) => {
    try {
        const data = await StockIn.getAll();
        res.json({ status: 'Success', data });
    } catch (err) {
        console.error('Gagal mengambil daftar stok in:', err);
        res.status(500).json({ error: 'Gagal mengambil daftar stok in.' });
    }
};

exports.getStokInById = async (req, res) => {
    if (!req.params.noStokIn.trim()) {
        return res.status(400).json({ error: 'Nomor stok in tidak valid.' });
    }

    try {
        const stokIn = await StockIn.findById(req.params.noStokIn);
        if (!stokIn) {
            return res.status(404).json({ error: 'Stok in tidak ditemukan.' });
        }
        res.json({ status: 'Success', data: stokIn });
    } catch (err) {
        console.error('Gagal mengambil detail stok in:', err);
        res.status(500).json({ error: 'Gagal mengambil detail stok in.' });
    }
};

exports.createStokIn = async (req, res) => {
    const { no_stok_in, tanggal, kode_supplier, items } = req.body || {};
    if (typeof no_stok_in !== 'string' || !no_stok_in.trim() || no_stok_in.trim().length > 50) {
        return res.status(400).json({ error: 'Nomor stok in wajib diisi (maksimal 50 karakter).' });
    }
    if (typeof tanggal !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
        return res.status(400).json({ error: 'Tanggal stok in tidak valid.' });
    }
    const [year, month, day] = tanggal.split('-').map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));
    if (parsedDate.getUTCFullYear() !== year || parsedDate.getUTCMonth() !== month - 1 ||
        parsedDate.getUTCDate() !== day) {
        return res.status(400).json({ error: 'Tanggal stok in tidak valid.' });
    }
    if (kode_supplier != null && (typeof kode_supplier !== 'string' || kode_supplier.length > 50)) {
        return res.status(400).json({ error: 'Supplier tidak valid.' });
    }
    if (!Array.isArray(items) || items.length < 1 || items.length > 100) {
        return res.status(400).json({ error: 'Tambahkan minimal satu barang (maksimal 100 baris).' });
    }

    const cleanItems = [];
    for (const item of items) {
        if (!item || typeof item.kode_barang !== 'string' || !item.kode_barang.trim() ||
            item.kode_barang.trim().length > 50) {
            return res.status(400).json({ error: 'Kode barang tidak valid.' });
        }
        const qty = Number(item.qty);
        const satuan_harga = Number(item.satuan_harga);
        if (!Number.isSafeInteger(qty) || qty < 1) {
            return res.status(400).json({ error: 'Qty barang harus bilangan bulat minimal 1.' });
        }
        if (!Number.isFinite(satuan_harga) || satuan_harga < 0 || satuan_harga > 9999999999.99) {
            return res.status(400).json({ error: 'Harga satuan harus berupa angka nol atau lebih.' });
        }
        if (Math.abs(satuan_harga * 100 - Math.round(satuan_harga * 100)) > 0.000001) {
            return res.status(400).json({ error: 'Harga satuan maksimal dua angka di belakang koma.' });
        }
        cleanItems.push({ kode_barang: item.kode_barang.trim(), qty, satuan_harga });
    }
    const grandTotalCents = cleanItems.reduce(
        (total, item) => total + item.qty * Math.round(item.satuan_harga * 100),
        0
    );
    if (!Number.isSafeInteger(grandTotalCents) || grandTotalCents > 999999999999) {
        return res.status(400).json({ error: 'Grand total melebihi batas maksimum transaksi.' });
    }

    try {
        const created = await StockIn.create({
            no_stok_in: no_stok_in.trim(),
            tanggal,
            kode_supplier: kode_supplier?.trim() || null,
            items: cleanItems
        });
        res.status(201).json({ status: 'Success', data: created });
    } catch (err) {
        if (err.statusCode === 400) {
            return res.status(400).json({ error: err.message });
        }
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Nomor stok in sudah digunakan.' });
        }
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ error: 'Supplier atau barang tidak ditemukan.' });
        }
        console.error('Gagal membuat transaksi stok in:', err);
        res.status(500).json({ error: 'Gagal membuat transaksi stok in.' });
    }
};