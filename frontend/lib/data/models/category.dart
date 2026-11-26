import 'json_utils.dart';

class Category {
  const Category({
    required this.id,
    required this.nama,
    required this.jenis,
    this.deskripsi,
  });

  final int id;
  final String nama;
  final String jenis; // 'tanaman' | 'pupuk'
  final String? deskripsi;

  factory Category.fromJson(Map<String, dynamic> json) => Category(
        id: asInt(json['id_category']),
        nama: '${json['nama_category']}',
        jenis: '${json['jenis_category']}',
        deskripsi: json['deskripsi'] as String?,
      );
}

/// Data yang dikirim saat tambah/ubah kategori (admin).
class CategoryInput {
  const CategoryInput({required this.nama, required this.jenis, this.deskripsi});

  final String nama;
  final String jenis;
  final String? deskripsi;

  Map<String, dynamic> toJson() => {
        'nama_category': nama,
        'jenis_category': jenis,
        if (deskripsi != null && deskripsi!.isNotEmpty) 'deskripsi': deskripsi,
      };
}
