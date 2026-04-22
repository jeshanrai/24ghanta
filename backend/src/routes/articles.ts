import { Router, Request, Response } from 'express';
import {
  getFeaturedArticle,
  getLatestArticles,
  getArticlesByCategory,
  getArticleBySlug,
  getRelatedArticles,
  getAllArticleSlugs,
} from '../data';

const router = Router();

// GET /api/articles — list articles with optional filters
router.get('/', (req: Request, res: Response) => {
  const { category, limit } = req.query;
  const parsedLimit = limit ? parseInt(limit as string, 10) : 10;

  if (category) {
    const articles = getArticlesByCategory(category as string, parsedLimit);
    return res.json({ data: articles, total: articles.length });
  }

  const articles = getLatestArticles(parsedLimit);
  res.json({ data: articles, total: articles.length });
});

// GET /api/articles/featured
router.get('/featured', (_req: Request, res: Response) => {
  const article = getFeaturedArticle();
  res.json({ data: article });
});

// GET /api/articles/slugs — all article slugs (for SSG)
router.get('/slugs', (_req: Request, res: Response) => {
  const slugs = getAllArticleSlugs();
  res.json({ data: slugs });
});

// GET /api/articles/:slug
router.get('/:slug', (req: Request, res: Response) => {
  const article = getArticleBySlug(req.params.slug);
  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }
  res.json({ data: article });
});

// GET /api/articles/:slug/related
router.get('/:slug/related', (req: Request, res: Response) => {
  const article = getArticleBySlug(req.params.slug);
  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 3;
  const related = getRelatedArticles(article.id, limit);
  res.json({ data: related });
});

export default router;
