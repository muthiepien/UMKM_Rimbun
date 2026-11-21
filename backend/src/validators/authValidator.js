const { body } = require('express-validator');

const register = [
  body('nama').trim().notEmpty().withMessage('Nama wajib diisi').isLength({ max: 100 }).withMessage('Nama maksimal 100 karakter'),
  body('email').trim().isEmail().withMessage('Format email tidak valid').normalizeEmail().isLength({ max: 150 }).withMessage('Email maksimal 150 karakter'),
  body('password').isLength({ min: 6, max: 72 }).withMessage('Password 6-72 karakter'),
  body('no_telepon')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^[0-9+\-\s]{8,20}$/)
    .withMessage('Nomor telepon tidak valid'),
];

const login = [
  body('email').trim().isEmail().withMessage('Format email tidak valid').normalizeEmail(),
  body('password').notEmpty().withMessage('Password wajib diisi'),
];

module.exports = { register, login };
