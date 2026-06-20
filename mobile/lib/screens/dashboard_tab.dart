import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/locale_provider.dart';
import '../services/api_service.dart';
import '../services/location_service.dart';
import '../widgets/sos_button.dart';
import '../widgets/recorder_sheet.dart';
import 'circles_screen.dart';

class DashboardTab extends StatefulWidget {
  const DashboardTab({super.key});
  @override
  State<DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends State<DashboardTab> {
  final _api = ApiService.instance.dio;
  List _circles = []; String? _circleId;
  List _members = []; Map? _activeAlert; bool _loading = true;

  @override
  void initState() { super.initState(); _loadCircles(); }

  Future<void> _loadCircles() async {
    try {
      final r = await _api.get('/circles/mine');
      _circles = r.data['data'];
      if (_circles.isNotEmpty) { _circleId = _circles.first['_id']; await _loadMembers(); }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _loadMembers() async {
    if (_circleId == null) return;
    final r = await _api.get('/circles/$_circleId/locations');
    if (mounted) setState(() => _members = r.data['data']);
  }

  Future<void> _triggerSos() async {
    final pos = await LocationService.current();
    final body = {'type': 'sos'};
    if (pos != null) { body['lng'] = pos.longitude; body['lat'] = pos.latitude; }
    final r = await _api.post('/circles/$_circleId/alerts', data: body);
    setState(() => _activeAlert = r.data['data']);
  }

  Future<void> _resolve() async {
    await _api.post('/circles/$_circleId/alerts/${_activeAlert!['_id']}/resolve', data: {});
    setState(() => _activeAlert = null);
  }

  @override
  Widget build(BuildContext context) {
    final t = context.watch<LocaleProvider>().t;
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_circles.isEmpty) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Text(t('noCircle')), const SizedBox(height: 14),
        FilledButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CirclesScreen())).then((_) => _loadCircles()),
          child: Text(t('createCircle'))),
      ]));
    }
    return RefreshIndicator(
      onRefresh: _loadMembers,
      child: ListView(padding: const EdgeInsets.all(16), children: [
        Card(child: Padding(padding: const EdgeInsets.all(16),
          child: Row(children: [
            const Icon(Icons.check_circle, color: Color(0xFF2DD4A7)),
            const SizedBox(width: 12),
            Expanded(child: Text(t('allSafe'), style: const TextStyle(fontWeight: FontWeight.w700))),
            IconButton(icon: const Icon(Icons.group), onPressed: () =>
              Navigator.push(context, MaterialPageRoute(builder: (_) => const CirclesScreen())).then((_) => _loadCircles())),
          ]))),
        const SizedBox(height: 16),
        Card(child: Padding(padding: const EdgeInsets.all(20),
          child: Column(children: [
            if (_activeAlert == null)
              SosButton(onTrigger: _triggerSos)
            else ...[
              Chip(label: Text(t('sosSent')), backgroundColor: const Color(0x22FF4D5E)),
              const SizedBox(height: 14),
              RecorderSheet(circleId: _circleId!, alertId: _activeAlert!['_id']),
              const SizedBox(height: 14),
              SizedBox(width: double.infinity, child: FilledButton(onPressed: _resolve, child: Text(t('imSafe')))),
            ],
          ]))),
        const SizedBox(height: 16),
        Text('${t('members')} · ${_members.length}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
        const SizedBox(height: 8),
        ..._members.map((m) {
          final u = m['user'] ?? {};
          return Card(child: ListTile(
            leading: CircleAvatar(backgroundColor: const Color(0xFF4DA3FF), child: Text((u['name'] ?? '?').toString().substring(0, 1))),
            title: Text(u['name'] ?? '—'),
            subtitle: m['moving'] == true ? Text('${t('moving')} · ${m['speed'] ?? 0} km/h') : null,
            trailing: Text(m['battery'] != null ? '${m['battery']}%' : t('safe'),
              style: const TextStyle(color: Color(0xFF2DD4A7), fontWeight: FontWeight.w700)),
          ));
        }),
      ]),
    );
  }
}
