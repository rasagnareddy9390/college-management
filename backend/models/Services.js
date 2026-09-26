import mongoose from 'mongoose';

const libraryBookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    isbn: { type: String, required: true, unique: true },
    department: { type: String, default: 'Computer Science' },
    totalCopies: { type: Number, default: 5 },
    availableCopies: { type: Number, default: 5 },
    shelfLocation: { type: String, default: 'Rack-A4' },
  },
  { timestamps: true }
);

const bookIssueSchema = new mongoose.Schema(
  {
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'LibraryBook', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date, default: null },
    fineAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['Issued', 'Returned', 'Overdue'], default: 'Issued' },
  },
  { timestamps: true }
);

const hostelRoomSchema = new mongoose.Schema(
  {
    block: { type: String, required: true }, // e.g. "Aryabhatta Block"
    roomNumber: { type: String, required: true },
    capacity: { type: Number, default: 3 },
    occupiedBeds: { type: Number, default: 0 },
    inmates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  },
  { timestamps: true }
);

const hostelOutpassSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    reason: { type: String, required: true },
    destination: { type: String, required: true },
    fromTime: { type: Date, required: true },
    toTime: { type: Date, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Exited', 'Returned'], default: 'Pending' },
    wardenRemarks: { type: String, default: '' },
    qrVerificationCode: { type: String, default: '' },
  },
  { timestamps: true }
);

const transportRouteSchema = new mongoose.Schema(
  {
    routeNumber: { type: String, required: true, unique: true },
    routeName: { type: String, required: true },
    busNumber: { type: String, required: true },
    driverName: { type: String, default: 'Ramesh Kumar' },
    driverPhone: { type: String, default: '+91 9876543210' },
    capacity: { type: Number, default: 50 },
    stops: [
      {
        stopName: String,
        pickupTime: String,
        dropTime: String,
      },
    ],
  },
  { timestamps: true }
);

const grievanceSchema = new mongoose.Schema(
  {
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['Academic', 'Hostel', 'Transport', 'Fee/Accounts', 'Infrastructure', 'General'],
      required: true,
    },
    description: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'In Progress', 'Under Investigation', 'Resolved', 'Closed'], default: 'Pending' },
    resolutionNotes: { type: String, default: '' },
    assignedTo: { type: String, default: 'Student Welfare Cell' },
  },
  { timestamps: true }
);

const campusEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, enum: ['Technical', 'Cultural', 'Sports', 'Hackathon', 'Seminar', 'Workshop', 'Club Event'], default: 'Technical' },
    organizingClub: { type: String, default: 'Coding & Robotics Club' },
    eventDate: { type: Date, required: true },
    venue: { type: String, default: 'Main Auditorium' },
    description: { type: String, default: '' },
    registrationDeadline: { type: Date, required: true },
    registeredStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  },
  { timestamps: true }
);

export const LibraryBook = mongoose.model('LibraryBook', libraryBookSchema);
export const BookIssue = mongoose.model('BookIssue', bookIssueSchema);
export const HostelRoom = mongoose.model('HostelRoom', hostelRoomSchema);
export const HostelOutpass = mongoose.model('HostelOutpass', hostelOutpassSchema);
export const TransportRoute = mongoose.model('TransportRoute', transportRouteSchema);
export const Grievance = mongoose.model('Grievance', grievanceSchema);
export const CampusEvent = mongoose.model('CampusEvent', campusEventSchema);
