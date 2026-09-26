import express from 'express';
import { aiController } from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/chat', authenticate, aiController.chat);
router.get('/history', authenticate, aiController.getHistory);
router.post('/clear', authenticate, aiController.clearHistory);
router.post('/solve', authenticate, aiController.solve);
router.get('/study-plan', authenticate, aiController.getStudyPlan);

export default router;
