import 'package:flutter/material.dart';

// Brand palette shared with the web app.
const _safe = Color(0xFF2DD4A7);
const _azure = Color(0xFF4DA3FF);
const _danger = Color(0xFFFF4D5E);

class AppTheme {
  static ThemeData get dark {
    const bg = Color(0xFF070D17);
    const surface = Color(0xFF0F1C30);
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: bg,
      colorScheme: const ColorScheme.dark(
        primary: _safe, secondary: _azure, error: _danger,
        surface: surface, onPrimary: Color(0xFF06121C),
      ),
      cardTheme: CardTheme(
        color: surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        elevation: 0,
      ),
      fontFamily: 'Roboto',
    );
  }

  static ThemeData get light {
    const bg = Color(0xFFF4F7FB);
    const surface = Color(0xFFFFFFFF);
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: bg,
      colorScheme: const ColorScheme.light(
        primary: Color(0xFF11A87E), secondary: Color(0xFF2C7BE5), error: Color(0xFFE23744),
        surface: surface, onPrimary: Colors.white,
      ),
      cardTheme: CardTheme(
        color: surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        elevation: 1,
      ),
      fontFamily: 'Roboto',
    );
  }
}
