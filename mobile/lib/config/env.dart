import 'package:flutter/foundation.dart';

class Env {
  // Android emulator uses 10.0.2.2 to reach the host; desktop builds use localhost.
  static String get _host => defaultTargetPlatform == TargetPlatform.android ? '10.0.2.2' : 'localhost';

  static String get apiBase => const String.fromEnvironment('API_BASE').isNotEmpty
      ? const String.fromEnvironment('API_BASE')
      : 'http://$_host:5000/api/v1';

  static String get socketUrl => const String.fromEnvironment('SOCKET_URL').isNotEmpty
      ? const String.fromEnvironment('SOCKET_URL')
      : 'http://$_host:5000';
}
