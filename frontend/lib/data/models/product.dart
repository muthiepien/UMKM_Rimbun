import 'dart:typed_data';

import 'json_utils.dart';

class Product {
  const Product({
    required this.id,
    required this.idCategory,
    required this.nama,
    required this.harga,
    required this.stok,
    this.jenisProduk,
    this.deskripsi,
    this.gambarUrl,
    this.namaCategory,
    this.jenisCategory,
  });

  final int id;
  final int idCategory;
  final String nama;
  final double harga;
  final int stok;
  final String? jenisProduk;
  final String? deskripsi;

  /// URL lengkap gambar (sudah dibuat backend), null jika produk tanpa gambar.
  final String? gambarUrl;
  final String? namaCategory;
  final String? jenisCategory;

  bool get stokHabis => stok <= 0;

  factory Product.fromJson(Map<String, dynamic> json) => Product(
        id: asInt(json['id_product']),
        idCategory: asInt(json['id_category']),
        nama: '${json['nama_produk']}',
        harga: asDouble(json['harga_produk']),
        stok: asInt(json['stok']),
        jenisProduk: json['jenis_produk'] as String?,
        deskripsi: json['deskripsi_produk'] as String?,
        gambarUrl: json['gambar_url'] as String?,
        namaCategory: json['nama_category'] as String?,
        jenisCategory: json['jenis_category'] as String?,
      );
}

/// Gambar yang dipilih pengguna untuk diunggah (dari image_picker, dibaca sebagai bytes).
class UploadImage {
  const UploadImage({required this.bytes, required this.fileName});

  final Uint8List bytes;
  final String fileName;
}

/// Data yang dikirim saat tambah/ubah produk (admin).
/// [gambar] null pada ubah produk = pertahankan gambar lama.
class ProductInput {
  const ProductInput({
    required this.idCategory,
    required this.nama,
    required this.harga,
    required this.stok,
    this.jenisProduk,
    this.deskripsi,
    this.gambar,
  });

  final int idCategory;
  final String nama;
  final double harga;
  final int stok;
  final String? jenisProduk;
  final String? deskripsi;
  final UploadImage? gambar;

  Map<String, String> toFields() => {
        'id_category': '$idCategory',
        'nama_produk': nama,
        'harga_produk': '$harga',
        'stok': '$stok',
        if (jenisProduk != null && jenisProduk!.isNotEmpty) 'jenis_produk': jenisProduk!,
        if (deskripsi != null && deskripsi!.isNotEmpty) 'deskripsi_produk': deskripsi!,
      };
}
