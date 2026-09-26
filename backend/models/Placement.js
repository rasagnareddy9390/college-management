import mongoose from 'mongoose';

const placementJobSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    role: { type: String, required: true },
    ctc: { type: String, required: true }, // e.g. "12 LPA"
    baseSalary: { type: Number, default: 1200000 },
    location: { type: String, default: 'Bangalore, India' },
    minCgpa: { type: Number, default: 7.0 },
    maxBacklogs: { type: Number, default: 0 },
    allowedBranches: [{ type: String }],
    driveDate: { type: Date, required: true },
    deadline: { type: Date, required: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const jobApplicationSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlacementJob', required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    appliedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['Applied', 'Shortlisted', 'Test Scheduled', 'Technical Interview', 'HR Interview', 'Selected', 'Rejected'],
      default: 'Applied',
    },
    remarks: { type: String, default: '' },
  },
  { timestamps: true }
);

jobApplicationSchema.index({ jobId: 1, studentId: 1 }, { unique: true });

const studentPortfolioSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
    summary: { type: String, default: 'Aspiring Full Stack Engineer & Machine Learning enthusiast.' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    portfolioWebsite: { type: String, default: '' },
    experience: [
      {
        company: String,
        role: String,
        duration: String,
        description: String,
      },
    ],
    resumeUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

export const PlacementJob = mongoose.model('PlacementJob', placementJobSchema);
export const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);
export const StudentPortfolio = mongoose.model('StudentPortfolio', studentPortfolioSchema);

