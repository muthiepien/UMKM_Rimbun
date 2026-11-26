import 'json_utils.dart';

class CartItem {
  const CartItem({
    required this.idProduct,
    required this.nama,
    required this.hargaSatuan,
    required this.jumlah,
    required this.subtotal,
    required this.stok,
    required this.stokCukup,
    this.gambarUrl,
  });

  final int idProduct;
  final String nama;
  final double hargaSatuan;
  final int jumlah;
  final double subtotal;
  final int stok;

  /// false jika stok sekarang kurang dari jumlah di keranjang (checkout akan ditolak).
  final bool stokCukup;
  final String? gambarUrl;

  factory CartItem.fromJson(Map<String, dynamic> json) => CartItem(
        idProduct: asInt(json['id_product']),
        nama: '${json['nama_produk']}',
        hargaSatuan: asDouble(json['harga_satuan']),
        jumlah: asInt(json['jumlah']),
        subtotal: asDouble(json['subtotal']),
        stok: asInt(json['stok']),
        stokCukup: json['stok_cukup'] != false,
        gambarUrl: json['gambar_url'] as String?,
      );
}

class Cart {
  const Cart({
    required this.items,
    required this.totalItem,
    required this.totalHarga,
  });

  const Cart.empty() : this(items: const [], totalItem: 0, totalHarga: 0);

  final List<CartItem> items;
  final int totalItem;
  final double totalHarga;

  bool get isEmpty => items.isEmpty;

  /// true jika semua item punya stok cukup -> tombol checkout boleh aktif.
  bool get siapCheckout => items.isNotEmpty && items.every((i) => i.stokCukup);

  factory Cart.fromJson(Map<String, dynamic> json) {
    final raw = json['items'];
    return Cart(
      items: raw is List
          ? raw.whereType<Map<String, dynamic>>().map(CartItem.fromJson).toList()
          : const [],
      totalItem: asInt(json['total_item']),
      totalHarga: asDouble(json['total_harga']),
    );
  }
}
