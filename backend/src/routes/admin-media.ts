import { Router, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import pool from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { validateImage } from '../utils/imageValidation';
import { storageService } from '../utils/storage';

const router = Router();

// Store files in memory so we can validate before touching the disk.
const upload = multer({ storage: multer.memoryStorage() });

// Protect all media administrative routes
router.use(requireAuth);

/**
 * GET /api/admin/media
 * Returns a paginated list of media with search support.
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
    const limit = 40;
    const offset = (page - 1) * limit;
    const search = req.query.search as string || '';

    let whereClause = '';
    const params: any[] = [limit, offset];

    if (search.trim() !== '') {
      whereClause = 'WHERE original_name ILIKE $3 OR alt_text ILIKE $3';
      params.push(`%${search.trim()}%`);
    }

    // Count total rows matching search
    const countResult = await pool.query(
      `SELECT count(*) FROM media ${whereClause}`,
      search.trim() !== '' ? [params[2]] : []
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Fetch matching rows
    const result = await pool.query(
      `
      SELECT id, storage_key, original_name, mime_type, size_bytes, width, height, checksum, alt_text, caption, created_at
      FROM media
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
      `,
      params
    );

    res.json({
      media: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/media
 * Accepts single file upload. Validates, checks for deduplication, and saves.
 */
router.post('/', upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    const originalName = req.file.originalname;
    
    // 1. Validate Image (Magic Bytes, Dimensions, Size)
    let validation;
    try {
      validation = validateImage(req.file.buffer);
    } catch (validationError: any) {
      res.status(400).json({ error: validationError.message || 'Invalid image' });
      return;
    }

    // 2. Generate Checksum
    const checksum = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

    // 3. Deduplication Check
    const existing = await pool.query('SELECT * FROM media WHERE checksum = $1', [checksum]);
    if (existing.rows.length > 0) {
      // Return existing record (Deduplication)
      res.status(200).json({ 
        message: 'File already exists', 
        media: existing.rows[0] 
      });
      return;
    }

    // 4. Save to Disk
    // Generate unique file name to avoid physical overwrite
    const uniqueFileName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${validation.ext}`;
    const storageKey = await storageService.upload(req.file.buffer, uniqueFileName);

    // 5. Save to Database (Atomic behavior)
    try {
      const result = await pool.query(
        `
        INSERT INTO media 
          (storage_key, original_name, mime_type, size_bytes, width, height, checksum, alt_text, caption)
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7, '', '')
        RETURNING *
        `,
        [
          storageKey, 
          originalName, 
          validation.mimeType, 
          validation.sizeBytes, 
          validation.width, 
          validation.height, 
          checksum
        ]
      );
      
      res.status(201).json({ message: 'Upload successful', media: result.rows[0] });
    } catch (dbError) {
      console.error('Database connection failed during upload. Cleaning up file.', dbError);
      
      // Cleanup the orphaned physical file
      await storageService.remove(storageKey);
      
      res.status(500).json({ error: 'Database error. Upload rolled back.' });
    }
  } catch (error) {
    console.error('Crash during media upload:', error);
    res.status(500).json({ error: 'Internal server error during upload.' });
  }
});

/**
 * POST /api/admin/media/url
 * Fetches an image from a URL, validates it, and saves it to the media library.
 */
router.post('/url', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    // Fetch the image from URL
    let fetchResponse;
    try {
      fetchResponse = await fetch(url);
      if (!fetchResponse.ok) {
        throw new Error(`Failed to fetch: ${fetchResponse.statusText}`);
      }
    } catch (fetchErr: any) {
      res.status(400).json({ error: fetchErr.message || 'Failed to download image from the provided URL' });
      return;
    }

    const arrayBuffer = await fetchResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract a filename from the URL, or use a fallback
    let originalName = url.split('/').pop()?.split('?')[0] || 'url-upload.jpg';
    if (!originalName.includes('.')) {
      originalName += '.jpg';
    }

    // 1. Validate Image (Magic Bytes, Dimensions, Size)
    let validation;
    try {
      validation = validateImage(buffer);
    } catch (validationError: any) {
      res.status(400).json({ error: validationError.message || 'Invalid image' });
      return;
    }

    // 2. Generate Checksum
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    // 3. Deduplication Check
    const existing = await pool.query('SELECT * FROM media WHERE checksum = $1', [checksum]);
    if (existing.rows.length > 0) {
      res.status(200).json({ 
        message: 'File already exists', 
        media: existing.rows[0] 
      });
      return;
    }

    // 4. Save to Disk
    const uniqueFileName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${validation.ext}`;
    const storageKey = await storageService.upload(buffer, uniqueFileName);

    // 5. Save to Database
    try {
      const result = await pool.query(
        `
        INSERT INTO media 
          (storage_key, original_name, mime_type, size_bytes, width, height, checksum, alt_text, caption)
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7, '', '')
        RETURNING *
        `,
        [
          storageKey, 
          originalName, 
          validation.mimeType, 
          validation.sizeBytes, 
          validation.width, 
          validation.height, 
          checksum
        ]
      );
      
      res.status(201).json({ message: 'Upload successful', media: result.rows[0] });
    } catch (dbError) {
      console.error('Database connection failed during upload. Cleaning up file.', dbError);
      await storageService.remove(storageKey);
      res.status(500).json({ error: 'Database error. Upload rolled back.' });
    }
  } catch (error) {
    console.error('Crash during media upload from URL:', error);
    res.status(500).json({ error: 'Internal server error during URL upload.' });
  }
});

/**
 * PATCH /api/admin/media/:id
 * Updates exclusively alt_text and caption.
 */
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { alt_text, caption } = req.body;

    // We allow either to be strings, but fall back to unchanged if undefined
    const existing = await pool.query('SELECT * FROM media WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Media not found' });
      return;
    }

    const currentAltText = alt_text !== undefined ? alt_text : existing.rows[0].alt_text;
    const currentCaption = caption !== undefined ? caption : existing.rows[0].caption;

    const result = await pool.query(
      `UPDATE media SET alt_text = $1, caption = $2 WHERE id = $3 RETURNING *`,
      [currentAltText, currentCaption, id]
    );

    res.json({ message: 'Media updated', media: result.rows[0] });
  } catch (error) {
    console.error('Error updating media:', error);
    res.status(500).json({ error: 'Internal server error while updating.' });
  }
});

/**
 * DELETE /api/admin/media/:id
 * Removes database record and underlying storage file.
 */
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Find the current record
    const existing = await pool.query('SELECT * FROM media WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Media not found' });
      return;
    }

    const mediaRecord = existing.rows[0];

    // Remove from physical storage first
    const deletedFile = await storageService.remove(mediaRecord.storage_key);

    // Even if storage deletion failed (e.g. file missing from disk manually),
    // we should still clean up the DB to avoid an orphaned DB state unless strictly strict.
    // We will proceed to delete from DB either way.
    
    await pool.query('DELETE FROM media WHERE id = $1', [id]);

    res.json({ message: 'Media deleted successfully', storageDeleted: deletedFile });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ error: 'Internal server error while deleting.' });
  }
});

export default router;