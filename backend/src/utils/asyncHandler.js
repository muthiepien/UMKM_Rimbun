// Express 4 tidak menangkap error dari fungsi async secara otomatis.
// Wrapper ini meneruskan error ke error-handler middleware.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
