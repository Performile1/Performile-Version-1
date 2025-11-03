/**
 * Postal Code Validator Component
 * Validates postal codes in real-time and shows delivery availability
 */

import React, { useState, useEffect } from 'react';
import {
  BlockStack,
  InlineStack,
  Text,
  Icon,
  Banner,
} from '@shopify/ui-extensions-react/checkout';

export function PostalCodeValidator({ postalCode, country = 'SE', apiBaseUrl, onValidation }) {
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!postalCode || postalCode.length < 4) {
      setValidation(null);
      return;
    }

    validatePostalCode(postalCode, country);
  }, [postalCode, country]);

  const validatePostalCode = async (code, countryCode) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/postal-codes/validate`, {
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

      const data = await response.json();
      setValidation(data);

      // Notify parent component
      if (onValidation) {
        onValidation(data);
      }

    } catch (err) {
      console.error('Postal code validation error:', err);
      setError('Unable to validate postal code');
      setValidation(null);
    } finally {
      setLoading(false);
    }
  };

  // Don't show anything while loading or if no postal code
  if (!postalCode || loading) {
    return null;
  }

  // Show error banner if validation failed
  if (error) {
    return (
      <Banner status="warning">
        <Text size="small">{error}</Text>
      </Banner>
    );
  }

  // Show validation result
  if (validation) {
    if (validation.valid) {
      return (
        <BlockStack spacing="tight">
          <InlineStack spacing="tight" blockAlignment="center">
            <Icon source="checkmark" appearance="success" />
            <Text size="small" appearance="success">
              ✓ Delivery available to {validation.city}
            </Text>
          </InlineStack>
          
          {validation.courierCount > 0 && (
            <Text size="extraSmall" appearance="subdued">
              {validation.courierCount} courier{validation.courierCount > 1 ? 's' : ''} available in your area
            </Text>
          )}
        </BlockStack>
      );
    } else {
      return (
        <Banner status="warning">
          <BlockStack spacing="tight">
            <Text size="small">
              ⚠️ Invalid postal code
            </Text>
            {validation.error && (
              <Text size="extraSmall" appearance="subdued">
                {validation.error}
              </Text>
            )}
          </BlockStack>
        </Banner>
      );
    }
  }

  return null;
}
