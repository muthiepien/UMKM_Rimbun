import 'json_utils.dart';

class User {
  const User({
    required this.id,
    required this.nama,
    required this.email,
    required this.role,
    this.noTelepon,
  });

  final int id;
  final String nama;
  final String email;
  final String role; // 'admin' | 'pelanggan'
  final String? noTelepon;

  bool get isAdmin => role == 'admin';
  bool get isPelanggan => role == 'pelanggan';

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: asInt(json['id_user']),
        nama: '${json['nama']}',
        email: '${json['email']}',
        role: '${json['role']}',
        noTelepon: json['no_telepon'] as String?,
      );
}
