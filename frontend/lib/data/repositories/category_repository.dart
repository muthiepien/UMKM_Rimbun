import '../../core/network/api_client.dart';
import '../models/category.dart';

class CategoryRepository {
  CategoryRepository(this._api);

  final ApiClient _api;

  /// GET /api/categories?jenis=pupuk (publik)
  Future<List<Category>> list({String? jenis}) async {
    final response = await _api.get('/api/categories', query: {'jenis': jenis});
    return response.asList().map(Category.fromJson).toList();
  }

  Future<Category> detail(int id) async {
    final response = await _api.get('/api/categories/$id');
    return Category.fromJson(response.asMap());
  }

  /// Khusus admin.
  Future<Category> create(CategoryInput input) async {
    final response = await _api.post('/api/categories', body: input.toJson());
    return Category.fromJson(response.asMap());
  }

  /// Khusus admin. PUT mengganti seluruh data, jadi semua field dikirim.
  Future<Category> update(int id, CategoryInput input) async {
    final response = await _api.put('/api/categories/$id', body: input.toJson());
    return Category.fromJson(response.asMap());
  }

  /// Khusus admin. 409 jika kategori masih dipakai produk.
  Future<void> delete(int id) async {
    await _api.delete('/api/categories/$id');
  }
}
