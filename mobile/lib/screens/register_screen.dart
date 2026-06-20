import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/locale_provider.dart';
import '../l10n/app_strings.dart';
import '../widgets/brand_header.dart';
import '../widgets/lang_theme_row.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});
  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _pass = TextEditingController();
  String? _err; bool _busy = false;

  Future<void> _submit() async {
    final loc = context.read<LocaleProvider>();
    setState(() { _busy = true; _err = null; });
    try {
      await context.read<AuthProvider>().register({
        'name': _name.text.trim(), 'phone': _phone.text.trim(),
        'password': _pass.text, 'language': loc.lang,
      });
      if (mounted) Navigator.pushReplacementNamed(context, '/home');
    } catch (e) { setState(() => _err = 'Error'); }
    finally { if (mounted) setState(() => _busy = false); }
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.watch<LocaleProvider>();
    final t = loc.t;
    return Scaffold(
      body: SafeArea(child: Center(child: SingleChildScrollView(
        padding: const EdgeInsets.all(22),
        child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 420),
          child: Card(child: Padding(padding: const EdgeInsets.all(22),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                BrandHeader(title: t('appName')), const LangThemeRow()]),
              const SizedBox(height: 18),
              Text(t('createAccount'), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
              const SizedBox(height: 16),
              TextField(controller: _name, decoration: InputDecoration(labelText: t('name'), border: const OutlineInputBorder())),
              const SizedBox(height: 12),
              TextField(controller: _phone, keyboardType: TextInputType.phone, decoration: InputDecoration(labelText: t('phone'), border: const OutlineInputBorder())),
              const SizedBox(height: 12),
              TextField(controller: _pass, obscureText: true, decoration: InputDecoration(labelText: t('password'), border: const OutlineInputBorder())),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: loc.lang,
                decoration: InputDecoration(labelText: t('language'), border: const OutlineInputBorder()),
                items: AppStrings.langs.map((l) => DropdownMenuItem(value: l['code'], child: Text(l['label']!))).toList(),
                onChanged: (v) { if (v != null) loc.setLang(v); }),
              if (_err != null) Padding(padding: const EdgeInsets.only(top: 10), child: Text(_err!, style: const TextStyle(color: Color(0xFFFF4D5E)))),
              const SizedBox(height: 16),
              SizedBox(width: double.infinity, child: FilledButton(onPressed: _busy ? null : _submit,
                child: _busy ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2)) : Text(t('register')))),
              Center(child: TextButton(onPressed: () => Navigator.pop(context), child: Text('${t('haveAccount')} ${t('login')}'))),
            ]),
          )),
        ),
      ))),
    );
  }
}
