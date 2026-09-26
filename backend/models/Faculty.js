import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    employeeId: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    designation: { type: String, default: 'Associate Professor' },
    specialization: { type: String, default: 'Cloud Computing & AI' },
    assignedSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
    cabinNumber: { type: String, default: 'CS-304' },
    qualification: { type: String, default: 'Ph.D. in Computer Science' },
    experienceYears: { type: Number, default: 8 },
  },
  { timestamps: true }
);

export const Faculty = mongoose.model('Faculty', facultySchema);

