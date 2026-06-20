import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/locale_provider.dart';
import '../providers/theme_provider.dart';
import '../l10n/app_strings.dart';
import '../services/api_service.dart';

class ProfileTab extends StatefulWidget {
  const ProfileTab({super.key});
  @override
  State<ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends State<ProfileTab> {
  final _api = ApiService.instance.dio;
  late final TextEditingController _name;
  late final TextEditingController _blood;
  late final TextEditingController _allergies;
  String _msg = '';

  @override
  void initState() {
    super.initState();
    final u = context.read<AuthProvider>().user;
    _name = TextEditingController(text: u?.name ?? '');
    _blood = TextEditingController(text: u?.bloodType ?? '');
    _allergies = TextEditingController(text: u?.allergies ?? '');
  }

  Future<void> _save() async {
    final loc = context.read<LocaleProvider>();
    await _api.put('/users/me', data: {
      'name': _name.text, 'bloodType': _blood.text, 'allergies': _allergies.text, 'language': loc.lang,
    });
    setState(() => _msg = loc.t('uploaded'));
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.watch<LocaleProvider>();
    final theme = context.watch<ThemeProvider>();
    final auth = context.read<AuthProvider>();
    final t = loc.t;
    return ListView(padding: const EdgeInsets.all(16), children: [
      Center(child: CircleAvatar(radius: 38, backgroundColor: const Color(0xFF4DA3FF),
        child: Text((auth.user?.name ?? '?').substring(0, 1), style: const TextStyle(fontSize: 28)))),
      const SizedBox(height: 8),
      Center(child: Text(auth.user?.name ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700))),
      Center(child: Text(auth.user?.phone ?? '', style: TextStyle(color: Theme.of(context).hintColor))),
      const SizedBox(height: 20),

      Text(t('medical'), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
      const SizedBox(height: 10),
      TextField(controller: _name, decoration: InputDecoration(labelText: t('name'), border: const OutlineInputBorder())),
      const SizedBox(height: 12),
      TextField(controller: _blood, decoration: InputDecoration(labelText: t('bloodType'), border: const OutlineInputBorder())),
      const SizedBox(height: 12),
      TextField(controller: _allergies, decoration: InputDecoration(labelText: t('allergies'), border: const OutlineInputBorder())),
      const SizedBox(height: 12),
      DropdownButtonFormField<String>(
        value: loc.lang,
        decoration: InputDecoration(labelText: t('language'), border: const OutlineInputBorder()),
        items: AppStrings.langs.map((l) => DropdownMenuItem(value: l['code'], child: Text(l['label']!))).toList(),
        onChanged: (v) { if (v != null) loc.setLang(v); }),
      const SizedBox(height: 12),
      SizedBox(width: double.infinity, child: FilledButton(onPressed: _save, child: Text(t('save')))),
      if (_msg.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 8), child: Text(_msg, style: const TextStyle(color: Color(0xFF2DD4A7)))),

      const Divider(height: 32),
      Text(t('theme'), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
      const SizedBox(height: 8),
      Row(children: [
        Expanded(child: OutlinedButton.icon(onPressed: () => theme.set(true),
          icon: const Icon(Icons.dark_mode), label: Text(t('dark')),
          style: theme.isDark ? OutlinedButton.styleFrom(backgroundColor: const Color(0x222DD4A7)) : null)),
        const SizedBox(width: 10),
        Expanded(child: OutlinedButton.icon(onPressed: () => theme.set(false),
          icon: const Icon(Icons.light_mode), label: Text(t('light')),
          style: !theme.isDark ? OutlinedButton.styleFrom(backgroundColor: const Color(0x222DD4A7)) : null)),
      ]),

      const Divider(height: 32),
      SizedBox(width: double.infinity, child: OutlinedButton.icon(
        onPressed: () async { await auth.logout(); if (context.mounted) Navigator.pushReplacementNamed(context, '/login'); },
        icon: const Icon(Icons.logout), label: Text(t('logout')),
        style: OutlinedButton.styleFrom(foregroundColor: const Color(0xFFFF4D5E)))),
    ]);
  }
}
