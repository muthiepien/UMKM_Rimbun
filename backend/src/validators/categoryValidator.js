const { body, param, query } = require('express-validator');

const id = [param('id').isInt({ min: 1 }).withMessage('ID kategori harus angka positif')];

const filter = [
  query('jenis').optional().isIn(['tanaman', 'pupuk']).withMessage("Jenis harus 'tanaman' atau 'pupuk'"),
];

// Dipakai untuk POST dan PUT (PUT = ganti seluruh data, jadi aturannya sama).
const payload = [
  body('nama_category').trim().notEmpty().withMessage('Nama kategori wajib diisi')
    .isLength({ max: 100 }).withMessage('Nama kategori maksimal 100 karakter'),
  body('jenis_category').isIn(['tanaman', 'pupuk']).withMessage("Jenis kategori harus 'tanaman' atau 'pupuk'"),
  body('deskripsi').optional({ values: 'falsy' }).trim()
    .isLength({ max: 255 }).withMessage('Deskripsi maksimal 255 karakter'),
];

module.exports = { id, filter, payload };
