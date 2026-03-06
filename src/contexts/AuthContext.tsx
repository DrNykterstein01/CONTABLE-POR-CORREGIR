import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import { storage } from '../services/storage';

interface AuthContextValue {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    // initialize default users/accounts
    storage.initializeDefaultUsers();
    storage.initializeDefaultAccounts();
    const savedUserId = localStorage.getItem('currentUserId');
    if (savedUserId) {
      const users = storage.getUsers();
      const found = users.find(u => u.id === savedUserId);
      if (found) setUser(found);
    }
    applyTheme(theme);
  }, []); // eslint-disable-line

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const applyTheme = (t: 'light' | 'dark') => {
    const root = document.documentElement;
    if (t === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const login = async (username: string, password: string) => {
    const users = storage.getUsers();
    const creds = storage.getCredentials();
    const found = users.find(u => u.username.toLowerCase() === username.toLowerCase() || u.fullName.toLowerCase() === username.toLowerCase());
    if (found && creds[found.username] === password) {
      setUser(found);
      localStorage.setItem('currentUserId', found.id);
      return true;
    }

    // allow login with credentials even if user not present (not ideal, but helpful for quick create)
    if (creds[username] === password) {
      // try to find user by username
      const u = users.find(u => u.username === username);
      if (u) {
        setUser(u);
        localStorage.setItem('currentUserId', u.id);
        return true;
      }
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUserId');
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const users = storage.getUsers();
    const updated = users.map(u => {
      if (u.id === user.id) {
        return { ...u, ...data };
      }
      return u;
    });
    storage.saveUsers(updated);
    const newUser = { ...user, ...data };
    setUser(newUser);
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile, theme, toggleTheme }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
