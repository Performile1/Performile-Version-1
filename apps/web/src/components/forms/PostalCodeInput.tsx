/**
 * Postal Code Input Component with Validation
 * Validates postal codes in real-time and auto-fills city
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  InputAdornment,
  CircularProgress,
  IconButton,
  Tooltip,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Info,
} from '@mui/icons-material';
import { debounce } from 'lodash';

interface PostalCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onCityDetected?: (city: string) => void;
  onValidation?: (isValid: boolean, data?: any) => void;
  country?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
}

interface ValidationResult {
  valid: boolean;
  postalCode?: string;
  city?: string;
  region?: string;
  country?: string;
  deliveryAvailable?: boolean;
  courierCount?: number;
  error?: string;
  source?: 'cache' | 'api';
}

export function PostalCodeInput({
  value,
  onChange,
  onCityDetected,
  onValidation,
  country = 'SE',
  label = 'Postal Code',
  required = false,
  disabled = false,
  error: externalError = false,
  helperText: externalHelperText,
  fullWidth = true,
}: PostalCodeInputProps) {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced validation function
  const validatePostalCode = useCallback(
    debounce(async (code: string, countryCode: string) => {
      if (!code || code.length < 4) {
        setValidation(null);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('https://performile-platform-main.vercel.app/api/postal-codes/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postalCode: code,
            country: countryCode
          })
        });

        if (!response.ok) {
          throw new Error('Validation failed');
        }

        const data: ValidationResult = await response.json();
        setValidation(data);

        // Auto-fill city if valid
        if (data.valid && data.city && onCityDetected) {
          onCityDetected(data.city);
        }

        // Notify parent of validation result
        if (onValidation) {
          onValidation(data.valid, data);
        }

      } catch (err) {
        console.error('Postal code validation error:', err);
        setError('Unable to validate postal code');
        setValidation(null);
        
        if (onValidation) {
          onValidation(false);
        }
      } finally {
        setLoading(false);
      }
    }, 500), // 500ms debounce
    [onCityDetected, onValidation]
  );

  // Validate when value or country changes
  useEffect(() => {
    validatePostalCode(value, country);
  }, [value, country, validatePostalCode]);

  // Determine input adornment icon
  const getEndAdornment = () => {
    if (loading) {
      return (
        <InputAdornment position="end">
          <CircularProgress size={20} />
        </InputAdornment>
      );
    }

    if (validation) {
      if (validation.valid) {
        return (
          <InputAdornment position="end">
            <Tooltip title={`Valid postal code for ${validation.city}`}>
              <CheckCircle color="success" />
            </Tooltip>
          </InputAdornment>
        );
      } else {
        return (
          <InputAdornment position="end">
            <Tooltip title={validation.error || 'Invalid postal code'}>
              <Error color="error" />
            </Tooltip>
          </InputAdornment>
        );
      }
    }

    return null;
  };

  // Determine helper text
  const getHelperText = () => {
    if (externalHelperText) {
      return externalHelperText;
    }

    if (error) {
      return error;
    }

    if (validation) {
      if (validation.valid) {
        const parts = [`✓ ${validation.city}`];
        if (validation.deliveryAvailable && validation.courierCount) {
          parts.push(`${validation.courierCount} courier${validation.courierCount > 1 ? 's' : ''} available`);
        }
        return parts.join(' • ');
      } else {
        return validation.error || 'Invalid postal code';
      }
    }

    return `Enter ${country} postal code`;
  };

  // Determine if there's an error
  const hasError = externalError || (validation !== null && !validation.valid) || error !== null;

  return (
    <Box>
      <TextField
        fullWidth={fullWidth}
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        error={hasError}
        helperText={getHelperText()}
        InputProps={{
          endAdornment: getEndAdornment(),
        }}
        placeholder={country === 'SE' ? '11122' : country === 'NO' ? '0010' : country === 'DK' ? '1000' : '00100'}
      />

      {/* Delivery availability info */}
      {validation && validation.valid && validation.deliveryAvailable && (
        <Box mt={1}>
          <Alert severity="success" icon={<CheckCircle />}>
            <Typography variant="body2">
              <strong>Delivery available</strong> to {validation.city}
              {validation.courierCount && ` • ${validation.courierCount} couriers in your area`}
            </Typography>
          </Alert>
        </Box>
      )}

      {/* No delivery warning */}
      {validation && validation.valid && !validation.deliveryAvailable && (
        <Box mt={1}>
          <Alert severity="warning" icon={<Info />}>
            <Typography variant="body2">
              <strong>Limited delivery</strong> to {validation.city}
              {' • '}No couriers available yet
            </Typography>
          </Alert>
        </Box>
      )}
    </Box>
  );
}
