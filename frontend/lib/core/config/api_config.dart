import 'package:flutter/foundation.dart';

/// Konfigurasi koneksi ke backend Rimbun.
///
/// Alamat dipilih otomatis sesuai platform:
/// - Emulator Android              -> http://10.0.2.2:3000 (alias "localhost" komputer Anda)
/// - Web / iOS Simulator / desktop -> http://localhost:3000
/// - HP fisik (satu Wi-Fi dengan komputer), jalankan dengan alamat IP komputer:
///     flutter run --dart-define=API_BASE_URL=http://192.168.1.10:3000
abstract final class ApiConfig {
  static const String _fromEnv = String.fromEnvironment('API_BASE_URL');

  static String get baseUrl {
    if (_fromEnv.isNotEmpty) return _fromEnv;
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:3000';
    }
    return 'http://localhost:3000';
  }

  /// Batas waktu tunggu setiap request.
  static const Duration timeout = Duration(seconds: 15);
}
