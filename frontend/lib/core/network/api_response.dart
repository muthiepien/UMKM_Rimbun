import 'api_exception.dart';

/// Hasil sukses dari backend dengan format { success, message, data }.
class ApiResponse {
  const ApiResponse({required this.message, this.data});

  final String message;
  final dynamic data;

  /// [data] sebagai objek JSON.
  Map<String, dynamic> asMap() {
    final value = data;
    if (value is Map<String, dynamic>) return value;
    throw const ApiException('Format data dari server tidak sesuai.');
  }

  /// [data] sebagai daftar objek JSON.
  List<Map<String, dynamic>> asList() {
    final value = data;
    if (value is List) return value.whereType<Map<String, dynamic>>().toList();
    throw const ApiException('Format data dari server tidak sesuai.');
  }
}
