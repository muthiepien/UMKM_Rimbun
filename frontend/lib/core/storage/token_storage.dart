import 'package:shared_preferences/shared_preferences.dart';

/// Menyimpan token JWT di perangkat agar pengguna tidak perlu login ulang
/// setiap membuka aplikasi.
class TokenStorage {
  static const String _key = 'rimbun_auth_token';

  Future<String?> read() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_key);
  }

  Future<void> save(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, token);
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}
