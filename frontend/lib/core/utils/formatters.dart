import 'package:intl/intl.dart';

/// Format tampilan angka & tanggal berbahasa Indonesia.
/// Format tanggal membutuhkan initializeDateFormatting('id_ID') di main().
abstract final class Formatters {
  /// 30000 -> "Rp 30.000"
  static String rupiah(num value) {
    final digits = value.round().abs().toString();
    final buffer = StringBuffer();
    for (var i = 0; i < digits.length; i++) {
      if (i > 0 && (digits.length - i) % 3 == 0) buffer.write('.');
      buffer.write(digits[i]);
    }
    return '${value < 0 ? '-' : ''}Rp $buffer';
  }

  /// "26 Nov 2026"
  static String tanggal(DateTime date) =>
      DateFormat('d MMM yyyy', 'id_ID').format(date.toLocal());

  /// "26 Nov 2026, 14:30"
  static String tanggalWaktu(DateTime date) =>
      DateFormat('d MMM yyyy, HH:mm', 'id_ID').format(date.toLocal());
}
