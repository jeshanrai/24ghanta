import { Router, Request, Response } from 'express';
import { getLatestVideos, getShortStories } from '../data';

const router = Router();

// GET /api/videos — list videos
router.get('/', (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 8;
  const videos = getLatestVideos(limit);
  res.json({ data: videos, total: videos.length });
});

// GET /api/videos/shorts — short story videos
router.get('/shorts', (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
  const shorts = getShortStories(limit);
  res.json({ data: shorts, total: shorts.length });
});

export default router;
