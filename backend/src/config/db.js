const mysql = require('mysql2/promise');
const { baseConfig } = require('./dbConfig');

// Connection pool: koneksi dipakai ulang sehingga lebih efisien daripada
// membuka koneksi baru di setiap request.
const pool = mysql.createPool({
  ...baseConfig,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true, // kolom DECIMAL (harga) dikembalikan sebagai number, bukan string
});

module.exports = pool;
