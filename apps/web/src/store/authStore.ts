import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState, LoginCredentials, RegisterData } from '@/types';
import { authService } from '@/services/authService';
import toast from 'react-hot-toast';
import { analytics } from '@/lib/analytics';
import { jwtDecode } from 'jwt-decode';

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  validateStoredToken: () => Promise<void>;
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
          console.log('[AuthStore] === LOGIN STARTED ===');
          console.log('[AuthStore] Credentials:', { email: credentials.email });
          set({ isLoading: true });
          
          const response = await authService.login(credentials);
          console.log('[AuthStore] Login response received:', { success: response.success, hasData: !!response.data });
          
          if (response.success && response.data) {
            const { user, tokens } = response.data;
            
            console.log('[AuthStore] Login successful, setting tokens:', { hasTokens: !!tokens, hasAccessToken: !!tokens?.accessToken });
            
            // CRITICAL: Manually save tokens to localStorage as backup
            if (tokens) {
              try {
                localStorage.setItem('performile_tokens', JSON.stringify(tokens));
                console.log('[AuthStore] Tokens manually saved to localStorage');
              } catch (e) {
                console.error('[AuthStore] Failed to save tokens to localStorage:', e);
              }
            }
            
            set({
              user,
              tokens,
              isAuthenticated: true,
              isLoading: false,
            });
            
            console.log('[AuthStore] State after login:', { hasTokens: !!get().tokens, hasAccessToken: !!get().tokens?.accessToken });
            
            // Track login event
            analytics.login(user.user_id, user.user_role);
            
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
            
            // Track signup event
            analytics.signup(user.user_id, user.user_role);
            
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
          console.log('[AuthStore] Logout initiated');
          const { tokens } = get();
          
          if (tokens) {
            await authService.logout();
          }
          
          // Track logout event
          analytics.logout();
          
          // Use clearAuth to ensure everything is cleared
          get().clearAuth();
          
          toast.success('Logged out successfully');
        } catch (error: any) {
          console.error('Logout error:', error);
          // Clear auth state even if logout request fails
          get().clearAuth();
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

      validateStoredToken: async () => {
        try {
          const { tokens, isAuthenticated } = get();
          
          if (!isAuthenticated || !tokens?.accessToken) {
            console.log('[AuthStore] No tokens to validate');
            return;
          }

          // Decode token to check expiration
          const decoded: any = jwtDecode(tokens.accessToken);
          const now = Math.floor(Date.now() / 1000);
          
          console.log('[AuthStore] Token validation:', {
            exp: decoded.exp,
            now: now,
            expired: decoded.exp < now,
            expiresInMinutes: Math.floor((decoded.exp - now) / 60)
          });
          
          // If token expired or expires in less than 5 minutes, try to refresh
          if (decoded.exp && decoded.exp < now + 300) {
            console.log('[AuthStore] Token expired or expiring soon, attempting refresh');
            const refreshSuccess = await get().refreshToken();
            
            if (!refreshSuccess) {
              console.log('[AuthStore] Token refresh failed, clearing auth');
              get().clearAuth();
              toast.error('Your session has expired. Please log in again.');
            } else {
              console.log('[AuthStore] Token refreshed successfully');
            }
          } else {
            console.log('[AuthStore] Token is still valid');
          }
        } catch (error) {
          console.error('[AuthStore] Token validation error:', error);
          // If token is invalid, clear auth silently
          try {
            get().clearAuth();
            toast.error('Invalid session. Please log in again.');
          } catch (clearError) {
            console.error('[AuthStore] Error clearing auth:', clearError);
          }
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
        console.log('[AuthStore] Clearing authentication state');
        
        // Clear zustand state
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
        });
        
        // Also clear manual localStorage backup
        try {
          localStorage.removeItem('performile_tokens');
          console.log('[AuthStore] Cleared localStorage backup');
        } catch (error) {
          console.error('[AuthStore] Failed to clear localStorage backup:', error);
        }
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
