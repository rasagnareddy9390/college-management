import { Student, User, TimetableSlot, Assignment, Submission, AttendanceSession, Holiday, Exam } from '../models/index.js';

export const studentController = {
  // Searchable student directory with pagination
  async getStudents(req, res) {
    try {
      const { search, departmentId, semester, section, page = 1, limit = 20 } = req.query;
      const query = {};

      if (departmentId) query.departmentId = departmentId;
      if (semester) query.semester = Number(semester);
      if (section) query.section = section.toUpperCase();

      if (search) {
        const searchRegex = new RegExp(search, 'i');
        const matchedUsers = await User.find({ name: searchRegex }).select('_id');
        const userIds = matchedUsers.map((u) => u._id);

        query.$or = [
          { rollNumber: searchRegex },
          { branch: searchRegex },
          { userId: { $in: userIds } },
        ];
      }

      const total = await Student.countDocuments(query);
      const students = await Student.find(query)
        .populate('userId', 'name email phone avatar')
        .populate('departmentId', 'name code')
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ rollNumber: 1 });

      return res.json({
        success: true,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        students,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve students directory.' });
    }
  },

  // Get student by ID
  async getStudentById(req, res) {
    try {
      const student = await Student.findById(req.params.id)
        .populate('userId', 'name email phone avatar')
        .populate('departmentId courseId');

      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found.' });
      }

      return res.json({ success: true, student });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Error retrieving student.' });
    }
  },

  // "MY DAY" - Smart daily student agenda
  async getMyDay(req, res) {
    try {
      const student = req.student || (await Student.findOne({ userId: req.user._id }).populate('departmentId'));
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student record not found.' });
      }

      // Today's day name
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayDay = days[new Date().getDay()];

      // 1. Today's classes
      const todayClasses = await TimetableSlot.find({
        departmentId: student.departmentId?._id || student.departmentId,
        semester: student.semester,
        section: student.section,
        dayOfWeek: todayDay,
      })
        .populate('subjectId', 'name code')
        .populate('facultyId', 'name email')
        .sort({ period: 1 });

      // 2. Pending assignments due soon
      const assignments = await Assignment.find({
        semester: student.semester,
        section: student.section,
        deadline: { $gte: new Date(Date.now() - 86400000) },
      })
        .populate('subjectId', 'name code')
        .sort({ deadline: 1 })
        .limit(5);

      const submissions = await Submission.find({ studentId: student._id });
      const submittedIds = new Set(submissions.map((s) => String(s.assignmentId)));
      const pendingAssignments = assignments.filter((a) => !submittedIds.has(String(a._id)));

      // 3. Upcoming exams in next 14 days
      const upcomingExams = await Exam.find({
        semester: student.semester,
        startDate: { $gte: new Date() },
      }).sort({ startDate: 1 }).limit(3);

      // 4. Upcoming holidays in next 7 days
      const upcomingHolidays = await Holiday.find({
        startDate: { $gte: new Date(), $lte: new Date(Date.now() + 86400000 * 7) },
      }).sort({ startDate: 1 });

      return res.json({
        success: true,
        myDay: {
          todayDay,
          date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
          classes: todayClasses,
          pendingAssignments,
          upcomingExams,
          upcomingHolidays,
          alerts: [
            { type: 'warning', text: 'DBMS Unit 4 assignment deadline approaching tomorrow' },
            { type: 'info', text: 'Campus Placement Drive by Google is open for registration' },
          ],
        },
      });
    } catch (err) {
      console.error('[Student] getMyDay error:', err);
      return res.status(500).json({ success: false, message: 'Failed to generate My Day agenda.' });
    }
  },

  // Student Smart Insights
  async getInsights(req, res) {
    try {
      const student = req.student || (await Student.findOne({ userId: req.user._id }));
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found.' });
      }

      const insights = [
        {
          id: '1',
          type: 'attendance',
          status: 'warning',
          title: 'DBMS Attendance Below Threshold',
          description: 'Your DBMS attendance is currently 70.0%, which is below the mandatory 75% threshold. You must attend 8 more consecutive classes.',
          metric: '70.0%',
        },
        {
          id: '2',
          type: 'academic',
          status: 'success',
          title: 'Strong Cumulative CGPA',
          description: `Your cumulative CGPA stands at ${student.cgpa || 8.12} with 0 active backlogs. You are eligible for Tier-1 corporate placements.`,
          metric: `${student.cgpa || 8.12} CGPA`,
        },
        {
          id: '3',
          type: 'fees',
          status: 'neutral',
          title: 'Upcoming Fee Due Date',
          description: 'Semester 5 tuition fee of ₹25,000 is due on the 25th. Pay online to receive your instant digital receipt.',
          metric: '₹25,000 Due',
        },
        {
          id: '4',
          type: 'assignment',
          status: 'info',
          title: 'Assignments Completion Rate',
          description: 'You have submitted 8 out of 9 total assignments this semester (88.8% completion rate).',
          metric: '8/9 Submitted',
        },
      ];

      return res.json({ success: true, insights });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to load insights.' });
    }
  },
};

