import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const { data } = await API.post('/users/login', credentials);
    const { user: userData, accessToken, refreshToken } = data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (formData) => {
    const { data } = await API.post('/users/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  };

  const logout = async () => {
    try {
      await API.post('/users/logout');
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
