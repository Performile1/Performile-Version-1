/**
 * Performile Delivery - Shopify Checkout UI Extension
 * Displays courier ratings in Shopify checkout
 */

import React, { useEffect, useState } from 'react';
import {
  reactExtension,
  Banner,
  BlockStack,
  InlineStack,
  Text,
  Divider,
  Icon,
  useSettings,
  useShippingAddress,
  useApplyAttributeChange,
} from '@shopify/ui-extensions-react/checkout';

export default reactExtension(
  'purchase.checkout.block.render',
  () => <CourierRatings />
);

function CourierRatings() {
  const settings = useSettings();
  const shippingAddress = useShippingAddress();
  const applyAttributeChange = useApplyAttributeChange();
  
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [error, setError] = useState(null);

  const title = settings.title || 'Top Rated Couriers in Your Area';
  const numCouriers = settings.num_couriers || 3;

  useEffect(() => {
    if (shippingAddress?.zip) {
      fetchCourierRatings(shippingAddress.zip);
    }
  }, [shippingAddress?.zip]);

  const fetchCourierRatings = async (postalCode) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://frontend-two-swart-31.vercel.app/api/couriers/ratings-by-postal?postal_code=${postalCode}&limit=${numCouriers}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch courier ratings');
      }

      const data = await response.json();

      if (data.success && data.couriers) {
        setCouriers(data.couriers);
        
        // Auto-select first courier
        if (data.couriers.length > 0) {
          handleCourierSelect(data.couriers[0]);
        }
      } else {
        setError(data.message || 'No couriers found');
      }
    } catch (err) {
      console.error('Error fetching couriers:', err);
      setError('Unable to load courier ratings');
    } finally {
      setLoading(false);
    }
  };

  const handleCourierSelect = async (courier) => {
    setSelectedCourier(courier.courier_id);

    // Save to order attributes
    try {
      await applyAttributeChange({
        type: 'updateAttribute',
        key: 'performile_courier_id',
        value: courier.courier_id,
      });

      await applyAttributeChange({
        type: 'updateAttribute',
        key: 'performile_courier_name',
        value: courier.courier_name,
      });
    } catch (err) {
      console.error('Error saving courier selection:', err);
    }
  };

  if (loading) {
    return (
      <Banner title={title}>
        <Text>Loading courier ratings...</Text>
      </Banner>
    );
  }

  if (error) {
    return null; // Hide if error
  }

  if (couriers.length === 0) {
    return null; // Hide if no couriers
  }

  return (
    <BlockStack spacing="base">
      <Text size="medium" emphasis="bold">
        {title}
      </Text>

      <BlockStack spacing="tight">
        {couriers.map((courier, index) => (
          <CourierCard
            key={courier.courier_id}
            courier={courier}
            isRecommended={index === 0}
            isSelected={selectedCourier === courier.courier_id}
            onSelect={() => handleCourierSelect(courier)}
          />
        ))}
      </BlockStack>

      <Divider />

      <InlineStack spacing="tight" blockAlignment="center">
        <Text size="small" appearance="subdued">
          ⭐ Ratings based on verified customer reviews
        </Text>
        <Text size="small" appearance="subdued">
          • Powered by Performile
        </Text>
      </InlineStack>
    </BlockStack>
  );
}

function CourierCard({ courier, isRecommended, isSelected, onSelect }) {
  const getBadgeColor = (badge) => {
    switch (badge) {
      case 'excellent': return 'success';
      case 'very_good': return 'success';
      case 'good': return 'warning';
      case 'average': return 'critical';
      default: return 'base';
    }
  };

  const getBadgeLabel = (badge) => {
    switch (badge) {
      case 'excellent': return 'Excellent';
      case 'very_good': return 'Very Good';
      case 'good': return 'Good';
      case 'average': return 'Average';
      default: return '';
    }
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    return '⭐'.repeat(fullStars);
  };

  return (
    <Banner
      status={isSelected ? 'info' : 'base'}
      onDismiss={isRecommended ? undefined : onSelect}
    >
      <BlockStack spacing="tight">
        <InlineStack spacing="tight" blockAlignment="center">
          <Text emphasis="bold">{courier.courier_name}</Text>
          
          {isRecommended && (
            <Text size="small" appearance="accent">
              Recommended
            </Text>
          )}
          
          {courier.badge && (
            <Text size="small" appearance={getBadgeColor(courier.badge)}>
              {getBadgeLabel(courier.badge)}
            </Text>
          )}
        </InlineStack>

        <InlineStack spacing="tight" blockAlignment="center">
          <Text>{renderStars(courier.trust_score)}</Text>
          <Text size="small" appearance="subdued">
            {courier.trust_score}/5 ({courier.total_reviews} reviews)
          </Text>
        </InlineStack>

        <InlineStack spacing="base">
          <InlineStack spacing="extraTight" blockAlignment="center">
            <Text size="small">🚚</Text>
            <Text size="small" appearance="subdued">
              {courier.avg_delivery_time}
            </Text>
          </InlineStack>

          <InlineStack spacing="extraTight" blockAlignment="center">
            <Text size="small">✓</Text>
            <Text size="small" appearance="subdued">
              {courier.on_time_percentage}% on-time
            </Text>
          </InlineStack>
        </InlineStack>
      </BlockStack>
    </Banner>
  );
}
