import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth';
import { validateImage, MAX_FILE_SIZE, ALLOWED_TYPES } from '../utils/imageValidation';

const router = Router();

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Buffer in memory so we can verify the actual file content (magic bytes)
// before persisting to disk — protects against renamed-extension uploads.
const storage = multer.memoryStorage();

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowedMime = ['image/webp', 'image/jpeg', 'image/png', 'image/gif'];
  if (allowedMime.includes(file.mimetype)) return cb(null, true);
  cb(new Error(
    `Unsupported file type "${file.mimetype || 'unknown'}". Only ${ALLOWED_TYPES.join(', ')} images are accepted.`
  ));
}

// Give multer a slightly larger ceiling than the validator so oversized uploads
// reach validateImage() and get the descriptive size-limit message instead of
// multer's generic "File too large". The 1 MB cushion is small enough that we
// still reject obviously abusive payloads at the stream layer.
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE + 1024 * 1024, files: 1 },
});

// Translates multer's terse error codes into user-friendly messages.
function describeMulterError(err: unknown): string {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return `Image is too large. Maximum allowed size is ${Math.round(MAX_FILE_SIZE / (1024 * 1024))} MB.`;
      case 'LIMIT_FILE_COUNT':
      case 'LIMIT_UNEXPECTED_FILE':
        return 'Only one image can be uploaded at a time.';
      case 'LIMIT_PART_COUNT':
      case 'LIMIT_FIELD_KEY':
      case 'LIMIT_FIELD_VALUE':
      case 'LIMIT_FIELD_COUNT':
        return 'The upload request is malformed. Please try again.';
      default:
        return err.message || 'Upload failed.';
    }
  }
  if (err instanceof Error) return err.message;
  return 'Upload failed.';
}

// Tight per-IP limiter: prevents disk-fill / abuse even with valid auth.
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many uploads, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

import sharp from 'sharp';

// POST /api/uploads/image — admin/author auth required.
// Accepts multiple image types, sniffs magic bytes, returns { url, filename, size }.
router.post('/image', uploadLimiter, requireAuth, (req: Request, res: Response) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: describeMulterError(err) });
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded. Please select an image to upload.' });

    let validation;
    try {
      validation = validateImage(req.file.buffer);
    } catch (validationErr: any) {
      return res.status(400).json({ error: validationErr.message || 'Invalid image' });
    }

    const stamp = Date.now().toString(36);
    const rand = crypto.randomBytes(6).toString('hex');

    try {
      let finalFilename: string;
      let finalBuffer: Buffer;

      // ── Image resizing pipeline ──────────────────────────────────────────
      // Resize images wider than 1920px (maintaining aspect ratio) and convert
      // to WebP for better compression and CDN performance. If Sharp fails for
      // any reason (corrupt image, unsupported format), we fall back to storing
      // the original so uploads are never blocked.
      //
      // GIFs are stored as-is — Sharp's default reader only decodes the first
      // frame, so resizing or re-encoding would silently strip the animation.
      // The validator already enforces file-size and dimension limits, so the
      // original is safe to ship to clients directly.
      if (validation.ext === 'gif') {
        finalFilename = `${stamp}-${rand}.gif`;
        finalBuffer = req.file.buffer;
      } else {
        try {
          finalBuffer = await sharp(req.file.buffer)
            .resize({ width: 1920, withoutEnlargement: true, fit: 'inside' })
            .webp({ quality: 82, effort: 4 })
            .toBuffer();
          finalFilename = `${stamp}-${rand}.webp`;
        } catch (sharpErr) {
          // eslint-disable-next-line no-console
          console.warn('Sharp processing failed, storing original:', sharpErr);
          finalFilename = `${stamp}-${rand}.${validation.ext}`;
          finalBuffer = req.file.buffer;
        }
      }

      fs.writeFileSync(path.join(UPLOAD_DIR, finalFilename), finalBuffer);

      const relPath = `/uploads/${finalFilename}`;
      res.json({ data: { url: relPath, filename: finalFilename, size: finalBuffer.length } });
    } catch (processErr) {
      // eslint-disable-next-line no-console
      console.error('Image processing failed:', processErr);
      return res.status(500).json({ error: 'Failed to process and save image' });
    }
  });
});

export default router;
