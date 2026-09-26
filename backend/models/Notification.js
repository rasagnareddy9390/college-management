import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    recipientRole: {
      type: String,
      enum: [
        'all',
        'student',
        'faculty',
        'parent',
        'hod',
        'admin',
        'principal',
        'accountant',
        'exam_cell',
        'placement_officer',
        'librarian',
        'hostel_warden',
        'transport_staff',
        'event_coordinator',
        'super_admin',
        'college_admin',
      ],
      default: 'all',
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    category: {
      type: String,
      enum: [
        'Academic',
        'Attendance',
        'Assignment',
        'Exam',
        'Fees',
        'Holiday',
        'Timetable',
        'Placement',
        'Events',
        'Library',
        'Hostel',
        'Transport',
        'College Announcements',
        'Emergency',
        'Faculty Connect',
        'Ask Faculty',
        'Skill',
        'Reminder',
        'Announcement',
      ],
      default: 'College Announcements',
      index: true,
    },
    priority: {
      type: String,
      enum: ['URGENT', 'IMPORTANT', 'ACADEMIC', 'COLLEGE', 'PLACEMENT'],
      default: 'COLLEGE',
      index: true,
    },
    isRead: { type: Boolean, default: false, index: true },
    link: { type: String, default: '' },
    questionId: { type: String, default: '', index: true },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

const holidaySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    type: {
      type: String,
      enum: [
        'Public Holiday',
        'College Holiday',
        'Department Holiday',
        'Vacation',
        'Semester Break',
        'Special Working Day',
        'Exam Holiday',
        'Event Day',
      ],
      default: 'College Holiday',
    },
    description: { type: String, default: '' },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  },
  { timestamps: true }
);

const academicEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    category: {
      type: String,
      enum: ['Exam', 'Assignment', 'Holiday', 'Workshop', 'Seminar', 'Placement', 'Sports', 'Cultural', 'Deadline', 'Hackathon', 'Conference', 'Symposium'],
      default: 'Workshop',
    },
    description: { type: String, default: '' },
    location: { type: String, default: 'Campus Auditorium' },
    organizer: { type: String, default: 'Academic Affairs' },
  },
  { timestamps: true }
);

export const Notification = mongoose.model('Notification', notificationSchema);
export const Holiday = mongoose.model('Holiday', holidaySchema);
export const AcademicEvent = mongoose.model('AcademicEvent', academicEventSchema);

