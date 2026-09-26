import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    rollNumber: { type: String, required: true },
    status: { type: String, enum: ['Present', 'Absent', 'Late', 'Excused'], default: 'Present' },
    remarks: { type: String, default: '' },
  },
  { _id: false }
);

const attendanceSessionSchema = new mongoose.Schema(
  {
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    semester: { type: Number, required: true },
    section: { type: String, required: true },
    date: { type: Date, required: true, index: true },
    period: { type: Number, required: true }, // e.g. 1, 2, 3, 4, 5
    topicCovered: { type: String, default: '' },
    records: [attendanceRecordSchema],
    totalStudents: { type: Number, default: 0 },
    presentCount: { type: Number, default: 0 },
    absentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

attendanceSessionSchema.index({ subjectId: 1, section: 1, date: 1, period: 1 });

const attendanceImportSchema = new mongoose.Schema(
  {
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fileName: String,
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    section: String,
    totalRows: Number,
    successRows: Number,
    errorRows: Number,
    errors: [
      {
        row: Number,
        rollNumber: String,
        reason: String,
      },
    ],
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

export const AttendanceSession = mongoose.model('AttendanceSession', attendanceSessionSchema);
export const AttendanceImport = mongoose.model('AttendanceImport', attendanceImportSchema);

