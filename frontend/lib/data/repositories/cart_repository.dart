import '../../core/network/api_client.dart';
import '../models/cart.dart';

/// Keranjang belanja (khusus pelanggan). Setiap pemanggilan mengembalikan
/// isi keranjang terbaru, jadi UI cukup mengganti state dengan hasilnya.
class CartRepository {
  CartRepository(this._api);

  final ApiClient _api;

  Future<Cart> get() async {
    final response = await _api.get('/api/cart');
    return Cart.fromJson(response.asMap());
  }

  /// Tambah produk. Jika sudah ada, jumlahnya ditambah. 409 jika melebihi stok.
  Future<Cart> add(int idProduct, {int jumlah = 1}) async {
    final response = await _api.post('/api/cart/items', body: {
      'id_product': idProduct,
      'jumlah': jumlah,
    });
    return Cart.fromJson(response.asMap());
  }

  /// Ubah jumlah menjadi nilai tertentu (bukan tambahan).
  Future<Cart> setQuantity(int idProduct, int jumlah) async {
    final response = await _api.put('/api/cart/items/$idProduct', body: {'jumlah': jumlah});
    return Cart.fromJson(response.asMap());
  }

  Future<Cart> remove(int idProduct) async {
    final response = await _api.delete('/api/cart/items/$idProduct');
    return Cart.fromJson(response.asMap());
  }

  Future<Cart> clear() async {
    final response = await _api.delete('/api/cart');
    return Cart.fromJson(response.asMap());
  }
}
