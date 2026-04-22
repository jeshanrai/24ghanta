import { Router, Request, Response } from 'express';
import { getPolls, getActivePoll, getPollById } from '../data';

const router = Router();

// GET /api/polls
router.get('/', (_req: Request, res: Response) => {
  const polls = getPolls();
  res.json({ data: polls });
});

// GET /api/polls/active
router.get('/active', (_req: Request, res: Response) => {
  const poll = getActivePoll();
  if (!poll) {
    return res.status(404).json({ error: 'No active poll found' });
  }
  res.json({ data: poll });
});

// GET /api/polls/:id
router.get('/:id', (req: Request, res: Response) => {
  const poll = getPollById(req.params.id);
  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }
  res.json({ data: poll });
});

export default router;
