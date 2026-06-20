import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
export const tokens = {
  get access() { return localStorage.getItem('bb_access'); },
  get refresh() { return localStorage.getItem('bb_refresh'); },
  set({ accessToken, refreshToken }) {
    if (accessToken) localStorage.setItem('bb_access', accessToken);
    if (refreshToken) localStorage.setItem('bb_refresh', refreshToken);
  },
  clear() { localStorage.removeItem('bb_access'); localStorage.removeItem('bb_refresh'); },
};

const api = axios.create({ baseURL: API_URL });

// attach access token + current language
api.interceptors.request.use((config) => {
  if (tokens.access) config.headers.Authorization = `Bearer ${tokens.access}`;
  config.headers['x-lang'] = localStorage.getItem('bb_lang') || 'so';
  return config;
});

// auto-refresh once on 401
let refreshing = null;
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && tokens.refresh) {
      original._retry = true;
      try {
        refreshing = refreshing || axios.post(`${API_URL}/auth/refresh`, { refreshToken: tokens.refresh });
        const { data } = await refreshing;
        refreshing = null;
        tokens.set(data.data);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch (e) {
        refreshing = null;
        tokens.clear();
        if (location.pathname !== '/login') location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
export default api;
