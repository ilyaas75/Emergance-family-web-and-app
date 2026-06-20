import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/locale_provider.dart';

class SosButton extends StatefulWidget {
  final VoidCallback onTrigger;
  const SosButton({super.key, required this.onTrigger});
  @override
  State<SosButton> createState() => _SosButtonState();
}

class _SosButtonState extends State<SosButton> {
  double _progress = 0;
  Timer? _timer;
  static const _steps = 30; // 3s / 100ms

  void _start(_) {
    _progress = 0;
    _timer = Timer.periodic(const Duration(milliseconds: 100), (t) {
      setState(() => _progress += 1 / _steps);
      if (_progress >= 1) { t.cancel(); _reset(); widget.onTrigger(); }
    });
  }
  void _reset() { _timer?.cancel(); _timer = null; setState(() => _progress = 0); }

  @override
  Widget build(BuildContext context) {
    final t = context.read<LocaleProvider>().t;
    return Column(children: [
      GestureDetector(
        onTapDown: _start, onTapUp: (_) => _reset(), onTapCancel: _reset,
        child: SizedBox(
          width: 200, height: 200,
          child: Stack(alignment: Alignment.center, children: [
            Container(
              width: 200, height: 200,
              decoration: const BoxDecoration(shape: BoxShape.circle,
                gradient: RadialGradient(center: Alignment(0, -0.3), radius: 0.9,
                  colors: [Color(0xFFFF6B78), Color(0xFFFF4D5E), Color(0xFFC81E2E)], stops: [0, 0.55, 1]),
                boxShadow: [BoxShadow(color: Color(0x66FF4D5E), blurRadius: 40, offset: Offset(0, 16))]),
            ),
            SizedBox(width: 188, height: 188,
              child: CircularProgressIndicator(value: _progress, strokeWidth: 6,
                valueColor: const AlwaysStoppedAnimation(Colors.white),
                backgroundColor: Colors.white24)),
            Column(mainAxisSize: MainAxisSize.min, children: [
              Text(t('sos'), style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w800, letterSpacing: 2)),
              Text(t('sosHold'), style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w600)),
            ]),
          ]),
        ),
      ),
      const SizedBox(height: 12),
      Text(t('sosDesc'), textAlign: TextAlign.center, style: TextStyle(color: Theme.of(context).hintColor, fontSize: 13)),
    ]);
  }
  @override
  void dispose() { _timer?.cancel(); super.dispose(); }
}
