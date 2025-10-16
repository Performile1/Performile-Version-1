import React from 'react';
import { RegisterForm } from './RegisterForm';

interface EnhancedRegisterFormProps {
  onSwitchToLogin: () => void;
}

// TODO: Complete multi-step wizard implementation
// For now, using standard RegisterForm
export const EnhancedRegisterForm: React.FC<EnhancedRegisterFormProps> = ({ onSwitchToLogin }) => {
  return <RegisterForm onSwitchToLogin={onSwitchToLogin} />;
};

/* WORK IN PROGRESS - Multi-step wizard
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Link
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { RegisterForm } from './RegisterForm';
import PlatformSelector from '../onboarding/PlatformSelector';
import EmailCustomizer from '../onboarding/EmailCustomizer';
import LogoUploader from '../onboarding/LogoUploader';
import SubscriptionSelector from '../onboarding/SubscriptionSelector';

const steps = ['Account', 'Platform', 'Branding', 'Plan'];

export const EnhancedRegisterForm: React.FC<EnhancedRegisterFormProps> = ({ onSwitchToLogin }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Onboarding data
  const [platform, setPlatform] = useState('');
  const [customText, setCustomText] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#667eea');
  const [secondaryColor, setSecondaryColor] = useState('#764ba2');
  const [logoUrl, setLogoUrl] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);

  const navigate = useNavigate();

  // Fetch subscription plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/admin/subscriptions');
        if (response.ok) {
          const data = await response.json();
          setSubscriptionPlans(data.plans || []);
        }
      } catch (err) {
        console.error('Failed to fetch plans:', err);
      }
    };
    fetchPlans();
  }, []);


  const completeRegistration = async (_data: any, _role: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Register user
      const registerResponse = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          user_role: role
        })
      });

      if (!registerResponse.ok) {
        throw new Error('Registration failed');
      }

      const authData = await registerResponse.json();

      // If merchant, save onboarding data
      if (role === 'merchant' && platform) {
        const token = authData.token;
        
        // Save e-commerce integration
        await fetch('/api/ecommerce-integrations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            platform,
            status: 'pending'
          })
        });

        // Save email template
        if (customText || logoUrl) {
          await fetch('/api/email-templates', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              template_type: 'review_request',
              custom_text: customText,
              logo_url: logoUrl,
              primary_color: primaryColor,
              secondary_color: secondaryColor
            })
          });
        }

        // Save subscription selection (for future payment)
        if (selectedPlanId) {
          localStorage.setItem('selected_plan_id', selectedPlanId.toString());
        }
      }

      // Login and redirect
      const authStore = useAuthStore.getState();
      await authStore.login(data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleFinish = () => {
    completeRegistration(registrationData, userRole);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <RegisterForm onSwitchToLogin={onSwitchToLogin} />
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
              Note: After registration, merchants will complete additional setup steps.
            </Typography>
          </Box>
        );

      case 1:
        return (
          <Box>
            <PlatformSelector value={platform} onChange={setPlatform} />
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button onClick={handleBack}>Back</Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!platform}
                fullWidth
              >
                Continue
              </Button>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <LogoUploader logoUrl={logoUrl} onChange={setLogoUrl} />
            <Box sx={{ mt: 3 }}>
              <EmailCustomizer
                customText={customText}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                onChange={(field, value) => {
                  if (field === 'customText') setCustomText(value);
                  if (field === 'primaryColor') setPrimaryColor(value);
                  if (field === 'secondaryColor') setSecondaryColor(value);
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button onClick={handleBack}>Back</Button>
              <Button variant="contained" onClick={handleNext} fullWidth>
                Continue
              </Button>
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box>
            <SubscriptionSelector
              userType={userRole as 'merchant' | 'courier'}
              selectedPlanId={selectedPlanId}
              plans={subscriptionPlans}
              onChange={setSelectedPlanId}
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button onClick={handleBack} disabled={isSubmitting}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleFinish}
                disabled={!selectedPlanId || isSubmitting}
                fullWidth
              >
                {isSubmitting ? <CircularProgress size={24} /> : 'Complete Registration'}
              </Button>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  // For step 0 (account creation), don't show stepper
  if (activeStep === 0) {
    return renderStepContent();
  }

  return (
    <Card sx={{ maxWidth: 1200, mx: 'auto' }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Complete Your Setup
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Let's get your account ready in just a few steps
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label} completed={index < activeStep}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{' '}
            <Link
              component="button"
              variant="body2"
              onClick={onSwitchToLogin}
              sx={{ cursor: 'pointer' }}
            >
              Sign in
            </Link>
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
*/
