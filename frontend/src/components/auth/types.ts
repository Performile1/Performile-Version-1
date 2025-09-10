export type UserRole = 'merchant' | 'courier' | 'consumer';

export interface RegisterFormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  user_role: UserRole;
  phone?: string;
}

export interface RoleOption {
  value: UserRole;
  label: string;
  description: string;
}

export interface ApiError extends Error {
  status?: number;
  code?: string;
  field?: string;
  details?: Record<string, unknown>;
}

export interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  minUppercase: 1,
  minLowercase: 1,
  minNumbers: 1,
  minSpecialChars: 1,
  specialChars: '!@#$%^&*()_+\-=\[\]{};:"\\|,.<>/?`~',
};
