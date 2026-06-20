import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/locale_provider.dart';
import '../services/api_service.dart';

class CirclesScreen extends StatefulWidget {
  const CirclesScreen({super.key});
  @override
  State<CirclesScreen> createState() => _CirclesScreenState();
}

class _CirclesScreenState extends State<CirclesScreen> {
  final _api = ApiService.instance.dio;
  List _circles = [];
  final _name = TextEditingController();
  final _code = TextEditingController();
  String _type = 'family';

  @override
  void initState() { super.initState(); _load(); }
  Future<void> _load() async {
    final r = await _api.get('/circles/mine');
    if (mounted) setState(() => _circles = r.data['data']);
  }
  Future<void> _create() async {
    if (_name.text.trim().isEmpty) return;
    await _api.post('/circles', data: {'name': _name.text.trim(), 'type': _type});
    _name.clear(); _load();
  }
  Future<void> _join() async {
    if (_code.text.trim().isEmpty) return;
    await _api.post('/circles/join', data: {'inviteCode': _code.text.trim()});
    _code.clear(); _load();
  }

  @override
  Widget build(BuildContext context) {
    final t = context.watch<LocaleProvider>().t;
    return Scaffold(
      appBar: AppBar(title: Text(t('createCircle'))),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        ..._circles.map((c) => Card(child: ListTile(
          leading: CircleAvatar(backgroundColor: const Color(0xFF2DD4A7), child: Text(c['name'][0])),
          title: Text(c['name']),
          subtitle: Text('${t(c['type'])} · ${(c['members'] as List?)?.length ?? 0} ${t('members')}'),
          trailing: Text(c['inviteCode'], style: const TextStyle(fontFamily: 'monospace')),
        ))),
        const SizedBox(height: 12),
        Card(child: Padding(padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(t('createCircle'), style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            TextField(controller: _name, decoration: InputDecoration(labelText: t('circleName'), border: const OutlineInputBorder())),
            const SizedBox(height: 10),
            DropdownButtonFormField<String>(value: _type,
              decoration: InputDecoration(labelText: t('type'), border: const OutlineInputBorder()),
              items: [
                DropdownMenuItem(value: 'family', child: Text(t('family'))),
                DropdownMenuItem(value: 'couple', child: Text(t('couple'))),
              ], onChanged: (v) => setState(() => _type = v ?? 'family')),
            const SizedBox(height: 12),
            SizedBox(width: double.infinity, child: FilledButton(onPressed: _create, child: Text(t('create')))),
          ]))),
        const SizedBox(height: 12),
        Card(child: Padding(padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(t('joinCircle'), style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            TextField(controller: _code, decoration: InputDecoration(labelText: t('inviteCode'), border: const OutlineInputBorder())),
            const SizedBox(height: 12),
            SizedBox(width: double.infinity, child: OutlinedButton(onPressed: _join, child: Text(t('joinCircle')))),
          ]))),
      ]),
    );
  }
}
