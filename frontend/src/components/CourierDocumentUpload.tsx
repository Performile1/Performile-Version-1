import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  IconButton,
  LinearProgress,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Visibility,
  Business,
  Description,
  Security,
  VerifiedUser
} from '@mui/icons-material';
import { apiClient } from '../services/apiClient';
import toast from 'react-hot-toast';

interface Document {
  document_id: string;
  courier_id: string;
  document_type: 'logo' | 'license' | 'insurance' | 'certification';
  file_url: string;
  file_name: string;
  mime_type: string;
  uploaded_at: string;
}

interface CourierDocumentUploadProps {
  courierId?: string;
  onDocumentChange?: () => void;
  readOnly?: boolean;
}

const documentTypeConfig = {
  logo: {
    label: 'Company Logo',
    icon: <Business />,
    color: 'primary' as const,
    accept: 'image/*',
    description: 'Upload your company logo (JPG, PNG, GIF, WebP)',
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  license: {
    label: 'Business License',
    icon: <Description />,
    color: 'info' as const,
    accept: 'image/*,application/pdf',
    description: 'Upload business license document',
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  insurance: {
    label: 'Insurance Certificate',
    icon: <Security />,
    color: 'warning' as const,
    accept: 'image/*,application/pdf',
    description: 'Upload insurance certificate',
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  certification: {
    label: 'Certifications',
    icon: <VerifiedUser />,
    color: 'success' as const,
    accept: 'image/*,application/pdf',
    description: 'Upload professional certifications',
    maxSize: 10 * 1024 * 1024 // 10MB
  }
};

const CourierDocumentUpload: React.FC<CourierDocumentUploadProps> = ({
  courierId,
  onDocumentChange,
  readOnly = false
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  // Load documents
  const loadDocuments = useCallback(async () => {
    try {
      const response = await apiClient.get(`/upload${courierId ? `?courierId=${courierId}` : ''}`);
      if (response.data.success) {
        setDocuments(response.data.documents);
      }
    } catch (error: any) {
      console.error('Failed to load documents:', error);
      if (!readOnly) {
        toast.error('Failed to load documents');
      }
    }
  }, [courierId, readOnly]);

  React.useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Handle file upload with direct Vercel Blob integration
  const handleFileUpload = async (documentType: keyof typeof documentTypeConfig, file: File) => {
    if (!file || readOnly) return;

    const config = documentTypeConfig[documentType];

    // Validate file size
    if (file.size > config.maxSize) {
      toast.error(`File size must be less than ${Math.round(config.maxSize / (1024 * 1024))}MB`);
      return;
    }

    try {
      setUploadProgress(prev => ({ ...prev, [documentType]: 0 }));

      // Step 1: Get upload URL from our API
      const uploadResponse = await apiClient.post('/upload', {
        filename: file.name,
        fileType: file.type,
        documentType,
        courierId
      });

      if (!uploadResponse.data.success) {
        throw new Error(uploadResponse.data.message);
      }

      const { uploadUrl } = uploadResponse.data.data;

      // Step 2: Upload directly to Vercel Blob
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(prev => ({ ...prev, [documentType]: progress }));
        }
      });

      xhr.addEventListener('load', () => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[documentType];
          return newProgress;
        });

        if (xhr.status === 200 || xhr.status === 201) {
          toast.success(`${config.label} uploaded successfully`);
          loadDocuments();
          onDocumentChange?.();
        } else {
          toast.error('Upload failed');
        }
      });

      xhr.addEventListener('error', () => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[documentType];
          return newProgress;
        });
        toast.error('Upload failed');
      });

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Upload failed');
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[documentType];
        return newProgress;
      });
    }
  };

  // Handle file deletion
  const handleDeleteDocument = async (document: Document) => {
    if (readOnly) return;

    if (!window.confirm(`Are you sure you want to delete ${document.file_name}?`)) {
      return;
    }

    try {
      const response = await apiClient.delete('/upload', {
        data: { documentId: document.document_id }
      });

      if (response.data.success) {
        toast.success('Document deleted successfully');
        loadDocuments();
        onDocumentChange?.();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete document');
    }
  };

  // Get documents by type
  const getDocumentsByType = (type: keyof typeof documentTypeConfig) => {
    return documents.filter(doc => doc.document_type === type);
  };

  // Handle file input change
  const handleFileInputChange = (documentType: keyof typeof documentTypeConfig, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(documentType, file);
    }
    // Reset input value to allow re-uploading same file
    event.target.value = '';
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {readOnly ? 'Documents' : 'Document Management'}
      </Typography>
      
      <Grid container spacing={2}>
        {Object.entries(documentTypeConfig).map(([type, config]) => {
          const typeDocuments = getDocumentsByType(type as keyof typeof documentTypeConfig);
          const isUploading = uploadProgress[type] !== undefined;
          const hasDocument = typeDocuments.length > 0;
          
          return (
            <Grid item xs={12} sm={6} key={type}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    {config.icon}
                    <Typography variant="subtitle1">{config.label}</Typography>
                    {hasDocument && <VerifiedUser color="success" fontSize="small" />}
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {config.description}
                  </Typography>

                  {isUploading && (
                    <Box mb={2}>
                      <LinearProgress 
                        variant="determinate" 
                        value={uploadProgress[type]} 
                      />
                      <Typography variant="caption" color="text.secondary">
                        Uploading... {uploadProgress[type]}%
                      </Typography>
                    </Box>
                  )}

                  {!readOnly && (
                    <>
                      <input
                        type="file"
                        id={`upload-${type}`}
                        style={{ display: 'none' }}
                        accept={config.accept}
                        onChange={(e) => handleFileInputChange(type as keyof typeof documentTypeConfig, e)}
                      />
                      <Button
                        variant="outlined"
                        startIcon={<CloudUpload />}
                        onClick={() => document.getElementById(`upload-${type}`)?.click()}
                        disabled={isUploading}
                        fullWidth
                        size="small"
                        sx={{ mb: 2 }}
                      >
                        {hasDocument ? 'Replace' : 'Upload'} {config.label}
                      </Button>
                    </>
                  )}

                  {typeDocuments.length > 0 && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <List dense>
                        {typeDocuments.map((document) => (
                          <ListItem key={document.document_id} sx={{ px: 0 }}>
                            <ListItemAvatar>
                              <Avatar sx={{ width: 32, height: 32 }}>
                                {document.mime_type.startsWith('image/') ? (
                                  <Description fontSize="small" />
                                ) : (
                                  <Description fontSize="small" />
                                )}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={document.file_name}
                              secondary={new Date(document.uploaded_at).toLocaleDateString()}
                              primaryTypographyProps={{ variant: 'body2' }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                onClick={() => window.open(document.file_url, '_blank')}
                                size="small"
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                              {!readOnly && (
                                <IconButton
                                  edge="end"
                                  onClick={() => handleDeleteDocument(document)}
                                  size="small"
                                  color="error"
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              )}
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {readOnly && documents.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No documents have been uploaded yet.
        </Alert>
      )}
    </Box>
  );
};

export default CourierDocumentUpload;
