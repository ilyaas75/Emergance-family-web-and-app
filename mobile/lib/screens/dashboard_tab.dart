import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../providers/auth_provider.dart';
import '../providers/locale_provider.dart';
import '../services/api_service.dart';
import '../services/location_service.dart';
import '../widgets/sos_button.dart';
import '../widgets/recorder_sheet.dart';
import 'circles_screen.dart';

const _emergencyNumbers = [
  {'label': 'Emergency', 'phone': '112', 'icon': Icons.emergency},
  {'label': 'Police', 'phone': '999', 'icon': Icons.local_police},
  {'label': 'Ambulance', 'phone': '997', 'icon': Icons.local_hospital},
  {'label': 'Fire', 'phone': '998', 'icon': Icons.local_fire_department},
];

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
    final body = <String, dynamic>{'type': 'sos'};
    if (pos != null) { body['lng'] = pos.longitude; body['lat'] = pos.latitude; }
    final r = await _api.post('/circles/$_circleId/alerts', data: body);
    setState(() => _activeAlert = r.data['data']);
  }

  Future<void> _resolve() async {
    await _api.post('/circles/$_circleId/alerts/${_activeAlert!['_id']}/resolve', data: {});
    setState(() => _activeAlert = null);
  }

  Future<void> _call(String phone) async {
    final cleaned = phone.trim();
    if (cleaned.isEmpty) return;
    final uri = Uri(scheme: 'tel', path: cleaned);
    final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!opened && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not open phone dialer for $cleaned')),
      );
    }
  }

  Widget _statCard({required IconData icon, required String label, required String value, required Color color}) {
    return Expanded(child: Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface.withValues(alpha: .72),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: color.withValues(alpha: .22)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 10),
        Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
        const SizedBox(height: 2),
        Text(label, style: TextStyle(fontSize: 11, color: Theme.of(context).hintColor)),
      ]),
    ));
  }

  Widget _memberTile(Map m) {
    final t = context.read<LocaleProvider>().t;
    final u = m['user'] ?? {};
    final name = (u['name'] ?? '—').toString();
    final moving = m['moving'] == true;
    final speed = m['speed'] ?? 0;
    final accuracy = m['accuracy'];
    final battery = m['battery'];
    final coords = m['geo']?['coordinates'];
    final hasLocation = coords is List && coords.length >= 2;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: .06)),
      ),
      child: Row(children: [
        Container(
          width: 48, height: 48,
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: moving
              ? const [Color(0xFFF6B73C), Color(0xFFFF8A3D)]
              : const [Color(0xFF4DA3FF), Color(0xFF2DD4A7)]),
            shape: BoxShape.circle,
            boxShadow: [BoxShadow(color: (moving ? const Color(0xFFF6B73C) : const Color(0xFF2DD4A7)).withValues(alpha: .25), blurRadius: 18)],
          ),
          child: Center(child: Text(name.substring(0, 1).toUpperCase(),
            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: Color(0xFF06121C)))),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
          const SizedBox(height: 5),
          Wrap(spacing: 8, runSpacing: 6, children: [
            _MiniPill(icon: moving ? Icons.directions_walk : Icons.verified, label: moving ? '${t('moving')} · $speed km/h' : t('safe'),
              color: moving ? const Color(0xFFF6B73C) : const Color(0xFF2DD4A7)),
            if (accuracy != null) _MiniPill(icon: Icons.gps_fixed, label: '±${accuracy}m', color: const Color(0xFF4DA3FF)),
            if (hasLocation) _MiniPill(icon: Icons.place, label: '${coords[1].toStringAsFixed(3)}, ${coords[0].toStringAsFixed(3)}', color: const Color(0xFF9DB0C7)),
          ]),
        ])),
        const SizedBox(width: 10),
        Text(battery != null ? '$battery%' : t('safe'), style: const TextStyle(color: Color(0xFF2DD4A7), fontWeight: FontWeight.w800)),
      ]),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = context.watch<LocaleProvider>().t;
    final user = context.watch<AuthProvider>().user;
    final personalContacts = user?.emergencyContacts
        .where((c) => (c['name']?.toString().isNotEmpty ?? false) && (c['phone']?.toString().isNotEmpty ?? false))
        .toList() ?? [];
    final primaryCallPhone = personalContacts.isNotEmpty ? personalContacts.first['phone'].toString() : '112';
    final active = _activeAlert != null;
    final movingCount = _members.where((m) => m['moving'] == true).length;
    final circleName = _circles.where((c) => c['_id'] == _circleId).isNotEmpty
      ? _circles.firstWhere((c) => c['_id'] == _circleId)['name']
      : 'Badbaado';
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
      child: ListView(padding: const EdgeInsets.fromLTRB(16, 14, 16, 24), children: [
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(26),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: active
                ? const [Color(0xFF3B1019), Color(0xFF111C31)]
                : const [Color(0xFF10243C), Color(0xFF0F1C30)],
            ),
            border: Border.all(color: (active ? const Color(0xFFFF4D5E) : const Color(0xFF2DD4A7)).withValues(alpha: .28)),
            boxShadow: [BoxShadow(color: (active ? const Color(0xFFFF4D5E) : const Color(0xFF2DD4A7)).withValues(alpha: .12), blurRadius: 28, offset: const Offset(0, 14))],
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Container(width: 44, height: 44, decoration: BoxDecoration(
                color: (active ? const Color(0xFFFF4D5E) : const Color(0xFF2DD4A7)).withValues(alpha: .16),
                borderRadius: BorderRadius.circular(15)),
                child: Icon(active ? Icons.warning_rounded : Icons.verified_rounded,
                  color: active ? const Color(0xFFFF4D5E) : const Color(0xFF2DD4A7))),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(active ? t('sosSent') : t('allSafe'), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
                const SizedBox(height: 3),
                Text(circleName.toString(), style: TextStyle(color: Theme.of(context).hintColor, fontSize: 12)),
              ])),
              IconButton(
                icon: const Icon(Icons.groups_rounded),
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CirclesScreen())).then((_) => _loadCircles()),
              ),
            ]),
            const SizedBox(height: 18),
            Row(children: [
              _statCard(icon: Icons.people_alt_rounded, label: t('members'), value: '${_members.length}', color: const Color(0xFF4DA3FF)),
              const SizedBox(width: 10),
              _statCard(icon: Icons.directions_walk_rounded, label: t('moving'), value: '$movingCount', color: const Color(0xFFF6B73C)),
              const SizedBox(width: 10),
              _statCard(icon: Icons.health_and_safety_rounded, label: t('safe'), value: active ? 'SOS' : 'OK', color: active ? const Color(0xFFFF4D5E) : const Color(0xFF2DD4A7)),
            ]),
          ]),
        ),
        const SizedBox(height: 18),
        Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: Colors.white.withValues(alpha: .06)),
          ),
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
          ]),
        ),
        const SizedBox(height: 20),
        Row(children: [
          const Expanded(child: Text('Emergency call', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18))),
          IconButton(
            tooltip: 'Call now',
            onPressed: () => _call(primaryCallPhone),
            icon: const Icon(Icons.call_rounded, color: Color(0xFF2DD4A7)),
          ),
        ]),
        const SizedBox(height: 10),
        SizedBox(
          height: 112,
          child: ListView(scrollDirection: Axis.horizontal, children: [
            ...personalContacts.map((c) => _CallCard(
              label: c['relation']?.toString().isNotEmpty == true ? c['relation'].toString() : 'Family',
              phone: c['phone'].toString(),
              title: c['name'].toString(),
              icon: Icons.family_restroom,
              onTap: () => _call(c['phone'].toString()),
            )),
            ..._emergencyNumbers.map((n) => _CallCard(
              label: n['label'] as String,
              phone: n['phone'] as String,
              title: n['phone'] as String,
              icon: n['icon'] as IconData,
              onTap: () => _call(n['phone'] as String),
            )),
          ]),
        ),
        const SizedBox(height: 20),
        Row(children: [
          Expanded(child: Text('${t('members')} · ${_members.length}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18))),
          Text(t('safe'), style: const TextStyle(color: Color(0xFF2DD4A7), fontWeight: FontWeight.w800)),
        ]),
        const SizedBox(height: 10),
        if (_members.isEmpty)
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(color: Theme.of(context).colorScheme.surface, borderRadius: BorderRadius.circular(18)),
            child: Text(t('none'), textAlign: TextAlign.center),
          )
        else
          ..._members.map((m) => _memberTile(m)),
      ]),
    );
  }
}

class _CallCard extends StatelessWidget {
  final String label, title, phone;
  final IconData icon;
  final VoidCallback onTap;

  const _CallCard({required this.label, required this.title, required this.phone, required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsetsDirectional.only(end: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Container(
          width: 148,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFF2DD4A7).withValues(alpha: .18)),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Icon(icon, color: const Color(0xFF2DD4A7), size: 20),
            const Spacer(),
            Text(label, maxLines: 1, overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 10, height: 1, color: Theme.of(context).hintColor, fontWeight: FontWeight.w700)),
            const SizedBox(height: 3),
            Text(title, maxLines: 1, overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 16, height: 1.05, fontWeight: FontWeight.w900)),
            const SizedBox(height: 3),
            Text(phone, maxLines: 1, overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 10, height: 1, color: Theme.of(context).hintColor)),
          ]),
        ),
      ),
    );
  }
}

class _MiniPill extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _MiniPill({required this.icon, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(color: color.withValues(alpha: .12), borderRadius: BorderRadius.circular(999)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 12, color: color),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w800)),
      ]),
    );
  }
}
