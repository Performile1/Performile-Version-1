/**
 * Performile Delivery - Shopify Checkout UI Extension
 * Displays courier ratings in Shopify checkout
 */

import React, { useEffect, useState, useRef } from 'react';
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
  useCartLines,
  useTotalAmount,
} from '@shopify/ui-extensions-react/checkout';
import { PostalCodeValidator } from './components/PostalCodeValidator';

export default reactExtension(
  'purchase.checkout.block.render',
  () => <CourierRatings />
);

function CourierRatings() {
  const settings = useSettings();
  const shippingAddress = useShippingAddress();
  const applyAttributeChange = useApplyAttributeChange();
  const cartLines = useCartLines();
  const totalAmount = useTotalAmount();
  
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [error, setError] = useState(null);
  const [sessionId] = useState(() => `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const trackedCouriers = useRef(new Set());

  const title = settings.title || 'Top Rated Couriers in Your Area';
  const numCouriers = settings.num_couriers || 3;
  const apiBaseUrl = settings.api_url || 'https://frontend-two-swart-31.vercel.app/api';
  const merchantId = settings.merchant_id;

  // Calculate order details
  const getOrderDetails = () => {
    const orderValue = totalAmount?.amount ? parseFloat(totalAmount.amount) : 0;
    const itemsCount = cartLines.length || 0;
    
    // Calculate total weight (if available)
    const packageWeight = cartLines.reduce((sum, line) => {
      const weight = line.merchandise?.weight?.value || 0;
      const quantity = line.quantity || 1;
      return sum + (weight * quantity);
    }, 0);

    return {
      orderValue,
      itemsCount,
      packageWeightKg: packageWeight > 0 ? packageWeight : null,
    };
  };

  // Track courier position display
  const trackCourierDisplay = async (courier, position, totalCouriers) => {
    if (!merchantId || !courier.courier_id) return;
    
    // Prevent duplicate tracking
    const trackingKey = `${sessionId}_${courier.courier_id}_display`;
    if (trackedCouriers.current.has(trackingKey)) return;
    trackedCouriers.current.add(trackingKey);

    const orderDetails = getOrderDetails();

    try {
      await fetch(`${apiBaseUrl}/public/checkout-analytics-track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          courierId: courier.courier_id,
          checkoutSessionId: sessionId,
          positionShown: position,
          totalCouriersShown: totalCouriers,
          wasSelected: false,
          trustScoreAtTime: courier.trust_score || 0,
          priceAtTime: courier.price || 0,
          deliveryTimeEstimate: courier.delivery_hours || 48,
          distanceKm: courier.distance_km || 0,
          orderValue: orderDetails.orderValue,
          itemsCount: orderDetails.itemsCount,
          packageWeightKg: orderDetails.packageWeightKg,
          deliveryPostalCode: shippingAddress?.zip || '',
          deliveryCity: shippingAddress?.city || '',
          deliveryCountry: shippingAddress?.countryCode || '',
        }),
      });
    } catch (error) {
      console.error('Failed to track courier display:', error);
      // Don't block UI on tracking failure
    }
  };

  // Track courier selection
  const trackCourierSelection = async (courier, position, totalCouriers) => {
    if (!merchantId || !courier.courier_id) return;

    const orderDetails = getOrderDetails();

    try {
      await fetch(`${apiBaseUrl}/public/checkout-analytics-track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          courierId: courier.courier_id,
          checkoutSessionId: sessionId,
          positionShown: position,
          totalCouriersShown: totalCouriers,
          wasSelected: true, // ✅ Selected!
          trustScoreAtTime: courier.trust_score || 0,
          priceAtTime: courier.price || 0,
          deliveryTimeEstimate: courier.delivery_hours || 48,
          distanceKm: courier.distance_km || 0,
          orderValue: orderDetails.orderValue,
          itemsCount: orderDetails.itemsCount,
          packageWeightKg: orderDetails.packageWeightKg,
          deliveryPostalCode: shippingAddress?.zip || '',
          deliveryCity: shippingAddress?.city || '',
          deliveryCountry: shippingAddress?.countryCode || '',
        }),
      });
    } catch (error) {
      console.error('Failed to track courier selection:', error);
      // Don't block UI on tracking failure
    }
  };

  useEffect(() => {
    // Fetch real courier data when shipping address is available
    if (shippingAddress?.zip) {
      fetchCourierRatings(shippingAddress.zip);
    } else {
      // Use demo data as fallback if no shipping address yet
      const demoData = [
        {
          courier_id: 'demo-1',
          courier_name: 'PostNord',
          trust_score: 4.5,
          total_reviews: 1234,
          avg_delivery_time: '1-2 days',
          on_time_percentage: 95,
          badge: 'excellent'
        },
        {
          courier_id: 'demo-2',
          courier_name: 'Bring',
          trust_score: 4.3,
          total_reviews: 987,
          avg_delivery_time: '2-3 days',
          on_time_percentage: 92,
          badge: 'very_good'
        },
        {
          courier_id: 'demo-3',
          courier_name: 'Porterbuddy',
          trust_score: 4.7,
          total_reviews: 456,
          avg_delivery_time: 'Same day',
          on_time_percentage: 98,
          badge: 'excellent'
        }
      ];
      
      setCouriers(demoData);
      if (demoData.length > 0) {
        handleCourierSelect(demoData[0], 1);
      }
    }
  }, [shippingAddress?.zip]);

  // Track courier displays when couriers are loaded
  useEffect(() => {
    if (couriers.length > 0 && merchantId) {
      couriers.forEach((courier, index) => {
        trackCourierDisplay(courier, index + 1, couriers.length);
      });
    }
  }, [couriers, merchantId]);

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

  const handleCourierSelect = async (courier, position) => {
    setSelectedCourier(courier.courier_id);

    // Track selection
    await trackCourierSelection(courier, position, couriers.length);

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

      await applyAttributeChange({
        type: 'updateAttribute',
        key: 'performile_session_id',
        value: sessionId,
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

      {/* Postal Code Validation */}
      {shippingAddress?.zip && (
        <PostalCodeValidator
          postalCode={shippingAddress.zip}
          country={shippingAddress.countryCode || 'SE'}
          apiBaseUrl={apiBaseUrl}
          onValidation={(data) => {
            // Store validation result for potential use
            if (data.valid) {
              console.log('Postal code validated:', data.city);
            }
          }}
        />
      )}

      <BlockStack spacing="tight">
        {couriers.map((courier, index) => (
          <CourierCard
            key={courier.courier_id}
            courier={courier}
            position={index + 1}
            isRecommended={index === 0}
            isSelected={selectedCourier === courier.courier_id}
            onSelect={() => handleCourierSelect(courier, index + 1)}
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
