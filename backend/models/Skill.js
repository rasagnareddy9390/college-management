import mongoose from 'mongoose';

// 1. Skill Catalog Schema
const skillSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    category: {
      type: String,
      required: true,
      enum: ['Technical', 'Career', 'Productivity', 'Professional'],
      index: true,
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
      default: 'Beginner',
    },
    description: { type: String, required: true },
    estimatedDays: { type: Number, default: 30 },
    icon: { type: String, default: 'fas fa-laptop-code' },
    tags: [{ type: String, trim: true }],
    modules: [
      {
        day: { type: Number, required: true },
        title: { type: String, required: true },
        description: { type: String, default: '' },
        tasks: [{ type: String }],
        resources: [
          {
            title: String,
            url: String,
            type: { type: String, default: 'Video' },
          },
        ],
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// 2. Curated Free Learning Resources Schema
const skillResourceSchema = new mongoose.Schema(
  {
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', index: true },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Technical', 'Career', 'Productivity', 'Professional'],
      default: 'Technical',
      index: true,
    },
    url: { type: String, required: true },
    type: {
      type: String,
      enum: ['Video', 'Article', 'Interactive', 'Documentation', 'Book', 'Course'],
      default: 'Video',
    },
    provider: { type: String, default: 'YouTube' },
    isFree: { type: Boolean, default: true },
    description: { type: String, default: '' },
    level: { type: String, default: 'Beginner' },
    duration: { type: String, default: 'Self-paced' },
  },
  { timestamps: true }
);

// 3. 30-Day Learning Plan with Daily Checklist
const learningPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['Technical', 'Career', 'Productivity', 'Professional'],
      default: 'Technical',
    },
    startDate: { type: Date, default: Date.now },
    targetCompletionDate: { type: Date, required: true },
    totalDays: { type: Number, default: 30 },
    completedDays: [{ type: Number }],
    dailyChecklist: [
      {
        day: { type: Number, required: true },
        title: { type: String, required: true },
        isCompleted: { type: Boolean, default: false },
        completedAt: { type: Date },
        notes: { type: String, default: '' },
        taskDescription: { type: String, default: '' },
        taskUrl: { type: String, default: '' },
        videoUrl: { type: String, default: '' },
      },
    ],
    status: {
      type: String,
      enum: ['In Progress', 'Completed', 'Paused'],
      default: 'In Progress',
      index: true,
    },
    progressPercent: { type: Number, default: 0 },
    certificateEarned: { type: Boolean, default: false },
    certificateUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

// 4. Typing Practice Record Schema
const typingSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    durationMinutes: { type: Number, required: true, enum: [1, 3, 5] },
    wpm: { type: Number, required: true },
    netWpm: { type: Number, default: 0 },
    accuracy: { type: Number, required: true },
    charactersTyped: { type: Number, required: true },
    errorsCount: { type: Number, default: 0 },
    sampleTextUsed: { type: String, default: '' },
    date: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// 5. Pomodoro / Study Timer Log Schema
const learningSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['Pomodoro', 'CustomStudy'],
      default: 'Pomodoro',
    },
    durationMinutes: { type: Number, required: true },
    focusTask: { type: String, default: 'Skill Practice' },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// 6. Student Certificate Tracker Schema
const certificateSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    issuer: { type: String, required: true },
    issueDate: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    credentialUrl: { type: String, default: '' },
    category: {
      type: String,
      enum: ['Technical', 'Career', 'Productivity', 'Professional', 'Other'],
      default: 'Technical',
    },
    verificationStatus: {
      type: String,
      enum: ['Verified', 'Pending', 'Self-Reported'],
      default: 'Self-Reported',
    },
  },
  { timestamps: true }
);

export const Skill = mongoose.model('Skill', skillSchema);
export const SkillResource = mongoose.model('SkillResource', skillResourceSchema);
export const LearningPlan = mongoose.model('LearningPlan', learningPlanSchema);
export const TypingSession = mongoose.model('TypingSession', typingSessionSchema);
export const LearningSession = mongoose.model('LearningSession', learningSessionSchema);
export const Certificate = mongoose.model('Certificate', certificateSchema);

