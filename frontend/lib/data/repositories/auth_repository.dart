import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../core/storage/token_storage.dart';
import '../models/user.dart';

/// Register, login, pemulihan sesi, dan logout.
/// Token JWT disimpan di perangkat (TokenStorage) dan dipasang ke ApiClient.
class AuthRepository {
  AuthRepository(this._api, this._storage);

  final ApiClient _api;
  final TokenStorage _storage;

  /// POST /api/auth/register -> membuat akun pelanggan (belum login).
  Future<User> register({
    required String nama,
    required String email,
    required String password,
    String? noTelepon,
  }) async {
    final response = await _api.post('/api/auth/register', body: {
      'nama': nama,
      'email': email,
      'password': password,
      if (noTelepon != null && noTelepon.isNotEmpty) 'no_telepon': noTelepon,
    });
    return User.fromJson(response.asMap());
  }

  /// POST /api/auth/login -> simpan token, kembalikan data user.
  Future<User> login({required String email, required String password}) async {
    final response = await _api.post('/api/auth/login', body: {
      'email': email,
      'password': password,
    });
    final data = response.asMap();
    final token = data['token'];
    final user = data['user'];
    if (token is! String || user is! Map<String, dynamic>) {
      throw const ApiException('Respons login tidak valid.');
    }
    _api.setToken(token);
    await _storage.save(token);
    return User.fromJson(user);
  }

  /// Dipanggil saat aplikasi dibuka. Mengembalikan user jika token tersimpan masih
  /// berlaku, null jika belum login / token kedaluwarsa. Error jaringan dilempar
  /// ulang agar layar awal bisa menawarkan "Coba lagi" (bukan memaksa login ulang).
  Future<User?> restoreSession() async {
    final token = await _storage.read();
    if (token == null) return null;
    _api.setToken(token);
    try {
      final response = await _api.get('/api/auth/me');
      return User.fromJson(response.asMap());
    } on ApiException catch (e) {
      if (e.isUnauthorized) {
        await logout();
        return null;
      }
      rethrow;
    }
  }

  Future<void> logout() async {
    _api.setToken(null);
    await _storage.clear();
  }
}
