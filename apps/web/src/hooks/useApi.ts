import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { ApiResponse, PaginationParams } from '@/types';
import toast from 'react-hot-toast';

// Generic API hook for GET requests
export const useApiQuery = <T>(
  key: string | string[],
  url: string,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
  }
) => {
  return useQuery<ApiResponse<T>>({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<T>>(url);
      return response.data;
    },
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Generic API hook for mutations
export const useApiMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: {
    onSuccess?: (data: ApiResponse<TData>) => void;
    onError?: (error: Error) => void;
    invalidateQueries?: string[];
  }
) => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<TData>, Error, TVariables>({
    mutationFn: mutationFn,
    onSuccess: (data) => {
      if (data.success && data.message) {
        toast.success(data.message);
      }

      // Invalidate specified queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      }

      options?.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'An error occurred');
      options?.onError?.(error);
    },
  });
};

// Paginated query hook
export const usePaginatedQuery = <T>(
  key: string,
  url: string,
  params: PaginationParams = {}
) => {
  const queryKey = [key, params];
  
  return useQuery<ApiResponse<T[]>>({
    queryKey: queryKey,
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
      
      const response = await apiClient.get<ApiResponse<T[]>>(
        `${url}?${searchParams.toString()}`
      );
      return response.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 30000, // 30 seconds
  });
};
