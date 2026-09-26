import express from 'express';
import { academicController } from '../controllers/academicController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/departments', academicController.getDepartments);
router.post('/departments', authenticate, authorize('super_admin', 'college_admin', 'admin'), academicController.createDepartment);

router.get('/courses', academicController.getCourses);
router.get('/subjects', academicController.getSubjects);
router.post('/subjects', authenticate, authorize('super_admin', 'college_admin', 'admin', 'hod'), academicController.createSubject);

router.get('/sections', academicController.getSections);

export default router;

