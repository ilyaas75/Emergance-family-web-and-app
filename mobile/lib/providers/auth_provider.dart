import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/token_store.dart';
import '../services/socket_service.dart';
import '../models/user.dart';

class AuthProvider extends ChangeNotifier {
  AppUser? user;
  bool loading = true;
  final _api = ApiService.instance.dio;

  Future<void> tryAutoLogin() async {
    final token = await TokenStore.access;
    if (token != null) {
      try {
        final r = await _api.get('/auth/me');
        user = AppUser.fromJson(r.data['data']);
        await SocketService.connect();
      } catch (_) { await TokenStore.clear(); }
    }
    loading = false; notifyListeners();
  }

  Future<void> login(String phone, String password) async {
    final r = await _api.post('/auth/login', data: {'phone': phone, 'password': password});
    await _afterAuth(r.data['data']);
  }
  Future<void> register(Map<String, dynamic> body) async {
    final r = await _api.post('/auth/register', data: body);
    await _afterAuth(r.data['data']);
  }
  Future<void> _afterAuth(Map<String, dynamic> d) async {
    await TokenStore.save(d['accessToken'], d['refreshToken']);
    user = AppUser.fromJson(d['user']);
    await SocketService.connect();
    notifyListeners();
  }
  void setUser(AppUser next) {
    user = next;
    notifyListeners();
  }
  Future<void> logout() async {
    try { final rt = await TokenStore.refresh; await _api.post('/auth/logout', data: {'refreshToken': rt}); } catch (_) {}
    await TokenStore.clear(); SocketService.disconnect(); user = null; notifyListeners();
  }
}
