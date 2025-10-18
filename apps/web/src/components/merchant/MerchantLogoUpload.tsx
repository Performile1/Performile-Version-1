/**
 * MerchantLogoUpload Component
 * Allows merchants to upload/manage their shop logo
 * 
 * Phase: B.5 - Upload Component
 * Created: October 18, 2025, 5:32 PM
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { MerchantLogo } from './MerchantLogo';
import { apiClient } from '@/services/apiClient';
import toast from 'react-hot-toast';

export interface MerchantLogoUploadProps {
  /** Shop ID */
  shopId: string;
  
  /** Shop name */
  shopName: string;
  
  /** Current logo URL */
  currentLogoUrl?: string | null;
  
  /** Callback when upload succeeds */
  onUploadSuccess?: (logoUrl: string) => void;
  
  /** Callback when delete succeeds */
  onDeleteSuccess?: () => void;
  
  /** Max file size in MB */
  maxSizeMB?: number;
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
const DEFAULT_MAX_SIZE_MB = 2;

export const MerchantLogoUpload: React.FC<MerchantLogoUploadProps> = ({
  shopId,
  shopName,
  currentLogoUrl,
  onUploadSuccess,
  onDeleteSuccess,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
}) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(currentLogoUrl || null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Validate file
   */
  const validateFile = (file: File): string | null => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Invalid file type. Allowed: PNG, JPG, JPEG, SVG`;
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${maxSizeMB}MB limit`;
    }

    return null;
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    await uploadFile(file);
  }, [shopId]);

  /**
   * Upload file to server
   */
  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('shop_id', shopId);

      // Simulate progress (since we can't track actual upload progress easily)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Upload
      const response = await apiClient.post('/merchant/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.data.success) {
        const newLogoUrl = response.data.data.logo_url;
        setLogoUrl(newLogoUrl);
        setPreviewUrl(null);
        toast.success('Logo uploaded successfully!');
        onUploadSuccess?.(newLogoUrl);
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Upload failed';
      setError(errorMessage);
      toast.error(errorMessage);
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  /**
   * Handle file input change
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Handle drag events
   */
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  /**
   * Handle drop
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Handle delete logo
   */
  const handleDelete = async () => {
    try {
      const response = await apiClient.delete(`/merchant/logo?shop_id=${shopId}`);

      if (response.data.success) {
        setLogoUrl(null);
        setDeleteDialogOpen(false);
        toast.success('Logo deleted successfully');
        onDeleteSuccess?.();
      } else {
        throw new Error(response.data.error || 'Delete failed');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Delete failed';
      toast.error(errorMessage);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Shop Logo
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Upload your shop logo. It will be visible to couriers and administrators.
        </Typography>

        {/* Current Logo or Upload Area */}
        <Box sx={{ mb: 2 }}>
          {logoUrl ? (
            // Show current logo
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <MerchantLogo
                shopId={shopId}
                shopName={shopName}
                logoUrl={logoUrl}
                size="xlarge"
                variant="rounded"
              />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Current Logo
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    Replace
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={uploading}
                  >
                    Delete
                  </Button>
                </Box>
              </Box>
            </Box>
          ) : (
            // Show upload area
            <Box
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              sx={{
                border: '2px dashed',
                borderColor: dragActive ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                bgcolor: dragActive ? 'action.hover' : 'background.paper',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                },
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <Box>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{
                      maxWidth: '200px',
                      maxHeight: '200px',
                      objectFit: 'contain',
                    }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Uploading...
                  </Typography>
                </Box>
              ) : (
                <>
                  <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Drag & drop your logo here
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    or click to browse
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    PNG, JPG, JPEG, SVG • Max {maxSizeMB}MB • Recommended: 400x400px
                  </Typography>
                </>
              )}
            </Box>
          )}
        </Box>

        {/* Upload Progress */}
        {uploading && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Uploading... {uploadProgress}%
            </Typography>
          </Box>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* File Input (Hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
          disabled={uploading}
        />

        {/* Guidelines */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Logo Guidelines:
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2, m: 0 }}>
            <li>Use a square image (400x400px recommended)</li>
            <li>Ensure good contrast and readability</li>
            <li>Avoid text-heavy logos</li>
            <li>Use transparent background (PNG) for best results</li>
          </Typography>
        </Box>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Logo?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete your shop logo? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default MerchantLogoUpload;
