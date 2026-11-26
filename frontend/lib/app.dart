import 'package:flutter/material.dart';

import 'core/theme/app_theme.dart';
import 'features/setup/connection_check_screen.dart';

/// Widget akar aplikasi. Routing & pemilihan layar awal ditambahkan di Tahap 3.
class RimbunApp extends StatelessWidget {
  const RimbunApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Rimbun',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: const ConnectionCheckScreen(),
    );
  }
}
