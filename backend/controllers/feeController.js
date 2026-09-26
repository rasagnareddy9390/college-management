import mongoose from 'mongoose';
import { FeeStructure, FeePayment, Student, Notification } from '../models/index.js';
import { pdfService } from '../services/pdfService.js';

export const feeController = {
  // Get fee ledger for student
  async getStudentFees(req, res) {
    try {
      let studentId = req.params.studentId;
      if (!studentId || studentId === 'my') {
        const student = req.student || (await Student.findOne({ userId: req.user._id }));
        if (!student) {
          return res.status(404).json({ success: false, message: 'Student profile not found.' });
        }
        studentId = student._id;
      }

      const student = await Student.findById(studentId);
      const feeStructure = await FeeStructure.findOne({ semester: student.semester });
      const payments = await FeePayment.find({ studentId }).sort({ paymentDate: -1 });

      const totalPaid = payments
        .filter((p) => p.status === 'Success')
        .reduce((sum, p) => sum + p.amountPaid, 0);

      const totalFee = feeStructure ? feeStructure.totalAmount : 55000;
      const pendingDues = Math.max(0, totalFee - totalPaid);

      return res.json({
        success: true,
        summary: {
          totalFee,
          totalPaid,
          pendingDues,
          dueDate: feeStructure?.dueDate || new Date(Date.now() + 86400000 * 15),
          status: pendingDues === 0 ? 'FULLY_PAID' : totalPaid > 0 ? 'PARTIAL' : 'OVERDUE',
        },
        feeStructure,
        payments,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve fee records.' });
    }
  },

  // Online Payment Simulation
  async processPayment(req, res) {
    try {
      const { amount, paymentMethod, remarks } = req.body;
      const student = req.student || (await Student.findOne({ userId: req.user._id }));

      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found.' });
      }

      const feeStructure = await FeeStructure.findOne({ semester: student.semester });
      const txnId = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const receiptNum = `REC-2026-${Math.floor(100000 + Math.random() * 900000)}`;

      const payment = await FeePayment.create({
        studentId: student._id,
        feeStructureId: feeStructure?._id,
        transactionId: txnId,
        amountPaid: Number(amount) || 25000,
        paymentMethod: paymentMethod || 'UPI',
        status: 'Success',
        receiptNumber: receiptNum,
        remarks: remarks || 'Online Semester Tuition Fee Payment',
      });

      // Send instant notification
      await Notification.create({
        recipientId: req.user._id,
        recipientRole: 'student',
        title: 'Fee Payment Received',
        message: `Payment of ₹${payment.amountPaid} has been verified and credited. Receipt: ${payment.receiptNumber}.`,
        category: 'Fees',
        priority: 'IMPORTANT',
      });

      return res.status(201).json({
        success: true,
        message: 'Payment completed successfully.',
        payment,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Payment processing error.' });
    }
  },

  // Download official Fee Receipt PDF
  async downloadFeeReceiptPDF(req, res) {
    try {
      const { paymentId } = req.params;
      let payment = null;
      if (mongoose.isValidObjectId(paymentId)) {
        payment = await FeePayment.findById(paymentId);
      }
      if (!payment) {
        payment = await FeePayment.findOne().sort({ createdAt: -1 });
      }
      if (!payment) return res.status(404).send('Payment transaction record not found.');

      let student = await Student.findById(payment.studentId).populate('userId departmentId');
      if (!student) {
        student = await Student.findOne().populate('userId departmentId');
      }
      let feeStructure = await FeeStructure.findById(payment.feeStructureId);
      if (!feeStructure) {
        feeStructure = await FeeStructure.findOne();
      }

      const pdfDoc = pdfService.createFeeReceiptPDF(payment, student, feeStructure);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Receipt_${payment.receiptNumber}.pdf"`);
      pdfDoc.pipe(res);
      pdfDoc.end();
    } catch (err) {
      console.error('Fee receipt PDF error:', err);
      return res.status(500).send('Failed to generate fee receipt PDF.');
    }
  },
};
