const db = require('../config/db');

class User {
    static async findByUsername(username) {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE username = ? AND status = "active"', 
            [username]
        );
        return rows[0];
    }

    static async updateLastLogin(id) {
        await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [id]);
    }

    static async getAll() {
        const [rows] = await db.query(
            'SELECT id, username, nama, role FROM users ORDER BY id'
        );
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query(
            'SELECT id, username, no_telp, role FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async create({ username, nama, role, no_telp, password }) {
        const [result] = await db.query(
            'INSERT INTO users (username, nama, role, no_telp, password, status) VALUES (?, ?, ?, ?, ?, ?)',
            [username, nama, role, no_telp, password, 'active']
        );
        return result.insertId;
    }

    static async update(id, { username, no_telp, password, role }) {
        await db.query(
            'UPDATE users SET username = ?, no_telp = ?, password = COALESCE(?, password), role = COALESCE(?, role) WHERE id = ?',
            [username, no_telp, password, role, id]
        );
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = User;