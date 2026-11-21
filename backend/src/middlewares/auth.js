const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

// Autentikasi: memastikan request membawa JWT yang valid.
const authenticate = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('Token tidak ditemukan. Silakan login.', 401));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id_user: payload.id_user, role: payload.role };
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token kedaluwarsa. Silakan login ulang.' : 'Token tidak valid.';
    next(new AppError(msg, 401));
  }
};

// Otorisasi: membatasi akses berdasarkan role. Contoh: authorize('admin')
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('Anda tidak memiliki hak akses untuk aksi ini.', 403));
  }
  next();
};

module.exports = { authenticate, authorize };
