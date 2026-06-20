import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeProvider extends ChangeNotifier {
  ThemeMode _mode = ThemeMode.dark;
  ThemeMode get mode => _mode;
  bool get isDark => _mode == ThemeMode.dark;

  ThemeProvider() { _load(); }
  Future<void> _load() async {
    final p = await SharedPreferences.getInstance();
    _mode = (p.getString('bb_theme') ?? 'dark') == 'light' ? ThemeMode.light : ThemeMode.dark;
    notifyListeners();
  }
  Future<void> set(bool dark) async {
    _mode = dark ? ThemeMode.dark : ThemeMode.light; notifyListeners();
    final p = await SharedPreferences.getInstance();
    await p.setString('bb_theme', dark ? 'dark' : 'light');
  }
  void toggle() => set(!isDark);
}
