import { Assignment, Submission, Student, Subject, Notification } from '../models/index.js';

export const assignmentController = {
  // Get assignments for student or subject
  async getAssignments(req, res) {
    try {
      const { subjectId, semester, section } = req.query;
      const query = {};
      if (subjectId) query.subjectId = subjectId;
      if (semester) query.semester = Number(semester);
      if (section) query.section = section;

      const assignments = await Assignment.find(query)
        .populate('subjectId', 'name code')
        .populate('facultyId', 'name email')
        .sort({ deadline: 1 });

      let mySubmissions = [];
      if (req.user.role === 'student') {
        const student = req.student || (await Student.findOne({ userId: req.user._id }));
        if (student) {
          mySubmissions = await Submission.find({ studentId: student._id });
        }
      }

      const submissionMap = new Map(mySubmissions.map((s) => [String(s.assignmentId), s]));

      const enriched = assignments.map((a) => {
        const sub = submissionMap.get(String(a._id));
        return {
          ...a.toObject(),
          mySubmission: sub || null,
          isSubmitted: !!sub,
          isOverdue: !sub && new Date(a.deadline) < new Date(),
        };
      });

      return res.json({ success: true, count: enriched.length, assignments: enriched });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve assignments.' });
    }
  },

  // Faculty creates assignment
  async createAssignment(req, res) {
    try {
      const { subjectId, title, description, unit, semester, section, deadline, maxMarks, attachmentUrl } = req.body;
      const facultyId = req.user._id;

      const assignment = await Assignment.create({
        subjectId,
        facultyId,
        title,
        description,
        unit: Number(unit) || 1,
        semester: Number(semester),
        section: section || 'A',
        deadline: new Date(deadline),
        maxMarks: Number(maxMarks) || 10,
        attachmentUrl: attachmentUrl || '',
      });

      // Broadcast notification to students
      await Notification.create({
        recipientRole: 'student',
        title: `New Assignment: ${title}`,
        message: `A new assignment has been posted with deadline ${new Date(deadline).toLocaleDateString()}.`,
        category: 'Assignment',
        priority: 'ACADEMIC',
      });

      return res.status(201).json({ success: true, message: 'Assignment published successfully.', assignment });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to create assignment.' });
    }
  },

  // Student submits assignment
  async submitAssignment(req, res) {
    try {
      const { assignmentId, fileUrl } = req.body;
      const student = req.student || (await Student.findOne({ userId: req.user._id }));

      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found.' });
      }

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ success: false, message: 'Assignment not found.' });
      }

      const isLate = new Date() > new Date(assignment.deadline);

      const submission = await Submission.findOneAndUpdate(
        { assignmentId, studentId: student._id },
        {
          assignmentId,
          studentId: student._id,
          fileUrl: fileUrl || 'https://storage.nriit.ac.in/submissions/sample_assignment.pdf',
          status: isLate ? 'Late' : 'Submitted',
          submittedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      return res.json({
        success: true,
        message: isLate ? 'Assignment submitted (Marked Late).' : 'Assignment submitted successfully.',
        submission,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to submit assignment.' });
    }
  },

  // Faculty evaluates and grades submission
  async evaluateSubmission(req, res) {
    try {
      const { submissionId, obtainedMarks, feedback } = req.body;

      const submission = await Submission.findByIdAndUpdate(
        submissionId,
        {
          obtainedMarks: Number(obtainedMarks),
          feedback: feedback || '',
          status: 'Evaluated',
          evaluatedAt: new Date(),
        },
        { new: true }
      ).populate('studentId assignmentId');

      if (!submission) {
        return res.status(404).json({ success: false, message: 'Submission not found.' });
      }

      return res.json({ success: true, message: 'Submission evaluated and graded.', submission });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to evaluate submission.' });
    }
  },
};

