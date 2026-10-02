const MasterBarang = require('../models/MasterBarang');

exports.getAllBarang = async (req, res) => {
    try {
        const barang = await MasterBarang.getAll(); // Sesuaikan dengan fungsi di Model MasterBarang kamu
        res.json({ status: 'Success', data: barang });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};