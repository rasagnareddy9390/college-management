import { Exam, HallTicket, Student, Subject } from '../models/index.js';
import { pdfService } from '../services/pdfService.js';

export const examController = {
  // Get upcoming and active exam schedules
  async getExams(req, res) {
    try {
      const { semester } = req.query;
      const query = { isPublished: true };
      if (semester) query.semester = Number(semester);

      const exams = await Exam.find(query).populate('schedules.subjectId', 'name code credits').sort({ startDate: 1 });
      return res.json({ success: true, count: exams.length, exams });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve exams.' });
    }
  },

  // Get or issue Digital Hall Ticket
  async getHallTicket(req, res) {
    try {
      const student = req.student || (await Student.findOne({ userId: req.user._id }).populate('departmentId'));
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student record not found.' });
      }

      const exam = await Exam.findOne({ semester: student.semester, isPublished: true });
      if (!exam) {
        return res.status(404).json({ success: false, message: 'No published examination schedule for your semester.' });
      }

      const isEligible = student.attendancePercentage >= 75 && (student.cgpa || 8.0) >= 4.0;
      const ineligibilityReason = !isEligible ? 'Attendance shortage (<75%) in core semester subjects.' : '';

      const hallTicket = await HallTicket.findOneAndUpdate(
        { studentId: student._id, examId: exam._id },
        {
          studentId: student._id,
          examId: exam._id,
          hallTicketNumber: `HT-${student.rollNumber}-SEM${student.semester}`,
          qrVerificationCode: `VERIFIED-NRIIT-${student.rollNumber}-${exam._id}`,
          isEligible,
          ineligibilityReason,
        },
        { upsert: true, new: true }
      );

      const subjects = await Subject.find({ departmentId: student.departmentId?._id || student.departmentId, semester: student.semester });

      return res.json({
        success: true,
        hallTicket,
        exam,
        student,
        subjects,
      });
    } catch (err) {
      console.error('[Exam] getHallTicket error:', err);
      return res.status(500).json({ success: false, message: 'Failed to generate digital hall ticket.' });
    }
  },

  // Download official Hall Ticket PDF
  async downloadHallTicketPDF(req, res) {
    try {
      const student = req.student || (await Student.findOne({ userId: req.user._id }).populate('userId departmentId'));
      if (!student) return res.status(404).send('Student profile not found');

      const exam = await Exam.findOne({ semester: student.semester, isPublished: true });
      const hallTicket = await HallTicket.findOne({ studentId: student._id, examId: exam._id });
      const subjects = await Subject.find({ departmentId: student.departmentId?._id || student.departmentId, semester: student.semester });

      const pdfDoc = pdfService.createHallTicketPDF(student, exam, hallTicket, subjects);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="HallTicket_${student.rollNumber}.pdf"`);
      pdfDoc.pipe(res);
      pdfDoc.end();
    } catch (err) {
      return res.status(500).send('Error generating Hall Ticket PDF');
    }
  },
};

