import { Router, Request, Response } from 'express';
import { categories, getCategoryBySlug, getAllCategorySlugs } from '../data';

const router = Router();

// GET /api/categories
router.get('/', (_req: Request, res: Response) => {
  res.json({ data: categories });
});

// GET /api/categories/:slug
router.get('/:slug', (req: Request, res: Response) => {
  const category = getCategoryBySlug(req.params.slug);
  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }
  res.json({ data: category });
});

export default router;
