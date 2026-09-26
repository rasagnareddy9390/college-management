import {
  LibraryBook,
  BookIssue,
  HostelRoom,
  HostelOutpass,
  TransportRoute,
  Grievance,
  CampusEvent,
  Student,
} from '../models/index.js';

export const serviceController = {
  // 1. Central Library Catalog & Search
  async getLibraryBooks(req, res) {
    try {
      const { search, department } = req.query;
      const query = {};
      if (department) query.department = department;
      if (search) {
        query.$or = [
          { title: new RegExp(search, 'i') },
          { author: new RegExp(search, 'i') },
          { isbn: new RegExp(search, 'i') },
        ];
      }

      const books = await LibraryBook.find(query).limit(40);
      return res.json({ success: true, count: books.length, books });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to search library.' });
    }
  },

  // 2. Hostel Rooms & Outpass Request
  async getHostelOutpasses(req, res) {
    try {
      let query = {};
      if (req.user.role === 'student') {
        const student = req.student || (await Student.findOne({ userId: req.user._id }));
        if (student) query.studentId = student._id;
      }

      const outpasses = await HostelOutpass.find(query).populate('studentId', 'rollNumber branch').sort({ createdAt: -1 });
      return res.json({ success: true, count: outpasses.length, outpasses });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve outpasses.' });
    }
  },

  async requestOutpass(req, res) {
    try {
      const { reason, destination, fromTime, toTime } = req.body;
      const student = req.student || (await Student.findOne({ userId: req.user._id }));

      const outpass = await HostelOutpass.create({
        studentId: student._id,
        reason,
        destination,
        fromTime: new Date(fromTime),
        toTime: new Date(toTime),
        qrVerificationCode: `OUTPASS-${student.rollNumber}-${Date.now()}`,
      });

      return res.status(201).json({ success: true, message: 'Outpass request submitted to Warden.', outpass });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to request outpass.' });
    }
  },

  // 3. Transport Fleet & Routes
  async getTransportRoutes(req, res) {
    try {
      const routes = await TransportRoute.find();
      return res.json({ success: true, count: routes.length, routes });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve transport routes.' });
    }
  },

  // 4. Student Grievances
  async getGrievances(req, res) {
    try {
      let query = {};
      if (req.user.role === 'student' || req.user.role === 'parent') {
        query.submittedBy = req.user._id;
      }

      const grievances = await Grievance.find(query).populate('submittedBy', 'name email role').sort({ createdAt: -1 });
      return res.json({ success: true, count: grievances.length, grievances });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve grievances.' });
    }
  },

  async submitGrievance(req, res) {
    try {
      const { title, category, description } = req.body;
      const grievance = await Grievance.create({
        submittedBy: req.user._id,
        title,
        category,
        description,
      });

      return res.status(201).json({ success: true, message: 'Ticket registered. Redressal Cell notified.', grievance });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to submit grievance.' });
    }
  },

  // 5. Campus Events & Hackathons
  async getEvents(req, res) {
    try {
      const events = await CampusEvent.find().sort({ eventDate: 1 });
      return res.json({ success: true, count: events.length, events });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve events.' });
    }
  },

  async registerEvent(req, res) {
    try {
      const { eventId } = req.body;
      const student = req.student || (await Student.findOne({ userId: req.user._id }));

      const event = await CampusEvent.findByIdAndUpdate(
        eventId,
        { $addToSet: { registeredStudents: student._id } },
        { new: true }
      );

      return res.json({
        success: true,
        message: 'Successfully registered for event! Pass generated.',
        event,
        passQr: `EVENT-PASS-${student.rollNumber}-${eventId}`,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to register for event.' });
    }
  },
};

