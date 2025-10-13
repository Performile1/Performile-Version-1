import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import database from '../config/database';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.use(authenticateToken);

/**
 * GET /api/upload
 * Get documents for user or courier
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const { courierId } = req.query;

    logger.info('[Upload] Get documents', { userId, courierId });

    let query = '';
    let params: any[] = [];

    if (courierId) {
      // Get documents for specific courier (admin or courier owner)
      query = `
        SELECT 
          d.document_id,
          d.courier_id,
          d.document_type,
          d.file_name,
          d.file_url,
          d.file_size,
          d.mime_type,
          d.status,
          d.uploaded_at,
          d.verified_at,
          d.verified_by,
          d.rejection_reason
        FROM courier_documents d
        WHERE d.courier_id = $1
        ORDER BY d.uploaded_at DESC
      `;
      params = [courierId];
    } else {
      // Get documents for current user's courier profile
      query = `
        SELECT 
          d.document_id,
          d.courier_id,
          d.document_type,
          d.file_name,
          d.file_url,
          d.file_size,
          d.mime_type,
          d.status,
          d.uploaded_at,
          d.verified_at,
          d.verified_by,
          d.rejection_reason
        FROM courier_documents d
        JOIN couriers c ON d.courier_id = c.courier_id
        WHERE c.user_id = $1
        ORDER BY d.uploaded_at DESC
      `;
      params = [userId];
    }

    const result = await database.query(query, params);

    res.json({
      success: true,
      documents: result.rows
    });
  } catch (error) {
    logger.error('[Upload] Get documents error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents'
    });
  }
});

/**
 * POST /api/upload
 * Create upload URL for document (S3 presigned URL or similar)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const { filename, fileType, documentType, courierId } = req.body;

    logger.info('[Upload] Create upload URL', { userId, filename, documentType });

    // Validate document type
    const validDocumentTypes = [
      'business_license',
      'insurance_certificate',
      'vehicle_registration',
      'driver_license',
      'tax_document',
      'other'
    ];

    if (!validDocumentTypes.includes(documentType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid document type'
      });
    }

    // Get courier_id
    let targetCourierId = courierId;
    if (!targetCourierId) {
      const courierResult = await database.query(
        'SELECT courier_id FROM couriers WHERE user_id = $1',
        [userId]
      );
      
      if (courierResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Courier profile not found'
        });
      }
      
      targetCourierId = courierResult.rows[0].courier_id;
    }

    // Generate unique file key
    const fileExtension = filename.split('.').pop();
    const fileKey = `courier-documents/${targetCourierId}/${documentType}/${uuidv4()}.${fileExtension}`;

    // In production, generate S3 presigned URL
    // For now, return mock upload URL
    const uploadUrl = process.env.S3_UPLOAD_URL || 
      `https://storage.performile.com/upload/${fileKey}`;

    // Create document record
    const documentResult = await database.query(
      `INSERT INTO courier_documents 
       (courier_id, document_type, file_name, file_url, mime_type, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING document_id, file_url`,
      [targetCourierId, documentType, filename, fileKey, fileType]
    );

    res.json({
      success: true,
      uploadUrl,
      documentId: documentResult.rows[0].document_id,
      fileUrl: documentResult.rows[0].file_url,
      message: 'Upload URL generated successfully'
    });
  } catch (error) {
    logger.error('[Upload] Create upload URL error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate upload URL'
    });
  }
});

/**
 * PUT /api/upload/:documentId
 * Update document status (after upload complete)
 */
router.put('/:documentId', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const { status, fileSize } = req.body;

    logger.info('[Upload] Update document', { documentId, status });

    await database.query(
      `UPDATE courier_documents 
       SET status = $1, 
           file_size = $2,
           uploaded_at = NOW()
       WHERE document_id = $3`,
      [status || 'uploaded', fileSize, documentId]
    );

    res.json({
      success: true,
      message: 'Document updated successfully'
    });
  } catch (error) {
    logger.error('[Upload] Update document error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update document'
    });
  }
});

/**
 * DELETE /api/upload
 * Delete document
 */
router.delete('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const userRole = (req as any).user?.user_role;
    const { documentId } = req.body;

    logger.info('[Upload] Delete document', { userId, documentId });

    // Check ownership
    if (userRole !== 'admin') {
      const ownerCheck = await database.query(
        `SELECT d.document_id 
         FROM courier_documents d
         JOIN couriers c ON d.courier_id = c.courier_id
         WHERE d.document_id = $1 AND c.user_id = $2`,
        [documentId, userId]
      );

      if (ownerCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    }

    // Delete document
    const result = await database.query(
      'DELETE FROM courier_documents WHERE document_id = $1 RETURNING *',
      [documentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // In production, also delete from S3
    // await deleteFromS3(result.rows[0].file_url);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    logger.error('[Upload] Delete document error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete document'
    });
  }
});

/**
 * POST /api/upload/:documentId/verify
 * Verify document (admin only)
 */
router.post('/:documentId/verify', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const userId = (req as any).user?.user_id;
    const { status, rejectionReason } = req.body;

    logger.info('[Upload] Verify document', { documentId, status });

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be verified or rejected'
      });
    }

    await database.query(
      `UPDATE courier_documents 
       SET status = $1, 
           verified_at = NOW(),
           verified_by = $2,
           rejection_reason = $3
       WHERE document_id = $4`,
      [status, userId, rejectionReason || null, documentId]
    );

    res.json({
      success: true,
      message: `Document ${status} successfully`
    });
  } catch (error) {
    logger.error('[Upload] Verify document error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify document'
    });
  }
});

export default router;
