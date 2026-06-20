import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/locale_provider.dart';
import '../widgets/brand_header.dart';
import '../widgets/lang_theme_row.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phone = TextEditingController();
  final _pass = TextEditingController();
  String? _err; bool _busy = false;

  Future<void> _submit() async {
    setState(() { _busy = true; _err = null; });
    try {
      await context.read<AuthProvider>().login(_phone.text.trim(), _pass.text);
      if (mounted) Navigator.pushReplacementNamed(context, '/home');
    } catch (e) {
      setState(() => _err = e.toString().contains('401') ? 'Invalid credentials' : 'Error');
    } finally { if (mounted) setState(() => _busy = false); }
  }

  @override
  Widget build(BuildContext context) {
    final t = context.read<LocaleProvider>().t;
    return Scaffold(
      body: SafeArea(child: Center(child: SingleChildScrollView(
        padding: const EdgeInsets.all(22),
        child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 420),
          child: Card(child: Padding(padding: const EdgeInsets.all(22),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                BrandHeader(title: t('appName')), const LangThemeRow(),
              ]),
              const SizedBox(height: 20),
              Text(t('welcome'), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
              const SizedBox(height: 18),
              TextField(controller: _phone, keyboardType: TextInputType.phone,
                decoration: InputDecoration(labelText: t('phone'), border: const OutlineInputBorder())),
              const SizedBox(height: 14),
              TextField(controller: _pass, obscureText: true,
                decoration: InputDecoration(labelText: t('password'), border: const OutlineInputBorder())),
              if (_err != null) Padding(padding: const EdgeInsets.only(top: 10),
                child: Text(_err!, style: const TextStyle(color: Color(0xFFFF4D5E), fontSize: 13))),
              const SizedBox(height: 18),
              SizedBox(width: double.infinity, child: FilledButton(
                onPressed: _busy ? null : _submit,
                child: _busy ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2)) : Text(t('login')))),
              const SizedBox(height: 12),
              Center(child: TextButton(
                onPressed: () => Navigator.pushNamed(context, '/register'),
                child: Text('${t('noAccount')} ${t('createAccount')}'))),
            ]),
          )),
        ),
      ))),
    );
  }
}
