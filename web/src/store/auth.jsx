import { createContext, useContext, useEffect, useState } from 'react';
import api, { tokens } from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';

const AuthCtx = createContext();
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (tokens.access) {
        try {
          const { data } = await api.get('/auth/me');
          setUser(data.data);
          connectSocket();
        } catch (e) { tokens.clear(); }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (phone, password) => {
    const { data } = await api.post('/auth/login', { phone, password });
    tokens.set(data.data); setUser(data.data.user); connectSocket();
    return data.data.user;
  };
  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    tokens.set(data.data); setUser(data.data.user); connectSocket();
    return data.data.user;
  };
  const logout = async () => {
    try { await api.post('/auth/logout', { refreshToken: tokens.refresh }); } catch (e) {}
    tokens.clear(); disconnectSocket(); setUser(null);
  };
  return <AuthCtx.Provider value={{ user, setUser, loading, login, register, logout }}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);
