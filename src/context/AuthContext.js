// src/context/AuthContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import { api, setToken, clearAuth } from '../api/client';

const AuthContext = createContext(null);

const ROLE_MAP = { 0: 'Admin', 1: 'Attendant', 2: 'Viewer' };

function parseJwt(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));

    const username =
      payload['unique_name'] ||
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
      payload['name'] ||
      'User';

    const rawRole =
      payload['role'] ||
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
      '';

    const role = ROLE_MAP[rawRole] || ROLE_MAP[parseInt(rawRole)] || rawRole || 'Viewer';

    return { username, role };
  } catch {
    return { username: 'User', role: 'Viewer' };
  }
}

function getStoredUser() {
  try {
    const s = localStorage.getItem('sp_user');
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = getStoredUser();
    // FIX: when restoring the session from localStorage we MUST also call
    // setToken() so the TOKEN variable inside client.js is populated.
    // Without this, client.js runs its module-level initialiser:
    //   let TOKEN = localStorage.getItem('sp_token') || '';
    // at import time — before AuthProvider even mounts — and because React
    // modules are cached, TOKEN stays '' for the entire session.
    // Every request then goes out without an Authorization header → 401.
    if (stored?.token) {
      setToken(stored.token);
    }
    return stored;
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const login = useCallback(async (username, password) => {
    setLoading(true); setError('');
    try {
      const data  = await api.login(username, password);
      const token = data.token || data.Token;
      setToken(token);
      const info = parseJwt(token);
      const u    = { ...info, token };
      setUser(u);
      localStorage.setItem('sp_user', JSON.stringify(u));
      return u;
    } catch (e) {
      setError('Invalid credentials or server unreachable.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }