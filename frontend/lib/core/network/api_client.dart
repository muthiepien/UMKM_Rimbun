import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart' show MediaType;

import '../config/api_config.dart';
import 'api_exception.dart';
import 'api_response.dart';

/// Satu-satunya pintu komunikasi ke backend.
///
/// Tugasnya: menyusun URL, menyisipkan token JWT, memberi batas waktu, membaca
/// JSON, dan mengubah semua kegagalan menjadi [ApiException].
/// Repository (Tahap 2) memakai kelas ini; UI tidak pernah memanggil http langsung.
class ApiClient {
  ApiClient({http.Client? httpClient}) : _http = httpClient ?? http.Client();

  final http.Client _http;
  String? _token;

  /// Dipanggil saat server membalas 401 padahal request membawa token
  /// (token kedaluwarsa/tidak valid). AuthProvider memakainya untuk logout otomatis.
  void Function()? onUnauthorized;

  bool get hasToken => _token != null;

  /// Isi setelah login, kosongkan (null) saat logout.
  void setToken(String? token) => _token = token;

  Future<ApiResponse> get(String path, {Map<String, String?>? query}) =>
      _send('GET', path, query: query);

  Future<ApiResponse> post(String path, {Object? body}) =>
      _send('POST', path, body: body);

  Future<ApiResponse> put(String path, {Object? body}) =>
      _send('PUT', path, body: body);

  Future<ApiResponse> patch(String path, {Object? body}) =>
      _send('PATCH', path, body: body);

  Future<ApiResponse> delete(String path) => _send('DELETE', path);

  /// Kirim form-data (teks + satu gambar opsional dengan nama field "gambar").
  /// Dipakai untuk tambah/ubah produk (POST/PUT /api/products).
  Future<ApiResponse> sendMultipart(
    String method,
    String path, {
    required Map<String, String> fields,
    Uint8List? fileBytes,
    String? fileName,
  }) async {
    final request = http.MultipartRequest(method, _uri(path, null))
      ..headers['Accept'] = 'application/json'
      ..fields.addAll(fields);

    if (fileBytes != null && fileName != null) {
      // Backend memeriksa Content-Type bagian file, jadi harus diisi benar.
      request.files.add(http.MultipartFile.fromBytes(
        'gambar',
        fileBytes,
        filename: fileName,
        contentType: imageMediaType(fileName),
      ));
    }
    _attachToken(request);
    return _handle(await _execute(request));
  }

  /// Batas ukuran gambar sama dengan backend (2 MB).
  static const int maxImageBytes = 2 * 1024 * 1024;

  /// Tipe gambar yang diterima backend: JPG, PNG, WEBP. Selain itu -> ApiException.
  static MediaType imageMediaType(String fileName) {
    final name = fileName.toLowerCase();
    if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return MediaType('image', 'jpeg');
    if (name.endsWith('.png')) return MediaType('image', 'png');
    if (name.endsWith('.webp')) return MediaType('image', 'webp');
    throw const ApiException('Gambar harus berformat JPG, PNG, atau WEBP.');
  }

  void dispose() => _http.close();

  // ───────────────────────── internal

  Uri _uri(String path, Map<String, String?>? query) {
    final params = <String, String>{};
    query?.forEach((key, value) {
      if (value != null && value.isNotEmpty) params[key] = value;
    });
    return Uri.parse(ApiConfig.baseUrl).replace(
      path: path,
      queryParameters: params.isEmpty ? null : params,
    );
  }

  Future<ApiResponse> _send(
    String method,
    String path, {
    Map<String, String?>? query,
    Object? body,
  }) async {
    final request = http.Request(method, _uri(path, query))
      ..headers['Accept'] = 'application/json';

    _attachToken(request);

    if (body != null) {
      request.headers['Content-Type'] = 'application/json';
      request.body = jsonEncode(body);
    }

    return _handle(await _execute(request));
  }

  void _attachToken(http.BaseRequest request) {
    final token = _token;
    if (token != null) request.headers['Authorization'] = 'Bearer $token';
  }

  Future<http.Response> _execute(http.BaseRequest request) async {
    try {
      final streamed = await _http.send(request).timeout(ApiConfig.timeout);
      return await http.Response.fromStream(streamed).timeout(ApiConfig.timeout);
    } on TimeoutException {
      throw const ApiException.timeout();
    } catch (_) {
      // SocketException, ClientException, dsb. -> masalah jaringan.
      throw const ApiException.network();
    }
  }

  ApiResponse _handle(http.Response response) {
    final status = response.statusCode;

    Map<String, dynamic>? json;
    if (response.bodyBytes.isNotEmpty) {
      try {
        final decoded = jsonDecode(utf8.decode(response.bodyBytes));
        if (decoded is Map<String, dynamic>) json = decoded;
      } on FormatException {
        // Bukan JSON (mis. halaman error proxy). Ditangani di bawah.
      }
    }

    if (status >= 200 && status < 300) {
      if (json == null) {
        throw ApiException('Respons server tidak valid.', statusCode: status);
      }
      return ApiResponse(
        message: (json['message'] as String?) ?? '',
        data: json['data'],
      );
    }

    // 401 saat login (tanpa token) = password salah, bukan sesi habis.
    if (status == 401 && _token != null) onUnauthorized?.call();

    throw ApiException(
      (json?['message'] as String?) ?? _defaultMessage(status),
      statusCode: status,
      fieldErrors: _parseFieldErrors(json?['errors']),
    );
  }

  String _defaultMessage(int status) {
    if (status >= 500) return 'Terjadi kesalahan pada server.';
    if (status == 404) return 'Data tidak ditemukan.';
    return 'Permintaan gagal (kode $status).';
  }

  /// Backend mengirim: errors: [{ field: 'email', message: '...' }]
  Map<String, String> _parseFieldErrors(Object? raw) {
    if (raw is! List) return const {};
    final result = <String, String>{};
    for (final item in raw) {
      if (item is Map) {
        final field = item['field'];
        final message = item['message'];
        if (field is String && message is String) {
          result.putIfAbsent(field, () => message);
        }
      }
    }
    return result;
  }
}
