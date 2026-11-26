import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/core/utils/formatters.dart';

void main() {
  group('Formatters.rupiah', () {
    test('memberi pemisah ribuan berupa titik', () {
      expect(Formatters.rupiah(500), 'Rp 500');
      expect(Formatters.rupiah(1000), 'Rp 1.000');
      expect(Formatters.rupiah(30000), 'Rp 30.000');
      expect(Formatters.rupiah(1234567), 'Rp 1.234.567');
    });

    test('nol dan pembulatan desimal', () {
      expect(Formatters.rupiah(0), 'Rp 0');
      expect(Formatters.rupiah(25000.4), 'Rp 25.000');
    });

    test('angka negatif', () {
      expect(Formatters.rupiah(-15000), '-Rp 15.000');
    });
  });
}
