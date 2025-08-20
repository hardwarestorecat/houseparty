import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';

interface User {
  _id: string;
  username: string;
  email: string;
  phone: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  profilePicture?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  error: null,

  // Login
  login: async (email, password) => {
    try {
      set({ loading: true, error: null });
      
      // Call login API
      const response = await api.post('/auth/login', { email, password });
      
      const { user, accessToken, refreshToken } = response.data;
      
      // Save tokens to AsyncStorage
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      
      // Update state
      set({
        isAuthenticated: true,
        user,
        accessToken,
        refreshToken,
        loading: false,
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error.response?.data?.error || 'Login failed',
      });
    }
  },

  // Register
  register: async (username, email, phone, password) => {
    try {
      set({ loading: true, error: null });
      
      // Call register API
      const response = await api.post('/auth/register', {
        username,
        email,
        phone,
        password,
      });
      
      // Update state
      set({
        loading: false,
        user: response.data.user,
      });
      
      return response.data;
    } catch (error: any) {
      set({
        loading: false,
        error: error.response?.data?.error || 'Registration failed',
      });
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      set({ loading: true });
      
      // Call logout API if needed
      // await api.post('/auth/logout');
      
      // Clear tokens from AsyncStorage
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      
      // Reset state
      set({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
    }
  },

  // Check if user is authenticated
  checkAuth: async () => {
    try {
      set({ loading: true });
      
      // Get tokens from AsyncStorage
      const accessToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (!accessToken || !refreshToken) {
        set({ loading: false });
        return;
      }
      
      // Set tokens in API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      // Get user profile
      const response = await api.get('/auth/me');
      
      // Update state
      set({
        isAuthenticated: true,
        user: response.data.user,
        accessToken,
        refreshToken,
        loading: false,
      });
    } catch (error) {
      // Clear tokens if authentication fails
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      
      set({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        loading: false,
      });
    }
  },

  // Verify email
  verifyEmail: async (email, otp) => {
    try {
      set({ loading: true, error: null });
      
      // Call verify email API
      const response = await api.post('/auth/verify-email', { email, otp });
      
      // Update user state
      set((state) => ({
        user: state.user ? { ...state.user, isEmailVerified: true } : null,
        loading: false,
      }));
      
      return response.data;
    } catch (error: any) {
      set({
        loading: false,
        error: error.response?.data?.error || 'Email verification failed',
      });
      throw error;
    }
  },

  // Update profile
  updateProfile: async (userData) => {
    try {
      set({ loading: true, error: null });
      
      // Call update profile API
      const response = await api.put('/users/profile', userData);
      
      // Update user state
      set((state) => ({
        user: state.user ? { ...state.user, ...response.data.user } : null,
        loading: false,
      }));
      
      return response.data;
    } catch (error: any) {
      set({
        loading: false,
        error: error.response?.data?.error || 'Profile update failed',
      });
      throw error;
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

