/// Pembantu membaca JSON dari backend dengan aman.
/// DECIMAL dari MySQL bisa tiba sebagai angka atau teks, jadi dibaca lewat [asDouble].
double asDouble(Object? value) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0;
  return 0;
}

int asInt(Object? value) {
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}

DateTime? asDate(Object? value) => value == null ? null : DateTime.tryParse('$value');
