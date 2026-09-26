import express from 'express';
import { attendanceController } from '../controllers/attendanceController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/mark', authenticate, authorize('faculty', 'hod', 'super_admin', 'admin'), attendanceController.markAttendance);
router.get('/student/:studentId', authenticate, attendanceController.getStudentAttendance);
router.get('/my', authenticate, attendanceController.getStudentAttendance);
router.get('/student-breakdown', authenticate, attendanceController.getStudentAttendance);
router.get('/calculator', attendanceController.whatIfCalculator);
router.get('/defaulters', authenticate, attendanceController.getDefaulters);
router.post('/import-excel', authenticate, upload.single('file'), attendanceController.importAttendanceExcel);
router.get('/export-excel', authenticate, attendanceController.exportAttendanceExcel);

export default router;

