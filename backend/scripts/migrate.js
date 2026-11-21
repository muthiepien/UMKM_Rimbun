// Menjalankan file SQL di /database/migrations secara berurutan dan mencatatnya di tabel
// schema_migrations, sehingga aman dijalankan berulang (file yang sudah jalan dilewati).
// Jalankan: npm run db:migrate
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { baseConfig } = require('../src/config/dbConfig');

const dir = path.resolve(__dirname, '../../database/migrations');

(async () => {
  const name = process.env.DB_NAME;
  if (!/^[A-Za-z0-9_]+$/.test(name || '')) {
    throw new Error('DB_NAME kosong atau mengandung karakter tidak valid (hanya huruf, angka, underscore).');
  }

  const conn = await mysql.createConnection({ ...baseConfig, multipleStatements: true });
  console.log(`Terhubung ke server MySQL ${baseConfig.host}`);

  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${name}\``);
  await conn.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       filename VARCHAR(255) PRIMARY KEY,
       applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     )`
  );

  const [rows] = await conn.query('SELECT filename FROM schema_migrations');
  const done = new Set(rows.map((r) => r.filename));
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    if (done.has(file)) {
      console.log(`- lewati  ${file} (sudah dijalankan)`);
      continue;
    }
    await conn.query(fs.readFileSync(path.join(dir, file), 'utf8'));
    await conn.query('INSERT INTO schema_migrations (filename) VALUES (?)', [file]);
    console.log(`- selesai ${file}`);
  }

  console.log(`Migrasi selesai pada database "${name}".`);
  await conn.end();
})().catch((e) => {
  console.error('Migrasi gagal:', e.message);
  process.exit(1);
});
