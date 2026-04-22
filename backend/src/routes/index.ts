import { Router } from 'express';
import articlesRouter from './articles';
import videosRouter from './videos';
import categoriesRouter from './categories';
import pollsRouter from './polls';
import adminRouter from './admin';

const router = Router();

router.use('/articles', articlesRouter);
router.use('/videos', videosRouter);
router.use('/categories', categoriesRouter);
router.use('/polls', pollsRouter);
router.use('/admin', adminRouter);

export default router;
