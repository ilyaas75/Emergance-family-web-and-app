import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/locale_provider.dart';
import '../services/api_service.dart';
import '../config/env.dart';

class AlertsTab extends StatefulWidget {
  const AlertsTab({super.key});
  @override
  State<AlertsTab> createState() => _AlertsTabState();
}

class _AlertsTabState extends State<AlertsTab> {
  final _api = ApiService.instance.dio;
  List _alerts = []; bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }
  Future<void> _load() async {
    try {
      final r = await _api.get('/circles/mine');
      final circles = r.data['data'];
      if (circles.isNotEmpty) {
        final a = await _api.get('/circles/${circles.first['_id']}/alerts');
        _alerts = a.data['data'];
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final t = context.watch<LocaleProvider>().t;
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_alerts.isEmpty) return Center(child: Text(t('none')));
    return ListView.builder(padding: const EdgeInsets.all(16), itemCount: _alerts.length,
      itemBuilder: (_, i) {
        final a = _alerts[i];
        final active = a['status'] == 'active';
        final media = (a['media'] as List?) ?? [];
        return Card(child: Padding(padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Icon(active ? Icons.warning : Icons.check_circle, color: active ? const Color(0xFFFF4D5E) : const Color(0xFF2DD4A7), size: 18),
              const SizedBox(width: 8),
              Expanded(child: Text('${a['type'] == 'sos' ? 'SOS' : 'Check-in'} · ${a['triggeredBy']?['name'] ?? '—'}',
                style: const TextStyle(fontWeight: FontWeight.w700))),
            ]),
            if (media.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 8),
              child: Wrap(spacing: 8, children: media.map<Widget>((m) =>
                Chip(label: Text(m['kind'] == 'video' ? '🎥 video' : '🎙 audio'))).toList())),
            Padding(padding: const EdgeInsets.only(top: 6),
              child: Text(a['startedAt'] ?? '', style: TextStyle(fontSize: 11, color: Theme.of(context).hintColor))),
          ])));
      });
  }
}
