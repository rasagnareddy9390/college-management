import mongoose from 'mongoose';

const markSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    semester: { type: Number, required: true },
    examType: {
      type: String,
      enum: ['CIA-1', 'CIA-2', 'CIA-3', 'Assignment', 'Lab-Internal', 'Semester-End'],
      required: true,
    },
    maxMarks: { type: Number, default: 50 },
    obtainedMarks: { type: Number, required: true },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String, default: '' },
  },
  { timestamps: true }
);

markSchema.index({ studentId: 1, subjectId: 1, examType: 1 }, { unique: true });

const resultSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    semester: { type: Number, required: true },
    academicYear: { type: String, default: '2025-2026' },
    sgpa: { type: Number, required: true },
    cgpa: { type: Number, required: true },
    totalCredits: { type: Number, default: 24 },
    earnedCredits: { type: Number, default: 24 },
    status: { type: String, enum: ['PASS', 'FAIL', 'WITHHELD'], default: 'PASS' },
    subjectGrades: [
      {
        subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
        subjectCode: String,
        subjectName: String,
        credits: Number,
        internalMarks: Number,
        externalMarks: Number,
        totalMarks: Number,
        grade: String, // 'O', 'A+', 'A', 'B+', 'B', 'C', 'F'
        gradePoint: Number,
        status: String,
      },
    ],
    publishedDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Mark = mongoose.model('Mark', markSchema);
export const Result = mongoose.model('Result', resultSchema);

