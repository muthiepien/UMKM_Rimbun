const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

// Dipanggil setelah rangkaian aturan express-validator. Jika ada error -> 422.
module.exports = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  next(new AppError('Validasi gagal', 422, errors));
};
