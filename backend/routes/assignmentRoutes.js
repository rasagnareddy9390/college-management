import express from 'express';
import { assignmentController } from '../controllers/assignmentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, assignmentController.getAssignments);
router.post('/create', authenticate, authorize('faculty', 'hod', 'super_admin', 'admin'), assignmentController.createAssignment);
router.post('/submit', authenticate, authorize('student'), assignmentController.submitAssignment);
router.post('/evaluate', authenticate, authorize('faculty', 'hod', 'super_admin', 'admin'), assignmentController.evaluateSubmission);

export default router;

