require('dotenv').config(); // harus paling awal agar process.env terisi sebelum modul lain dimuat

const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 3000;

(async () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.startsWith('ganti_dengan')) {
    console.error('JWT_SECRET belum diset dengan benar di file .env');
    process.exit(1);
  }
  try {
    const [[row]] = await db.query('SELECT DATABASE() AS db');
    console.log(`Terhubung ke database MySQL (${row.db})`);
    app.listen(PORT, () => console.log(`Server Rimbun berjalan di http://localhost:${PORT}`));
  } catch (err) {
    console.error('Gagal terhubung ke database:', err.message);
    process.exit(1);
  }
})();
