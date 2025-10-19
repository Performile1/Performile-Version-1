/**
 * Service Comparison Chart Component
 * Week 4 Phase 6 - Frontend Components
 * 
 * Compare performance metrics across multiple courier services
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Chip
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { TrendingUp, Speed, Star, CheckCircle } from '@mui/icons-material';

interface ServiceData {
  courier_name: string;
  service_name: string;
  trust_score: number;
  completion_rate: number;
  on_time_rate: number;
  avg_rating: number;
  customer_satisfaction_score: number;
}

interface ServiceComparisonChartProps {
  data: ServiceData[];
  title?: string;
  defaultView?: 'bar' | 'radar';
}

export const ServiceComparisonChart: React.FC<ServiceComparisonChartProps> = ({
  data,
  title = 'Service Performance Comparison',
  defaultView = 'bar'
}) => {
  const [chartType, setChartType] = React.useState<'bar' | 'radar'>(defaultView);

  // Transform data for bar chart
  const barChartData = data.map(item => ({
    name: `${item.courier_name}\n${item.service_name}`,
    'Trust Score': item.trust_score,
    'Completion Rate': item.completion_rate,
    'On-Time Rate': item.on_time_rate,
    'Avg Rating': item.avg_rating * 20, // Scale to 100
    'Satisfaction': item.customer_satisfaction_score
  }));

  // Transform data for radar chart
  const radarChartData = [
    {
      metric: 'Trust Score',
      ...data.reduce((acc, item, idx) => ({
        ...acc,
        [item.courier_name]: item.trust_score
      }), {})
    },
    {
      metric: 'Completion',
      ...data.reduce((acc, item) => ({
        ...acc,
        [item.courier_name]: item.completion_rate
      }), {})
    },
    {
      metric: 'On-Time',
      ...data.reduce((acc, item) => ({
        ...acc,
        [item.courier_name]: item.on_time_rate
      }), {})
    },
    {
      metric: 'Rating',
      ...data.reduce((acc, item) => ({
        ...acc,
        [item.courier_name]: item.avg_rating * 20
      }), {})
    },
    {
      metric: 'Satisfaction',
      ...data.reduce((acc, item) => ({
        ...acc,
        [item.courier_name]: item.customer_satisfaction_score
      }), {})
    }
  ];

  // Colors for different couriers
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  // Get best performer for each metric
  const getBestPerformer = (metric: keyof ServiceData): string => {
    const best = data.reduce((prev, current) => 
      (current[metric] as number) > (prev[metric] as number) ? current : prev
    );
    return best.courier_name;
  };

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Typography variant="h6">{title}</Typography>
            <ToggleButtonGroup
              value={chartType}
              exclusive
              onChange={(_, newType) => newType && setChartType(newType)}
              size="small"
            >
              <ToggleButton value="bar">
                Bar Chart
              </ToggleButton>
              <ToggleButton value="radar">
                Radar Chart
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        }
        subheader={
          <Box display="flex" gap={1} mt={1} flexWrap="wrap">
            <Chip
              icon={<TrendingUp />}
              label={`Best Trust Score: ${getBestPerformer('trust_score')}`}
              size="small"
              color="success"
              variant="outlined"
            />
            <Chip
              icon={<CheckCircle />}
              label={`Best Completion: ${getBestPerformer('completion_rate')}`}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              icon={<Speed />}
              label={`Best On-Time: ${getBestPerformer('on_time_rate')}`}
              size="small"
              color="info"
              variant="outlined"
            />
            <Chip
              icon={<Star />}
              label={`Best Rating: ${getBestPerformer('avg_rating')}`}
              size="small"
              color="warning"
              variant="outlined"
            />
          </Box>
        }
      />

      <CardContent>
        {chartType === 'bar' ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                label={{ value: 'Score', angle: -90, position: 'insideLeft' }}
                domain={[0, 100]}
              />
              <Tooltip 
                formatter={(value: number) => value.toFixed(1)}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 8 }}
              />
              <Legend />
              <Bar dataKey="Trust Score" fill="#8884d8" />
              <Bar dataKey="Completion Rate" fill="#82ca9d" />
              <Bar dataKey="On-Time Rate" fill="#ffc658" />
              <Bar dataKey="Avg Rating" fill="#ff7c7c" />
              <Bar dataKey="Satisfaction" fill="#8dd1e1" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarChartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Tooltip 
                formatter={(value: number) => value.toFixed(1)}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 8 }}
              />
              <Legend />
              {data.map((item, index) => (
                <Radar
                  key={item.courier_name}
                  name={item.courier_name}
                  dataKey={item.courier_name}
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.3}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        )}

        {/* Summary Statistics */}
        <Box mt={3} p={2} bgcolor="grey.50" borderRadius={2}>
          <Typography variant="subtitle2" gutterBottom>
            Comparison Summary
          </Typography>
          <Box display="flex" gap={3} flexWrap="wrap">
            <Box>
              <Typography variant="caption" color="text.secondary">
                Services Compared
              </Typography>
              <Typography variant="h6">
                {data.length}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Avg Trust Score
              </Typography>
              <Typography variant="h6">
                {(data.reduce((sum, item) => sum + item.trust_score, 0) / data.length).toFixed(1)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Avg Completion Rate
              </Typography>
              <Typography variant="h6">
                {(data.reduce((sum, item) => sum + item.completion_rate, 0) / data.length).toFixed(1)}%
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Avg On-Time Rate
              </Typography>
              <Typography variant="h6">
                {(data.reduce((sum, item) => sum + item.on_time_rate, 0) / data.length).toFixed(1)}%
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ServiceComparisonChart;
