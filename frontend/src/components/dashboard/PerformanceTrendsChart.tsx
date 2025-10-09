import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export const PerformanceTrendsChart: React.FC = () => {
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');

  const { data: trendsData, isLoading } = useQuery({
    queryKey: ['dashboard-trends', period],
    queryFn: async () => {
      const response = await apiClient.get(`/dashboard/trends?period=${period}`);
      return response.data.data || [];
    },
    staleTime: 60000, // 1 minute
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Performance Trends
          </Typography>
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={(_, newPeriod) => {
              if (newPeriod) setPeriod(newPeriod);
            }}
            size="small"
          >
            <ToggleButton value="7d">7 Days</ToggleButton>
            <ToggleButton value="30d">30 Days</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : trendsData && trendsData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                yAxisId="left"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                labelFormatter={formatDate}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="orders"
                stroke="#2196f3"
                strokeWidth={2}
                name="Orders"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="reviews"
                stroke="#4caf50"
                strokeWidth={2}
                name="Reviews"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="trust_score"
                stroke="#ff9800"
                strokeWidth={2}
                name="Avg TrustScore"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="text.secondary">
              No trend data available
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
