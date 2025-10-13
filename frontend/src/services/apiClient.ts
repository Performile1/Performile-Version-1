import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

// Event emitter for session expiration
export const sessionEvents = {
  listeners: new Set<() => void>(),
  emit() {
    this.listeners.forEach(listener => listener());
  },
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
};

// Dynamic API URL that works for both local development and production
const getApiBaseUrl = () => {
  // If VITE_API_URL is set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // For Vercel deployment, use /api which gets rewritten to /frontend/api
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }
  
  // For server-side rendering or build time, use relative path
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];
  private lastActivityTime = Date.now();
  private activityCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.startActivityMonitoring();
  }

  // Sliding session: Track user activity and extend token
  private startActivityMonitoring(): void {
    // Update activity time on any user interaction
    if (typeof window !== 'undefined') {
      ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
        window.addEventListener(event, () => {
          this.lastActivityTime = Date.now();
        }, { passive: true });
      });

      // Check activity every 5 minutes
      this.activityCheckInterval = setInterval(() => {
        const inactiveTime = Date.now() - this.lastActivityTime;
        const FIFTEEN_MINUTES = 15 * 60 * 1000;

        // If user has been active in last 15 minutes, extend token
        if (inactiveTime < FIFTEEN_MINUTES) {
          const { tokens } = useAuthStore.getState();
          if (tokens?.accessToken) {
            this.extendSession();
          }
        }
      }, 5 * 60 * 1000); // Check every 5 minutes
    }
  }

  // Extend session by refreshing token
  private async extendSession(): Promise<void> {
    try {
      const { refreshToken } = useAuthStore.getState();
      await refreshToken();
      console.log('[ApiClient] Session extended due to user activity');
    } catch (error) {
      console.error('[ApiClient] Failed to extend session:', error);
    }
  }

  // Cleanup
  public destroy(): void {
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval);
    }
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        // Try to get token from auth store first
        const state = useAuthStore.getState();
        let tokens = state.tokens;
        
        // FALLBACK: If not in store, try manual localStorage backup
        if (!tokens?.accessToken) {
          try {
            const storedTokens = localStorage.getItem('performile_tokens');
            if (storedTokens) {
              tokens = JSON.parse(storedTokens);
              console.log('[ApiClient] Using tokens from localStorage backup');
            }
          } catch (e) {
            console.error('[ApiClient] Failed to read tokens from localStorage:', e);
          }
        }
        
        // Debug logging (always on for now)
        console.log('[ApiClient] Auth state:', { hasTokens: !!tokens, hasAccessToken: !!tokens?.accessToken });
        
        if (tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        } else {
          console.warn('[ApiClient] No access token available for request:', config.url);
        }
        
        // Always send credentials (cookies)
        config.withCredentials = true;
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const { refreshToken } = useAuthStore.getState();
            const success = await refreshToken();

            if (success) {
              const { tokens } = useAuthStore.getState();
              
              // Process queued requests
              this.processQueue(null, tokens?.accessToken);
              
              // Retry original request
              originalRequest.headers.Authorization = `Bearer ${tokens?.accessToken}`;
              return this.client(originalRequest);
            } else {
              // Refresh failed, emit session expired event
              this.processQueue(new Error('Session expired'), null);
              sessionEvents.emit();
              useAuthStore.getState().clearAuth();
              return Promise.reject(new Error('Session expired. Please log in again.'));
            }
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            sessionEvents.emit();
            useAuthStore.getState().clearAuth();
            return Promise.reject(new Error('Session expired. Please log in again.'));
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle other error responses with improved messages
        if (error.response?.status === 401) {
          // Don't show toast for 401 as session modal will handle it
          return Promise.reject(new Error('Authentication required'));
        } else if (error.response?.status === 403) {
          toast.error('You do not have permission to perform this action');
        } else if (error.response?.status === 429) {
          toast.error('Too many requests. Please try again later.');
        } else if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else if (error.message === 'Network Error') {
          toast.error('Network error. Please check your connection.');
        } else if (error.code === 'ECONNABORTED') {
          toast.error('Request timeout. Please try again.');
        } else if (error.message && !error.message.includes('Session expired')) {
          toast.error(error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any, token: string | null = null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  // HTTP methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }

  // Upload file with progress
  async uploadFile<T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<AxiosResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.client.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  }

  // Get instance for direct use
  getInstance(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();
