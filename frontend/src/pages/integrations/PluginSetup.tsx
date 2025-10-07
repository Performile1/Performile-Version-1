import React, { useState, useEffect } from 'react';
import { Container, Paper, Typography, Box, Button, Tabs, Tab, Card, CardContent, TextField, List, ListItem, ListItemIcon, ListItemText, IconButton } from '@mui/material';
import { ContentCopy, CheckCircle, Download, ShoppingCart, Code } from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;
  return value === index ? <Box sx={{ py: 3 }}>{children}</Box> : null;
}

export const PluginSetup: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    fetchApiKey();
  }, []);

  const fetchApiKey = async () => {
    try {
      const response = await axios.get('/api/auth/api-key');
      setApiKey(response.data.api_key || '');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Plugin Setup</Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6">API Key</Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <TextField fullWidth value={apiKey} size="small" InputProps={{ readOnly: true }} />
          <Button variant="outlined" startIcon={<ContentCopy />} onClick={() => copy(apiKey)}>Copy</Button>
        </Box>
      </Paper>
      <Paper>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="WooCommerce" icon={<ShoppingCart />} iconPosition="start" />
          <Tab label="Shopify" icon={<ShoppingCart />} iconPosition="start" />
          <Tab label="API" icon={<Code />} iconPosition="start" />
        </Tabs>
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6">WooCommerce Setup</Typography>
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="subtitle1">Step 1: Download</Typography>
                <Button variant="contained" startIcon={<Download />} sx={{ mt: 1 }}>Download Plugin</Button>
              </CardContent>
            </Card>
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="subtitle1">Step 2: Install</Typography>
                <List>
                  <ListItem><ListItemIcon><CheckCircle color="primary" /></ListItemIcon><ListItemText primary="Upload to WordPress" /></ListItem>
                  <ListItem><ListItemIcon><CheckCircle color="primary" /></ListItemIcon><ListItemText primary="Activate plugin" /></ListItem>
                </List>
              </CardContent>
            </Card>
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="subtitle1">Step 3: Configure</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>Enter API Key in WooCommerce settings</Typography>
                <TextField fullWidth value={apiKey} size="small" sx={{ mt: 2 }} InputProps={{ readOnly: true, endAdornment: <IconButton onClick={() => copy(apiKey)}><ContentCopy /></IconButton> }} />
              </CardContent>
            </Card>
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6">Shopify Setup</Typography>
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="subtitle1">Step 1: Install from Shopify App Store</Typography>
              </CardContent>
            </Card>
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="subtitle1">Step 2: Enter API Key</Typography>
                <TextField fullWidth value={apiKey} size="small" sx={{ mt: 2 }} InputProps={{ readOnly: true, endAdornment: <IconButton onClick={() => copy(apiKey)}><ContentCopy /></IconButton> }} />
              </CardContent>
            </Card>
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6">API Integration</Typography>
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="subtitle1">Endpoint</Typography>
                <Box sx={{ bgcolor: 'grey.100', p: 2, mt: 1, borderRadius: 1, fontFamily: 'monospace' }}>GET /api/couriers/merchant-couriers</Box>
                <Typography variant="body2" sx={{ mt: 2 }}>Parameters: api_key, postal_code, limit</Typography>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};