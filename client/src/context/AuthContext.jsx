import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService';

const TOKEN_STORAGE_KEY = 'saas:token';
const ACTIVE_ORG_STORAGE_KEY = 'saas:activeOrgId';

export const AuthContext = createContext(null);

const getStoredToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
};

const clearAuthStorage = () => {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(ACTIVE_ORG_STORAGE_KEY);
};

const getAuthPayload = (response) => response.data?.data || {};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getStoredToken);
  const [loading, setLoading] = useState(true);

  const storeSession = useCallback((authPayload) => {
    if (!authPayload.token) {
      return authPayload.user;
    }

    window.localStorage.setItem(TOKEN_STORAGE_KEY, authPayload.token);
    setToken(authPayload.token);
    setUser(authPayload.user);

    return authPayload.user;
  }, []);

  const login = useCallback(
    async (email, password) => {
      const response = await authService.login({ email, password });
      return storeSession(getAuthPayload(response));
    },
    [storeSession],
  );

  const register = useCallback(
    async (payload) => {
      const response = await authService.register(payload);
      return storeSession(getAuthPayload(response));
    },
    [storeSession],
  );

  const logout = useCallback(() => {
    clearAuthStorage();
    setToken(null);
    setUser(null);

    if (window.location.pathname !== '/login') {
      window.location.assign('/login');
    }
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((currentUser) => (currentUser ? { ...currentUser, ...patch } : currentUser));
  }, []);

  const completeOnboarding = useCallback(async () => {
    const response = await authService.completeOnboarding();
    const nextUser = response.data?.data?.user;

    setUser((currentUser) => nextUser || (currentUser ? { ...currentUser, hasCompletedOnboarding: true } : currentUser));
    return nextUser;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadCurrentUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authService.getMe();
        if (isMounted) {
          setUser(response.data?.data?.user || null);
        }
      } catch (_error) {
        clearAuthStorage();
        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
      updateUser,
      completeOnboarding,
    }),
    [completeOnboarding, loading, login, logout, register, token, updateUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
