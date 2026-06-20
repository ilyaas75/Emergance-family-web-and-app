import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/locale_provider.dart';
import '../services/api_service.dart';

class AlertsTab extends StatefulWidget {
  const AlertsTab({super.key});
  @override
  State<AlertsTab> createState() => _AlertsTabState();
}

class _AlertsTabState extends State<AlertsTab> {
  final _api = ApiService.instance.dio;
  List _alerts = []; String? _circleId; bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }
  Future<void> _load() async {
    try {
      final r = await _api.get('/circles/mine');
      final circles = r.data['data'];
      if (circles.isNotEmpty) {
        _circleId = circles.first['_id'];
        final a = await _api.get('/circles/$_circleId/alerts');
        _alerts = a.data['data'];
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _respond(String alertId, String status) async {
    if (_circleId == null) return;
    await _api.post('/circles/$_circleId/alerts/$alertId/respond', data: {'status': status});
    await _load();
  }

  Future<void> _resolve(String alertId) async {
    if (_circleId == null) return;
    await _api.post('/circles/$_circleId/alerts/$alertId/resolve', data: {});
    await _load();
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
        final message = a['emergencyMessage'] ?? a['note'];
        return Card(child: Padding(padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Icon(active ? Icons.warning : Icons.check_circle, color: active ? const Color(0xFFFF4D5E) : const Color(0xFF2DD4A7), size: 18),
              const SizedBox(width: 8),
              Expanded(child: Text('${a['type'] == 'sos' ? 'SOS' : 'Check-in'} · ${a['triggeredBy']?['name'] ?? '—'}',
                style: const TextStyle(fontWeight: FontWeight.w700))),
            ]),
            if (message != null) Padding(padding: const EdgeInsets.only(top: 8), child: Text(message.toString())),
            if (a['locationUrl'] != null) Padding(padding: const EdgeInsets.only(top: 8),
              child: Chip(avatar: const Icon(Icons.place, size: 16), label: Text(a['locationUrl']))),
            if (media.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 8),
              child: Wrap(spacing: 8, children: media.map<Widget>((m) =>
                Chip(label: Text(m['kind'] == 'video' ? '🎥 video' : '🎙 audio'))).toList())),
            if (active) Padding(padding: const EdgeInsets.only(top: 10),
              child: Wrap(spacing: 8, runSpacing: 8, children: [
                OutlinedButton(onPressed: () => _respond(a['_id'], 'responding'), child: const Text('Responding')),
                OutlinedButton(onPressed: () => _respond(a['_id'], 'arrived'), child: const Text('Arrived')),
                FilledButton(onPressed: () => _respond(a['_id'], 'safe'), child: Text(t('safe'))),
                FilledButton.tonal(onPressed: () => _resolve(a['_id']), child: const Text('Resolve')),
              ])),
            Padding(padding: const EdgeInsets.only(top: 6),
              child: Text(a['startedAt'] ?? '', style: TextStyle(fontSize: 11, color: Theme.of(context).hintColor))),
          ])));
      });
  }
}
