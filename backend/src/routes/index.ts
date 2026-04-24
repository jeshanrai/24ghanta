import { Router } from 'express';
import articlesRouter from './articles';
import videosRouter from './videos';
import categoriesRouter from './categories';
import pollsRouter from './polls';
import trendingRouter from './trending';
import newsletterRouter from './newsletter';
import contactRouter from './contact';
import authRouter from './auth';
import adminRouter from './admin';
import adminArticlesRouter from './admin-articles';
import adminCategoriesRouter from './admin-categories';
import adminTagsRouter from './admin-tags';
import adminVideosRouter from './admin-videos';
import adminAuthorsRouter from './admin-authors';
import adminTrendingRouter from './admin-trending';
import adminNewsletterRouter from './admin-newsletter';
import adminPollsRouter from './admin-polls';

const router = Router();

// Public routes
router.use('/articles', articlesRouter);
router.use('/videos', videosRouter);
router.use('/categories', categoriesRouter);
router.use('/polls', pollsRouter);
router.use('/trending', trendingRouter);
router.use('/newsletter', newsletterRouter);
router.use('/contact', contactRouter);
router.use('/auth', authRouter);

// Admin routes
router.use('/admin', adminRouter);
router.use('/admin/articles', adminArticlesRouter);
router.use('/admin/categories', adminCategoriesRouter);
router.use('/admin/tags', adminTagsRouter);
router.use('/admin/videos', adminVideosRouter);
router.use('/admin/authors', adminAuthorsRouter);
router.use('/admin/trending', adminTrendingRouter);
router.use('/admin/newsletter', adminNewsletterRouter);
router.use('/admin/polls', adminPollsRouter);

export default router;
