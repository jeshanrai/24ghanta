import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth';

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
  cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

import { validateImage } from '../utils/imageValidation';

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
      const msg = err instanceof Error ? err.message : 'Upload failed';
      return res.status(400).json({ error: msg });
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

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
      // The validator already caps GIFs at 1920 px / 8 MB, so the original is
      // safe to ship to clients directly.
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
