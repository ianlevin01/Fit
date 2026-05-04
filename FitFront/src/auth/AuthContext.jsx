import { createContext, useContext, useState, useCallback } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fit_user')); } catch { return null; }
  });

  const login = useCallback(async (email, password) => {
    const { data } = await client.post('/fit/auth/login', { email, password });
    localStorage.setItem('fit_token', data.token);
    localStorage.setItem('fit_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await client.post('/fit/auth/register', { name, email, password });
    localStorage.setItem('fit_token', data.token);
    localStorage.setItem('fit_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('fit_token');
    localStorage.removeItem('fit_user');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await client.get('/fit/auth/me');
    localStorage.setItem('fit_user', JSON.stringify(data));
    setUser(data);
    return data;
  }, []);

  const updateProfile = useCallback(async (fields) => {
    const { data } = await client.put('/fit/auth/profile', fields);
    localStorage.setItem('fit_user', JSON.stringify(data));
    setUser(data);
    return data;
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
