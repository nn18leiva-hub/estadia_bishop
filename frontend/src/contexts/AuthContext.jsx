import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch, getAuthToken, setAuthToken, removeAuthToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user profile if we have a token
  const fetchProfile = async (type, role, email) => {
    let resolvedType = type;
    let resolvedRole = role;
    let resolvedEmail = email;

    if (!resolvedType) {
      const token = getAuthToken();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          resolvedType = payload.type;
          resolvedRole = payload.role;
          resolvedEmail = payload.email;
        } catch (e) {}
      }
    }

    try {
      if (resolvedType === 'staff') {
        try {
          const data = await apiFetch('/staff/profile');
          setUser({ ...data, type: 'staff', role: data.role || resolvedRole, email: data.email || resolvedEmail });
        } catch {
          // Fallback if staff profile endpoint not yet available
          setUser({ type: 'staff', role: resolvedRole, email: resolvedEmail, full_name: resolvedEmail?.split('@')[0] || 'Administrator' });
        }
      } else {
        const data = await apiFetch('/parent/profile');
        setUser({ ...data, type: data.user_type || 'parent' });
      }
    } catch (err) {
      console.error('Failed to load profile', err);
      removeAuthToken();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        fetchProfile(payload.type, payload.role, payload.email);
      } catch (e) {
        fetchProfile(); // fallback
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setAuthToken(res.token);

    if (res.type === 'parent' || res.type === 'past_student' || !res.type) {
      await fetchProfile('parent', res.role, email);
    } else {
      await fetchProfile('staff', res.role, email);
    }
    return res;
  };

  const register = async (userData) => {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    return res;
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
  };

  // Allows Profile page to update in-memory user state after save
  const updateUser = (patch) => {
    setUser(prev => prev ? { ...prev, ...patch } : prev);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, fetchProfile, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
