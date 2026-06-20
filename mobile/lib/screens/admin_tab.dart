import 'package:flutter/material.dart';
import '../services/api_service.dart';

class AdminTab extends StatefulWidget {
  const AdminTab({super.key});

  @override
  State<AdminTab> createState() => _AdminTabState();
}

class _AdminTabState extends State<AdminTab> {
  final _api = ApiService.instance.dio;
  bool _loading = true;
  Map<String, dynamic> _overview = {};
  List _alerts = [];
  List _users = [];
  List _locations = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait([
        _api.get('/admin/overview'),
        _api.get('/admin/alerts'),
        _api.get('/admin/users'),
        _api.get('/admin/locations'),
      ]);
      _overview = results[0].data['data'];
      _alerts = results[1].data['data'];
      _users = results[2].data['data'];
      _locations = results[3].data['data'];
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Widget _stat(String label, String value, IconData icon, Color color) {
    return Expanded(child: Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: color.withValues(alpha: .2)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(icon, color: color),
        const SizedBox(height: 10),
        Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
        Text(label, style: TextStyle(fontSize: 11, color: Theme.of(context).hintColor)),
      ]),
    ));
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    final totals = (_overview['totals'] as Map?) ?? {};
    final activeAlerts = _alerts.where((a) => a['status'] == 'active').length;
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(padding: const EdgeInsets.all(16), children: [
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [Color(0xFF10243C), Color(0xFF0F1C30)]),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0xFF4DA3FF).withValues(alpha: .25)),
          ),
          child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Icon(Icons.admin_panel_settings, color: Color(0xFF4DA3FF), size: 30),
            SizedBox(height: 12),
            Text('Admin Control Panel', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900)),
            SizedBox(height: 6),
            Text('Monitor users, alerts, GPS locations, reports, and system activity.'),
          ]),
        ),
        const SizedBox(height: 16),
        Row(children: [
          _stat('Users', '${totals['users'] ?? _users.length}', Icons.people_alt, const Color(0xFF4DA3FF)),
          const SizedBox(width: 10),
          _stat('Active SOS', '$activeAlerts', Icons.warning_rounded, activeAlerts > 0 ? const Color(0xFFFF4D5E) : const Color(0xFF2DD4A7)),
        ]),
        const SizedBox(height: 10),
        Row(children: [
          _stat('Circles', '${totals['circles'] ?? 0}', Icons.groups, const Color(0xFFF6B73C)),
          const SizedBox(width: 10),
          _stat('GPS Records', '${totals['locations'] ?? _locations.length}', Icons.gps_fixed, const Color(0xFF2DD4A7)),
        ]),
        const SizedBox(height: 18),
        const Text('Recent alerts', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
        const SizedBox(height: 8),
        ..._alerts.take(8).map((a) => Card(child: ListTile(
          leading: Icon(a['status'] == 'active' ? Icons.warning : Icons.check_circle,
              color: a['status'] == 'active' ? const Color(0xFFFF4D5E) : const Color(0xFF2DD4A7)),
          title: Text(a['triggeredBy']?['name'] ?? 'Unknown user'),
          subtitle: Text('${a['circle']?['name'] ?? 'No circle'} · ${a['status']}'),
          trailing: Text((a['type'] ?? 'sos').toString().toUpperCase()),
        ))),
        const SizedBox(height: 18),
        const Text('Latest GPS locations', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
        const SizedBox(height: 8),
        ..._locations.take(8).map((l) {
          final coords = l['geo']?['coordinates'];
          return Card(child: ListTile(
            leading: const Icon(Icons.place, color: Color(0xFF4DA3FF)),
            title: Text(l['user']?['name'] ?? 'Unknown user'),
            subtitle: Text(coords is List ? '${coords[1]}, ${coords[0]}' : 'No coordinates'),
            trailing: Text('${l['speed'] ?? 0} km/h'),
          ));
        }),
      ]),
    );
  }
}
