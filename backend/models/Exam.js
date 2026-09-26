import mongoose from 'mongoose';

const examScheduleSchema = new mongoose.Schema(
  {
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    date: { type: Date, required: true },
    session: { type: String, enum: ['FN (09:30 AM - 12:30 PM)', 'AN (02:00 PM - 05:00 PM)'], default: 'FN (09:30 AM - 12:30 PM)' },
    roomNumber: { type: String, default: 'Hall-B' },
  },
  { _id: true }
);

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    semester: { type: Number, required: true },
    academicYear: { type: String, default: '2025-2026' },
    type: { type: String, enum: ['Mid-Term', 'Semester-End', 'Supplements'], default: 'Semester-End' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    schedules: [examScheduleSchema],
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const hallTicketSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    hallTicketNumber: { type: String, required: true, unique: true },
    qrVerificationCode: { type: String, required: true },
    isEligible: { type: Boolean, default: true },
    ineligibilityReason: { type: String, default: '' },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

hallTicketSchema.index({ studentId: 1, examId: 1 }, { unique: true });

export const Exam = mongoose.model('Exam', examSchema);
export const HallTicket = mongoose.model('HallTicket', hallTicketSchema);

