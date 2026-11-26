import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/app.dart';
import 'package:frontend/core/network/api_client.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';

void main() {
  setUpAll(() async {
    await initializeDateFormatting('id_ID');
  });

  testWidgets('layar cek koneksi menampilkan status server & database', (tester) async {
    final client = MockClient((request) async {
      expect(request.url.path, '/api/health');
      return http.Response(
        jsonEncode({
          'success': true,
          'message': 'Server dan database terhubung',
          'data': {'database_name': 'defaultdb', 'server_time': '2026-11-26T02:00:00.000Z'},
        }),
        200,
        headers: {'content-type': 'application/json'},
      );
    });

    await tester.pumpWidget(
      MultiProvider(
        providers: [Provider<ApiClient>.value(value: ApiClient(httpClient: client))],
        child: const RimbunApp(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Server dan database terhubung'), findsOneWidget);
    expect(find.text('defaultdb'), findsOneWidget);
  });
}
