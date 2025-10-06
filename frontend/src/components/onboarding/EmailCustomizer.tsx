import React, { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Paper
} from '@mui/material';
import { Palette, Preview } from '@mui/icons-material';

interface EmailCustomizerProps {
  customText: string;
  primaryColor: string;
  secondaryColor: string;
  onChange: (field: string, value: string) => void;
}

const EmailCustomizer: React.FC<EmailCustomizerProps> = ({
  customText,
  primaryColor,
  secondaryColor,
  onChange
}) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Customize Your Email Templates
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Personalize the review request emails sent to your customers
      </Typography>

      <Grid container spacing={3}>
        {/* Customization Form */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Email Content
              </Typography>

              <TextField
                label="Custom Message"
                multiline
                rows={4}
                fullWidth
                value={customText}
                onChange={(e) => onChange('customText', e.target.value)}
                placeholder="We'd love to hear about your delivery experience! Your feedback helps us improve our service."
                helperText="This message will appear in review request emails"
                sx={{ mb: 3 }}
              />

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Brand Colors
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Primary Color
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => onChange('primaryColor', e.target.value)}
                        style={{
                          width: '60px',
                          height: '40px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      />
                      <TextField
                        size="small"
                        value={primaryColor}
                        onChange={(e) => onChange('primaryColor', e.target.value)}
                        placeholder="#667eea"
                      />
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Secondary Color
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => onChange('secondaryColor', e.target.value)}
                        style={{
                          width: '60px',
                          height: '40px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      />
                      <TextField
                        size="small"
                        value={secondaryColor}
                        onChange={(e) => onChange('secondaryColor', e.target.value)}
                        placeholder="#764ba2"
                      />
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <Button
                startIcon={<Preview />}
                onClick={() => setShowPreview(!showPreview)}
                sx={{ mt: 2 }}
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Preview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Email Preview
              </Typography>

              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                  color: 'white',
                  borderRadius: 2
                }}
              >
                <Typography variant="h6" gutterBottom>
                  How was your delivery?
                </Typography>

                <Box
                  sx={{
                    bgcolor: 'white',
                    color: 'text.primary',
                    p: 2,
                    borderRadius: 1,
                    my: 2
                  }}
                >
                  <Typography variant="body2" paragraph>
                    Hi [Customer Name],
                  </Typography>

                  <Typography variant="body2" paragraph>
                    {customText || 'We\'d love to hear about your delivery experience! Your feedback helps us improve our service.'}
                  </Typography>

                  <Typography variant="body2" paragraph>
                    <strong>Order:</strong> #12345<br />
                    <strong>Courier:</strong> [Courier Name]<br />
                    <strong>Delivered:</strong> [Date]
                  </Typography>

                  <Button
                    variant="contained"
                    fullWidth
                    sx={{
                      background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                      color: 'white'
                    }}
                  >
                    Leave Your Review
                  </Button>
                </Box>

                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  This is a preview. Actual emails will include your logo.
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmailCustomizer;
