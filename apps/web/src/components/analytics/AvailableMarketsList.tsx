/**
 * Available Markets List Component
 * Week 2 Day 4 - Market List with Stats
 * 
 * Displays list of available markets with order counts and performance metrics
 * Clickable to filter PerformanceByLocation component
 * Created: November 6, 2025
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';

interface MarketData {
  country: string;
  countryName: string;
  countryFlag: string;
  totalOrders: number;
  totalCouriers: number;
  avgOnTimeRate: number;
}

interface AvailableMarketsListProps {
  onMarketSelect?: (countryCode: string) => void;
  selectedMarket?: string;
}

const countryFlags: { [key: string]: string } = {
  'NO': '🇳🇴',
  'SE': '🇸🇪',
  'DK': '🇩🇰',
  'FI': '🇫🇮',
  'US': '🇺🇸',
  'GB': '🇬🇧',
  'DE': '🇩🇪',
  'FR': '🇫🇷'
};

const countryNames: { [key: string]: string } = {
  'NO': 'Norway',
  'SE': 'Sweden',
  'DK': 'Denmark',
  'FI': 'Finland',
  'US': 'United States',
  'GB': 'United Kingdom',
  'DE': 'Germany',
  'FR': 'France'
};

export const AvailableMarketsList: React.FC<AvailableMarketsListProps> = ({ 
  onMarketSelect,
  selectedMarket 
}) => {
  const { user } = useAuthStore();
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMarkets();
  }, [user]);

  const fetchMarkets = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch market statistics from API
      const response = await apiClient.get('/analytics/markets-summary');
      
      const marketData = response.data.data || [];
      
      // Transform data
      const transformedMarkets = marketData.map((market: any) => ({
        country: market.country,
        countryName: countryNames[market.country] || market.country,
        countryFlag: countryFlags[market.country] || '🌍',
        totalOrders: market.total_orders || 0,
        totalCouriers: market.total_couriers || 0,
        avgOnTimeRate: market.avg_on_time_rate || 0
      }));

      // Sort by total orders descending
      transformedMarkets.sort((a, b) => b.totalOrders - a.totalOrders);

      setMarkets(transformedMarkets);
    } catch (err: any) {
      console.error('Failed to fetch markets:', err);
      setError(err.response?.data?.error || 'Failed to load markets');
    } finally {
      setLoading(false);
    }
  };

  const handleMarketClick = (countryCode: string) => {
    if (onMarketSelect) {
      onMarketSelect(countryCode);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Loading markets...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="warning">
        {error}
      </Alert>
    );
  }

  if (markets.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No market data available yet. Markets will appear once orders are placed.
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Click a market to view performance details below.
      </Typography>
      
      <List sx={{ p: 0 }}>
        {markets.map((market, index) => (
          <React.Fragment key={market.country}>
            {index > 0 && <Divider />}
            <ListItem disablePadding>
              <ListItemButton
                selected={selectedMarket === market.country}
                onClick={() => handleMarketClick(market.country)}
                sx={{
                  py: 1.5,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                    }
                  }
                }}
              >
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6" component="span">
                        {market.countryFlag}
                      </Typography>
                      <Typography variant="subtitle1" component="span" fontWeight="medium">
                        {market.countryName}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box display="flex" gap={1} flexWrap="wrap" mt={0.5}>
                      <Chip 
                        label={`${market.totalOrders} orders`}
                        size="small"
                        variant="outlined"
                        color={market.totalOrders > 0 ? 'primary' : 'default'}
                      />
                      <Chip 
                        label={`${market.totalCouriers} couriers`}
                        size="small"
                        variant="outlined"
                      />
                      {market.avgOnTimeRate > 0 && (
                        <Chip 
                          label={`${market.avgOnTimeRate.toFixed(0)}% on-time`}
                          size="small"
                          variant="outlined"
                          color={market.avgOnTimeRate >= 90 ? 'success' : market.avgOnTimeRate >= 75 ? 'warning' : 'error'}
                        />
                      )}
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};
