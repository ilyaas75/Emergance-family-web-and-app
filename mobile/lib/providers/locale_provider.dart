import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../l10n/app_strings.dart';

class LocaleProvider extends ChangeNotifier {
  String _lang = 'so';
  String get lang => _lang;
  bool get isRtl => _lang == 'ar';
  Locale get locale => Locale(_lang);

  LocaleProvider() { _load(); }
  Future<void> _load() async {
    final p = await SharedPreferences.getInstance();
    _lang = p.getString('bb_lang') ?? 'so';
    notifyListeners();
  }
  Future<void> setLang(String l) async {
    _lang = l; notifyListeners();
    final p = await SharedPreferences.getInstance();
    await p.setString('bb_lang', l);
  }
  String t(String key) => AppStrings.of(_lang, key);
}
