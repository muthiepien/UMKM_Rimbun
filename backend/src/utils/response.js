// Format response konsisten: { success, message, data } atau { success, message, errors }
const success = (res, data = null, message = 'Berhasil', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

module.exports = { success };
