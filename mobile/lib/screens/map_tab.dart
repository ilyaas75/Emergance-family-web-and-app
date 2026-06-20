import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';

class MapTab extends StatefulWidget {
  const MapTab({super.key});
  @override
  State<MapTab> createState() => _MapTabState();
}

class _MapTabState extends State<MapTab> {
  final _api = ApiService.instance.dio;
  final Map<String, LatLng> _points = {};
  final Map<String, String> _names = {};
  String? _circleId;

  @override
  void initState() { super.initState(); _init(); }

  Future<void> _init() async {
    final r = await _api.get('/circles/mine');
    final circles = r.data['data'];
    if (circles.isEmpty) return;
    _circleId = circles.first['_id'];
    final loc = await _api.get('/circles/$_circleId/locations');
    for (final m in loc.data['data']) {
      final coords = m['geo']?['coordinates'];
      final u = m['user'] ?? {};
      if (coords != null) {
        _points[u['_id'] ?? m['_id']] = LatLng(coords[1].toDouble(), coords[0].toDouble());
        _names[u['_id'] ?? m['_id']] = u['name'] ?? '?';
      }
    }
    if (mounted) setState(() {});
    // live updates
    final s = await SocketService.connect();
    SocketService.joinCircle(_circleId!);
    s.on('location:update', (d) {
      if (d is Map && d['lat'] != null && d['lng'] != null) {
        setState(() {
          _points[d['user']] = LatLng((d['lat']).toDouble(), (d['lng']).toDouble());
          _names[d['user']] = d['name'] ?? '?';
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final center = _points.isNotEmpty ? _points.values.first : const LatLng(2.0469, 45.3182);
    return FlutterMap(
      options: MapOptions(initialCenter: center, initialZoom: 12),
      children: [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.badbaado.app',
        ),
        MarkerLayer(markers: _points.entries.map((e) => Marker(
          point: e.value, width: 80, height: 60,
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(width: 26, height: 26,
              decoration: BoxDecoration(color: const Color(0xFF2DD4A7), shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 3)),
              child: Center(child: Text((_names[e.key] ?? '?').substring(0, 1),
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF06121C))))),
            Text(_names[e.key] ?? '', style: const TextStyle(fontSize: 9)),
          ]),
        )).toList()),
      ],
    );
  }
}
