require('dotenv').config(); // Wajib di baris paling atas
const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'nandoapp',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = db;