const bcrypt = require('bcryptjs');
const User = require('../models/Users');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.getAll();
        res.json({ status: 'Success', data: users });
    } catch (err) {
        console.error('Gagal mengambil daftar user:', err);
        res.status(500).json({ error: 'Gagal mengambil daftar user.' });
    }
};

exports.getUserById = async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({ error: 'ID user tidak valid.' });
    }

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'User tidak ditemukan.' });
        }
        res.json({ status: 'Success', data: user });
    } catch (err) {
        console.error('Gagal mengambil detail user:', err);
        res.status(500).json({ error: 'Gagal mengambil detail user.' });
    }
};

exports.createUser = async (req, res) => {
    const { username, nama, role, no_telp, password } = req.body || {};

    if (String(req.user?.role || '').toLowerCase() !== 'admin') {
        return res.status(403).json({ error: 'Hanya admin yang dapat menambahkan user.' });
    }
    if (typeof username !== 'string' || !username.trim()) {
        return res.status(400).json({ error: 'Username wajib diisi.' });
    }
    if (typeof nama !== 'string' || !nama.trim()) {
        return res.status(400).json({ error: 'Nama wajib diisi.' });
    }
    if (!['admin', 'staff', 'gudang'].includes(role)) {
        return res.status(400).json({ error: 'Role harus admin, staff, atau gudang.' });
    }
    if (typeof password !== 'string' || !password) {
        return res.status(400).json({ error: 'Password wajib diisi.' });
    }
    if (Buffer.byteLength(password, 'utf8') > 72) {
        return res.status(400).json({ error: 'Password maksimal 72 byte.' });
    }
    if (no_telp != null && typeof no_telp !== 'string') {
        return res.status(400).json({ error: 'Nomor telepon tidak valid.' });
    }
    if (no_telp && no_telp.trim().length > 20) {
        return res.status(400).json({ error: 'Nomor telepon maksimal 20 karakter.' });
    }

    try {
        const id = await User.create({
            username: username.trim(),
            nama: nama.trim(),
            role,
            no_telp: no_telp?.trim() || null,
            password: await bcrypt.hash(password, 10)
        });
        const createdUser = await User.findById(id);
        res.status(201).json({ status: 'Success', data: createdUser });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Username sudah digunakan.' });
        }
        console.error('Gagal membuat user:', err);
        res.status(500).json({ error: 'Gagal membuat user.' });
    }
};

exports.updateUser = async (req, res) => {
    const { username, no_telp, password, role } = req.body || {};
    const id = Number(req.params.id);
    const isAdmin = String(req.user?.role || '').toLowerCase() === 'admin';

    if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({ error: 'ID user tidak valid.' });
    }
    if (role !== undefined && !isAdmin) {
        return res.status(403).json({ error: 'Hanya admin yang dapat mengubah role user.' });
    }
    if (role !== undefined && !['admin', 'staff', 'gudang'].includes(role)) {
        return res.status(400).json({ error: 'Role harus admin, staff, atau gudang.' });
    }
    if (typeof username !== 'string' || !username.trim()) {
        return res.status(400).json({ error: 'Username wajib diisi.' });
    }
    if (no_telp != null && typeof no_telp !== 'string') {
        return res.status(400).json({ error: 'Nomor telepon tidak valid.' });
    }
    if (no_telp && no_telp.trim().length > 20) {
        return res.status(400).json({ error: 'Nomor telepon maksimal 20 karakter.' });
    }
    if (password != null && typeof password !== 'string') {
        return res.status(400).json({ error: 'Password tidak valid.' });
    }
    if (password && Buffer.byteLength(password, 'utf8') > 72) {
        return res.status(400).json({ error: 'Password maksimal 72 byte.' });
    }

    try {
        const existingUser = await User.findById(id);
        if (!existingUser) {
            return res.status(404).json({ error: 'User tidak ditemukan.' });
        }

        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
        await User.update(id, {
            username: username.trim(),
            no_telp: no_telp?.trim() || null,
            password: hashedPassword,
            role: isAdmin ? role ?? null : null
        });

        const updatedUser = await User.findById(id);
        res.json({ status: 'Success', data: updatedUser });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Username sudah digunakan.' });
        }
        console.error('Gagal memperbarui user:', err);
        res.status(500).json({ error: 'Gagal memperbarui user.' });
    }
};

exports.deleteUser = async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({ error: 'ID user tidak valid.' });
    }

    try {
        const deleted = await User.delete(id);
        if (!deleted) {
            return res.status(404).json({ error: 'User tidak ditemukan.' });
        }
        res.json({ status: 'Success', message: 'User berhasil dihapus.' });
    } catch (err) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ error: 'User masih terkait dengan data lain dan tidak dapat dihapus.' });
        }
        console.error('Gagal menghapus user:', err);
        res.status(500).json({ error: 'Gagal menghapus user.' });
    }
};
