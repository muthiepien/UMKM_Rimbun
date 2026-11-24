const { body, param, query } = require('express-validator');

const STATUS = ['menunggu_konfirmasi', 'diproses', 'siap_diambil', 'selesai', 'dibatalkan'];

const id = [param('id').isInt({ min: 1 }).withMessage('ID transaksi harus angka positif')];

const filter = [
  query('status').optional().isIn(STATUS).withMessage(`Status harus salah satu dari: ${STATUS.join(', ')}`),
];

// Body: { "items": [ { "id_product": 1, "jumlah": 2 }, ... ] }
// Harga TIDAK diminta dari client; harga selalu diambil dari database.
const create = [
  body('items').isArray({ min: 1, max: 50 }).withMessage('items harus berupa daftar berisi 1-50 produk'),
  body('items.*.id_product').isInt({ min: 1 }).withMessage('id_product harus angka positif'),
  body('items.*.jumlah').isInt({ min: 1, max: 1000 }).withMessage('jumlah harus angka 1-1000'),
];

const status = [
  body('status').isIn(STATUS).withMessage(`Status harus salah satu dari: ${STATUS.join(', ')}`),
];

module.exports = { id, filter, create, status };
