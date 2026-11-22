import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { UserProfile, getCachedUser, setCachedUser, clearCachedUser } from '../storage/userCache';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../storage/secureStore';
import { authApi } from '../api/auth.api';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: (credentials: { idToken?: string; accessToken?: string; code?: string }) => Promise<void>;
  setSessionTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Optimistic Hydration on App Launch:
  // Check Keychain/Keystore for token and load cached profile immediately!
  useEffect(() => {
    async function hydrateAuth() {
      try {
        const [token, cached] = await Promise.all([
          getAccessToken(),
          getCachedUser(),
        ]);

        if (token) {
          // Optimistically hydrate user state instantly with cached profile
          if (cached) {
            setUser(cached);
            setIsAuthenticated(true);
          }

          // Background revalidation
          try {
            const freshUser = await authApi.getProfile();
            setUser(freshUser);
            setIsAuthenticated(true);
            await setCachedUser(freshUser);
          } catch (err: any) {
            if (err.response?.status === 401) {
              setUser(null);
              setIsAuthenticated(false);
              await clearTokens();
              await clearCachedUser();
            }
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Auth hydration error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    hydrateAuth();
  }, []);

  const loginWithGoogle = async (credentials: {
    idToken?: string;
    accessToken?: string;
    code?: string;
  }) => {
    setIsLoading(true);
    try {
      const data = await authApi.authenticateWithGoogle(credentials);
      await saveTokens(data.accessToken, data.refreshToken);
      await setCachedUser(data.user);
      setUser(data.user);
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const setSessionTokens = async (accessToken: string, refreshToken: string) => {
    setIsLoading(true);
    try {
      await saveTokens(accessToken, refreshToken);
      const profile = await authApi.getProfile();
      await setCachedUser(profile);
      setUser(profile);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Failed to set session tokens:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        await authApi.logout(refreshToken).catch(() => {});
      }
    } finally {
      await clearTokens();
      await clearCachedUser();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const freshUser = await authApi.getProfile();
      setUser(freshUser);
      await setCachedUser(freshUser);
    } catch (e) {
      console.error('Failed to refresh profile:', e);
    }
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      loginWithGoogle,
      setSessionTokens,
      logout,
      refreshProfile,
    }),
    [user, isAuthenticated, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
