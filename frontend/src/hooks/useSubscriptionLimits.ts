import { useState } from 'react';
import axios from 'axios';

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

export const useSubscriptionLimits = () => {
  const [upgradePromptOpen, setUpgradePromptOpen] = useState(false);
  const [limitError, setLimitError] = useState<SubscriptionLimitError | null>(null);

  const handleApiError = (error: any) => {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      const data = error.response.data;
      
      if (data.error === 'SUBSCRIPTION_LIMIT_REACHED') {
        setLimitError(data);
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
    handleApiError,
    closeUpgradePrompt
  };
};
