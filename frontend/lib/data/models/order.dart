import 'json_utils.dart';

/// Nilai status & metode sesuai ENUM di database/backend.
abstract final class OrderStatus {
  static const menungguKonfirmasi = 'menunggu_konfirmasi';
  static const diproses = 'diproses';
  static const siapDiambil = 'siap_diambil';
  static const selesai = 'selesai';
  static const dibatalkan = 'dibatalkan';

  static const semua = [menungguKonfirmasi, diproses, siapDiambil, selesai, dibatalkan];

  static String label(String status) => switch (status) {
        menungguKonfirmasi => 'Menunggu konfirmasi',
        diproses => 'Diproses',
        siapDiambil => 'Siap diambil',
        selesai => 'Selesai',
        dibatalkan => 'Dibatalkan',
        _ => status,
      };

  /// Status berikutnya yang boleh dipilih admin (sama dengan alur di backend).
  static List<String> berikutnya(String status) => switch (status) {
        menungguKonfirmasi => [diproses, dibatalkan],
        diproses => [siapDiambil, dibatalkan],
        siapDiambil => [selesai, dibatalkan],
        _ => const [],
      };
}

abstract final class PaymentMethod {
  static const tunai = 'tunai';
  static const transfer = 'transfer';
  static const qris = 'qris';

  static const semua = [tunai, transfer, qris];

  static String label(String metode) => switch (metode) {
        tunai => 'Tunai (bayar di toko)',
        transfer => 'Transfer bank',
        qris => 'QRIS',
        _ => metode,
      };
}

abstract final class PaymentStatus {
  static const belumBayar = 'belum_bayar';
  static const menungguVerifikasi = 'menunggu_verifikasi';
  static const berhasil = 'berhasil';
  static const ditolak = 'ditolak';

  static String label(String status) => switch (status) {
        belumBayar => 'Belum bayar',
        menungguVerifikasi => 'Menunggu verifikasi',
        berhasil => 'Lunas',
        ditolak => 'Ditolak',
        _ => status,
      };
}

class OrderItem {
  const OrderItem({
    required this.idProduct,
    required this.nama,
    required this.jumlah,
    required this.hargaSatuan,
    required this.subtotal,
  });

  final int idProduct;
  final String nama;
  final int jumlah;
  final double hargaSatuan;
  final double subtotal;

  factory OrderItem.fromJson(Map<String, dynamic> json) => OrderItem(
        idProduct: asInt(json['id_product']),
        nama: '${json['nama_produk']}',
        jumlah: asInt(json['jumlah']),
        hargaSatuan: asDouble(json['harga_satuan']),
        subtotal: asDouble(json['subtotal']),
      );
}

/// Satu transaksi (pesanan). [items] kosong pada daftar, terisi pada detail.
class Order {
  const Order({
    required this.id,
    required this.idUser,
    required this.namaPelanggan,
    required this.tanggal,
    required this.totalHarga,
    required this.status,
    required this.metodePembayaran,
    required this.statusPembayaran,
    this.tanggalPembayaran,
    this.items = const [],
  });

  final int id;
  final int idUser;
  final String namaPelanggan;
  final DateTime? tanggal;
  final double totalHarga;
  final String status;
  final String metodePembayaran;
  final String statusPembayaran;
  final DateTime? tanggalPembayaran;
  final List<OrderItem> items;

  bool get sudahLunas => statusPembayaran == PaymentStatus.berhasil;

  /// Pelanggan boleh membatalkan hanya selagi menunggu konfirmasi dan pembayaran belum dikirim.
  bool get bisaDibatalkanPelanggan =>
      status == OrderStatus.menungguKonfirmasi &&
      (statusPembayaran == PaymentStatus.belumBayar || statusPembayaran == PaymentStatus.ditolak);

  /// Pelanggan boleh menekan "Saya sudah bayar" untuk transfer/QRIS.
  bool get bisaKonfirmasiBayar =>
      metodePembayaran != PaymentMethod.tunai &&
      status != OrderStatus.dibatalkan &&
      (statusPembayaran == PaymentStatus.belumBayar || statusPembayaran == PaymentStatus.ditolak);

  factory Order.fromJson(Map<String, dynamic> json) {
    final raw = json['items'];
    return Order(
      id: asInt(json['id_transaksi']),
      idUser: asInt(json['id_user']),
      namaPelanggan: '${json['nama_pelanggan'] ?? ''}',
      tanggal: asDate(json['tanggal_transaksi']),
      totalHarga: asDouble(json['total_harga']),
      status: '${json['status_transaksi']}',
      metodePembayaran: '${json['metode_pembayaran'] ?? PaymentMethod.tunai}',
      statusPembayaran: '${json['status_pembayaran'] ?? PaymentStatus.belumBayar}',
      tanggalPembayaran: asDate(json['tanggal_pembayaran']),
      items: raw is List
          ? raw.whereType<Map<String, dynamic>>().map(OrderItem.fromJson).toList()
          : const [],
    );
  }
}
