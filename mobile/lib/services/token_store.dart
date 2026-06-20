import 'package:flutter_secure_storage/flutter_secure_storage.dart';

// Tokens kept in platform secure storage (Keychain / Keystore).
class TokenStore {
  static const _s = FlutterSecureStorage();
  static Future<String?> get access => _s.read(key: 'bb_access');
  static Future<String?> get refresh => _s.read(key: 'bb_refresh');
  static Future<void> save(String? access, String? refresh) async {
    if (access != null) await _s.write(key: 'bb_access', value: access);
    if (refresh != null) await _s.write(key: 'bb_refresh', value: refresh);
  }
  static Future<void> clear() async { await _s.delete(key: 'bb_access'); await _s.delete(key: 'bb_refresh'); }
}
