import React from 'react';
import { MerchantCourierSettings } from '@/pages/settings/MerchantCourierSettings';

interface CouriersSettingsProps {
  subscriptionInfo: any;
}

export const CouriersSettings: React.FC<CouriersSettingsProps> = ({ subscriptionInfo }) => {
  // Simply render the existing MerchantCourierSettings component
  // but without the container wrapper since it's already in a tab
  return <MerchantCourierSettings />;
};
