import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../models/product.dart';

class ProductRepository {
  ProductRepository(this._api);

  final ApiClient _api;

  /// GET /api/products?q=&id_category=&jenis= (publik)
  Future<List<Product>> list({String? q, int? idCategory, String? jenis}) async {
    final response = await _api.get('/api/products', query: {
      'q': q?.trim(),
      'id_category': idCategory?.toString(),
      'jenis': jenis,
    });
    return response.asList().map(Product.fromJson).toList();
  }

  Future<Product> detail(int id) async {
    final response = await _api.get('/api/products/$id');
    return Product.fromJson(response.asMap());
  }

  /// Khusus admin. Gambar opsional (JPG/PNG/WEBP, maks 2 MB).
  Future<Product> create(ProductInput input) async {
    _cekGambar(input.gambar);
    final response = await _api.sendMultipart(
      'POST',
      '/api/products',
      fields: input.toFields(),
      fileBytes: input.gambar?.bytes,
      fileName: input.gambar?.fileName,
    );
    return Product.fromJson(response.asMap());
  }

  /// Khusus admin. Jika [ProductInput.gambar] null, gambar lama dipertahankan.
  Future<Product> update(int id, ProductInput input) async {
    _cekGambar(input.gambar);
    final response = await _api.sendMultipart(
      'PUT',
      '/api/products/$id',
      fields: input.toFields(),
      fileBytes: input.gambar?.bytes,
      fileName: input.gambar?.fileName,
    );
    return Product.fromJson(response.asMap());
  }

  /// Khusus admin. 409 jika produk sudah pernah dibeli.
  Future<void> delete(int id) async {
    await _api.delete('/api/products/$id');
  }

  /// Validasi di sisi aplikasi (ketentuan: validasi juga di antarmuka) sebelum dikirim.
  void _cekGambar(UploadImage? gambar) {
    if (gambar == null) return;
    ApiClient.imageMediaType(gambar.fileName); // melempar ApiException jika tipe salah
    if (gambar.bytes.length > ApiClient.maxImageBytes) {
      throw const ApiException('Ukuran gambar maksimal 2 MB.');
    }
  }
}
