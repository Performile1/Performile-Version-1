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
import { apiClient } from '@/services/apiClient';

interface EnhancedRegisterFormProps {
  onSwitchToLogin: () => void;
}

const steps = ['Account', 'Platform', 'Branding', 'Plan'];

export const EnhancedRegisterFormV2: React.FC<EnhancedRegisterFormProps> = ({ onSwitchToLogin }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Registration data from step 1
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  
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
        const response = await apiClient.get('/admin/subscriptions');
        setSubscriptionPlans(response.data.plans || []);
      } catch (err) {
        console.error('Failed to fetch plans:', err);
      }
    };
    fetchPlans();
  }, []);

  const handleRegistrationSuccess = (data: any, role: string) => {
    setRegistrationData(data);
    setUserRole(role);
    
    // Skip onboarding steps for couriers
    if (role === 'courier') {
      completeRegistration(data, role);
    } else {
      setActiveStep(1); // Move to platform selection
    }
  };

  const completeRegistration = async (data: any, role: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Register user
      const registerResponse = await apiClient.post('/auth', {
        ...data,
        user_role: role
      });

      const authData = registerResponse.data;

      // If merchant, save onboarding data
      if (role === 'merchant' && platform) {
        const token = authData.token;
        
        // Save e-commerce integration
        await apiClient.post('/ecommerce-integrations', {
          platform,
          status: 'pending'
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Save email template
        if (customText || logoUrl) {
          await apiClient.post('/email-templates', {
            template_type: 'review_request',
            custom_text: customText,
            logo_url: logoUrl,
            primary_color: primaryColor,
            secondary_color: secondaryColor
          }, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
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
    if (registrationData && userRole) {
      completeRegistration(registrationData, userRole);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <RegisterForm 
              onSwitchToLogin={onSwitchToLogin}
              onSuccess={handleRegistrationSuccess}
            />
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
              Note: Merchants will complete additional setup steps after registration.
            </Typography>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Your E-commerce Platform
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose the platform you use to manage your online store
            </Typography>
            
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              {['WooCommerce', 'Shopify', 'Magento', 'BigCommerce', 'Custom', 'Other'].map((p) => (
                <Button
                  key={p}
                  variant={platform === p ? 'contained' : 'outlined'}
                  onClick={() => setPlatform(p)}
                  sx={{ py: 2 }}
                >
                  {p}
                </Button>
              ))}
            </Box>
            
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
            <Typography variant="h6" gutterBottom>
              Customize Your Branding
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Personalize how your customers see your review requests
            </Typography>
            
            {/* Logo Upload */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Logo URL (optional)
              </Typography>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </Box>

            {/* Custom Text */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Custom Message (optional)
              </Typography>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Add a personal message to your review requests..."
                rows={4}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontFamily: 'inherit' }}
              />
            </Box>

            {/* Colors */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Primary Color
                </Typography>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  style={{ width: '100%', height: '50px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Secondary Color
                </Typography>
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  style={{ width: '100%', height: '50px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </Box>
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
            <Typography variant="h6" gutterBottom>
              Choose Your Plan
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select a subscription plan (you can start with a free trial)
            </Typography>
            
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
              {subscriptionPlans.filter(p => p.user_type === userRole).map((plan) => (
                <Card
                  key={plan.subscription_plan_id}
                  sx={{
                    border: selectedPlanId === plan.subscription_plan_id ? '2px solid' : '1px solid',
                    borderColor: selectedPlanId === plan.subscription_plan_id ? 'primary.main' : 'divider',
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                  onClick={() => setSelectedPlanId(plan.subscription_plan_id)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {plan.plan_name}
                    </Typography>
                    <Typography variant="h4" color="primary" gutterBottom>
                      ${plan.price_per_month}
                      <Typography component="span" variant="body2" color="text.secondary">
                        /month
                      </Typography>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {plan.description || 'Perfect for getting started'}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>

            {subscriptionPlans.length === 0 && (
              <Alert severity="info">
                No plans available. You can set up payment later.
              </Alert>
            )}

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
                disabled={isSubmitting}
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

        <Stepper activeStep={activeStep - 1} sx={{ mb: 4 }}>
          {steps.slice(1).map((label, index) => (
            <Step key={label} completed={index < activeStep - 1}>
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
