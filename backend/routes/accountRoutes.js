import express from 'express';
import { accountController } from '../controllers/accountController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Only Admin / Super Admin / College Admin can perform Account Management
const adminOnly = [authenticate, authorize('super_admin', 'college_admin', 'admin')];

// Account Dashboard Statistics
router.get('/accounts/stats', ...adminOnly, accountController.getAccountStats);

// Student Account Management Endpoints
router.get('/students', ...adminOnly, accountController.getStudents);
router.post('/students', ...adminOnly, accountController.createStudent);
router.put('/students/:id', ...adminOnly, accountController.updateStudent);
router.patch('/students/:id/status', ...adminOnly, accountController.toggleStudentStatus);
router.delete('/students/:id', ...adminOnly, accountController.deleteStudent);
router.post('/students/:id/reset-password', ...adminOnly, accountController.resetStudentPassword);

// Faculty Account Management Endpoints
router.get('/faculty', ...adminOnly, accountController.getFaculty);
router.post('/faculty', ...adminOnly, accountController.createFaculty);
router.put('/faculty/:id', ...adminOnly, accountController.updateFaculty);
router.patch('/faculty/:id/status', ...adminOnly, accountController.toggleFacultyStatus);
router.delete('/faculty/:id', ...adminOnly, accountController.deleteFaculty);
router.post('/faculty/:id/reset-password', ...adminOnly, accountController.resetFacultyPassword);

export default router;

