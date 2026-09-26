import mongoose from 'mongoose';

const collegeDocumentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['Academic Regulation', 'Attendance Policy', 'Exam Rules', 'Hostel Rules', 'Fee Policy', 'Library Manual', 'Syllabus'],
      required: true,
    },
    content: { type: String, required: true },
    keywords: [{ type: String }],
    version: { type: String, default: '2025-26.v1' },
  },
  { timestamps: true }
);

collegeDocumentSchema.index({ content: 'text', title: 'text' });

const aiChatHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mode: { type: String, default: 'AcademicAssistant' },
    messages: [
      {
        role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    entityType: { type: String, default: '' },
    entityId: { type: String, default: '' },
    details: { type: Object, default: {} },
    ipAddress: { type: String, default: '127.0.0.1' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

export const CollegeDocument = mongoose.model('CollegeDocument', collegeDocumentSchema);
export const AIChatHistory = mongoose.model('AIChatHistory', aiChatHistorySchema);
export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

