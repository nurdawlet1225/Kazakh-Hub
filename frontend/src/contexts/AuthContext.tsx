import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { apiService } from '../utils/api';

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  totp_enabled?: boolean;
}

interface AuthTokens {
  access_token: string;
  token_type: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  login: (tokens: AuthTokens, user: User) => void;
  logout: () => Promise<void>;
  setTokens: (tokens: AuthTokens) => void;
  setUser: (user: User) => void;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshing = useRef(false);

  // Initialize from sessionStorage on mount
  // Refresh token is stored in HttpOnly cookie (sent automatically by browser)
  // User data is stored in sessionStorage for UI display purposes
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        setUserState(JSON.parse(storedUser));
      } catch { /* ignore */ }
    }
    // Try to refresh the access token on load (cookie is sent automatically)
    refreshAccessToken();
  }, []);

  // Cleanup refresh timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  const refreshAccessToken = useCallback(async () => {
    if (isRefreshing.current) return;
    isRefreshing.current = true;
    try {
      const data = await apiService.refreshToken();
      setAccessToken(data.access_token);
    } catch {
      // Refresh failed — clear auth
      sessionStorage.removeItem('user');
      setAccessToken(null);
      setUserState(null);
    } finally {
      isRefreshing.current = false;
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((tokens: AuthTokens, userData: User) => {
    setAccessToken(tokens.access_token);
    // Store user data in sessionStorage for UI display
    // Refresh token is stored in HttpOnly cookie by the server
    sessionStorage.setItem('user', JSON.stringify(userData));
    setUserState(userData);

    // Schedule auto-refresh before token expires (25 minutes for 30-min token)
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      refreshAccessToken();
    }, 25 * 60 * 1000);
  }, [refreshAccessToken]);

  const logout = useCallback(async () => {
    try {
      await apiService.logout(accessToken || undefined);
    } catch { /* ignore */ }
    setAccessToken(null);
    sessionStorage.removeItem('user');
    setUserState(null);
    isRefreshing.current = false; // Reset so refresh can work after re-login
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  }, [accessToken]);

  const setTokens = useCallback((tokens: AuthTokens) => {
    setAccessToken(tokens.access_token);
  }, []);

  const setUser = useCallback((userData: User) => {
    sessionStorage.setItem('user', JSON.stringify(userData));
    setUserState(userData);
  }, []);

  const getAccessToken = useCallback(() => accessToken, [accessToken]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !isLoading && !!user && !!accessToken,
    isLoading,
    accessToken,
    login,
    logout,
    setTokens,
    setUser,
    getAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;