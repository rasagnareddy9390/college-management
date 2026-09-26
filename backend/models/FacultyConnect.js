import mongoose from 'mongoose';

// 1. Faculty Public / Connect Profile Schema
const facultyProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    designation: { type: String, default: 'Associate Professor' },
    department: { type: String, default: 'Computer Science & Engineering' },
    departmentCode: { type: String, default: 'CSE' },
    qualification: { type: String, default: 'Ph.D. in Computer Science' },
    experienceYears: { type: Number, default: 8 },
    photo: { type: String, default: '' },
    subjects: [{ type: String, trim: true }],
    expertise: [{ type: String, trim: true }],
    bio: { type: String, default: '' },
    officeLocation: { type: String, default: 'Academic Block-B, Cabin 304' },
    officeHours: { type: String, default: '02:00 PM - 04:30 PM' },
    availableDays: [{ type: String }],
    isAvailable: { type: Boolean, default: true },
    stats: {
      questionsAnswered: { type: Number, default: 0 },
      avgResponseTime: { type: String, default: '< 4 hours' },
      activeDiscussions: { type: Number, default: 0 },
      rating: { type: Number, default: 4.9 },
      studentSatisfaction: { type: String, default: '98%' },
    },
    officeSchedule: [
      {
        day: { type: String, required: true },
        timeSlot: { type: String, required: true },
        room: { type: String, default: 'Cabin' },
        status: { type: String, default: 'Available' },
      },
    ],
  },
  { timestamps: true }
);

// 2. Student Question Schema
const facultyQuestionSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true, unique: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentName: { type: String, required: true },
    studentEmail: { type: String, default: '' },
    studentRollNo: { type: String, default: '' },
    studentDepartment: { type: String, default: '' },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    facultyName: { type: String, required: true },
    facultyDepartment: { type: String, default: '' },
    subject: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        'Concept Clarification',
        'Assignment Doubt',
        'Exam Preparation',
        'Lab / Practical Doubt',
        'Career Guidance',
        'Project / Research',
        'General Inquiry',
      ],
      default: 'Concept Clarification',
    },
    priority: {
      type: String,
      enum: ['Normal', 'Important', 'Urgent'],
      default: 'Normal',
      index: true,
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    attachments: [
      {
        name: { type: String },
        url: { type: String },
        type: { type: String },
        size: { type: Number },
      },
    ],
    isPrivate: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['New', 'In Progress', 'Answered', 'Resolved', 'Closed'],
      default: 'New',
      index: true,
    },
    draftAnswer: {
      text: { type: String, default: '' },
      savedAt: { type: Date },
    },
    lastReplyAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

// 3. Conversation Message Schema
const questionMessageSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true },
    senderRole: {
      type: String,
      enum: ['student', 'faculty', 'admin', 'super_admin', 'hod', 'principal'],
      required: true,
    },
    senderAvatar: { type: String, default: '' },
    message: { type: String, required: true },
    attachments: [
      {
        name: { type: String },
        url: { type: String },
        type: { type: String },
        size: { type: Number },
      },
    ],
    isFacultyAnswer: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const FacultyProfile = mongoose.model('FacultyProfile', facultyProfileSchema);
export const FacultyQuestion = mongoose.model('FacultyQuestion', facultyQuestionSchema);
export const QuestionMessage = mongoose.model('QuestionMessage', questionMessageSchema);

