// gambar_produk bisa berupa URL luar (data seed) atau path lokal "/uploads/produk/xxx.jpg".
// Fungsi ini mengubahnya menjadi URL lengkap yang bisa dibuka client (Flutter).
const toUrl = (req, p) => {
  if (!p) return null;
  return /^https?:\/\//.test(p) ? p : `${req.protocol}://${req.get('host')}${p}`;
};

module.exports = { toUrl };
