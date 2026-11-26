import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';

import 'app.dart';
import 'core/network/api_client.dart';
import 'core/storage/token_storage.dart';
import 'data/repositories/auth_repository.dart';
import 'data/repositories/cart_repository.dart';
import 'data/repositories/category_repository.dart';
import 'data/repositories/order_repository.dart';
import 'data/repositories/product_repository.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('id_ID');

  runApp(
    MultiProvider(
      providers: [
        // Objek tunggal yang dipakai seluruh aplikasi. State provider
        // (AuthProvider, CartProvider, dst.) ditambahkan di tahap berikutnya.
        Provider<ApiClient>(
          create: (_) => ApiClient(),
          dispose: (_, client) => client.dispose(),
        ),
        Provider<TokenStorage>(create: (_) => TokenStorage()),
        // Repository (Tahap 2): satu-satunya jalan UI/Provider mengakses data backend.
        Provider<AuthRepository>(
          create: (c) => AuthRepository(c.read<ApiClient>(), c.read<TokenStorage>()),
        ),
        Provider<CategoryRepository>(create: (c) => CategoryRepository(c.read<ApiClient>())),
        Provider<ProductRepository>(create: (c) => ProductRepository(c.read<ApiClient>())),
        Provider<CartRepository>(create: (c) => CartRepository(c.read<ApiClient>())),
        Provider<OrderRepository>(create: (c) => OrderRepository(c.read<ApiClient>())),
      ],
      child: const RimbunApp(),
    ),
  );
}
