import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Avatar,
  Rating
} from '@mui/material';
import {
  Lock,
  Send,
  LocalShipping
} from '@mui/icons-material';
import { CompetitorData } from '@/types/analytics';

interface CourierCardProps {
  courier: CompetitorData;
  onUnlock: (courierId: string) => void;
  onSendLead: (courierId: string) => void;
}

const CourierCard: React.FC<CourierCardProps> = ({ courier, onUnlock, onSendLead }) => {
  return (
    <Card sx={{ height: '100%', position: 'relative' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center">
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <LocalShipping />
            </Avatar>
            <Box>
              <Typography variant="h6">
                {courier.isUnlocked ? `Courier ${courier.anonymizedId}` : 'Anonymous Courier'}
              </Typography>
              <Chip 
                label={`TrustScore: ${courier.isUnlocked ? courier.trustScore : '***'}`}
                color="primary"
                size="small"
              />
            </Box>
          </Box>
          {!courier.isUnlocked && (
            <Chip 
              icon={<Lock />}
              label={`$${courier.unlockPrice}`}
              color="warning"
              size="small"
            />
          )}
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Completion Rate
            </Typography>
            <Typography variant="h6">
              {courier.isUnlocked ? `${courier.completionRate}%` : '***%'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              On-Time Rate
            </Typography>
            <Typography variant="h6">
              {courier.isUnlocked ? `${courier.onTimeRate}%` : '***%'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Market Share
            </Typography>
            <Typography variant="h6">
              {courier.isUnlocked ? `${courier.marketShare}%` : '***%'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Avg Price
            </Typography>
            <Typography variant="h6">
              {courier.isUnlocked ? `$${courier.priceRange.avg}` : '$***'}
            </Typography>
          </Grid>
        </Grid>

        <Rating 
          value={courier.isUnlocked ? courier.customerSatisfaction : 0} 
          readOnly 
          size="small"
          sx={{ mb: 2 }}
        />

        <Box display="flex" gap={1}>
          {!courier.isUnlocked ? (
            <Button 
              variant="outlined" 
              fullWidth
              startIcon={<Lock />}
              onClick={() => onUnlock(courier.anonymizedId)}
            >
              Unlock Data
            </Button>
          ) : (
            <Button 
              variant="contained" 
              fullWidth
              startIcon={<Send />}
              onClick={() => onSendLead(courier.anonymizedId)}
            >
              Send Lead
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

interface SendLeadDialogProps {
  open: boolean;
  onClose: () => void;
  courierId: string;
  onSend: (leadData: any) => void;
}

const SendLeadDialog: React.FC<SendLeadDialogProps> = ({ open, onClose, courierId, onSend }) => {
  const [leadData, setLeadData] = useState({
    estimatedVolume: '',
    avgOrderValue: '',
    deliveryAreas: '',
    requirements: '',
    budgetMin: '',
    budgetMax: '',
    isAnonymized: true
  });

  const handleSend = () => {
    onSend({
      ...leadData,
      courierId,
      estimatedVolume: parseInt(leadData.estimatedVolume),
      avgOrderValue: parseFloat(leadData.avgOrderValue),
      budgetMin: parseFloat(leadData.budgetMin),
      budgetMax: parseFloat(leadData.budgetMax),
      deliveryAreas: leadData.deliveryAreas.split(',').map(area => area.trim())
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Send Lead to Courier</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Estimated Monthly Volume"
              type="number"
              value={leadData.estimatedVolume}
              onChange={(e) => setLeadData(prev => ({ ...prev, estimatedVolume: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Average Order Value ($)"
              type="number"
              value={leadData.avgOrderValue}
              onChange={(e) => setLeadData(prev => ({ ...prev, avgOrderValue: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Budget Min ($)"
              type="number"
              value={leadData.budgetMin}
              onChange={(e) => setLeadData(prev => ({ ...prev, budgetMin: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Budget Max ($)"
              type="number"
              value={leadData.budgetMax}
              onChange={(e) => setLeadData(prev => ({ ...prev, budgetMax: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Delivery Areas"
              placeholder="e.g., Manhattan, Brooklyn, Queens"
              value={leadData.deliveryAreas}
              onChange={(e) => setLeadData(prev => ({ ...prev, deliveryAreas: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Special Requirements"
              value={leadData.requirements}
              onChange={(e) => setLeadData(prev => ({ ...prev, requirements: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Lead Visibility</InputLabel>
              <Select
                value={leadData.isAnonymized ? "true" : "false"}
                label="Lead Visibility"
                onChange={(e) => setLeadData(prev => ({ ...prev, isAnonymized: e.target.value === "true" }))}
              >
                <MenuItem value={"true"}>Anonymous (Recommended)</MenuItem>
                <MenuItem value={"false"}>Show Company Details</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSend} variant="contained">
          Send Lead
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface CourierMarketplaceProps {
  marketId: string;
}

export const CourierMarketplace: React.FC<CourierMarketplaceProps> = ({ marketId: _marketId }) => {
  const [selectedCourier, setSelectedCourier] = useState<string | null>(null);
  const [sendLeadOpen, setSendLeadOpen] = useState(false);

  // Mock data - would come from API
  const couriers: CompetitorData[] = [
    {
      anonymizedId: 'ANON_ABC123',
      trustScore: 92,
      completionRate: 96,
      onTimeRate: 89,
      customerSatisfaction: 4.7,
      marketShare: 15,
      avgDeliveryTime: 24,
      priceRange: { min: 5, max: 25, avg: 12 },
      isUnlocked: false,
      unlockPrice: 29
    },
    {
      anonymizedId: 'ANON_DEF456',
      trustScore: 87,
      completionRate: 93,
      onTimeRate: 85,
      customerSatisfaction: 4.5,
      marketShare: 12,
      avgDeliveryTime: 28,
      priceRange: { min: 4, max: 20, avg: 10 },
      isUnlocked: true,
      unlockPrice: 29
    }
  ];

  const handleUnlock = (courierId: string) => {
    console.log('Unlocking courier:', courierId);
    // API call to unlock courier data
  };

  const handleSendLead = (courierId: string) => {
    console.log('Sending lead to courier:', courierId, 'for market:', _marketId);
    setSelectedCourier(courierId);
    setSendLeadOpen(true);
  };

  const handleLeadSubmit = (_leadData: any) => {
    console.log('Sending lead to:', _marketId);
    // API call to send lead
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Available Couriers in Market
        </Typography>
        <Chip 
          label={`${couriers.length} couriers found`}
          color="primary"
          variant="outlined"
        />
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>How it works:</strong> Research anonymized courier performance data. 
          Unlock detailed information for $29, then send leads to connect with top performers.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {couriers.map((courier, index) => (
          <Grid item xs={12} md={6} lg={4} key={index}>
            <CourierCard 
              courier={courier}
              onUnlock={handleUnlock}
              onSendLead={handleSendLead}
            />
          </Grid>
        ))}
      </Grid>

      <SendLeadDialog
        open={sendLeadOpen}
        onClose={() => setSendLeadOpen(false)}
        courierId={selectedCourier || ''}
        onSend={handleLeadSubmit}
      />
    </Box>
  );
};
