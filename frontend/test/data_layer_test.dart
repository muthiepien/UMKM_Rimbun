import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/core/network/api_client.dart';
import 'package:frontend/core/network/api_exception.dart';
import 'package:frontend/core/storage/token_storage.dart';
import 'package:frontend/data/models/order.dart';
import 'package:frontend/data/models/product.dart';
import 'package:frontend/data/repositories/auth_repository.dart';
import 'package:frontend/data/repositories/cart_repository.dart';
import 'package:frontend/data/repositories/order_repository.dart';
import 'package:frontend/data/repositories/product_repository.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';

http.Response jsonResponse(Object? data, {int status = 200, String message = 'ok'}) => http.Response(
      jsonEncode({'success': status < 400, 'message': message, 'data': data}),
      status,
      headers: {'content-type': 'application/json'},
    );

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() => SharedPreferences.setMockInitialValues({}));

  group('AuthRepository', () {
    test('login menyimpan token dan memasangnya ke ApiClient', () async {
      final api = ApiClient(
        httpClient: MockClient((req) async {
          expect(req.url.path, '/api/auth/login');
          expect(jsonDecode(req.body), {'email': 'a@b.com', 'password': 'rahasia1'});
          return jsonResponse({
            'token': 'tok123',
            'user': {'id_user': 2, 'nama': 'Pel', 'email': 'a@b.com', 'role': 'pelanggan', 'no_telepon': null},
          });
        }),
      );
      final storage = TokenStorage();
      final user = await AuthRepository(api, storage).login(email: 'a@b.com', password: 'rahasia1');

      expect(user.isPelanggan, isTrue);
      expect(api.hasToken, isTrue);
      expect(await storage.read(), 'tok123');
    });

    test('restoreSession: token kedaluwarsa (401) -> null dan token dihapus', () async {
      SharedPreferences.setMockInitialValues({'rimbun_auth_token': 'lama'});
      final api = ApiClient(
        httpClient: MockClient((req) async => jsonResponse(null, status: 401, message: 'Token kedaluwarsa.')),
      );
      final storage = TokenStorage();
      final user = await AuthRepository(api, storage).restoreSession();

      expect(user, isNull);
      expect(api.hasToken, isFalse);
      expect(await storage.read(), isNull);
    });

    test('login gagal 401 menjadi ApiException dengan pesan backend', () async {
      final api = ApiClient(
        httpClient: MockClient((req) async => jsonResponse(null, status: 401, message: 'Email atau password salah')),
      );
      expect(
        AuthRepository(api, TokenStorage()).login(email: 'a@b.com', password: 'x'),
        throwsA(isA<ApiException>().having((e) => e.message, 'message', 'Email atau password salah')),
      );
    });
  });

  group('ProductRepository', () {
    test('list mengirim filter yang terisi saja', () async {
      late Uri url;
      final api = ApiClient(
        httpClient: MockClient((req) async {
          url = req.url;
          return jsonResponse([
            {
              'id_product': 1,
              'id_category': 1,
              'nama_produk': 'Pupuk Urea',
              'harga_produk': '30000.00',
              'stok': 35,
              'gambar_url': null,
              'nama_category': 'Pupuk Anorganik',
              'jenis_category': 'pupuk',
            }
          ]);
        }),
      );
      final list = await ProductRepository(api).list(q: ' urea ', idCategory: 1);

      expect(url.path, '/api/products');
      expect(url.queryParameters, {'q': 'urea', 'id_category': '1'});
      expect(list.single.harga, 30000); // DECIMAL berupa teks tetap terbaca
      expect(list.single.stokHabis, isFalse);
    });

    test('create mengirim multipart dengan Content-Type gambar & token', () async {
      late http.Request sent;
      final api = ApiClient(
        httpClient: MockClient((req) async {
          sent = req;
          return jsonResponse({
            'id_product': 9,
            'id_category': 1,
            'nama_produk': 'Baru',
            'harga_produk': 1000,
            'stok': 3,
          }, status: 201);
        }),
      )..setToken('admintoken');

      await ProductRepository(api).create(ProductInput(
        idCategory: 1,
        nama: 'Baru',
        harga: 1000,
        stok: 3,
        gambar: UploadImage(bytes: Uint8List.fromList([1, 2, 3]), fileName: 'foto.PNG'),
      ));

      expect(sent.method, 'POST');
      expect(sent.headers['content-type'], startsWith('multipart/form-data'));
      expect(sent.headers['Authorization'], 'Bearer admintoken');
      expect(sent.body, contains('name="gambar"'));
      expect(sent.body, contains('image/png'));
      expect(sent.body, contains('name="nama_produk"'));
    });

    test('gambar bertipe salah atau terlalu besar ditolak sebelum dikirim', () async {
      var dipanggil = false;
      final api = ApiClient(httpClient: MockClient((req) async {
        dipanggil = true;
        return jsonResponse(null);
      }));
      final repo = ProductRepository(api);
      ProductInput input(UploadImage img) =>
          ProductInput(idCategory: 1, nama: 'x', harga: 1, stok: 1, gambar: img);

      await expectLater(
        repo.create(input(UploadImage(bytes: Uint8List(10), fileName: 'a.gif'))),
        throwsA(isA<ApiException>()),
      );
      await expectLater(
        repo.create(input(UploadImage(bytes: Uint8List(ApiClient.maxImageBytes + 1), fileName: 'a.jpg'))),
        throwsA(isA<ApiException>()),
      );
      expect(dipanggil, isFalse);
    });
  });

  group('CartRepository', () {
    test('add mengirim body benar dan membaca isi keranjang', () async {
      late http.Request sent;
      final api = ApiClient(
        httpClient: MockClient((req) async {
          sent = req;
          return jsonResponse({
            'id_keranjang': 1,
            'items': [
              {
                'id_product': 1,
                'nama_produk': 'Pupuk Urea',
                'gambar_url': null,
                'harga_satuan': 30000,
                'jumlah': 2,
                'subtotal': 60000,
                'stok': 1,
                'stok_cukup': false,
              }
            ],
            'total_item': 2,
            'total_harga': 60000,
          }, status: 201);
        }),
      );
      final cart = await CartRepository(api).add(1, jumlah: 2);

      expect(sent.url.path, '/api/cart/items');
      expect(jsonDecode(sent.body), {'id_product': 1, 'jumlah': 2});
      expect(cart.totalHarga, 60000);
      expect(cart.items.single.stokCukup, isFalse);
      expect(cart.siapCheckout, isFalse); // stok kurang -> checkout dicegah di UI
    });
  });

  group('OrderRepository & model Order', () {
    final json = {
      'id_transaksi': 5,
      'id_user': 2,
      'nama_pelanggan': 'Pel',
      'tanggal_transaksi': '2026-11-26T02:00:00.000Z',
      'total_harga': 135000,
      'status_transaksi': 'menunggu_konfirmasi',
      'metode_pembayaran': 'transfer',
      'status_pembayaran': 'belum_bayar',
      'tanggal_pembayaran': null,
      'items': [
        {'id_product': 1, 'nama_produk': 'Urea', 'jumlah': 3, 'harga_satuan': 30000, 'subtotal': 90000},
      ],
    };

    test('checkout mengirim metode pembayaran dan mem-parse pesanan', () async {
      late http.Request sent;
      final api = ApiClient(httpClient: MockClient((req) async {
        sent = req;
        return jsonResponse(json, status: 201);
      }));
      final order = await OrderRepository(api).checkout(metode: PaymentMethod.transfer);

      expect(sent.url.path, '/api/transactions');
      expect(jsonDecode(sent.body), {'metode_pembayaran': 'transfer'});
      expect(order.items.single.subtotal, 90000);
      expect(order.tanggalPembayaran, isNull);
    });

    test('aturan tombol di UI sesuai aturan backend', () {
      final order = Order.fromJson(json);
      expect(order.bisaKonfirmasiBayar, isTrue); // transfer + belum bayar
      expect(order.bisaDibatalkanPelanggan, isTrue);

      final tunai = Order.fromJson({...json, 'metode_pembayaran': 'tunai'});
      expect(tunai.bisaKonfirmasiBayar, isFalse); // tunai dikonfirmasi admin

      final menunggu = Order.fromJson({...json, 'status_pembayaran': 'menunggu_verifikasi'});
      expect(menunggu.bisaDibatalkanPelanggan, isFalse);
      expect(menunggu.bisaKonfirmasiBayar, isFalse);
    });

    test('verifyPayment mengirim status sesuai pilihan admin', () async {
      late http.Request sent;
      final api = ApiClient(httpClient: MockClient((req) async {
        sent = req;
        return jsonResponse(json);
      }));
      await OrderRepository(api).verifyPayment(5, diterima: false);

      expect(sent.method, 'PATCH');
      expect(sent.url.path, '/api/transactions/5/payment');
      expect(jsonDecode(sent.body), {'status_pembayaran': 'ditolak'});
    });

    test('alur status admin sama dengan backend', () {
      expect(OrderStatus.berikutnya('menunggu_konfirmasi'), ['diproses', 'dibatalkan']);
      expect(OrderStatus.berikutnya('selesai'), isEmpty);
    });
  });
}
