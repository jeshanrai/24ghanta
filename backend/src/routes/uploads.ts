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

// POST /api/uploads/image — admin/author auth required.
// Accepts multiple image types, sniffs magic bytes, returns { url, filename, size }.
router.post('/image', uploadLimiter, requireAuth, (req: Request, res: Response) => {
  upload.single('file')(req, res, (err) => {
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
    const filename = `${stamp}-${rand}.${validation.ext}`;
    const dest = path.join(UPLOAD_DIR, filename);

    try {
      fs.writeFileSync(dest, req.file.buffer);
    } catch (writeErr) {
      // eslint-disable-next-line no-console
      console.error('Upload write failed:', writeErr);
      return res.status(500).json({ error: 'Failed to persist upload' });
    }

    const relPath = `/uploads/${filename}`;
    res.json({ data: { url: relPath, filename, size: req.file.size } });
  });
});

export default router;
