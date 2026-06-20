import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/env.dart';
import 'token_store.dart';

// Singleton Dio client with auth + language headers and one-shot refresh on 401.
class ApiService {
  ApiService._() {
    dio = Dio(BaseOptions(baseUrl: Env.apiBase, connectTimeout: const Duration(seconds: 12)));
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await TokenStore.access;
        if (token != null) options.headers['Authorization'] = 'Bearer $token';
        final p = await SharedPreferences.getInstance();
        options.headers['x-lang'] = p.getString('bb_lang') ?? 'so';
        handler.next(options);
      },
      onError: (e, handler) async {
        if (e.response?.statusCode == 401 && e.requestOptions.extra['retried'] != true) {
          final refresh = await TokenStore.refresh;
          if (refresh != null) {
            try {
              final raw = Dio(BaseOptions(baseUrl: Env.apiBase));
              final r = await raw.post('/auth/refresh', data: {'refreshToken': refresh});
              final d = r.data['data'];
              await TokenStore.save(d['accessToken'], d['refreshToken']);
              final req = e.requestOptions;
              req.extra['retried'] = true;
              req.headers['Authorization'] = 'Bearer ${d['accessToken']}';
              final clone = await dio.fetch(req);
              return handler.resolve(clone);
            } catch (_) {
              await TokenStore.clear();
            }
          }
        }
        handler.next(e);
      },
    ));
  }
  static final ApiService instance = ApiService._();
  late final Dio dio;
}
