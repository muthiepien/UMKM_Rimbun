const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} tidak ditemukan` });
};

// Satu tempat untuk semua error -> response JSON dengan format konsisten.
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let status = err.statusCode || 500;
  let message = err.message || 'Terjadi kesalahan pada server';
  const errors = err.errors || undefined;

  if (err.code === 'ER_DUP_ENTRY') {
    status = 409;
    message = 'Data sudah ada (duplikat).';
  } else if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    status = 409;
    message = 'Data tidak bisa dihapus karena masih dipakai oleh data lain.';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    status = 400;
    message = 'Data referensi (foreign key) tidak ditemukan.';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Format JSON tidak valid.';
  }

  if (status === 500) console.error(err); // detail error hanya di log server, tidak dibocorkan ke client

  res.status(status).json({
    success: false,
    message: status === 500 ? 'Terjadi kesalahan pada server' : message,
    ...(errors && { errors }),
  });
};

module.exports = { notFound, errorHandler };
