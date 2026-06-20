import 'package:flutter/material.dart';
class BrandHeader extends StatelessWidget {
  final String title; final String? subtitle;
  const BrandHeader({super.key, required this.title, this.subtitle});
  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).colorScheme;
    return Row(children: [
      Container(width: 44, height: 44,
        decoration: BoxDecoration(borderRadius: BorderRadius.circular(13),
          gradient: LinearGradient(colors: [c.primary, c.secondary])),
        child: const Icon(Icons.shield_outlined, color: Color(0xFF06121C))),
      const SizedBox(width: 12),
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
        if (subtitle != null) Text(subtitle!, style: TextStyle(fontSize: 12, color: Theme.of(context).hintColor)),
      ]),
    ]);
  }
}
