const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const db = require('./config/db');
const asyncHandler = require('./utils/asyncHandler');
const { success } = require('./utils/response');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

// crossOriginResourcePolicy "cross-origin": agar gambar dari /uploads bisa dimuat oleh aplikasi/web lain.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(express.json());

// Gambar yang diupload dapat dibuka lewat http://host:3000/uploads/produk/<nama-file>
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => res.json({ success: true, message: 'API Rimbun berjalan', version: '0.4.0' }));

// Cek kesehatan: memastikan server DAN database terhubung.
app.get('/api/health', asyncHandler(async (req, res) => {
  const [[row]] = await db.query('SELECT DATABASE() AS database_name, NOW() AS server_time');
  success(res, row, 'Server dan database terhubung');
}));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
// TODO tahap 4: /api/transaksi

app.use(notFound);
app.use(errorHandler);

module.exports = app;
