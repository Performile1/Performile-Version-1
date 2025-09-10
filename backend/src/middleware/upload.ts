import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// Configure storage for courier and store logos
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: Function) => {
    const uploadType = req.params.type || 'couriers'; // Default to couriers
    const uploadPath = path.join(process.cwd(), '..', 'uploads', uploadType, 'logos');
    cb(null, uploadPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb: Function) => {
    // Generate unique filename: entityId_timestamp.ext
    const entityId = req.params.id || 'temp';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${entityId}_${timestamp}${ext}`);
  }
});

// File filter for images only
const fileFilter = (req: Request, file: Express.Multer.File, cb: Function) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

// Configure multer with size limits and validation
export const logoUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 1 // Only one file at a time
  }
});

// Middleware for logo upload validation
export const validateLogoUpload = (req: Request, res: any, next: Function) => {
  logoUpload.single('logo')(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'File too large. Maximum size is 5MB.'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          error: 'Too many files. Only one logo can be uploaded at a time.'
        });
      }
      return res.status(400).json({
        error: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        error: err.message
      });
    }
    
    // Validate image dimensions if file was uploaded
    if (req.file) {
      // Note: For production, you might want to use sharp or jimp to validate/resize images
      // For now, we'll accept the upload and recommend 160x160 in the API docs
      req.body.logo_url = `/uploads/${req.params.type || 'couriers'}/logos/${req.file.filename}`;
    }
    
    next();
  });
};

// Helper function to delete old logo file
export const deleteOldLogo = (logoUrl: string): void => {
  if (logoUrl && logoUrl.startsWith('/uploads/')) {
    const fs = require('fs');
    const filePath = path.join(process.cwd(), '..', logoUrl);
    
    fs.unlink(filePath, (err: any) => {
      if (err && err.code !== 'ENOENT') {
        console.error('Error deleting old logo:', err);
      }
    });
  }
};
