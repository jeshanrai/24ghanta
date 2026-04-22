import { Router } from 'express';
import articlesRouter from './articles';
import videosRouter from './videos';
import categoriesRouter from './categories';
import pollsRouter from './polls';

const router = Router();

router.use('/articles', articlesRouter);
router.use('/videos', videosRouter);
router.use('/categories', categoriesRouter);
router.use('/polls', pollsRouter);

export default router;
