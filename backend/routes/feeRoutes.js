import express from 'express';
import { feeController } from '../controllers/feeController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/my', authenticate, feeController.getStudentFees);
router.get('/student/:studentId', authenticate, feeController.getStudentFees);
router.post('/pay', authenticate, feeController.processPayment);
router.get('/receipt/:paymentId', authenticate, feeController.downloadFeeReceiptPDF);

export default router;

