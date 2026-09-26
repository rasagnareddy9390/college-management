import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    rollNumber: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    studentId: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    branch: { type: String, default: 'Computer Science & Engineering' },
    year: { type: Number, default: 3 },
    semester: { type: Number, default: 5, index: true },
    section: { type: String, default: 'A', uppercase: true },
    batch: { type: String, default: '2022-2026' },
    cgpa: { type: Number, default: 8.12 },
    sgpa: { type: Number, default: 8.4 },
    backlogs: { type: Number, default: 0 },
    attendancePercentage: { type: Number, default: 78.5 },
    skills: [{ type: String }],
    projects: [
      {
        title: String,
        description: String,
        link: String,
      },
    ],
    certifications: [
      {
        title: String,
        issuer: String,
        issueDate: Date,
        link: String,
      },
    ],
    placementStatus: {
      type: String,
      enum: ['Not Placed', 'Applied', 'Shortlisted', 'Placed'],
      default: 'Not Placed',
    },
    parentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emergencyContact: { type: String, default: '' },
    address: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Student = mongoose.model('Student', studentSchema);

