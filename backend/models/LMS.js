import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    unit: { type: Number, default: 1 },
    semester: { type: Number, required: true },
    section: { type: String, default: 'A' },
    deadline: { type: Date, required: true },
    maxMarks: { type: Number, default: 10 },
    attachmentUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    submittedAt: { type: Date, default: Date.now },
    fileUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ['Submitted', 'Late', 'Evaluated', 'Revision Required'],
      default: 'Submitted',
    },
    obtainedMarks: { type: Number, default: null },
    feedback: { type: String, default: '' },
    evaluatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

const studyMaterialSchema = new mongoose.Schema(
  {
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    unit: { type: Number, default: 1 },
    topic: { type: String, default: 'General Overview' },
    fileType: { type: String, enum: ['PDF', 'PPT', 'DOCX', 'Video', 'Link', 'Image'], default: 'PDF' },
    fileUrl: { type: String, required: true },
    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const lmsCourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    modules: [
      {
        title: String,
        lessons: [
          {
            title: String,
            duration: String,
            videoUrl: String,
            notesUrl: String,
            isCompleted: { type: Boolean, default: false },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

const lmsProgressSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'LMSCourse', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    completedLessons: [{ type: String }],
    progressPercentage: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const quizQuestionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOptionIndex: { type: Number, required: true },
    explanation: { type: String, default: '' },
    marks: { type: Number, default: 1 },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    unit: { type: Number, default: 1 },
    durationMinutes: { type: Number, default: 20 },
    totalMarks: { type: Number, default: 10 },
    questions: [quizQuestionSchema],
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date, required: true },
  },
  { timestamps: true }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    score: { type: Number, required: true },
    totalScore: { type: Number, required: true },
    answers: [{ questionId: String, selectedIndex: Number, isCorrect: Boolean }],
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const questionBankSchema = new mongoose.Schema(
  {
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    unit: { type: Number, required: true },
    topic: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    type: { type: String, enum: ['MCQ', '2 Marks', '5 Marks', '10 Marks', 'Programming', 'Descriptive'], default: '5 Marks' },
    questionText: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: { type: String, default: '' },
    marks: { type: Number, default: 5 },
    bloomsTaxonomyLevel: { type: String, default: 'Understand' },
  },
  { timestamps: true }
);

export const Assignment = mongoose.model('Assignment', assignmentSchema);
export const Submission = mongoose.model('Submission', submissionSchema);
export const StudyMaterial = mongoose.model('StudyMaterial', studyMaterialSchema);
export const LMSCourse = mongoose.model('LMSCourse', lmsCourseSchema);
export const LMSProgress = mongoose.model('LMSProgress', lmsProgressSchema);
export const Quiz = mongoose.model('Quiz', quizSchema);
export const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
export const QuestionBank = mongoose.model('QuestionBank', questionBankSchema);

