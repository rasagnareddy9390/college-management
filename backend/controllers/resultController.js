import { Result, Student } from '../models/index.js';

export const resultController = {
  // Get official semester transcript / grade card
  async getStudentResults(req, res) {
    try {
      let studentId = req.params.studentId;
      if (!studentId || studentId === 'my') {
        const student = req.student || (await Student.findOne({ userId: req.user._id }));
        if (!student) {
          return res.status(404).json({ success: false, message: 'Student profile not found.' });
        }
        studentId = student._id;
      }

      const results = await Result.find({ studentId }).sort({ semester: 1 });
      const student = await Student.findById(studentId).populate('userId', 'name email').populate('departmentId', 'name code');

      return res.json({
        success: true,
        student,
        results,
        overallCGPA: student?.cgpa || 8.12,
        activeBacklogs: student?.backlogs || 0,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve examination results.' });
    }
  },

  // Publish semester result
  async publishResult(req, res) {
    try {
      const { studentId, semester, academicYear, sgpa, cgpa, totalCredits, earnedCredits, status, subjectGrades } = req.body;

      const result = await Result.findOneAndUpdate(
        { studentId, semester },
        {
          studentId,
          semester: Number(semester),
          academicYear: academicYear || '2025-2026',
          sgpa: Number(sgpa),
          cgpa: Number(cgpa),
          totalCredits: Number(totalCredits) || 24,
          earnedCredits: Number(earnedCredits) || 24,
          status: status || 'PASS',
          subjectGrades: subjectGrades || [],
        },
        { upsert: true, new: true }
      );

      // Update student aggregate cgpa & sgpa
      await Student.findByIdAndUpdate(studentId, { cgpa: Number(cgpa), sgpa: Number(sgpa) });

      return res.status(201).json({ success: true, message: 'Result published successfully.', result });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to publish result.' });
    }
  },
};

