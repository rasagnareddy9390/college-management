import express from 'express';
import { announcementController } from '../controllers/announcementController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

const adminOnly = [authenticate, authorize('super_admin', 'college_admin', 'admin')];

// Announcements endpoints
router.get('/', authenticate, announcementController.getAnnouncements);
router.post('/', ...adminOnly, announcementController.createAnnouncement);
router.delete('/:id', ...adminOnly, announcementController.deleteAnnouncement);

// Exam Countdown & Exam Scheduling
router.get('/upcoming-exam', authenticate, announcementController.getUpcomingExamCountdown);
router.post('/exams', ...adminOnly, announcementController.createUpcomingExam);

// Unified Academic Calendar
router.get('/calendar', authenticate, announcementController.getCalendarEvents);

export default router;

