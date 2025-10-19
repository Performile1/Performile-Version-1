/**
 * Merchant Logo Upload API
 * Handles upload, retrieval, and deletion of merchant logos
 * 
 * Phase: B.3 - Backend API
 * Created: October 18, 2025, 5:25 PM
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configuration
const CONFIG = {
  MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB
  ALLOWED_MIME_TYPES: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'],
  BUCKET_NAME: 'merchant-logos',
  IMAGE_SIZE: 400, // Resize to 400x400
  QUALITY: 90,
};

/**
 * Verify JWT token and get user
 */
async function verifyAuth(req: VercelRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Invalid or expired token');
  }

  return user;
}

/**
 * Verify user owns the shop
 */
async function verifyShopOwnership(userId: string, shopId: string) {
  const { data: store, error } = await supabase
    .from('stores')
    .select('shop_id, merchant_id')
    .eq('shop_id', shopId)
    .single();

  if (error || !store) {
    throw new Error('Shop not found');
  }

  if (store.merchant_id !== userId) {
    throw new Error('Unauthorized: You do not own this shop');
  }

  return store;
}

/**
 * Parse multipart form data
 */
function parseForm(req: VercelRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: CONFIG.MAX_FILE_SIZE,
      keepExtensions: true,
    });

    form.parse(req, (err: Error | null, fields: formidable.Fields, files: formidable.Files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

/**
 * Validate file
 */
function validateFile(file: formidable.File) {
  // Check file size
  if (file.size > CONFIG.MAX_FILE_SIZE) {
    throw new Error(`File size exceeds ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB limit`);
  }

  // Check MIME type
  if (!CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype || '')) {
    throw new Error(`Invalid file type. Allowed: ${CONFIG.ALLOWED_MIME_TYPES.join(', ')}`);
  }

  return true;
}

/**
 * Process and optimize image
 */
async function processImage(filePath: string, mimeType: string): Promise<Buffer> {
  // Skip processing for SVG
  if (mimeType === 'image/svg+xml') {
    return fs.readFileSync(filePath);
  }

  // Resize and optimize image
  return await sharp(filePath)
    .resize(CONFIG.IMAGE_SIZE, CONFIG.IMAGE_SIZE, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: CONFIG.QUALITY })
    .toBuffer();
}

/**
 * Upload file to Supabase Storage
 */
async function uploadToStorage(
  shopId: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const extension = mimeType.split('/')[1];
  const fileName = `logo.${extension}`;
  const filePath = `${shopId}/${fileName}`;

  // Delete existing logo if any
  const { data: existingFiles } = await supabase.storage
    .from(CONFIG.BUCKET_NAME)
    .list(shopId);

  if (existingFiles && existingFiles.length > 0) {
    const filesToDelete = existingFiles.map(file => `${shopId}/${file.name}`);
    await supabase.storage
      .from(CONFIG.BUCKET_NAME)
      .remove(filesToDelete);
  }

  // Upload new logo
  const { data, error } = await supabase.storage
    .from(CONFIG.BUCKET_NAME)
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(CONFIG.BUCKET_NAME)
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Update store with logo URL
 */
async function updateStoreLogo(shopId: string, logoUrl: string) {
  const { error } = await supabase
    .from('stores')
    .update({
      logo_url: logoUrl,
      logo_updated_at: new Date().toISOString(),
    })
    .eq('shop_id', shopId);

  if (error) {
    throw new Error(`Failed to update store: ${error.message}`);
  }
}

/**
 * Main handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Verify authentication
    const user = await verifyAuth(req);

    // Route handling
    switch (req.method) {
      case 'POST':
        return await handleUpload(req, res, user);
      case 'GET':
        return await handleGet(req, res, user);
      case 'DELETE':
        return await handleDelete(req, res, user);
      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed',
        });
    }
  } catch (error: any) {
    console.error('Logo API Error:', error);
    return res.status(error.message.includes('Unauthorized') ? 403 : 400).json({
      success: false,
      error: error.message || 'An error occurred',
    });
  }
}

/**
 * Handle logo upload
 */
async function handleUpload(req: VercelRequest, res: VercelResponse, user: any) {
  try {
    // Parse form data
    const { fields, files } = await parseForm(req);

    // Get shop_id
    const shopId = Array.isArray(fields.shop_id) ? fields.shop_id[0] : fields.shop_id;
    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'shop_id is required',
      });
    }

    // Verify ownership
    await verifyShopOwnership(user.id, shopId);

    // Get file
    const fileArray = Array.isArray(files.file) ? files.file : [files.file];
    const file = fileArray[0];
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    // Validate file
    validateFile(file);

    // Process image
    const buffer = await processImage(file.filepath, file.mimetype || '');

    // Upload to storage
    const logoUrl = await uploadToStorage(shopId, buffer, file.mimetype || '');

    // Update store
    await updateStoreLogo(shopId, logoUrl);

    // Clean up temp file
    fs.unlinkSync(file.filepath);

    return res.status(200).json({
      success: true,
      data: {
        logo_url: logoUrl,
        file_name: file.originalFilename,
        file_size: file.size,
        uploaded_at: new Date().toISOString(),
      },
      message: 'Logo uploaded successfully',
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Upload failed',
    });
  }
}

/**
 * Handle get logo
 */
async function handleGet(req: VercelRequest, res: VercelResponse, user: any) {
  try {
    const shopId = req.query.shop_id as string;
    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'shop_id is required',
      });
    }

    // Get store logo
    const { data: store, error } = await supabase
      .from('stores')
      .select('logo_url, logo_updated_at')
      .eq('shop_id', shopId)
      .single();

    if (error) {
      throw new Error('Shop not found');
    }

    return res.status(200).json({
      success: true,
      data: {
        logo_url: store.logo_url,
        logo_updated_at: store.logo_updated_at,
      },
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to get logo',
    });
  }
}

/**
 * Handle delete logo
 */
async function handleDelete(req: VercelRequest, res: VercelResponse, user: any) {
  try {
    const shopId = req.query.shop_id as string;
    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'shop_id is required',
      });
    }

    // Verify ownership
    await verifyShopOwnership(user.id, shopId);

    // Delete from storage
    const { data: files } = await supabase.storage
      .from(CONFIG.BUCKET_NAME)
      .list(shopId);

    if (files && files.length > 0) {
      const filesToDelete = files.map(file => `${shopId}/${file.name}`);
      await supabase.storage
        .from(CONFIG.BUCKET_NAME)
        .remove(filesToDelete);
    }

    // Update store
    const { error } = await supabase
      .from('stores')
      .update({
        logo_url: null,
        logo_updated_at: new Date().toISOString(),
      })
      .eq('shop_id', shopId);

    if (error) {
      throw new Error('Failed to update store');
    }

    return res.status(200).json({
      success: true,
      message: 'Logo deleted successfully',
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to delete logo',
    });
  }
}
