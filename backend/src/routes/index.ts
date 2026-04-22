import { Router } from 'express';
import articlesRouter from './articles';
import videosRouter from './videos';
import categoriesRouter from './categories';
import pollsRouter from './polls';
import adminRouter from './admin';
import adminArticlesRouter from './admin-articles';
import adminCategoriesRouter from './admin-categories';
import adminTagsRouter from './admin-tags';
import adminVideosRouter from './admin-videos';
import adminAuthorsRouter from './admin-authors';

const router = Router();

// Public routes
router.use('/articles', articlesRouter);
router.use('/videos', videosRouter);
router.use('/categories', categoriesRouter);
router.use('/polls', pollsRouter);

// Admin routes
router.use('/admin', adminRouter);
router.use('/admin/articles', adminArticlesRouter);
router.use('/admin/categories', adminCategoriesRouter);
router.use('/admin/tags', adminTagsRouter);
router.use('/admin/videos', adminVideosRouter);
router.use('/admin/authors', adminAuthorsRouter);

export default router;
