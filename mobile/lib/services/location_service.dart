import 'package:geolocator/geolocator.dart';

class LocationService {
  static Future<Position?> current() async {
    final enabled = await Geolocator.isLocationServiceEnabled();
    if (!enabled) return null;
    var perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) perm = await Geolocator.requestPermission();
    if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) return null;
    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
    );
  }
}
