import mongoose from 'mongoose';

// 1. Official College Announcement Schema
const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ['General', 'Academic', 'Exam', 'Placement', 'Holiday', 'Sports', 'Emergency', 'Cultural'],
      default: 'General',
      index: true,
    },
    priority: {
      type: String,
      enum: ['NORMAL', 'IMPORTANT', 'URGENT'],
      default: 'NORMAL',
      index: true,
    },
    targetAudience: [
      {
        type: String,
        enum: ['all', 'student', 'faculty', 'admin', 'parent'],
        default: 'all',
      },
    ],
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    publisherName: { type: String, default: 'Dean of Academic Affairs' },
    attachments: [
      {
        name: String,
        url: String,
      },
    ],
    expiryDate: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// 2. Scheduled Upcoming Exam Schema for real-time countdown
const upcomingExamSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    subjectCode: { type: String, default: '' },
    examName: { type: String, required: true, trim: true },
    examDate: { type: Date, required: true, index: true },
    startTime: { type: String, required: true, default: '10:00 AM' },
    endTime: { type: String, default: '01:00 PM' },
    durationMinutes: { type: Number, default: 180 },
    venue: { type: String, default: 'Main Examination Block / Online Lab' },
    maxMarks: { type: Number, default: 100 },
    category: {
      type: String,
      enum: ['Theory', 'Lab Practical', 'Mid-Term', 'Semester-End', 'Internal Assessment'],
      default: 'Semester-End',
    },
    targetSemester: { type: Number, default: 5 },
    targetDepartment: { type: String, default: 'All Departments' },
    instructions: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Announcement = mongoose.model('Announcement', announcementSchema);
export const UpcomingExam = mongoose.model('UpcomingExam', upcomingExamSchema);

