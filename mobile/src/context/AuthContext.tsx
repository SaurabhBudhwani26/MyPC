import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phoneNumber?: string;
  joinDate: string;
  preferences: {
    notifications: boolean;
    darkMode?: boolean;
    newsletter: boolean;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  getAccessToken: () => Promise<string | null>;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message?: string }>;
  signup: (credentials: SignupCredentials) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.29.22:3001/api';

  // Initialize auth state from AsyncStorage
  useEffect(() => {
    loadAuthFromStorage();
  }, []);

  const loadAuthFromStorage = async () => {
    try {
      const [userData, tokenData] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('tokens')
      ]);

      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        console.log('👤 User loaded from storage:', parsedUser.name);
      }

      if (tokenData) {
        const parsedTokens = JSON.parse(tokenData);
        setTokens(parsedTokens);
        console.log('🔑 Tokens loaded from storage');
      }
    } catch (error) {
      console.error('Error loading auth from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAuthToStorage = async (userData: User, tokenData: AuthTokens) => {
    try {
      await Promise.all([
        AsyncStorage.setItem('user', JSON.stringify(userData)),
        AsyncStorage.setItem('tokens', JSON.stringify(tokenData))
      ]);
      console.log('💾 Auth data saved to storage');
    } catch (error) {
      console.error('Error saving auth to storage:', error);
    }
  };

  const removeAuthFromStorage = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem('user'),
        AsyncStorage.removeItem('tokens')
      ]);
      console.log('🗑️ Auth data removed from storage');
    } catch (error) {
      console.error('Error removing auth from storage:', error);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);

    try {
      if (!credentials.email || !credentials.password) {
        return { success: false, message: 'Please fill in all fields' };
      }

      if (!isValidEmail(credentials.email)) {
        return { success: false, message: 'Please enter a valid email address' };
      }

      // Make API call to backend
      console.log('🚀 Attempting login with backend...');
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return { success: false, message: data.message || 'Login failed' };
      }

      // Extract user and tokens from response
      const userData: User = {
        id: data.data.user._id,
        name: data.data.user.name,
        email: data.data.user.email,
        avatar: data.data.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.data.user.name)}&background=1E40AF&color=fff`,
        phoneNumber: data.data.user.phoneNumber,
        joinDate: data.data.user.createdAt,
        preferences: {
          notifications: data.data.user.preferences?.notifications ?? true,
          darkMode: data.data.user.preferences?.darkMode ?? false,
          newsletter: data.data.user.preferences?.newsletter ?? false,
        },
      };

      const tokenData: AuthTokens = {
        accessToken: data.data.tokens.accessToken,
        refreshToken: data.data.tokens.refreshToken,
        expiresAt: data.data.tokens.expiresAt,
      };

      setUser(userData);
      setTokens(tokenData);
      await saveAuthToStorage(userData, tokenData);

      console.log('✅ User logged in successfully:', userData.name);
      return { success: true };

    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error. Please check your connection.' };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (credentials: SignupCredentials): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);

    try {
      // Validate input
      if (!credentials.name || !credentials.email || !credentials.password) {
        return { success: false, message: 'Please fill in all required fields' };
      }

      if (!isValidEmail(credentials.email)) {
        return { success: false, message: 'Please enter a valid email address' };
      }

      if (credentials.password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters' };
      }

      if (credentials.name.length < 2) {
        return { success: false, message: 'Name must be at least 2 characters' };
      }

      // Make API call to backend
      console.log('🚀 Attempting signup with backend...');
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return { success: false, message: data.message || 'Signup failed' };
      }

      // Extract user and tokens from response
      const userData: User = {
        id: data.data.user._id,
        name: data.data.user.name,
        email: data.data.user.email,
        avatar: data.data.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.data.user.name)}&background=1E40AF&color=fff`,
        phoneNumber: data.data.user.phoneNumber,
        joinDate: data.data.user.createdAt,
        preferences: {
          notifications: data.data.user.preferences?.notifications ?? true,
          darkMode: data.data.user.preferences?.darkMode ?? false,
          newsletter: data.data.user.preferences?.newsletter ?? false,
        },
      };

      const tokenData: AuthTokens = {
        accessToken: data.data.tokens.accessToken,
        refreshToken: data.data.tokens.refreshToken,
        expiresAt: data.data.tokens.expiresAt,
      };

      setUser(userData);
      setTokens(tokenData);
      await saveAuthToStorage(userData, tokenData);

      console.log('🎉 User signed up successfully:', userData.name);
      return { success: true };

    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: 'Network error. Please check your connection.' };
    } finally {
      setIsLoading(false);
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    try {
      if (!tokens) {
        console.log('🔑 No tokens available');
        return null;
      }

      // Check if token is expired
      const now = new Date();
      const expiresAt = new Date(tokens.expiresAt);

      if (now >= expiresAt) {
        console.log('🔑 Access token expired, attempting refresh...');
        return await refreshAccessToken();
      }

      return tokens.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      if (!tokens?.refreshToken) {
        console.log('🔑 No refresh token available');
        await logout();
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.log('🔑 Token refresh failed, logging out');
        await logout();
        return null;
      }

      const newTokenData: AuthTokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || tokens.refreshToken,
        expiresAt: data.expiresAt,
      };

      setTokens(newTokenData);
      if (user) {
        await saveAuthToStorage(user, newTokenData);
      }

      console.log('🔑 Access token refreshed successfully');
      return newTokenData.accessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      await logout();
      return null;
    }
  };

  const logout = async () => {
    try {
      // Notify backend about logout if we have a refresh token
      if (tokens?.refreshToken) {
        try {
          await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken: tokens.refreshToken }),
          });
        } catch (error) {
          console.warn('Failed to notify backend about logout:', error);
        }
      }

      setUser(null);
      setTokens(null);
      await removeAuthFromStorage();
      console.log('👋 User logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user || !tokens) return;

    try {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await saveAuthToStorage(updatedUser, tokens);
      console.log('✅ Profile updated');
    } catch (error) {
      console.error('Profile update error:', error);
    }
  };

  // Helper functions
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const extractNameFromEmail = (email: string): string => {
    const localPart = email.split('@')[0];
    return localPart.charAt(0).toUpperCase() + localPart.slice(1);
  };

  const generateUserId = (): string => {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  };

  const value: AuthContextType = {
    user,
    tokens,
    isLoading,
    isAuthenticated: !!user,
    getAccessToken,
    login,
    signup,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
