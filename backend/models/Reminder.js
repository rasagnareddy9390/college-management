import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    dueDate: { type: Date, required: true, index: true },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    category: {
      type: String,
      enum: ['Personal', 'Skill', 'Assignment', 'Exam', 'Application', 'General'],
      default: 'Personal',
      index: true,
    },
    isCompleted: { type: Boolean, default: false, index: true },
    completedAt: { type: Date },
    notifiedStages: [{ type: String }], // '7d', '3d', '1d', 'today', 'overdue'
    referenceType: { type: String, default: '' },
    referenceId: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Reminder = mongoose.model('Reminder', reminderSchema);

