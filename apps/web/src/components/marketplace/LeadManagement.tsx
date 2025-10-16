import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Visibility,
  Lock,
  Business,
  TrendingUp,
  AttachMoney,
  Schedule,
  CheckCircle,
  LocationOn
} from '@mui/icons-material';
import { CourierLead } from '@/types/analytics';

interface LeadCardProps {
  lead: CourierLead;
  onUnlock: (leadId: string) => void;
  isPurchased: boolean;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onUnlock, isPurchased }) => {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;

  return (
    <>
      <Card sx={{ height: '100%', position: 'relative' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box display="flex" alignItems="center">
              <Business color="primary" sx={{ mr: 1 }} />
              <Box>
                <Typography variant="h6">
                  {lead.isAnonymized && !isPurchased ? 'Anonymous Merchant' : lead.merchantName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Lead ID: {lead.leadId.slice(0, 8)}...
                </Typography>
              </Box>
            </Box>
            {lead.isAnonymized && !isPurchased && (
              <Chip 
                icon={<Lock />}
                label={formatCurrency(lead.unlockPrice)}
                color="warning"
                size="small"
              />
            )}
            {isPurchased && (
              <Chip 
                icon={<CheckCircle />}
                label="Purchased"
                color="success"
                size="small"
              />
            )}
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingUp fontSize="small" color="action" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Est. Monthly Volume: {lead.estimatedOrderVolume.toLocaleString()} orders
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" mb={1}>
                <AttachMoney fontSize="small" color="action" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Avg Order Value: {formatCurrency(lead.avgOrderValue)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" mb={1}>
                <LocationOn fontSize="small" color="action" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Areas: {lead.deliveryAreas.slice(0, 2).join(', ')}
                  {lead.deliveryAreas.length > 2 && ` +${lead.deliveryAreas.length - 2} more`}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" mb={1}>
                <Schedule fontSize="small" color="action" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Daily Orders: {lead.orderStatistics?.avgOrdersPerDay || '***'}/day
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingUp fontSize="small" color="success" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Growth: {lead.orderStatistics?.orderGrowthRate ? `+${lead.orderStatistics.orderGrowthRate}%` : '***%'}/month
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Budget: {formatCurrency(lead.budget.min)} - {formatCurrency(lead.budget.max)}
            </Typography>
            {lead.dynamicPricing && (
              <Box display="flex" alignItems="center" mt={1}>
                <Typography variant="body2" color="text.secondary">
                  Lead Price: 
                </Typography>
                <Typography variant="body2" color="primary.main" sx={{ ml: 1, fontWeight: 'bold' }}>
                  {formatCurrency(lead.dynamicPricing.finalPrice)}
                </Typography>
                <Chip 
                  label={`${lead.orderStatistics?.monthlyOrders || 0}+ orders/month`}
                  size="small"
                  color="info"
                  sx={{ ml: 1 }}
                />
              </Box>
            )}
          </Box>

          <Box display="flex" gap={1}>
            <Button 
              variant="outlined" 
              size="small"
              startIcon={<Visibility />}
              onClick={() => setDetailsOpen(true)}
            >
              View Details
            </Button>
            {lead.isAnonymized && !isPurchased && (
              <Button 
                variant="contained" 
                size="small"
                startIcon={<Lock />}
                onClick={() => onUnlock(lead.leadId)}
              >
                Unlock
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Lead Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Lead Details</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Business Information</Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Company" 
                    secondary={lead.isAnonymized && !isPurchased ? 'Anonymous' : lead.merchantName}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Monthly Volume" 
                    secondary={`${lead.estimatedOrderVolume.toLocaleString()} orders`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Average Order Value" 
                    secondary={formatCurrency(lead.avgOrderValue)}
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Requirements</Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Budget Range" 
                    secondary={`${formatCurrency(lead.budget.min)} - ${formatCurrency(lead.budget.max)}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Delivery Areas" 
                    secondary={lead.deliveryAreas.join(', ')}
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Special Requirements</Typography>
              <Typography variant="body2">
                {lead.requirements || 'No special requirements specified'}
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          {lead.isAnonymized && !isPurchased && (
            <Button 
              variant="contained" 
              onClick={() => {
                onUnlock(lead.leadId);
                setDetailsOpen(false);
              }}
            >
              Unlock for {formatCurrency(lead.unlockPrice)}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

interface LeadManagementProps {
  userRole: 'courier' | 'merchant';
}

export const LeadManagement: React.FC<LeadManagementProps> = ({ userRole }) => {
  const [purchasedLeads, setPurchasedLeads] = useState<Set<string>>(new Set());

  // Mock data - would come from API
  const leads: CourierLead[] = [
    {
      leadId: 'lead-001',
      merchantId: 'merchant-001',
      merchantName: 'FastFood Chain NYC',
      estimatedOrderVolume: 1200,
      avgOrderValue: 25.50,
      deliveryAreas: ['Manhattan', 'Brooklyn', 'Queens'],
      requirements: ['Same-day delivery', 'Food handling certification', 'Insulated bags'],
      budget: { min: 8, max: 15 },
      orderStatistics: {
        totalOrders: 14400,
        monthlyOrders: 1200,
        avgOrdersPerDay: 40,
        peakOrderHours: ['11:00-13:00', '17:00-20:00'],
        orderGrowthRate: 15.2
      },
      isAnonymized: true,
      unlockPrice: 99,
      dynamicPricing: {
        basePrice: 50,
        volumeMultiplier: 1.8,
        finalPrice: 129
      },
      createdAt: '2024-08-30T10:00:00Z'
    },
    {
      leadId: 'lead-002',
      merchantId: 'merchant-002',
      merchantName: 'E-commerce Retailer',
      estimatedOrderVolume: 800,
      avgOrderValue: 45.00,
      deliveryAreas: ['Manhattan', 'Bronx'],
      requirements: ['Package handling', 'Weekend availability'],
      budget: { min: 12, max: 20 },
      orderStatistics: {
        totalOrders: 9600,
        monthlyOrders: 800,
        avgOrdersPerDay: 27,
        peakOrderHours: ['10:00-12:00', '14:00-16:00'],
        orderGrowthRate: 8.5
      },
      isAnonymized: true,
      unlockPrice: 99,
      dynamicPricing: {
        basePrice: 50,
        volumeMultiplier: 1.4,
        finalPrice: 89
      },
      createdAt: '2024-08-29T14:30:00Z'
    }
  ];

  const handleUnlock = (leadId: string) => {
    console.log('Unlocking lead:', leadId);
    setPurchasedLeads(prev => new Set([...prev, leadId]));
    // API call to purchase lead
  };

  if (userRole !== 'courier') {
    return (
      <Alert severity="info">
        Lead management is available for courier accounts only.
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Available Merchant Leads
        </Typography>
        <Chip 
          label={`${leads.length} active leads`}
          color="primary"
          variant="outlined"
        />
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Lead System:</strong> Merchants post anonymized delivery opportunities. 
          Unlock leads for ${leads[0]?.unlockPrice || 99} to see full details and contact information.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {leads.map((lead, index) => (
          <Grid item xs={12} md={6} lg={4} key={index}>
            <LeadCard 
              lead={lead}
              onUnlock={handleUnlock}
              isPurchased={purchasedLeads.has(lead.leadId)}
            />
          </Grid>
        ))}
      </Grid>

      {leads.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Business sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No leads available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Check back later for new merchant opportunities
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
