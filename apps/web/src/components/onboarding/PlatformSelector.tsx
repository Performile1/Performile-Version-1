import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Radio,
  FormControlLabel,
  RadioGroup,
  Chip
} from '@mui/material';
import {
  ShoppingCart,
  Store,
  Storefront,
  LocalMall,
  ShoppingBag,
  Shop
} from '@mui/icons-material';

interface PlatformSelectorProps {
  value: string;
  onChange: (platform: string) => void;
}

const platforms = [
  {
    id: 'shopify',
    name: 'Shopify',
    icon: ShoppingCart,
    description: 'Leading e-commerce platform',
    marketShare: '25%',
    popular: true
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    icon: Store,
    description: 'WordPress e-commerce plugin',
    marketShare: '30%',
    popular: true
  },
  {
    id: 'wix',
    name: 'Wix',
    icon: Storefront,
    description: 'Website builder with e-commerce',
    marketShare: '10%',
    popular: false
  },
  {
    id: 'squarespace',
    name: 'Squarespace',
    icon: LocalMall,
    description: 'Premium website builder',
    marketShare: '5%',
    popular: false
  },
  {
    id: 'magento',
    name: 'Magento',
    icon: ShoppingBag,
    description: 'Adobe Commerce (Enterprise)',
    marketShare: '8%',
    popular: false
  },
  {
    id: 'opencart',
    name: 'OpenCart',
    icon: Shop,
    description: 'Free shopping cart solution',
    marketShare: '5%',
    popular: false
  },
  {
    id: 'prestashop',
    name: 'PrestaShop',
    icon: Store,
    description: 'Open-source e-commerce',
    marketShare: '7%',
    popular: false
  },
  {
    id: 'other',
    name: 'Other / Custom',
    icon: Store,
    description: 'Manual integration',
    marketShare: '10%',
    popular: false
  }
];

const PlatformSelector: React.FC<PlatformSelectorProps> = ({ value, onChange }) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select Your E-commerce Platform
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose the platform you use for your online store. We'll help you set up the integration.
      </Typography>

      <RadioGroup value={value} onChange={(e) => onChange(e.target.value)}>
        <Grid container spacing={2}>
          {platforms.map((platform) => {
            const Icon = platform.icon;
            const isSelected = value === platform.id;

            return (
              <Grid item xs={12} sm={6} md={4} key={platform.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: isSelected ? 2 : 1,
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: 'translateY(-2px)',
                      boxShadow: 3
                    }
                  }}
                  onClick={() => onChange(platform.id)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon color={isSelected ? 'primary' : 'action'} />
                        <FormControlLabel
                          value={platform.id}
                          control={<Radio />}
                          label=""
                          sx={{ m: 0 }}
                        />
                      </Box>
                      {platform.popular && (
                        <Chip label="Popular" size="small" color="primary" />
                      )}
                    </Box>

                    <Typography variant="h6" gutterBottom>
                      {platform.name}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {platform.description}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      Market Share: {platform.marketShare}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </RadioGroup>
    </Box>
  );
};

export default PlatformSelector;
