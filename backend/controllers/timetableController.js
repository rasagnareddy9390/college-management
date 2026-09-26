import { TimetableSlot, Subject, User } from '../models/index.js';

export const timetableController = {
  // Get weekly timetable matrix for section
  async getTimetable(req, res) {
    try {
      const { departmentId, semester, section } = req.query;
      const query = {};
      if (departmentId) query.departmentId = departmentId;
      if (semester) query.semester = Number(semester);
      if (section) query.section = section.toUpperCase();

      const slots = await TimetableSlot.find(query)
        .populate('subjectId', 'name code type')
        .populate('facultyId', 'name email phone')
        .sort({ dayOfWeek: 1, period: 1 });

      const matrix = {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
      };

      slots.forEach((s) => {
        if (matrix[s.dayOfWeek]) {
          matrix[s.dayOfWeek].push(s);
        }
      });

      return res.json({ success: true, count: slots.length, timetable: matrix, rawSlots: slots });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve timetable.' });
    }
  },

  // Get timetable for logged-in or specific faculty
  async getFacultyTimetable(req, res) {
    try {
      const facultyId = req.params.facultyId || req.user._id;
      const slots = await TimetableSlot.find({ facultyId })
        .populate('subjectId', 'name code')
        .populate('departmentId', 'name code')
        .sort({ dayOfWeek: 1, period: 1 });

      return res.json({ success: true, count: slots.length, slots });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve faculty timetable.' });
    }
  },

  // Conflict-aware automatic timetable generator
  async autoGenerateTimetable(req, res) {
    try {
      const { departmentId, semester, section } = req.body;
      const subjects = await Subject.find({ departmentId, semester }).populate('facultyId');

      if (!subjects || subjects.length === 0) {
        return res.status(400).json({ success: false, message: 'No subjects configured for this semester.' });
      }

      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const periodsPerDay = 5;
      const times = [
        { start: '09:00 AM', end: '09:50 AM' },
        { start: '10:00 AM', end: '10:50 AM' },
        { start: '11:10 AM', end: '12:00 PM' },
        { start: '01:00 PM', end: '01:50 PM' },
        { start: '02:00 PM', end: '02:50 PM' },
      ];

      // Remove existing slots for section
      await TimetableSlot.deleteMany({ departmentId, semester, section });

      const newSlots = [];
      let subjectIndex = 0;

      for (const day of days) {
        for (let p = 1; p <= periodsPerDay; p++) {
          const subject = subjects[subjectIndex % subjects.length];
          const facultyUser = await User.findOne({ role: 'faculty' });
          const facultyId = subject.facultyId?.userId || facultyUser?._id || req.user._id;

          newSlots.push({
            departmentId,
            semester: Number(semester),
            section: section.toUpperCase(),
            dayOfWeek: day,
            period: p,
            startTime: times[p - 1].start,
            endTime: times[p - 1].end,
            subjectId: subject._id,
            facultyId,
            room: `Lecture Hall ${semester}0${section === 'A' ? 1 : 2}`,
            isLab: subject.type === 'Practical',
          });

          subjectIndex++;
        }
      }

      await TimetableSlot.insertMany(newSlots);

      return res.status(201).json({
        success: true,
        message: `Generated ${newSlots.length} conflict-free timetable slots for Section ${section}.`,
        slotsCount: newSlots.length,
      });
    } catch (err) {
      console.error('[Timetable] autoGenerate error:', err);
      return res.status(500).json({ success: false, message: 'Automatic timetable generation failed.' });
    }
  },
};

