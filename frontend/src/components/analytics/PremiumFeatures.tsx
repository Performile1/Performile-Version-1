import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Assessment,
  Analytics,
  LocationOn,
  Groups,
  Speed,
  Email,
  Api,
  Star,
  TrendingUp
} from '@mui/icons-material';

interface PremiumFeatureCardProps {
  title: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  icon: React.ReactNode;
  category: string;
  isPopular?: boolean;
}

const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({
  title,
  description,
  price,
  billingCycle,
  features,
  icon,
  category,
  isPopular
}) => {
  return (
    <Card sx={{ position: 'relative', height: '100%' }}>
      {isPopular && (
        <Chip
          label="Most Popular"
          color="primary"
          size="small"
          sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}
        />
      )}
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box display="flex" alignItems="center" mb={2}>
          {icon}
          <Box ml={2}>
            <Typography variant="h6">{title}</Typography>
            <Chip label={category} size="small" variant="outlined" />
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          {description}
        </Typography>
        
        <Box mb={2}>
          <Typography variant="h4" component="span" color="primary">
            ${price}
          </Typography>
          <Typography variant="body2" component="span" color="text.secondary">
            /{billingCycle}
          </Typography>
        </Box>
        
        <List dense sx={{ flexGrow: 1 }}>
          {features.map((feature, index) => (
            <ListItem key={index} sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Star fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary={feature} 
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
          ))}
        </List>
        
        <Button variant="contained" fullWidth sx={{ mt: 2 }}>
          Upgrade Now
        </Button>
      </CardContent>
    </Card>
  );
};

export const PremiumFeatures: React.FC = () => {
  const merchantFeatures = [
    {
      title: "Advanced Courier Analytics",
      description: "Deep insights into courier performance with predictive analytics and benchmarking",
      price: 49,
      billingCycle: 'monthly' as const,
      category: "Analytics",
      icon: <Analytics color="primary" />,
      features: [
        "Predictive delivery time estimates",
        "Courier reliability scoring",
        "Cost optimization recommendations",
        "Performance trend forecasting",
        "Custom KPI dashboards"
      ]
    },
    {
      title: "Courier Marketplace Pro",
      description: "Access premium courier network and advanced lead generation tools",
      price: 99,
      billingCycle: 'monthly' as const,
      category: "Marketplace",
      icon: <Groups color="primary" />,
      isPopular: true,
      features: [
        "Access to 500+ verified couriers",
        "AI-powered courier matching",
        "Bulk quote requests",
        "Contract negotiation tools",
        "Performance guarantees"
      ]
    },
    {
      title: "Geographic Intelligence",
      description: "Location-based analytics and route optimization insights",
      price: 29,
      billingCycle: 'monthly' as const,
      category: "Insights",
      icon: <LocationOn color="primary" />,
      features: [
        "Delivery heat maps",
        "Route optimization suggestions",
        "Geographic performance analysis",
        "Postal code insights",
        "City-level benchmarking"
      ]
    },
    {
      title: "Automated Reporting",
      description: "Custom reports and automated insights delivered to your inbox",
      price: 39,
      billingCycle: 'monthly' as const,
      category: "Automation",
      icon: <Email color="primary" />,
      features: [
        "Weekly performance reports",
        "Custom report builder",
        "Automated alerts",
        "Executive summaries",
        "Export to Excel/PDF"
      ]
    }
  ];

  const courierFeatures = [
    {
      title: "Market Intelligence Pro",
      description: "Unlock competitor data and market opportunities across multiple cities",
      price: 79,
      billingCycle: 'monthly' as const,
      category: "Intelligence",
      icon: <TrendingUp color="primary" />,
      isPopular: true,
      features: [
        "Competitor performance data",
        "Market demand forecasting",
        "Pricing optimization tools",
        "Territory expansion insights",
        "Lead opportunity alerts"
      ]
    },
    {
      title: "Performance Optimization",
      description: "AI-powered recommendations to improve your TrustScore and efficiency",
      price: 59,
      billingCycle: 'monthly' as const,
      category: "Optimization",
      icon: <Speed color="primary" />,
      features: [
        "TrustScore improvement roadmap",
        "Route optimization AI",
        "Customer satisfaction insights",
        "Operational efficiency analysis",
        "Personalized coaching"
      ]
    },
    {
      title: "Lead Generation Plus",
      description: "Access to premium merchant leads and business development tools",
      price: 89,
      billingCycle: 'monthly' as const,
      category: "Business Development",
      icon: <Assessment color="primary" />,
      features: [
        "Premium merchant leads",
        "Lead scoring and prioritization",
        "Proposal templates",
        "Win rate analytics",
        "CRM integration"
      ]
    },
    {
      title: "API & Integration Suite",
      description: "Advanced API access and third-party integrations for enterprise operations",
      price: 149,
      billingCycle: 'monthly' as const,
      category: "Enterprise",
      icon: <Api color="primary" />,
      features: [
        "Full API access",
        "Webhook notifications",
        "Third-party integrations",
        "Custom dashboard embedding",
        "Priority support"
      ]
    }
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Premium Features for Merchants
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {merchantFeatures.map((feature, index) => (
          <Grid item xs={12} md={6} lg={3} key={index}>
            <PremiumFeatureCard {...feature} />
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" gutterBottom>
        Premium Features for Couriers
      </Typography>
      <Grid container spacing={3}>
        {courierFeatures.map((feature, index) => (
          <Grid item xs={12} md={6} lg={3} key={index}>
            <PremiumFeatureCard {...feature} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
