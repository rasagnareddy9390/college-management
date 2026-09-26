import { Mark, Student, Subject } from '../models/index.js';

export const markController = {
  // Enter or update marks for a student
  async recordMarks(req, res) {
    try {
      const { studentId, subjectId, semester, examType, maxMarks, obtainedMarks, remarks } = req.body;
      const facultyId = req.user._id;

      if (!studentId || !subjectId || !semester || !examType || obtainedMarks === undefined) {
        return res.status(400).json({ success: false, message: 'Missing required mark entry fields.' });
      }

      const mark = await Mark.findOneAndUpdate(
        { studentId, subjectId, examType },
        {
          studentId,
          subjectId,
          semester: Number(semester),
          examType,
          maxMarks: Number(maxMarks) || 50,
          obtainedMarks: Number(obtainedMarks),
          facultyId,
          remarks: remarks || '',
        },
        { upsert: true, new: true }
      );

      return res.status(201).json({ success: true, message: 'Mark recorded successfully.', mark });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to record marks.' });
    }
  },

  // Get marks for a student
  async getStudentMarks(req, res) {
    try {
      let studentId = req.params.studentId;
      if (!studentId || studentId === 'my') {
        const student = req.student || (await Student.findOne({ userId: req.user._id }));
        if (!student) {
          return res.status(404).json({ success: false, message: 'Student profile not found.' });
        }
        studentId = student._id;
      }

      const marks = await Mark.find({ studentId })
        .populate('subjectId', 'name code credits')
        .sort({ semester: 1, examType: 1 });

      return res.json({ success: true, marks });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve student marks.' });
    }
  },
};

