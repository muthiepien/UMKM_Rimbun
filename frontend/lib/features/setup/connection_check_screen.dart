import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/config/api_config.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_dimens.dart';
import '../../core/utils/formatters.dart';

/// LAYAR SEMENTARA (Tahap 1): membuktikan aplikasi Flutter terhubung ke backend
/// dan database lewat GET /api/health.
/// Akan diganti oleh SplashScreen pada Tahap 3, lalu file ini dihapus.
class ConnectionCheckScreen extends StatefulWidget {
  const ConnectionCheckScreen({super.key});

  @override
  State<ConnectionCheckScreen> createState() => _ConnectionCheckScreenState();
}

class _ConnectionCheckScreenState extends State<ConnectionCheckScreen> {
  late Future<Map<String, dynamic>> _health;

  @override
  void initState() {
    super.initState();
    _health = _checkHealth();
  }

  Future<Map<String, dynamic>> _checkHealth() async {
    final response = await context.read<ApiClient>().get('/api/health');
    return response.asMap();
  }

  void _retry() {
    setState(() {
      _health = _checkHealth();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppDimens.screenPadding),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const _Brand(),
                  const SizedBox(height: AppDimens.xl),
                  _StatusCard(
                    child: FutureBuilder<Map<String, dynamic>>(
                      future: _health,
                      builder: (context, snapshot) => _statusBody(snapshot),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _statusBody(AsyncSnapshot<Map<String, dynamic>> snapshot) {
    if (snapshot.connectionState != ConnectionState.done) {
      return const Column(
        children: [
          SizedBox(
            width: 28,
            height: 28,
            child: CircularProgressIndicator(strokeWidth: 3),
          ),
          SizedBox(height: AppDimens.md),
          Text('Menghubungi server…'),
        ],
      );
    }

    if (snapshot.hasError) {
      final error = snapshot.error;
      final message =
          error is ApiException ? error.message : 'Terjadi kesalahan tak terduga.';
      return Column(
        children: [
          const Icon(Icons.cloud_off_rounded, size: 40, color: AppColors.error),
          const SizedBox(height: AppDimens.sm),
          const Text(
            'Gagal terhubung',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: AppDimens.xs),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.textSecondary),
          ),
          const SizedBox(height: AppDimens.md),
          _InfoRow(label: 'Alamat API', value: ApiConfig.baseUrl),
          const SizedBox(height: AppDimens.md),
          OutlinedButton(onPressed: _retry, child: const Text('Coba Lagi')),
        ],
      );
    }

    final data = snapshot.data!;
    final serverTime = DateTime.tryParse('${data['server_time']}');
    return Column(
      children: [
        const Icon(Icons.check_circle_rounded, size: 40, color: AppColors.success),
        const SizedBox(height: AppDimens.sm),
        const Text(
          'Server dan database terhubung',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: AppDimens.md),
        _InfoRow(label: 'Alamat API', value: ApiConfig.baseUrl),
        _InfoRow(label: 'Database', value: '${data['database_name']}'),
        _InfoRow(
          label: 'Waktu server',
          value: serverTime == null ? '-' : Formatters.tanggalWaktu(serverTime),
        ),
      ],
    );
  }
}

class _Brand extends StatelessWidget {
  const _Brand();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 88,
          height: 88,
          decoration: const BoxDecoration(
            color: AppColors.primarySoft,
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.eco_rounded, size: 48, color: AppColors.primary),
        ),
        const SizedBox(height: AppDimens.md),
        Text(
          'Rimbun',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.w700,
                color: AppColors.primaryDark,
              ),
        ),
        const SizedBox(height: AppDimens.xs),
        const Text(
          'Toko Pupuk & Tanaman',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      ],
    );
  }
}

class _StatusCard extends StatelessWidget {
  const _StatusCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppDimens.lg),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppDimens.radiusLg),
        border: Border.all(color: AppColors.border),
      ),
      child: child,
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppDimens.xs),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textSecondary)),
          const SizedBox(width: AppDimens.md),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }
}
