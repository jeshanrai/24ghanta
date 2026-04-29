import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { requireAuth } from '../middleware/auth';

const router = Router();

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.webp';
    const stamp = Date.now().toString(36);
    const rand = crypto.randomBytes(6).toString('hex');
    cb(null, `${stamp}-${rand}${ext}`);
  },
});

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const okMime = file.mimetype === 'image/webp';
  const okExt = path.extname(file.originalname).toLowerCase() === '.webp';
  if (okMime && okExt) return cb(null, true);
  cb(new Error('Only .webp images are allowed'));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// POST /api/uploads/image — admin/author auth required, returns { url, path }
router.post('/image', requireAuth, (req: Request, res: Response) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      return res.status(400).json({ error: msg });
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const relPath = `/uploads/${req.file.filename}`;
    res.json({ data: { url: relPath, filename: req.file.filename, size: req.file.size } });
  });
});

export default router;
