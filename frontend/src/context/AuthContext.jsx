import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, loginUser, logoutUser, registerUser } from '../services/api';

const AuthContext = createContext(null);
const TOKEN_KEY = 'studentdrive_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setLoading(false); return; }
    getCurrentUser(token)
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  async function login(credentials) {
    const result = await loginUser(credentials);
    localStorage.setItem(TOKEN_KEY, result.token);
    setUser(result.user);
    return result;
  }

  async function register(details) {
    const result = await registerUser(details);
    localStorage.setItem(TOKEN_KEY, result.token);
    setUser(result.user);
    return result;
  }

  async function logout() {
    const token = localStorage.getItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    if (token) await logoutUser(token).catch(() => {});
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }