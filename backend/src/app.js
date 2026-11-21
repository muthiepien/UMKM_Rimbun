const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const db = require('./config/db');
const asyncHandler = require('./utils/asyncHandler');
const { success } = require('./utils/response');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ success: true, message: 'API Rimbun berjalan', version: '0.2.0' }));

// Cek kesehatan: memastikan server DAN database terhubung.
app.get('/api/health', asyncHandler(async (req, res) => {
  const [[row]] = await db.query('SELECT DATABASE() AS database_name, NOW() AS server_time');
  success(res, row, 'Server dan database terhubung');
}));

app.use('/api/auth', require('./routes/authRoutes'));
// TODO tahap 2: /api/kategori
// TODO tahap 3: /api/produk (+ upload gambar ke folder uploads/produk)
// TODO tahap 4: /api/transaksi

app.use(notFound);
app.use(errorHandler);

module.exports = app;
