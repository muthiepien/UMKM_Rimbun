// Membuat akun pengujian untuk setiap role (syarat tugas). Jalankan: npm run seed:users
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../src/config/db');

const accounts = [
  { nama: 'Admin Rimbun', email: 'admin@rimbun.com', password: 'admin123', role: 'admin' },
  { nama: 'Pelanggan Uji', email: 'pelanggan@rimbun.com', password: 'pelanggan123', role: 'pelanggan' },
];

(async () => {
  for (const a of accounts) {
    const hash = await bcrypt.hash(a.password, 10);
    await db.execute(
      `INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE nama = VALUES(nama), password = VALUES(password), role = VALUES(role)`,
      [a.nama, a.email, hash, a.role]
    );
    console.log(`OK ${a.role}: ${a.email} / ${a.password}`);
  }
  await db.end();
})().catch((e) => {
  console.error('Gagal membuat akun uji:', e.message);
  process.exit(1);
});
