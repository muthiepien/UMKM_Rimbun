import '../../core/network/api_client.dart';
import '../models/order.dart';

/// Checkout & pesanan. Pembayaran manual (tanpa payment gateway):
/// pelanggan konfirmasi "sudah bayar", admin memverifikasi.
class OrderRepository {
  OrderRepository(this._api);

  final ApiClient _api;

  /// Checkout isi keranjang. [metode]: lihat [PaymentMethod].
  Future<Order> checkout({String metode = PaymentMethod.tunai}) async {
    final response = await _api.post('/api/transactions', body: {'metode_pembayaran': metode});
    return Order.fromJson(response.asMap());
  }

  /// Pelanggan: pesanan miliknya. Admin: semua pesanan.
  Future<List<Order>> list({String? status}) async {
    final response = await _api.get('/api/transactions', query: {'status': status});
    return response.asList().map(Order.fromJson).toList();
  }

  Future<Order> detail(int id) async {
    final response = await _api.get('/api/transactions/$id');
    return Order.fromJson(response.asMap());
  }

  /// Pelanggan membatalkan pesanan (stok dikembalikan).
  Future<Order> cancel(int id) async {
    final response = await _api.patch('/api/transactions/$id/cancel');
    return Order.fromJson(response.asMap());
  }

  /// Pelanggan: "saya sudah transfer/bayar QRIS".
  Future<Order> confirmPayment(int id) async {
    final response = await _api.patch('/api/transactions/$id/payment/confirm');
    return Order.fromJson(response.asMap());
  }

  /// Admin: ubah status pesanan (lihat [OrderStatus.berikutnya]).
  Future<Order> updateStatus(int id, String status) async {
    final response = await _api.patch('/api/transactions/$id/status', body: {'status': status});
    return Order.fromJson(response.asMap());
  }

  /// Admin: terima (true) atau tolak (false) pembayaran.
  Future<Order> verifyPayment(int id, {required bool diterima}) async {
    final response = await _api.patch('/api/transactions/$id/payment', body: {
      'status_pembayaran': diterima ? PaymentStatus.berhasil : PaymentStatus.ditolak,
    });
    return Order.fromJson(response.asMap());
  }
}
