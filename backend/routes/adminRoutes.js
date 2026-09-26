import express from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authenticate, adminController.getDashboardStats);
router.get('/users', authenticate, authorize('super_admin', 'college_admin', 'admin', 'principal', 'hod'), adminController.getUsers);
router.patch('/users/:id/status', authenticate, authorize('super_admin', 'college_admin', 'admin'), adminController.updateUserStatus);
router.get('/audit-logs', authenticate, authorize('super_admin', 'college_admin', 'admin'), adminController.getAuditLogs);
router.get('/search', authenticate, adminController.globalSearch);
router.get('/reports', authenticate, authorize('super_admin', 'college_admin', 'admin', 'principal', 'hod', 'accountant'), adminController.getReports);

export default router;

