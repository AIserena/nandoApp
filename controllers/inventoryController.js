const InventoryStock = require('../models/InventoryStock');

exports.getInventory = async (req, res) => {
    const { filter, value } = req.query;
    if (typeof filter !== 'string' || !InventoryStock.isValidFilterType(filter)) {
        return res.status(400).json({ error: 'Pilih semua stok, No. Stok In, No. Penjualan, atau Nama Barang.' });
    }
    if (filter !== 'semua' && (typeof value !== 'string' || !value.trim())) {
        return res.status(400).json({ error: 'Masukkan kata kunci pencarian inventory.' });
    }
    if (typeof value === 'string' && value.trim().length > 100) {
        return res.status(400).json({ error: 'Kata kunci maksimal 100 karakter.' });
    }

    try {
        const inventory = await InventoryStock.search(filter, typeof value === 'string' ? value.trim() : '');
        const unallocated = filter === 'semua' || filter === 'no_stok_in'
            ? await InventoryStock.getUnallocatedSales()
            : [];
        res.json({ status: 'Success', data: inventory, unallocated });
    } catch (err) {
        console.error('Gagal mencari inventory:', err);
        res.status(500).json({ error: 'Gagal mencari inventory.' });
    }
};