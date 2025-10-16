import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Alert
} from '@mui/material';
import { CloudUpload, Delete, Image } from '@mui/icons-material';

interface LogoUploaderProps {
  logoUrl: string;
  onChange: (url: string) => void;
}

const LogoUploader: React.FC<LogoUploaderProps> = ({ logoUrl, onChange }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Convert to base64 for now (in production, upload to Vercel Blob)
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onChange(base64String);
        setUploading(false);
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setUploading(false);
      };
      reader.readAsDataURL(file);

      // TODO: In production, upload to Vercel Blob:
      // const formData = new FormData();
      // formData.append('file', file);
      // const response = await fetch('/api/upload-logo', {
      //   method: 'POST',
      //   body: formData
      // });
      // const { url } = await response.json();
      // onChange(url);
    } catch (err) {
      setError('Failed to upload logo');
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    setError(null);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Upload Your Logo
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Your logo will appear in all emails sent to customers
      </Typography>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {/* Logo Preview */}
            {logoUrl ? (
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={logoUrl}
                  sx={{
                    width: 120,
                    height: 120,
                    border: '2px solid',
                    borderColor: 'divider'
                  }}
                  variant="rounded"
                >
                  <Image sx={{ fontSize: 60 }} />
                </Avatar>
                <IconButton
                  size="small"
                  color="error"
                  onClick={handleRemove}
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    bgcolor: 'background.paper',
                    boxShadow: 1,
                    '&:hover': {
                      bgcolor: 'error.light',
                      color: 'white'
                    }
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            ) : (
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'background.default'
                }}
              >
                <Image sx={{ fontSize: 60, color: 'text.disabled' }} />
              </Box>
            )}

            {/* Upload Button */}
            <Button
              variant="contained"
              component="label"
              startIcon={<CloudUpload />}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileSelect}
              />
            </Button>

            {/* Error Message */}
            {error && (
              <Alert severity="error" sx={{ width: '100%' }}>
                {error}
              </Alert>
            )}

            {/* Guidelines */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Recommended: 200x200px, PNG or JPG
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Max file size: 2MB
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LogoUploader;
