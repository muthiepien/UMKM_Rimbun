const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/produk');

// Produk digabung dengan kategorinya (JOIN) agar client tidak perlu request dua kali.
const SELECT_PRODUK = `SELECT p.*, c.nama_category, c.jenis_category
                       FROM products p JOIN categories c ON c.id_category = p.id_category`;

// gambar_produk bisa berupa URL luar (data seed) atau path lokal "/uploads/produk/xxx.jpg".
const toUrl = (req, p) => {
  if (!p) return null;
  return /^https?:\/\//.test(p) ? p : `${req.protocol}://${req.get('host')}${p}`;
};
const format = (req, row) => ({ ...row, gambar_url: toUrl(req, row.gambar_produk) });

// Hanya file hasil upload (path lokal) yang dihapus dari disk.
const hapusFileLokal = (p) => {
  if (p && p.startsWith('/uploads/produk/')) {
    fs.unlink(path.join(UPLOAD_DIR, path.basename(p)), () => {});
  }
};

// GET /api/products?q=urea&id_category=1&jenis=pupuk (publik)
exports.list = asyncHandler(async (req, res) => {
  const { q, id_category, jenis } = req.query;
  const where = [];
  const params = [];
  if (q) { where.push('p.nama_produk LIKE ?'); params.push(`%${q}%`); }
  if (id_category) { where.push('p.id_category = ?'); params.push(id_category); }
  if (jenis) { where.push('c.jenis_category = ?'); params.push(jenis); }

  const sql = `${SELECT_PRODUK}${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY p.id_product`;
  const [rows] = await db.execute(sql, params);
  success(res, rows.map((r) => format(req, r)));
});

// GET /api/products/:id (publik)
exports.detail = asyncHandler(async (req, res) => {
  const [rows] = await db.execute(`${SELECT_PRODUK} WHERE p.id_product = ?`, [req.params.id]);
  if (!rows.length) throw new AppError('Produk tidak ditemukan', 404);
  success(res, format(req, rows[0]));
});

// POST /api/products (admin) - multipart/form-data, field gambar opsional
exports.create = asyncHandler(async (req, res) => {
  const { id_category, nama_produk, jenis_produk = null, deskripsi_produk = null, harga_produk, stok } = req.body;
  const gambar = req.file ? `/uploads/produk/${req.file.filename}` : null;

  const [result] = await db.execute(
    `INSERT INTO products (id_category, nama_produk, jenis_produk, deskripsi_produk, harga_produk, stok, gambar_produk)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id_category, nama_produk, jenis_produk, deskripsi_produk, harga_produk, stok, gambar]
  );
  const [rows] = await db.execute(`${SELECT_PRODUK} WHERE p.id_product = ?`, [result.insertId]);
  success(res, format(req, rows[0]), 'Produk berhasil ditambahkan', 201);
});

// PUT /api/products/:id (admin) - jika tidak kirim gambar baru, gambar lama dipertahankan
exports.update = asyncHandler(async (req, res) => {
  const { id_category, nama_produk, jenis_produk = null, deskripsi_produk = null, harga_produk, stok } = req.body;
  const [exist] = await db.execute('SELECT gambar_produk FROM products WHERE id_product = ?', [req.params.id]);
  if (!exist.length) throw new AppError('Produk tidak ditemukan', 404);

  const gambar = req.file ? `/uploads/produk/${req.file.filename}` : exist[0].gambar_produk;
  await db.execute(
    `UPDATE products SET id_category = ?, nama_produk = ?, jenis_produk = ?, deskripsi_produk = ?,
            harga_produk = ?, stok = ?, gambar_produk = ? WHERE id_product = ?`,
    [id_category, nama_produk, jenis_produk, deskripsi_produk, harga_produk, stok, gambar, req.params.id]
  );
  if (req.file) hapusFileLokal(exist[0].gambar_produk); // gambar lama diganti -> hapus dari disk

  const [rows] = await db.execute(`${SELECT_PRODUK} WHERE p.id_product = ?`, [req.params.id]);
  success(res, format(req, rows[0]), 'Produk berhasil diubah');
});

// DELETE /api/products/:id (admin) - ditolak 409 jika produk sudah ada di transaksi
exports.remove = asyncHandler(async (req, res) => {
  const [exist] = await db.execute('SELECT gambar_produk FROM products WHERE id_product = ?', [req.params.id]);
  if (!exist.length) throw new AppError('Produk tidak ditemukan', 404);

  await db.execute('DELETE FROM products WHERE id_product = ?', [req.params.id]);
  hapusFileLokal(exist[0].gambar_produk);
  success(res, null, 'Produk berhasil dihapus');
});
