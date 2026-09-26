import express from 'express';
import { calendarController } from '../controllers/calendarController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/holidays', calendarController.getHolidays);
router.get('/events', calendarController.getAcademicCalendar);
router.post('/holidays', authenticate, authorize('admin', 'super_admin', 'principal'), calendarController.createHoliday);

export default router;

