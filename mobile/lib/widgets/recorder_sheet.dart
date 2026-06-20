import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:record/record.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart' as pp;
import '../providers/locale_provider.dart';
import '../services/api_service.dart';

class RecorderSheet extends StatefulWidget {
  final String circleId, alertId;
  const RecorderSheet({super.key, required this.circleId, required this.alertId});
  @override
  State<RecorderSheet> createState() => _RecorderSheetState();
}

class _RecorderSheetState extends State<RecorderSheet> {
  final _rec = AudioRecorder();
  bool _recording = false;
  String _status = '';

  Future<void> _toggleAudio() async {
    final t = context.read<LocaleProvider>().t;
    if (_recording) {
      final path = await _rec.stop();
      setState(() => _recording = false);
      if (path != null) await _upload(File(path), 'audio');
      return;
    }
    if (await _rec.hasPermission()) {
      final dir = await pp.getTemporaryDirectory();
      final p = '${dir.path}/evidence_${DateTime.now().millisecondsSinceEpoch}.m4a';
      await _rec.start(const RecordConfig(), path: p);
      setState(() { _recording = true; _status = t('recording'); });
    }
  }

  Future<void> _video() async {
    final x = await ImagePicker().pickVideo(source: ImageSource.camera, maxDuration: const Duration(seconds: 30));
    if (x != null) await _upload(File(x.path), 'video');
  }

  Future<void> _upload(File f, String kind) async {
    final t = context.read<LocaleProvider>().t;
    setState(() => _status = '…');
    try {
      final form = FormData.fromMap({'file': await MultipartFile.fromFile(f.path)});
      await ApiService.instance.dio.post('/circles/${widget.circleId}/alerts/${widget.alertId}/media', data: form);
      setState(() => _status = t('uploaded'));
    } catch (e) { setState(() => _status = 'error'); }
  }

  @override
  Widget build(BuildContext context) {
    final t = context.read<LocaleProvider>().t;
    return Wrap(spacing: 10, runSpacing: 10, alignment: WrapAlignment.center, children: [
      ElevatedButton.icon(onPressed: _toggleAudio,
        icon: Icon(_recording ? Icons.stop : Icons.mic),
        label: Text(_recording ? t('recording') : t('recAudio')),
        style: _recording ? ElevatedButton.styleFrom(backgroundColor: const Color(0xFFFF4D5E)) : null),
      OutlinedButton.icon(onPressed: _video, icon: const Icon(Icons.videocam), label: Text(t('recVideo'))),
      if (_status.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 4), child: Text(_status, style: const TextStyle(fontSize: 12))),
    ]);
  }
  @override
  void dispose() { _rec.dispose(); super.dispose(); }
}
