const { body, param, query } = require('express-validator');

const STATUS = ['menunggu_konfirmasi', 'diproses', 'siap_diambil', 'selesai', 'dibatalkan'];
const METODE = ['tunai', 'transfer', 'qris'];

const id = [param('id').isInt({ min: 1 }).withMessage('ID transaksi harus angka positif')];

const filter = [
  query('status').optional().isIn(STATUS).withMessage(`Status harus salah satu dari: ${STATUS.join(', ')}`),
];

// Checkout mengambil isi KERANJANG user, jadi body hanya berisi metode pembayaran.
// Harga & jumlah tidak pernah dipercaya dari client; semuanya dibaca dari database.
const create = [
  body('metode_pembayaran').optional().isIn(METODE).withMessage(`Metode pembayaran harus salah satu dari: ${METODE.join(', ')}`),
];

const status = [
  body('status').isIn(STATUS).withMessage(`Status harus salah satu dari: ${STATUS.join(', ')}`),
];

// Admin memverifikasi pembayaran: terima (berhasil) atau tolak (ditolak).
const paymentVerify = [
  body('status_pembayaran').isIn(['berhasil', 'ditolak']).withMessage("status_pembayaran harus 'berhasil' atau 'ditolak'"),
];

module.exports = { id, filter, create, status, paymentVerify };
