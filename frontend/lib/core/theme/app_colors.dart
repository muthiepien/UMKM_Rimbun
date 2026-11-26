import 'package:flutter/material.dart';

/// Palet warna Rimbun.
/// Dasar: hijau tanaman dari referensi 2 (Plant Shop), dipadukan dengan
/// struktur layar referensi 1 (Replate).
abstract final class AppColors {
  // Utama (hijau)
  static const Color primary = Color(0xFF4E9873);
  static const Color primaryDark = Color(0xFF2F6E50);
  static const Color primarySoft = Color(0xFFE5F1EA);

  // Aksen kuning: badge diskon / promo (seperti tombol "Claim" pada referensi)
  static const Color accent = Color(0xFFFFC83D);

  // Latar & permukaan
  static const Color background = Color(0xFFF6F8F6);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color border = Color(0xFFE3E8E4);

  // Teks
  static const Color textPrimary = Color(0xFF1E2A24);
  static const Color textSecondary = Color(0xFF6B7A72);
  static const Color textHint = Color(0xFF9AA7A0);

  // Semantik
  static const Color success = Color(0xFF2E9E6B);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFE5484D);
  static const Color info = Color(0xFF3B82F6);
}
