import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { apiClient } from '@/services/apiClient';

interface SubscriptionLimitError {
  error: string;
  limit_type: string;
  current_usage: number;
  max_allowed: number;
  plan_name: string;
  tier: number;
  upgrade_required: boolean;
  message: string;
}

interface UsageSummary {
  hasSubscription: boolean;
  plan?: {
    name: string;
    tier: number;
  };
  period?: {
    start: Date;
    end: Date;
  };
  usage?: {
    orders: {
      used: number;
      limit: number | null;
      percentage: number;
      unlimited: boolean;
    };
    emails: {
      used: number;
      limit: number | null;
      percentage: number;
      unlimited: boolean;
    };
    sms: {
      used: number;
      limit: number | null;
      percentage: number;
      unlimited: boolean;
    };
  };
  features?: any;
}

export const useSubscriptionLimits = () => {
  const [upgradePromptOpen, setUpgradePromptOpen] = useState(false);
  const [limitError, setLimitError] = useState<SubscriptionLimitError | null>(null);

  // Fetch usage summary
  const { data: usageSummary, isLoading, refetch } = useQuery<UsageSummary>({
    queryKey: ['usage-summary'],
    queryFn: async () => {
      const response = await apiClient.get('/usage/summary');
      return response.data.data;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  const handleApiError = (error: any) => {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      const data = error.response.data;
      
      if (data.code && data.code.includes('LIMIT_EXCEEDED')) {
        setLimitError({
          error: data.error,
          limit_type: data.code,
          current_usage: 0,
          max_allowed: 0,
          plan_name: '',
          tier: 0,
          upgrade_required: true,
          message: data.message,
        });
        setUpgradePromptOpen(true);
        return true; // Handled
      }
    }
    return false; // Not a subscription limit error
  };

  const closeUpgradePrompt = () => {
    setUpgradePromptOpen(false);
    setLimitError(null);
  };

  return {
    upgradePromptOpen,
    limitError,
    usageSummary,
    isLoading,
    refetchUsage: refetch,
    handleApiError,
    closeUpgradePrompt
  };
};
