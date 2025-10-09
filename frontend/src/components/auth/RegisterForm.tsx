import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  AlertTitle,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Tooltip,
  Fade,
  Zoom,
} from '@mui/material';
import { 
  Visibility as VisibilityIcon, 
  VisibilityOff as VisibilityOffIcon, 
  Email as EmailIcon, 
  Lock as LockIcon, 
  Person as PersonIcon, 
  Phone as PhoneIcon,
  HelpOutline as HelpOutlineIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';

// Local imports
import { useAuthStore } from '@/store/authStore';
import { RegisterFormData, RoleOption, ApiError } from './types';
import { registerFormSchema } from './validation';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

// Memoized role options
const ROLE_OPTIONS: RoleOption[] = [
  { 
    value: 'consumer', 
    label: 'Consumer',
    description: 'Track deliveries and rate carriers'
  },
  { 
    value: 'merchant', 
    label: 'Merchant',
    description: 'Manage stores and analyze performance'
  },
  { 
    value: 'courier', 
    label: 'Courier',
    description: 'Monitor performance and generate leads'
  },
];

// Form field IDs for better accessibility
const FORM_IDS = {
  FIRST_NAME: 'register-first-name',
  LAST_NAME: 'register-last-name',
  EMAIL: 'register-email',
  PASSWORD: 'register-password',
  PHONE: 'register-phone',
  ROLE: 'register-role',
} as const;

// Form default values
const DEFAULT_VALUES: RegisterFormData = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  phone: '',
  user_role: 'consumer',
};

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onSuccess?: (data: any, role: string) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin, onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPasswordTooltip, setShowPasswordTooltip] = useState(false);
  
  const { register: registerUser } = useAuthStore();
  const navigate = useNavigate();

  const methods = useForm<RegisterFormData>({
    resolver: yupResolver(registerFormSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const { 
    control, 
    handleSubmit, 
    formState: { isDirty, isValid },
    watch,
    setError: setFormError,
    // clearErrors, // Commented out as it's not used
  } = methods;

  // Watch password field for strength meter
  const passwordValue = watch('password', '');
  
  // Memoize the password strength calculation
  const passwordStrength = useMemo(
    () => ({
      hasMinLength: passwordValue.length >= 8,
      hasUppercase: /[A-Z]/.test(passwordValue),
      hasLowercase: /[a-z]/.test(passwordValue),
      hasNumber: /\d/.test(passwordValue),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?`~]/.test(passwordValue),
    }),
    [passwordValue]
  );

  // Handle form submission
  const onSubmit = async (data: RegisterFormData) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setServerError(null);
    
    try {
      // If onSuccess callback is provided, use it instead of default behavior
      if (onSuccess) {
        onSuccess(data, data.user_role);
        return;
      }
      
      // Default behavior: register and navigate
      const success = await registerUser(data);
      if (success) {
        navigate('/dashboard');
      }
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage = apiError.message || 'Registration failed. Please try again.';
      
      if (apiError.field) {
        setFormError(apiError.field as any, {
          type: 'manual',
          message: errorMessage,
        });
      } else {
        setServerError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle password visibility toggle
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Handle password focus to show tooltip
  const handlePasswordFocus = () => {
    setShowPasswordTooltip(true);
  };
  
  // Handle password blur to hide tooltip with delay
  const handlePasswordBlur = () => {
    setTimeout(() => setShowPasswordTooltip(false), 200);
  };

  // Calculate form submission state
  const isFormValid = isDirty && isValid;
  const isSubmitDisabled = isSubmitting || !isFormValid;
  
  return (
    <Card 
      component="section"
      aria-labelledby="register-form-title"
      sx={{ 
        maxWidth: 600, 
        width: '100%',
        mx: 'auto', 
        mt: { xs: 2, sm: 4 },
        boxShadow: 3,
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography 
          id="register-form-title"
          variant="h4" 
          component="h1" 
          gutterBottom 
          align="center"
          sx={{
            fontWeight: 600,
            fontSize: { xs: '1.75rem', sm: '2rem' },
            mb: 2,
          }}
        >
          Create Account
        </Typography>
        
        <Typography 
          variant="body1" 
          color="text.secondary" 
          align="center" 
          sx={{ 
            mb: 4,
            fontSize: { xs: '0.9rem', sm: '1rem' },
          }}
        >
          Join Performile to track and improve delivery performance
        </Typography>

        {serverError && (
          <Fade in={!!serverError}>
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                '& .MuiAlert-message': {
                  width: '100%',
                },
              }}
              onClose={() => setServerError(null)}
            >
              <AlertTitle>Registration Error</AlertTitle>
              {serverError}
            </Alert>
          </Fade>
        )}

        <FormProvider {...methods}>
          <Box 
            component="form" 
            onSubmit={handleSubmit(onSubmit)} 
            noValidate
            aria-label="Registration form"
          >
            {/* Name Fields */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Controller
                name="first_name"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    id={FORM_IDS.FIRST_NAME}
                    label="First Name"
                    autoComplete="given-name"
                    fullWidth
                    error={!!error}
                    helperText={error?.message || ' '}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color={error ? 'error' : 'action'} />
                        </InputAdornment>
                      ),
                    }}
                    inputProps={{
                      'aria-required': 'true',
                      'aria-invalid': error ? 'true' : 'false',
                      'aria-describedby': error ? `${FORM_IDS.FIRST_NAME}-error` : undefined,
                    }}
                    FormHelperTextProps={{
                      id: error ? `${FORM_IDS.FIRST_NAME}-error` : undefined,
                      component: 'div',
                    }}
                    sx={{
                      minWidth: { xs: '100%', sm: 'calc(50% - 8px)' },
                      flex: 1,
                    }}
                  />
                )}
              />
              
              <Controller
                name="last_name"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    id={FORM_IDS.LAST_NAME}
                    label="Last Name"
                    autoComplete="family-name"
                    fullWidth
                    error={!!error}
                    helperText={error?.message || ' '}
                    inputProps={{
                      'aria-required': 'true',
                      'aria-invalid': error ? 'true' : 'false',
                      'aria-describedby': error ? `${FORM_IDS.LAST_NAME}-error` : undefined,
                    }}
                    FormHelperTextProps={{
                      id: error ? `${FORM_IDS.LAST_NAME}-error` : undefined,
                      component: 'div',
                    }}
                    sx={{
                      minWidth: { xs: '100%', sm: 'calc(50% - 8px)' },
                      flex: 1,
                    }}
                  />
                )}
              />
            </Box>

            {/* Email Field */}
            <Controller
              name="email"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  id={FORM_IDS.EMAIL}
                  label="Email Address"
                  type="email"
                  autoComplete="email"
                  fullWidth
                  error={!!error}
                  helperText={error?.message || ' '}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color={error ? 'error' : 'action'} />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{
                    'aria-required': 'true',
                    'aria-invalid': error ? 'true' : 'false',
                    'aria-describedby': error ? `${FORM_IDS.EMAIL}-error` : undefined,
                    inputMode: 'email',
                  }}
                  FormHelperTextProps={{
                    id: error ? `${FORM_IDS.EMAIL}-error` : undefined,
                  }}
                />
              )}
            />

            {/* Phone Field */}
            <Controller
              name="phone"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  id={FORM_IDS.PHONE}
                  label="Phone Number (Optional)"
                  type="tel"
                  autoComplete="tel"
                  fullWidth
                  error={!!error}
                  helperText={error?.message || ' '}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon color={error ? 'error' : 'action'} />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{
                    'aria-invalid': error ? 'true' : 'false',
                    'aria-describedby': error ? `${FORM_IDS.PHONE}-error` : undefined,
                    inputMode: 'tel',
                  }}
                  FormHelperTextProps={{
                    id: error ? `${FORM_IDS.PHONE}-error` : undefined,
                  }}
                />
              )}
            />

            {/* Role Selection */}
            <Controller
              name="user_role"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <FormControl 
                  fullWidth 
                  error={!!error} 
                  sx={{ mb: 2 }}
                  variant="outlined"
                >
                  <InputLabel id={`${FORM_IDS.ROLE}-label`}>Account Type</InputLabel>
                  <Select
                    {...field}
                    labelId={`${FORM_IDS.ROLE}-label`}
                    id={FORM_IDS.ROLE}
                    label="Account Type"
                    aria-required="true"
                    aria-invalid={!!error}
                    aria-describedby={error ? `${FORM_IDS.ROLE}-error` : undefined}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxHeight: 300,
                          '& .MuiMenuItem-root': {
                            py: 1.5,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            '&:last-child': {
                              borderBottom: 'none',
                            },
                          },
                        },
                      },
                    }}
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <MenuItem 
                        key={option.value} 
                        value={option.value}
                        sx={{
                          '&.Mui-selected': {
                            backgroundColor: 'action.selected',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            },
                          },
                        }}
                      >
                        <Box>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            {option.label}
                            {field.value === option.value && (
                              <CheckCircleIcon 
                                color="success" 
                                fontSize="small" 
                                sx={{ ml: 'auto' }} 
                              />
                            )}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{
                              mt: 0.5,
                              fontSize: '0.75rem',
                              lineHeight: 1.4,
                            }}
                          >
                            {option.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {error ? (
                    <FormHelperText id={`${FORM_IDS.ROLE}-error`}>
                      {error.message}
                    </FormHelperText>
                  ) : (
                    <FormHelperText>Select your account type</FormHelperText>
                  )}
                </FormControl>
              )}
            />

            {/* Password Field */}
            <Controller
              name="password"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <Box sx={{ position: 'relative' }}>
                  <TextField
                    {...field}
                    id={FORM_IDS.PASSWORD}
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    fullWidth
                    error={!!error}
                    helperText={error?.message || ' '}
                    sx={{ mb: 0.5 }}
                    onFocus={handlePasswordFocus}
                    onBlur={handlePasswordBlur}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color={error ? 'error' : 'action'} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <Tooltip 
                          title={showPassword ? 'Hide password' : 'Show password'}
                          arrow
                          placement="top"
                          TransitionComponent={Zoom}
                        >
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              onClick={togglePasswordVisibility}
                              onMouseDown={(e) => e.preventDefault()}
                              edge="end"
                              color={error ? 'error' : 'default'}
                              sx={{
                                '&:hover': {
                                  backgroundColor: 'transparent',
                                },
                              }}
                            >
                              {showPassword ? (
                                <VisibilityOffIcon />
                              ) : (
                                <VisibilityIcon />
                              )}
                            </IconButton>
                          </InputAdornment>
                        </Tooltip>
                      ),
                    }}
                    inputProps={{
                      'aria-required': 'true',
                      'aria-invalid': error ? 'true' : 'false',
                      'aria-describedby': error 
                        ? `${FORM_IDS.PASSWORD}-error` 
                        : `${FORM_IDS.PASSWORD}-helper`,
                    }}
                    FormHelperTextProps={{
                      id: error 
                        ? `${FORM_IDS.PASSWORD}-error` 
                        : `${FORM_IDS.PASSWORD}-helper`,
                      component: 'div',
                    }}
                  />
                  
                  {/* Password Requirements Tooltip */}
                  <Tooltip
                    title={
                      <Box sx={{ p: 1 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Password Requirements:
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, m: 0, '& li': { mb: 0.5 } }}>
                          <Typography component="li" variant="caption" color={passwordStrength.hasMinLength ? 'success.main' : 'text.secondary'}>
                            At least 8 characters long
                          </Typography>
                          <Typography component="li" variant="caption" color={passwordStrength.hasUppercase ? 'success.main' : 'text.secondary'}>
                            At least one uppercase letter
                          </Typography>
                          <Typography component="li" variant="caption" color={passwordStrength.hasLowercase ? 'success.main' : 'text.secondary'}>
                            At least one lowercase letter
                          </Typography>
                          <Typography component="li" variant="caption" color={passwordStrength.hasNumber ? 'success.main' : 'text.secondary'}>
                            At least one number
                          </Typography>
                          <Typography component="li" variant="caption" color={passwordStrength.hasSpecialChar ? 'success.main' : 'text.secondary'}>
                            At least one special character
                          </Typography>
                        </Box>
                      </Box>
                    }
                    open={showPasswordTooltip}
                    arrow
                    placement="top-start"
                    disableFocusListener
                    disableHoverListener
                    disableTouchListener
                    TransitionComponent={Zoom}
                    PopperProps={{
                      disablePortal: true,
                      modifiers: [
                        {
                          name: 'offset',
                          options: {
                            offset: [0, 8],
                          },
                        },
                      ],
                    }}
                    componentsProps={{
                      tooltip: {
                        sx: {
                          bgcolor: 'background.paper',
                          color: 'text.primary',
                          border: '1px solid',
                          borderColor: 'divider',
                          boxShadow: 2,
                          maxWidth: 250,
                        },
                      },
                      arrow: {
                        sx: {
                          color: 'background.paper',
                          '&:before': {
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                          },
                        },
                      },
                    }}
                  >
                    <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                      <HelpOutlineIcon 
                        color="action" 
                        fontSize="small" 
                        sx={{ opacity: 0.7 }}
                      />
                    </Box>
                  </Tooltip>
                  
                  {/* Password Strength Meter */}
                  {field.value && (
                    <Box sx={{ mt: 1, mb: 2 }}>
                      <PasswordStrengthMeter password={field.value} />
                    </Box>
                  )}
                </Box>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitDisabled}
              sx={{
                mt: 2,
                mb: 3,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: 'none',
                },
                '&:active': {
                  transform: 'translateY(1px)',
                },
                '&.Mui-disabled': {
                  bgcolor: 'action.disabledBackground',
                  color: 'text.disabled',
                },
              }}
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={20} color="inherit" />
                ) : null
              }
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>

            {/* Login Link */}
            <Box 
              textAlign="center" 
              sx={{ 
                pt: 1,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" component="span" sx={{ mr: 1 }}>
                Already have an account?
              </Typography>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={onSwitchToLogin}
                sx={{
                  fontWeight: 600,
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Sign in
              </Link>
            </Box>
          </Box>
        </FormProvider>
      </CardContent>
    </Card>
  );
};
