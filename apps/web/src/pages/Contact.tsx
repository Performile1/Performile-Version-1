/**
 * Contact Page
 * Simple contact form for inquiries
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  Alert,
} from '@mui/material';
import {
  Email,
  Phone,
  LocationOn,
  Send,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export const Contact: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual form submission
    console.log('Form submitted:', formData);
    setSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

  const contactInfo = [
    {
      icon: <Email sx={{ fontSize: 40, color: '#667eea' }} />,
      title: 'Email',
      value: 'support@performile.com',
      link: 'mailto:support@performile.com',
    },
    {
      icon: <Phone sx={{ fontSize: 40, color: '#667eea' }} />,
      title: 'Phone',
      value: '+1 (555) 123-4567',
      link: 'tel:+15551234567',
    },
    {
      icon: <LocationOn sx={{ fontSize: 40, color: '#667eea' }} />,
      title: 'Address',
      value: 'Stockholm, Sweden',
      link: null,
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h2" fontWeight="bold" gutterBottom>
            Contact Us
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Have questions? We'd love to hear from you.
          </Typography>
        </Container>
      </Box>

      {/* Contact Form & Info */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={6}>
          {/* Contact Form */}
          <Grid item xs={12} md={7}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Send us a Message
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Fill out the form below and we'll get back to you as soon as possible.
                </Typography>

                {submitted && (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    Thank you for your message! We'll get back to you soon.
                  </Alert>
                )}

                <form onSubmit={handleSubmit}>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label="Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                    <TextField
                      fullWidth
                      label="Subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    />
                    <TextField
                      fullWidth
                      label="Message"
                      name="message"
                      multiline
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      required
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      endIcon={<Send />}
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      }}
                    >
                      Send Message
                    </Button>
                  </Stack>
                </form>
              </CardContent>
            </Card>
          </Grid>

          {/* Contact Info */}
          <Grid item xs={12} md={5}>
            <Stack spacing={3}>
              <Typography variant="h5" fontWeight="bold">
                Get in Touch
              </Typography>
              <Typography variant="body1" color="text.secondary">
                We're here to help and answer any question you might have. We look forward to hearing from you!
              </Typography>

              {contactInfo.map((info, index) => (
                <Card key={index}>
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box>{info.icon}</Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          {info.title}
                        </Typography>
                        {info.link ? (
                          <Typography
                            variant="body1"
                            component="a"
                            href={info.link}
                            sx={{
                              color: 'primary.main',
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' },
                            }}
                          >
                            {info.value}
                          </Typography>
                        ) : (
                          <Typography variant="body1">{info.value}</Typography>
                        )}
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              ))}

              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Business Hours
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Monday - Friday: 9:00 AM - 6:00 PM<br />
                    Saturday: 10:00 AM - 4:00 PM<br />
                    Sunday: Closed
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Container>

      {/* Back to Home */}
      <Box sx={{ bgcolor: 'grey.100', py: 4, textAlign: 'center' }}>
        <Container maxWidth="lg">
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Contact;
