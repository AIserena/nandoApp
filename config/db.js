require('dotenv').config(); // Wajib di baris paling atas
const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', // Membaca password dari .env
    database: process.env.DB_NAME || 'nandoapp',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = db;