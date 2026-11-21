const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

// GET /api/categories?jenis=pupuk  -> daftar kategori (publik)
exports.list = asyncHandler(async (req, res) => {
  const { jenis } = req.query;
  const [rows] = jenis
    ? await db.execute('SELECT * FROM categories WHERE jenis_category = ? ORDER BY id_category', [jenis])
    : await db.execute('SELECT * FROM categories ORDER BY id_category');
  success(res, rows);
});

// GET /api/categories/:id -> detail kategori (publik)
exports.detail = asyncHandler(async (req, res) => {
  const [rows] = await db.execute('SELECT * FROM categories WHERE id_category = ?', [req.params.id]);
  if (!rows.length) throw new AppError('Kategori tidak ditemukan', 404);
  success(res, rows[0]);
});

// POST /api/categories -> tambah kategori (admin)
exports.create = asyncHandler(async (req, res) => {
  const { nama_category, jenis_category, deskripsi = null } = req.body;
  const [result] = await db.execute(
    'INSERT INTO categories (nama_category, jenis_category, deskripsi) VALUES (?, ?, ?)',
    [nama_category, jenis_category, deskripsi]
  );
  const [rows] = await db.execute('SELECT * FROM categories WHERE id_category = ?', [result.insertId]);
  success(res, rows[0], 'Kategori berhasil ditambahkan', 201);
});

// PUT /api/categories/:id -> ubah kategori (admin)
exports.update = asyncHandler(async (req, res) => {
  const { nama_category, jenis_category, deskripsi = null } = req.body;
  const [exist] = await db.execute('SELECT id_category FROM categories WHERE id_category = ?', [req.params.id]);
  if (!exist.length) throw new AppError('Kategori tidak ditemukan', 404);

  await db.execute(
    'UPDATE categories SET nama_category = ?, jenis_category = ?, deskripsi = ? WHERE id_category = ?',
    [nama_category, jenis_category, deskripsi, req.params.id]
  );
  const [rows] = await db.execute('SELECT * FROM categories WHERE id_category = ?', [req.params.id]);
  success(res, rows[0], 'Kategori berhasil diubah');
});

// DELETE /api/categories/:id -> hapus kategori (admin)
// Jika masih dipakai produk, MySQL menolak (foreign key) dan errorHandler membalas 409.
exports.remove = asyncHandler(async (req, res) => {
  const [exist] = await db.execute('SELECT id_category FROM categories WHERE id_category = ?', [req.params.id]);
  if (!exist.length) throw new AppError('Kategori tidak ditemukan', 404);

  await db.execute('DELETE FROM categories WHERE id_category = ?', [req.params.id]);
  success(res, null, 'Kategori berhasil dihapus');
});
