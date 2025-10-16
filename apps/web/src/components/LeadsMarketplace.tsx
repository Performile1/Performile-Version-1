import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Search,
  Star,
  LocationOn,
  Business,
  AttachMoney,
  Visibility,
  ShoppingCart,
  Category,
  Email,
  Phone
} from '@mui/icons-material';

interface Lead {
  lead_id: string;
  title: string;
  description: string;
  lead_category: string;
  lead_priority: 'low' | 'medium' | 'high' | 'urgent';
  shipment_cost: number;
  order_value: number;
  delivery_country: string;
  delivery_city: string;
  delivery_postal_code: string;
  merchant_company_name: string;
  merchant_contact_name: string;
  merchant_contact_email: string;
  merchant_contact_phone: string;
  lead_price: number;
  lead_score: number;
  competition_level: number;
  is_repeat_customer: boolean;
  previous_orders_count: number;
  total_previous_spend: number;
  next_follow_up: string;
  follow_up_type: string;
  expires_at: string;
  is_premium: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  status: string;
  view_count: number;
  interest_count: number;
  purchase_count: number;
  is_purchased_by_user: boolean;
  creator_name: string;
  store_name: string;
}

interface LeadsMarketplaceProps {
  userRole: string;
}

const LeadsMarketplace: React.FC<LeadsMarketplaceProps> = ({ userRole }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  
  // Filters and pagination
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    priority: '',
    min_price: '',
    max_price: '',
    delivery_country: '',
    featured_only: false
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  // Fetch leads on component mount and filter changes
  useEffect(() => {
    fetchLeads();
  }, [filters, pagination.page]);

  const fetchLeads = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.min_price && { min_price: filters.min_price }),
        ...(filters.max_price && { max_price: filters.max_price }),
        ...(filters.delivery_country && { delivery_country: filters.delivery_country }),
        ...(filters.featured_only && { featured_only: 'true' })
      });

      const response = await fetch(`/api/leads?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leads');
      }

      const data = await response.json();
      setLeads(data.leads || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages
      }));

    } catch (err) {
      console.error('Error fetching leads:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleViewLead = async (lead: Lead) => {
    setSelectedLead(lead);
    setDetailsOpen(true);

    // Track lead view
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/leads', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'view',
            lead_id: lead.lead_id
          })
        });
      }
    } catch (err) {
      console.error('Error tracking lead view:', err);
    }
  };

  const handlePurchaseLead = async (leadId: string) => {
    if (userRole !== 'courier') {
      setError('Only couriers can purchase leads');
      return;
    }

    setPurchaseLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'purchase',
          lead_id: leadId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to purchase lead');
      }

      setSuccess('Lead purchased successfully!');
      setDetailsOpen(false);
      fetchLeads(); // Refresh leads list

    } catch (err) {
      console.error('Error purchasing lead:', err);
      setError(err instanceof Error ? err.message : 'Failed to purchase lead');
    } finally {
      setPurchaseLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'electronics': return '📱';
      case 'fashion': return '👗';
      case 'home_garden': return '🏠';
      case 'automotive': return '🚗';
      case 'health_beauty': return '💄';
      case 'sports_outdoors': return '⚽';
      case 'books_media': return '📚';
      case 'food_beverages': return '🍕';
      default: return '📦';
    }
  };

  const LeadCard: React.FC<{ lead: Lead }> = ({ lead }) => (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        },
        border: lead.is_featured ? '2px solid #gold' : 'none',
        position: 'relative'
      }}
    >
      {lead.is_featured && (
        <Chip
          label="Featured"
          color="warning"
          size="small"
          sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
        />
      )}
      
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="h3" sx={{ flexGrow: 1, fontSize: '1.1rem' }}>
            {lead.title}
          </Typography>
          <Chip
            label={lead.lead_priority}
            color={getPriorityColor(lead.lead_priority) as any}
            size="small"
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 40, overflow: 'hidden' }}>
          {lead.description}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Category sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ mr: 2 }}>
            {getCategoryIcon(lead.lead_category)} {lead.lead_category}
          </Typography>
          <Star sx={{ fontSize: 16, mr: 0.5, color: 'gold' }} />
          <Typography variant="body2">
            {lead.lead_score}/100
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2">
            {lead.delivery_city}, {lead.delivery_country}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Business sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2">
            {lead.merchant_company_name}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AttachMoney sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ mr: 2 }}>
            Order: ${lead.order_value}
          </Typography>
          <Typography variant="body2">
            Shipping: ${lead.shipment_cost}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" color="primary">
            ${lead.lead_price}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Visibility sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="body2" sx={{ mr: 1 }}>
              {lead.view_count}
            </Typography>
            <ShoppingCart sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="body2">
              {lead.purchase_count}
            </Typography>
          </Box>
        </Box>

        <Button
          fullWidth
          variant="contained"
          onClick={() => handleViewLead(lead)}
          disabled={lead.is_purchased_by_user}
          sx={{ mt: 'auto' }}
        >
          {lead.is_purchased_by_user ? 'Already Purchased' : 'View Details'}
        </Button>
      </CardContent>
    </Card>
  );

  if (userRole !== 'courier') {
    return (
      <Alert severity="info">
        Lead marketplace is only available for couriers.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Leads Marketplace
      </Typography>

      {/* Filters */}
      <Box sx={{ p: 2, mb: 3, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search leads..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                label="Category"
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="electronics">Electronics</MenuItem>
                <MenuItem value="fashion">Fashion</MenuItem>
                <MenuItem value="home_garden">Home & Garden</MenuItem>
                <MenuItem value="automotive">Automotive</MenuItem>
                <MenuItem value="health_beauty">Health & Beauty</MenuItem>
                <MenuItem value="sports_outdoors">Sports & Outdoors</MenuItem>
                <MenuItem value="books_media">Books & Media</MenuItem>
                <MenuItem value="food_beverages">Food & Beverages</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={filters.priority}
                label="Priority"
                onChange={(e) => handleFilterChange('priority', e.target.value)}
              >
                <MenuItem value="">All Priorities</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              type="number"
              placeholder="Min Price"
              value={filters.min_price}
              onChange={(e) => handleFilterChange('min_price', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              type="number"
              placeholder="Max Price"
              value={filters.max_price}
              onChange={(e) => handleFilterChange('max_price', e.target.value)}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Error/Success Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Leads Grid */}
      {!loading && (
        <>
          <Grid container spacing={3}>
            {leads.map((lead) => (
              <Grid item xs={12} sm={6} md={4} key={lead.lead_id}>
                <LeadCard lead={lead} />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={pagination.totalPages}
                page={pagination.page}
                onChange={(_, page) => setPagination(prev => ({ ...prev, page }))}
                color="primary"
              />
            </Box>
          )}

          {/* No Results */}
          {leads.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No leads found matching your criteria
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try adjusting your filters or check back later for new leads
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* Lead Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedLead && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h5">{selectedLead.title}</Typography>
                <Chip
                  label={selectedLead.lead_priority}
                  color={getPriorityColor(selectedLead.lead_priority) as any}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedLead.description}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 1 }}>Shipment Details</Typography>
                  <Typography variant="body2">
                    <strong>Order Value:</strong> ${selectedLead.order_value}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Shipping Cost:</strong> ${selectedLead.shipment_cost}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Delivery:</strong> {selectedLead.delivery_city}, {selectedLead.delivery_country} {selectedLead.delivery_postal_code}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Category:</strong> {getCategoryIcon(selectedLead.lead_category)} {selectedLead.lead_category}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 1 }}>Merchant Information</Typography>
                  <Typography variant="body2">
                    <strong>Company:</strong> {selectedLead.merchant_company_name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Contact:</strong> {selectedLead.merchant_contact_name}
                  </Typography>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Email sx={{ fontSize: 16, mr: 1 }} />
                    <strong>Email:</strong> {selectedLead.merchant_contact_email}
                  </Typography>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Phone sx={{ fontSize: 16, mr: 1 }} />
                    <strong>Phone:</strong> {selectedLead.merchant_contact_phone}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Box>
                      <Typography variant="h6">Lead Score: {selectedLead.lead_score}/100</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Competition Level: {selectedLead.competition_level}/5
                      </Typography>
                    </Box>
                    <Typography variant="h4" color="primary">
                      ${selectedLead.lead_price}
                    </Typography>
                  </Box>
                </Grid>
                
                {selectedLead.is_repeat_customer && (
                  <Grid item xs={12}>
                    <Alert severity="info">
                      This is a repeat customer with {selectedLead.previous_orders_count} previous orders 
                      totaling ${selectedLead.total_previous_spend}
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>
                Close
              </Button>
              {!selectedLead.is_purchased_by_user && (
                <Button
                  variant="contained"
                  onClick={() => handlePurchaseLead(selectedLead.lead_id)}
                  disabled={purchaseLoading}
                  startIcon={purchaseLoading ? <CircularProgress size={20} /> : <ShoppingCart />}
                >
                  {purchaseLoading ? 'Purchasing...' : `Purchase for $${selectedLead.lead_price}`}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default LeadsMarketplace;
