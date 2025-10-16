import * as yup from 'yup';
import { RegisterFormData, PASSWORD_REQUIREMENTS } from './types';

export const registerFormSchema: yup.ObjectSchema<RegisterFormData> = yup.object().shape({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(PASSWORD_REQUIREMENTS.minLength, `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`)
    .matches(
      new RegExp(`^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[${PASSWORD_REQUIREMENTS.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}])`),
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .required('Password is required'),
  first_name: yup
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters')
    .required('First name is required'),
  last_name: yup
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters')
    .required('Last name is required'),
  user_role: yup
    .string()
    .oneOf(['merchant', 'courier', 'consumer'] as const, 'Please select a valid role')
    .required('Role is required'),
  phone: yup
    .string()
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'),
});

export const checkPasswordStrength = (password: string) => {
  const requirements = {
    minLength: password.length >= PASSWORD_REQUIREMENTS.minLength,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: new RegExp(`[${PASSWORD_REQUIREMENTS.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password),
  };

  return {
    ...requirements,
    isValid: Object.values(requirements).every(Boolean),
    score: Object.values(requirements).filter(Boolean).length,
    total: Object.keys(requirements).length,
  };
};
