const User = require('../models/Users'); // Sesuaikan nama model Users kamu
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_super_secure_erp_2026';

// PASTIKAN MENGGUNAKAN 'exports.login'
exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username dan password wajib diisi!' });
    }

    try {
        const user = await User.findByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Username atau password salah!' });
        }

        let isMatch = false;
        if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
            isMatch = await bcrypt.compare(password, user.password);
        } else {
            isMatch = (password === user.password);
        }

        if (!isMatch) {
            return res.status(401).json({ error: 'Username atau password salah!' });
        }

        if (typeof User.updateLastLogin === 'function') {
            await User.updateLastLogin(user.id);
        }

        const tokenPayload = { id: user.id, username: user.username, role: user.role, nama: user.nama };
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '12h' });

        res.json({
            status: 'Success',
            message: 'Login Berhasil!',
            token,
            user: tokenPayload
        });
    } catch (err) {
        console.error('Gagal memproses login:', err);
        res.status(500).json({ error: 'Terjadi kesalahan pada server saat login.' });
    }
};