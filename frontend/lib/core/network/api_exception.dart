/// Semua kegagalan request dibungkus menjadi ApiException supaya UI cukup
/// menampilkan [message] tanpa tahu detail HTTP.
class ApiException implements Exception {
  const ApiException(
    this.message, {
    this.statusCode,
    this.fieldErrors = const {},
  });

  /// Tidak ada koneksi / server mati / alamat salah.
  const ApiException.network()
      : this('Tidak dapat terhubung ke server. Periksa koneksi internet dan alamat server.');

  /// Server tidak menjawab dalam batas waktu.
  const ApiException.timeout()
      : this('Server terlalu lama merespons. Coba lagi beberapa saat.');

  /// Pesan yang aman ditampilkan ke pengguna.
  final String message;

  /// Kode HTTP (null jika gagal sebelum mendapat respons).
  final int? statusCode;

  /// Error validasi 422 dari backend: nama field -> pesan.
  /// Contoh: {'email': 'Format email tidak valid'}
  final Map<String, String> fieldErrors;

  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden => statusCode == 403;
  bool get isNotFound => statusCode == 404;
  bool get isConflict => statusCode == 409;
  bool get isValidation => statusCode == 422;

  @override
  String toString() => 'ApiException($statusCode): $message';
}
