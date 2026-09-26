import express from 'express';
import { examController } from '../controllers/examController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, examController.getExams);
router.get('/hall-ticket', authenticate, examController.getHallTicket);
router.get('/hall-ticket/pdf', authenticate, examController.downloadHallTicketPDF);

export default router;

