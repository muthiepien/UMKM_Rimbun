import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';

import 'app.dart';
import 'core/network/api_client.dart';
import 'core/storage/token_storage.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('id_ID');

  runApp(
    MultiProvider(
      providers: [
        // Objek tunggal yang dipakai seluruh aplikasi. Provider lain
        // (AuthProvider, CartProvider, dst.) ditambahkan di tahap berikutnya.
        Provider<ApiClient>(
          create: (_) => ApiClient(),
          dispose: (_, client) => client.dispose(),
        ),
        Provider<TokenStorage>(create: (_) => TokenStorage()),
      ],
      child: const RimbunApp(),
    ),
  );
}
