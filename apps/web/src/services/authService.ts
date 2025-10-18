import axios, { AxiosResponse } from 'axios';
import { ApiResponse, LoginCredentials, RegisterData, User, AuthTokens } from '@/types';

// Dynamic API URL that works for both local development and production
const getApiBaseUrl = () => {
  // If VITE_API_URL is set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // For Vercel deployment, use /api (will be rewritten to /frontend/api)
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }
  
  // For server-side rendering or build time, use relative path
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

// Create axios instance with interceptors
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000, // 30 second timeout (increased for serverless cold starts)
});

// Request interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  const authData = localStorage.getItem('performile-auth');
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      const accessToken = parsed.state?.tokens?.accessToken;
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    } catch (error) {
      console.warn('Failed to parse auth data from storage');
    }
  }
  return config;
});

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, attempt refresh
      const authData = localStorage.getItem('performile-auth');
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          const refreshToken = parsed.state?.tokens?.refreshToken;
          if (refreshToken) {
            // Attempt token refresh
            const refreshResponse = await axios.post(`${API_BASE_URL}/auth`, 
              { action: 'refresh', refreshToken }, 
              { withCredentials: true }
            );
            
            if (refreshResponse.data.success) {
              // Update stored tokens and retry original request
              const newTokens = refreshResponse.data.data.tokens;
              parsed.state.tokens = newTokens;
              localStorage.setItem('performile-auth', JSON.stringify(parsed));
              
              // Retry original request with new token
              error.config.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              return apiClient.request(error.config);
            }
          }
        } catch (refreshError: any) {
          console.error('Token refresh failed:', refreshError);
          // Clear auth state on refresh failure
          localStorage.removeItem('performile-auth');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

class AuthService {
  constructor() {
    // Using apiClient with baseURL already configured
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    try {
      console.log('Attempting login with API URL:', `${API_BASE_URL}/auth`);
      
      const response: AxiosResponse<ApiResponse<{ user: User; tokens: AuthTokens }>> = await axios.post(
        `${API_BASE_URL}/auth`,
        { action: 'login', ...credentials },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
          timeout: 30000, // 30 second timeout for serverless cold starts
        }
      );
      
      console.log('Login response:', response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      // Better error handling for frontend
      let errorMessage = 'Login failed';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout - please try again';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error - please check your connection';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  async register(data: RegisterData): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ user: User; tokens: AuthTokens }>> = await axios.post(
        `${API_BASE_URL}/auth`,
        { action: 'register', ...data },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
          timeout: 10000,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Register error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      // Better error handling for frontend
      let errorMessage = 'Register failed';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout - please try again';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error - please check your connection';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ tokens: AuthTokens }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ tokens: AuthTokens }>> = await apiClient.post(
        `/auth`,
        { action: 'refresh', refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Refresh token error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      // Better error handling for frontend
      let errorMessage = 'Refresh token failed';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout - please try again';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error - please check your connection';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  async logout(): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await apiClient.post(
        `/auth`,
        { action: 'logout' }
      );
      return response.data;
    } catch (error: any) {
      console.error('Logout error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      // Better error handling for frontend
      let errorMessage = 'Logout failed';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout - please try again';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error - please check your connection';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ user: User }>> = await apiClient.get(
        `/auth?action=profile`
      );
      return response.data;
    } catch (error: any) {
      console.error('Get profile error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      // Better error handling for frontend
      let errorMessage = 'Get profile failed';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout - please try again';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error - please check your connection';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }
}

export const authService = new AuthService();
