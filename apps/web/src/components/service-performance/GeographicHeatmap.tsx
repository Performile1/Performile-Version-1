/**
 * Geographic Heatmap Component
 * Week 4 Phase 6 - Frontend Components
 * 
 * Display performance metrics by geographic area
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  LinearProgress,
  Paper,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import {
  Search,
  LocationOn,
  TrendingUp,
  TrendingDown,
  FilterList,
  Map as MapIcon,
  ViewList
} from '@mui/icons-material';

interface GeographicData {
  geo_performance_id: string;
  courier_name: string;
  service_name: string;
  postal_code: string;
  city: string;
  region: string;
  total_deliveries: number;
  successful_deliveries: number;
  on_time_rate: number;
  avg_rating: number;
  area_trust_score: number;
}

interface GeographicHeatmapProps {
  data: GeographicData[];
  courierName: string;
  serviceName?: string;
}

export const GeographicHeatmap: React.FC<GeographicHeatmapProps> = ({
  data,
  courierName,
  serviceName
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'heatmap'>('list');
  const [sortBy, setSortBy] = useState<'trust_score' | 'deliveries' | 'on_time'>('trust_score');

  // Filter data based on search
  const filteredData = data.filter(item =>
    item.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.postal_code.includes(searchTerm) ||
    item.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    switch (sortBy) {
      case 'trust_score':
        return b.area_trust_score - a.area_trust_score;
      case 'deliveries':
        return b.total_deliveries - a.total_deliveries;
      case 'on_time':
        return b.on_time_rate - a.on_time_rate;
      default:
        return 0;
    }
  });

  // Get color based on trust score
  const getTrustScoreColor = (score: number): string => {
    if (score >= 90) return '#4caf50';
    if (score >= 80) return '#8bc34a';
    if (score >= 70) return '#ffc107';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  // Get performance indicator
  const getPerformanceIndicator = (score: number) => {
    if (score >= 90) return { icon: <TrendingUp />, color: 'success' };
    if (score >= 70) return { icon: <TrendingUp />, color: 'warning' };
    return { icon: <TrendingDown />, color: 'error' };
  };

  // Calculate summary stats
  const summaryStats = {
    totalAreas: filteredData.length,
    avgTrustScore: filteredData.reduce((sum, item) => sum + item.area_trust_score, 0) / filteredData.length || 0,
    totalDeliveries: filteredData.reduce((sum, item) => sum + item.total_deliveries, 0),
    avgOnTimeRate: filteredData.reduce((sum, item) => sum + item.on_time_rate, 0) / filteredData.length || 0,
    bestArea: sortedData[0]?.city || 'N/A'
  };

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h6">
                Geographic Performance
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {courierName} {serviceName && `- ${serviceName}`}
              </Typography>
            </Box>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newMode) => newMode && setViewMode(newMode)}
              size="small"
            >
              <ToggleButton value="list">
                <ViewList />
              </ToggleButton>
              <ToggleButton value="heatmap">
                <MapIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        }
      />

      <CardContent>
        {/* Summary Stats */}
        <Box mb={3} p={2} bgcolor="grey.50" borderRadius={2}>
          <Box display="flex" gap={3} flexWrap="wrap">
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total Areas
              </Typography>
              <Typography variant="h6">
                {summaryStats.totalAreas}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Avg Trust Score
              </Typography>
              <Typography variant="h6" sx={{ color: getTrustScoreColor(summaryStats.avgTrustScore) }}>
                {summaryStats.avgTrustScore.toFixed(1)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total Deliveries
              </Typography>
              <Typography variant="h6">
                {summaryStats.totalDeliveries.toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Avg On-Time Rate
              </Typography>
              <Typography variant="h6">
                {summaryStats.avgOnTimeRate.toFixed(1)}%
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Best Performing Area
              </Typography>
              <Typography variant="h6">
                {summaryStats.bestArea}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Search and Filter */}
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <TextField
            placeholder="Search by city, postal code, or region..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ flexGrow: 1, minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
          />
          <ToggleButtonGroup
            value={sortBy}
            exclusive
            onChange={(_, newSort) => newSort && setSortBy(newSort)}
            size="small"
          >
            <ToggleButton value="trust_score">
              Trust Score
            </ToggleButton>
            <ToggleButton value="deliveries">
              Deliveries
            </ToggleButton>
            <ToggleButton value="on_time">
              On-Time
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Data Display */}
        {viewMode === 'list' ? (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Location</TableCell>
                  <TableCell align="center">Postal Code</TableCell>
                  <TableCell align="center">Deliveries</TableCell>
                  <TableCell align="center">Success Rate</TableCell>
                  <TableCell align="center">On-Time Rate</TableCell>
                  <TableCell align="center">Rating</TableCell>
                  <TableCell align="center">Trust Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary" py={3}>
                        No data available for the selected filters
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedData.map((item) => {
                    const indicator = getPerformanceIndicator(item.area_trust_score);
                    const successRate = (item.successful_deliveries / item.total_deliveries * 100) || 0;

                    return (
                      <TableRow key={item.geo_performance_id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {item.city}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.region}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={item.postal_code} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {item.total_deliveries.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {successRate.toFixed(1)}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.successful_deliveries}/{item.total_deliveries}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight="medium">
                            {item.on_time_rate.toFixed(1)}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                            <Typography variant="body2" fontWeight="medium">
                              {item.avg_rating.toFixed(1)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              / 5.0
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box>
                            <Box display="flex" alignItems="center" justifyContent="center" gap={0.5} mb={0.5}>
                              <Tooltip title={indicator.color === 'success' ? 'Excellent' : indicator.color === 'warning' ? 'Good' : 'Needs Improvement'}>
                                <IconButton size="small" color={indicator.color as any}>
                                  {indicator.icon}
                                </IconButton>
                              </Tooltip>
                              <Typography 
                                variant="body2" 
                                fontWeight="bold"
                                sx={{ color: getTrustScoreColor(item.area_trust_score) }}
                              >
                                {item.area_trust_score.toFixed(1)}
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={item.area_trust_score}
                              sx={{
                                height: 4,
                                borderRadius: 2,
                                backgroundColor: 'rgba(0,0,0,0.1)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getTrustScoreColor(item.area_trust_score),
                                  borderRadius: 2
                                }
                              }}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          // Heatmap view (simplified - would integrate with actual map library)
          <Box>
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', minHeight: 400 }}>
              <MapIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Interactive Map View
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Integrate with Google Maps or Mapbox to display performance heatmap
              </Typography>
              <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
                {sortedData.slice(0, 5).map((item) => (
                  <Chip
                    key={item.geo_performance_id}
                    icon={<LocationOn />}
                    label={`${item.city}: ${item.area_trust_score.toFixed(1)}`}
                    sx={{
                      backgroundColor: getTrustScoreColor(item.area_trust_score),
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                ))}
              </Box>
            </Paper>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default GeographicHeatmap;
