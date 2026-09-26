import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    hodId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

const courseSchema = new mongoose.Schema(
  {
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    name: { type: String, required: true },
    code: { type: String, required: true, uppercase: true },
    durationYears: { type: Number, default: 4 },
    degree: { type: String, default: 'B.Tech' },
  },
  { timestamps: true }
);

const subjectSchema = new mongoose.Schema(
  {
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    name: { type: String, required: true },
    code: { type: String, required: true, uppercase: true, index: true },
    semester: { type: Number, required: true, index: true },
    credits: { type: Number, default: 4 },
    type: { type: String, enum: ['Theory', 'Practical', 'Elective', 'Seminar', 'Project'], default: 'Theory' },
    syllabusPdf: { type: String, default: '' },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
  },
  { timestamps: true }
);

const sectionSchema = new mongoose.Schema(
  {
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    name: { type: String, required: true, uppercase: true }, // e.g. 'A', 'B'
    semester: { type: Number, required: true },
    academicYear: { type: String, default: '2025-2026' },
  },
  { timestamps: true }
);

export const Department = mongoose.model('Department', departmentSchema);
export const Course = mongoose.model('Course', courseSchema);
export const Subject = mongoose.model('Subject', subjectSchema);
export const Section = mongoose.model('Section', sectionSchema);

