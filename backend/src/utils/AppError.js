// Error yang kita lempar sendiri, membawa HTTP status code yang sesuai.
class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

module.exports = AppError;
