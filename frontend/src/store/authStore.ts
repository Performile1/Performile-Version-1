import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState, LoginCredentials, RegisterData } from '@/types';
import { authService } from '@/services/authService';
import toast from 'react-hot-toast';

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  updateUser: (user: Partial<User>) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true });
          
          const response = await authService.login(credentials);
          
          if (response.success && response.data) {
            const { user, tokens } = response.data;
            
            console.log('[AuthStore] Login successful, setting tokens:', { hasTokens: !!tokens, hasAccessToken: !!tokens?.accessToken });
            
            set({
              user,
              tokens,
              isAuthenticated: true,
              isLoading: false,
            });
            
            console.log('[AuthStore] State after login:', { hasTokens: !!get().tokens, hasAccessToken: !!get().tokens?.accessToken });
            
            toast.success('Login successful!');
            return true;
          }
          
          toast.error(response.message || 'Login failed');
          set({ isLoading: false });
          return false;
        } catch (error: any) {
          console.error('Login error:', error);
          toast.error(error.message || 'Login failed');
          set({ isLoading: false });
          return false;
        }
      },

      register: async (data: RegisterData) => {
        try {
          set({ isLoading: true });
          
          const response = await authService.register(data);
          
          if (response.success && response.data) {
            const { user, tokens } = response.data;
            
            set({
              user,
              tokens,
              isAuthenticated: true,
              isLoading: false,
            });
            
            toast.success('Registration successful!');
            return true;
          }
          
          toast.error(response.message || 'Registration failed');
          set({ isLoading: false });
          return false;
        } catch (error: any) {
          console.error('Registration error:', error);
          toast.error(error.message || 'Registration failed');
          set({ isLoading: false });
          return false;
        }
      },

      logout: async () => {
        try {
          const { tokens } = get();
          
          if (tokens) {
            await authService.logout();
          }
          
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
          });
          
          toast.success('Logged out successfully');
        } catch (error: any) {
          console.error('Logout error:', error);
          // Clear auth state even if logout request fails
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      refreshToken: async () => {
        try {
          const { tokens } = get();
          
          if (!tokens?.refreshToken) {
            return false;
          }
          
          const response = await authService.refreshToken(tokens.refreshToken);
          
          if (response.success && response.data) {
            set({
              tokens: response.data.tokens,
            });
            return true;
          }
          
          // Refresh failed, clear auth
          get().clearAuth();
          return false;
        } catch (error: any) {
          console.error('Token refresh error:', error);
          get().clearAuth();
          return false;
        }
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...userData },
          });
        }
      },

      clearAuth: () => {
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'performile-auth',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens, // TEMPORARY: Store tokens until HttpOnly cookies are implemented
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
