import mongoose from 'mongoose';

// ==========================================
// 1. QUESTION BANK (Reusable Questions Pool)
// ==========================================
const testCaseSchema = new mongoose.Schema({
  input: { type: String, default: '' },
  expectedOutput: { type: String, required: true },
  isHidden: { type: Boolean, default: false },
  explanation: { type: String, default: '' },
  points: { type: Number, default: 10 },
}, { _id: true });

const mcqOptionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  isCorrect: { type: Boolean, default: false },
}, { _id: false });

const labQuestionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  questionType: {
    type: String,
    enum: ['programming', 'mcq', 'sql', 'debugging', 'viva_short'],
    default: 'programming',
    required: true,
  },
  subjectCode: { type: String, required: true, trim: true },
  subjectName: { type: String, required: true },
  topic: { type: String, default: 'General' },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  marks: { type: Number, default: 10, required: true },
  allowedLanguages: {
    type: [String],
    default: ['javascript', 'python'],
  },
  starterCode: {
    javascript: { type: String, default: '// Write your JavaScript solution here\nfunction solution(input) {\n  \n}' },
    python: { type: String, default: '# Write your Python solution here\ndef solution(input_data):\n    pass' },
    sql: { type: String, default: '-- Write your SQL query here\nSELECT * FROM ' },
  },
  solutionCode: { type: String, default: '' },
  testCases: [testCaseSchema],
  mcqOptions: [mcqOptionSchema],
  sqlSchema: { type: String, default: '' },
  rubric: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// ==========================================
// 2. LAB EXAM (Exam Instance / Schedule)
// ==========================================
const labExamSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  examCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, default: '' },
  subjectCode: { type: String, required: true },
  subjectName: { type: String, required: true },
  department: { type: String, default: 'Computer Science & Engineering' },
  semester: { type: Number, required: true, default: 4 },
  academicYear: { type: String, default: '2025-2026' },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  scheduledStart: { type: Date, required: true },
  scheduledEnd: { type: Date, required: true },
  durationMinutes: { type: Number, required: true, default: 60 },
  totalMarks: { type: Number, required: true, default: 50 },

  status: {
    type: String,
    enum: ['draft', 'published', 'active', 'completed', 'evaluated'],
    default: 'published',
  },

  allowedLanguages: {
    type: [String],
    default: ['javascript', 'python'],
  },
  randomizeQuestions: { type: Boolean, default: false },

  questions: [labQuestionSchema],

  assignedTarget: {
    type: {
      type: String,
      enum: ['all', 'department', 'section', 'specific_students'],
      default: 'all',
    },
    department: { type: String, default: 'Computer Science & Engineering' },
    semester: { type: Number, default: 4 },
    section: { type: String, default: 'A' },
    studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  },

  instructions: {
    type: [String],
    default: [
      'Ensure a stable internet connection for the duration of the exam.',
      'Do not switch browser tabs. Tab switches are logged and flagged as potential anomalies.',
      'Your code will be executed in a secure isolated sandbox against both sample and hidden test cases.',
      'Auto-save runs periodically. Your latest draft is saved automatically every 30 seconds.',
      'When the timer reaches 00:00, your exam will be automatically submitted.',
    ],
  },

  settings: {
    allowRunCode: { type: Boolean, default: true },
    maxTabSwitches: { type: Number, default: 5 },
    autoSubmitOnExpiry: { type: Boolean, default: true },
    showResultImmediately: { type: Boolean, default: true },
  },
}, { timestamps: true });

// ==========================================
// 3. LAB SUBMISSION (Student Attempt)
// ==========================================
const questionAnswerSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  questionType: { type: String, required: true },
  language: { type: String, default: 'javascript' },
  code: { type: String, default: '' },
  mcqSelectedOption: { type: String, default: '' },
  textAnswer: { type: String, default: '' },

  // Execution & Scoring metrics
  testCasesPassed: { type: Number, default: 0 },
  totalTestCases: { type: Number, default: 0 },
  autoScore: { type: Number, default: 0 },
  manualScore: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
  facultyRemarks: { type: String, default: '' },

  testResults: [{
    testCaseId: String,
    passed: Boolean,
    isHidden: Boolean,
    input: String,
    expectedOutput: String,
    actualOutput: String,
    executionTimeMs: Number,
    errorMessage: String,
  }],
}, { _id: false });

const labSubmissionSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabExam', required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  studentName: { type: String, default: '' },
  studentRollNumber: { type: String, default: '' },

  startedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date },

  status: {
    type: String,
    enum: ['in_progress', 'submitted', 'auto_submitted', 'evaluated'],
    default: 'in_progress',
  },

  answers: [questionAnswerSchema],

  tabSwitchCount: { type: Number, default: 0 },
  tabSwitchLog: [{
    timestamp: { type: Date, default: Date.now },
    reason: { type: String, default: 'Tab switch detected' },
  }],

  autoScore: { type: Number, default: 0 },
  manualScore: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
  maxScore: { type: Number, default: 50 },
  percentage: { type: Number, default: 0 },
  grade: { type: String, default: 'Pending' },

  feedback: { type: String, default: '' },
  evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  evaluatedAt: { type: Date },
}, { timestamps: true });

labSubmissionSchema.index({ examId: 1, studentId: 1 }, { unique: true });

export const LabQuestionBank = mongoose.model('LabQuestionBank', labQuestionSchema);
export const LabExam = mongoose.model('LabExam', labExamSchema);
export const LabSubmission = mongoose.model('LabSubmission', labSubmissionSchema);

