import mongoose from 'mongoose';

const feeStructureSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    semester: { type: Number, required: true },
    academicYear: { type: String, default: '2025-2026' },
    tuitionFee: { type: Number, default: 45000 },
    labFee: { type: Number, default: 8000 },
    libraryFee: { type: Number, default: 2500 },
    examFee: { type: Number, default: 2000 },
    hostelFee: { type: Number, default: 0 },
    transportFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
  },
  { timestamps: true }
);

const feePaymentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    feeStructureId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeStructure' },
    transactionId: { type: String, required: true, unique: true },
    amountPaid: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['UPI', 'NetBanking', 'CreditCard', 'DebitCard', 'Cash/Challan'], default: 'UPI' },
    status: { type: String, enum: ['Success', 'Pending', 'Failed'], default: 'Success' },
    receiptNumber: { type: String, required: true, unique: true },
    paymentDate: { type: Date, default: Date.now },
    remarks: { type: String, default: 'Semester Tuition Fee' },
  },
  { timestamps: true }
);

export const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);
export const FeePayment = mongoose.model('FeePayment', feePaymentSchema);

