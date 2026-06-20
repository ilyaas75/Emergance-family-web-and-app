import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'config/theme.dart';
import 'providers/auth_provider.dart';
import 'providers/theme_provider.dart';
import 'providers/locale_provider.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/home_screen.dart';

void main() => runApp(const BadbaadoApp());

class BadbaadoApp extends StatelessWidget {
  const BadbaadoApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => LocaleProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider()..tryAutoLogin()),
      ],
      child: Consumer2<ThemeProvider, LocaleProvider>(
        builder: (_, theme, locale, __) => MaterialApp(
          title: 'Badbaado',
          debugShowCheckedModeBanner: false,
          themeMode: theme.mode,
          theme: AppTheme.light,
          darkTheme: AppTheme.dark,
          // RTL for Arabic, LTR otherwise.
          builder: (ctx, child) => Directionality(
            textDirection: locale.isRtl ? TextDirection.rtl : TextDirection.ltr,
            child: child!,
          ),
          initialRoute: '/',
          routes: {
            '/': (_) => const SplashScreen(),
            '/login': (_) => const LoginScreen(),
            '/register': (_) => const RegisterScreen(),
            '/home': (_) => const HomeScreen(),
          },
        ),
      ),
    );
  }
}
