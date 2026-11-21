const fs = require('fs');
const path = require('path');

// Aiven mewajibkan koneksi SSL. Jika DB_SSL_CA diisi, sertifikat server diverifikasi
// memakai file CA dari Aiven (lebih aman). Jika kosong, SSL tetap dipakai tanpa verifikasi.
function buildSsl() {
  if (process.env.DB_SSL !== 'true') return undefined;
  if (process.env.DB_SSL_CA) {
    const caPath = path.resolve(__dirname, '../../', process.env.DB_SSL_CA);
    if (!fs.existsSync(caPath)) {
      throw new Error(`File CA tidak ditemukan: ${caPath}. Unduh dari Aiven Console atau kosongkan DB_SSL_CA.`);
    }
    return { ca: fs.readFileSync(caPath), rejectUnauthorized: true };
  }
  return { rejectUnauthorized: false };
}

// Konfigurasi koneksi TANPA nama database (dipakai migrate.js untuk membuat database).
const baseConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: buildSsl(),
};

module.exports = { baseConfig };
