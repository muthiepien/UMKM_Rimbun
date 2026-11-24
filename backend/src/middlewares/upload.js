const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const AppError = require('../utils/AppError');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/produk');
fs.mkdirSync(UPLOAD_DIR, { recursive: true }); // pastikan folder ada

const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    // Nama file dibuat acak. Ekstensi diambil dari tipe file, bukan dari nama asli
    // (nama asli bisa dimanipulasi atau bentrok dengan file lain).
    filename: (req, file, cb) =>
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${EXT[file.mimetype]}`),
  }),
  fileFilter: (req, file, cb) => {
    if (!EXT[file.mimetype]) return cb(new AppError('Gambar harus berformat JPG, PNG, atau WEBP', 422));
    cb(null, true);
  },
  limits: { fileSize: MAX_SIZE },
}).single('gambar'); // nama field form-data: "gambar"

// Dibungkus agar error multer menjadi response JSON yang konsisten.
const uploadGambar = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const tooBig = err.code === 'LIMIT_FILE_SIZE';
      return next(new AppError(tooBig ? 'Ukuran gambar maksimal 2 MB' : err.message, tooBig ? 413 : 400));
    }
    if (err) return next(err);

    // Jika request akhirnya gagal (validasi 422, produk 404, dll.), hapus file yang terlanjur tersimpan.
    if (req.file) {
      res.on('finish', () => {
        if (res.statusCode >= 400) fs.unlink(req.file.path, () => {});
      });
    }
    next();
  });
};

module.exports = { uploadGambar };
