import 'package:socket_io_client/socket_io_client.dart' as io;
import '../config/env.dart';
import 'token_store.dart';

// Real-time channel for live location + alerts.
class SocketService {
  static io.Socket? _socket;

  static Future<io.Socket> connect() async {
    if (_socket != null) return _socket!;
    final token = await TokenStore.access;
    _socket = io.io(Env.socketUrl, io.OptionBuilder()
        .setTransports(['websocket'])
        .setAuth({'token': token})
        .enableForceNew()
        .build());
    _socket!.connect();
    return _socket!;
  }
  static void joinCircle(String id) => _socket?.emit('circle:join', id);
  static io.Socket? get socket => _socket;
  static void disconnect() { _socket?.dispose(); _socket = null; }
}
