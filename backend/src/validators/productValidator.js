const { body, param, query } = require('express-validator');

const id = [param('id').isInt({ min: 1 }).withMessage('ID produk harus angka positif')];

const filter = [
  query('q').optional().trim().isLength({ max: 100 }).withMessage('Kata kunci maksimal 100 karakter'),
  query('id_category').optional().isInt({ min: 1 }).withMessage('id_category harus angka positif'),
  query('jenis').optional().isIn(['tanaman', 'pupuk']).withMessage("Jenis harus 'tanaman' atau 'pupuk'"),
];

// Untuk POST dan PUT. Data form-data selalu berupa teks, express-validator tetap bisa memeriksanya.
const payload = [
  body('id_category').isInt({ min: 1 }).withMessage('id_category wajib berupa angka positif'),
  body('nama_produk').trim().notEmpty().withMessage('Nama produk wajib diisi')
    .isLength({ max: 150 }).withMessage('Nama produk maksimal 150 karakter'),
  body('jenis_produk').optional({ values: 'falsy' }).trim()
    .isLength({ max: 100 }).withMessage('Jenis produk maksimal 100 karakter'),
  body('deskripsi_produk').optional({ values: 'falsy' }).trim(),
  body('harga_produk').isFloat({ min: 0.01 }).withMessage('Harga harus lebih dari 0'),
  body('stok').isInt({ min: 0 }).withMessage('Stok harus angka 0 atau lebih'),
];

module.exports = { id, filter, payload };
