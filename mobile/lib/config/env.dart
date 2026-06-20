class Env {
  // For Android emulator use 10.0.2.2 to reach host machine; iOS sim can use localhost.
  static const String apiBase = String.fromEnvironment(
    'API_BASE',
    defaultValue: 'http://10.0.2.2:5000/api/v1',
  );
  static const String socketUrl = String.fromEnvironment(
    'SOCKET_URL',
    defaultValue: 'http://10.0.2.2:5000',
  );
}
