import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/locale_provider.dart';
import '../providers/theme_provider.dart';
import '../l10n/app_strings.dart';

// Reusable language dropdown + theme toggle.
class LangThemeRow extends StatelessWidget {
  const LangThemeRow({super.key});
  @override
  Widget build(BuildContext context) {
    final loc = context.watch<LocaleProvider>();
    final theme = context.watch<ThemeProvider>();
    return Row(mainAxisSize: MainAxisSize.min, children: [
      DropdownButton<String>(
        value: loc.lang, underline: const SizedBox(),
        items: AppStrings.langs.map((l) => DropdownMenuItem(value: l['code'], child: Text(l['label']!))).toList(),
        onChanged: (v) { if (v != null) loc.setLang(v); }),
      IconButton(
        icon: Icon(theme.isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined),
        onPressed: theme.toggle),
    ]);
  }
}
