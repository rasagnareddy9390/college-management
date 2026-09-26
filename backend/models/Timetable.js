import mongoose from 'mongoose';

const timetableSlotSchema = new mongoose.Schema(
  {
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    semester: { type: Number, required: true },
    section: { type: String, required: true, uppercase: true },
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true,
    },
    period: { type: Number, required: true }, // 1 to 7
    startTime: { type: String, required: true }, // e.g. "09:00 AM"
    endTime: { type: String, required: true }, // e.g. "09:50 AM"
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    room: { type: String, default: 'Room 302' },
    isLab: { type: Boolean, default: false },
    isSubstitute: { type: Boolean, default: false },
    substituteFacultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isCancelled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

timetableSlotSchema.index({ departmentId: 1, semester: 1, section: 1, dayOfWeek: 1, period: 1 }, { unique: true });

export const TimetableSlot = mongoose.model('TimetableSlot', timetableSlotSchema);

