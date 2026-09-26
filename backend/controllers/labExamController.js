import { LabExam, LabQuestionBank, LabSubmission, Student, User } from '../models/index.js';
import { codeExecutionService } from '../services/codeExecutionService.js';

// Grade calculation helper
function calculateGrade(percentage) {
  if (percentage >= 90) return 'O';
  if (percentage >= 80) return 'A+';
  if (percentage >= 70) return 'A';
  if (percentage >= 60) return 'B+';
  if (percentage >= 50) return 'B';
  if (percentage >= 40) return 'C';
  return 'F';
}

export const labExamController = {
  // ==========================================
  // STUDENT ENDPOINTS
  // ==========================================

  /**
   * Get exams relevant to the current student
   */
  async getStudentExams(req, res) {
    try {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found for this account' });
      }

      // Find exams targeted at this student's department/semester/section or all
      const exams = await LabExam.find({
        status: { $in: ['published', 'active', 'completed', 'evaluated'] },
        $or: [
          { 'assignedTarget.type': 'all' },
          {
            'assignedTarget.type': 'department',
            'assignedTarget.department': student.department,
          },
          {
            'assignedTarget.type': 'section',
            'assignedTarget.department': student.department,
            'assignedTarget.semester': student.semester,
            'assignedTarget.section': student.section,
          },
          {
            'assignedTarget.type': 'specific_students',
            'assignedTarget.studentIds': student._id,
          },
        ],
      }).sort({ scheduledStart: 1 }).lean();

      // Check existing submission status for each exam
      const examIds = exams.map((e) => e._id);
      const submissions = await LabSubmission.find({
        examId: { $in: examIds },
        studentId: student._id,
      }).lean();

      const subMap = new Map();
      submissions.forEach((sub) => subMap.set(sub.examId.toString(), sub));

      const now = new Date();
      const enrichedExams = exams.map((exam) => {
        const sub = subMap.get(exam._id.toString());
        const start = new Date(exam.scheduledStart);
        const end = new Date(exam.scheduledEnd);

        let liveState = 'upcoming';
        if (now >= start && now <= end && exam.status !== 'completed') {
          liveState = 'active';
        } else if (now > end || exam.status === 'completed') {
          liveState = 'ended';
        }

        return {
          _id: exam._id,
          title: exam.title,
          examCode: exam.examCode,
          description: exam.description,
          subjectCode: exam.subjectCode,
          subjectName: exam.subjectName,
          durationMinutes: exam.durationMinutes,
          totalMarks: exam.totalMarks,
          questionCount: exam.questions?.length || 0,
          scheduledStart: exam.scheduledStart,
          scheduledEnd: exam.scheduledEnd,
          liveState,
          status: exam.status,
          submission: sub
            ? {
              status: sub.status,
              startedAt: sub.startedAt,
              submittedAt: sub.submittedAt,
              totalScore: sub.totalScore,
              percentage: sub.percentage,
              grade: sub.grade,
              canViewResult: exam.settings?.showResultImmediately || sub.status === 'evaluated',
            }
            : null,
        };
      });

      res.json({ success: true, count: enrichedExams.length, data: enrichedExams });
    } catch (err) {
      console.error('[labExamController.getStudentExams] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Get exam details and questions for an in-progress or starting exam
   * Conceals hidden test case details and solutions for student security
   */
  async getExamDetails(req, res) {
    try {
      const { id } = req.params;
      const exam = await LabExam.findById(id).lean();
      if (!exam) {
        return res.status(404).json({ success: false, message: 'Lab exam not found' });
      }

      const isStudent = req.user.role === 'student';
      let student = null;
      let submission = null;

      if (isStudent) {
        student = await Student.findOne({ userId: req.user._id });
        if (student) {
          submission = await LabSubmission.findOne({ examId: exam._id, studentId: student._id }).lean();
        }
      }

      // Sanitize questions for student view
      const sanitizedQuestions = (exam.questions || []).map((q, index) => {
        const base = {
          _id: q._id,
          questionNumber: index + 1,
          title: q.title,
          description: q.description,
          questionType: q.questionType,
          subjectCode: q.subjectCode,
          subjectName: q.subjectName,
          topic: q.topic,
          difficulty: q.difficulty,
          marks: q.marks,
          allowedLanguages: q.allowedLanguages,
          starterCode: q.starterCode,
          sqlSchema: q.sqlSchema,
        };

        if (isStudent) {
          // MCQ options: do not send isCorrect flag to student
          if (q.questionType === 'mcq') {
            base.mcqOptions = (q.mcqOptions || []).map((opt) => ({
              id: opt.id,
              text: opt.text,
            }));
          }
          // Programming test cases: only send non-hidden test cases
          if (q.questionType === 'programming' || q.questionType === 'debugging') {
            base.sampleTestCases = (q.testCases || [])
              .filter((tc) => !tc.isHidden)
              .map((tc) => ({
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                explanation: tc.explanation,
              }));
          }
        } else {
          // Faculty / Admin gets full access including hidden test cases and solutions
          base.testCases = q.testCases;
          base.solutionCode = q.solutionCode;
          base.mcqOptions = q.mcqOptions;
          base.rubric = q.rubric;
        }

        return base;
      });

      res.json({
        success: true,
        data: {
          _id: exam._id,
          title: exam.title,
          examCode: exam.examCode,
          description: exam.description,
          subjectCode: exam.subjectCode,
          subjectName: exam.subjectName,
          durationMinutes: exam.durationMinutes,
          totalMarks: exam.totalMarks,
          allowedLanguages: exam.allowedLanguages,
          instructions: exam.instructions,
          settings: exam.settings,
          scheduledStart: exam.scheduledStart,
          scheduledEnd: exam.scheduledEnd,
          questions: sanitizedQuestions,
          submission: submission || null,
        },
      });
    } catch (err) {
      console.error('[labExamController.getExamDetails] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Start an exam session for a student
   */
  async startExam(req, res) {
    try {
      const { id } = req.params;
      const exam = await LabExam.findById(id);
      if (!exam) {
        return res.status(404).json({ success: false, message: 'Lab exam not found' });
      }

      const student = await Student.findOne({ userId: req.user._id });
      if (!student) {
        return res.status(403).json({ success: false, message: 'Student profile not linked' });
      }

      // Check if submission already exists
      let submission = await LabSubmission.findOne({ examId: exam._id, studentId: student._id });
      if (!submission) {
        // Initialize default empty answers for each question
        const defaultAnswers = (exam.questions || []).map((q) => ({
          questionId: q._id.toString(),
          questionType: q.questionType,
          language: q.allowedLanguages?.[0] || 'javascript',
          code: q.starterCode?.[q.allowedLanguages?.[0] || 'javascript'] || '',
          mcqSelectedOption: '',
          textAnswer: '',
          testCasesPassed: 0,
          totalTestCases: (q.testCases || []).length,
          autoScore: 0,
          manualScore: 0,
          totalScore: 0,
          facultyRemarks: '',
          testResults: [],
        }));

        submission = await LabSubmission.create({
          examId: exam._id,
          studentId: student._id,
          userId: req.user._id,
          studentName: student.name || req.user.name,
          studentRollNumber: student.rollNumber || '',
          startedAt: new Date(),
          status: 'in_progress',
          answers: defaultAnswers,
          maxScore: exam.totalMarks,
        });
      } else if (submission.status === 'submitted' || submission.status === 'evaluated') {
        return res.status(400).json({
          success: false,
          message: 'Exam has already been submitted and finalized.',
          submission,
        });
      }

      // Compute remaining time in seconds
      const elapsedSeconds = Math.floor((Date.now() - new Date(submission.startedAt).getTime()) / 1000);
      const totalAllowedSeconds = exam.durationMinutes * 60;
      const remainingSeconds = Math.max(0, totalAllowedSeconds - elapsedSeconds);

      res.json({
        success: true,
        message: 'Exam session active',
        data: {
          submissionId: submission._id,
          startedAt: submission.startedAt,
          durationMinutes: exam.durationMinutes,
          remainingSeconds,
          answers: submission.answers,
          tabSwitchCount: submission.tabSwitchCount || 0,
        },
      });
    } catch (err) {
      console.error('[labExamController.startExam] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Run student code against sample test cases in the isolated sandbox
   */
  async runCode(req, res) {
    try {
      const { id: examId } = req.params;
      const { questionId, language, code, customInput } = req.body;

      if (!code) {
        return res.status(400).json({ success: false, message: 'Code content is required' });
      }

      const exam = await LabExam.findById(examId);
      if (!exam) {
        return res.status(404).json({ success: false, message: 'Lab exam not found' });
      }

      const question = exam.questions.id(questionId);
      if (!question) {
        return res.status(404).json({ success: false, message: 'Question not found in this exam' });
      }

      // If custom input is provided, run single test
      if (customInput !== undefined && customInput !== null && customInput.trim() !== '') {
        const runRes = await codeExecutionService.runSingle(language, code, customInput);
        return res.json({
          success: true,
          isCustomRun: true,
          data: runRes,
        });
      }

      // Otherwise run against visible/sample test cases
      const sampleCases = (question.testCases || []).filter((tc) => !tc.isHidden);
      if (sampleCases.length === 0) {
        // If no sample cases, execute once with default input
        const runRes = await codeExecutionService.runSingle(language, code, '');
        return res.json({
          success: true,
          isCustomRun: true,
          data: runRes,
        });
      }

      const evalRes = await codeExecutionService.evaluateTestCases(language, code, sampleCases, {
        isStudentView: true,
      });

      res.json({
        success: true,
        data: evalRes,
      });
    } catch (err) {
      console.error('[labExamController.runCode] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Auto-save answers draft and log tab switches periodically
   */
  async saveDraft(req, res) {
    try {
      const { id: examId } = req.params;
      const { answers, tabSwitchCount } = req.body;

      const student = await Student.findOne({ userId: req.user._id });
      if (!student) {
        return res.status(403).json({ success: false, message: 'Student profile not linked' });
      }

      const submission = await LabSubmission.findOne({ examId, studentId: student._id });
      if (!submission) {
        return res.status(404).json({ success: false, message: 'Active exam session not found' });
      }

      if (submission.status === 'submitted' || submission.status === 'evaluated') {
        return res.status(400).json({ success: false, message: 'Exam is already submitted' });
      }

      if (Array.isArray(answers)) {
        // Merge answers into submission
        answers.forEach((incoming) => {
          const existing = submission.answers.find((a) => a.questionId === incoming.questionId);
          if (existing) {
            if (incoming.language !== undefined) existing.language = incoming.language;
            if (incoming.code !== undefined) existing.code = incoming.code;
            if (incoming.mcqSelectedOption !== undefined) existing.mcqSelectedOption = incoming.mcqSelectedOption;
            if (incoming.textAnswer !== undefined) existing.textAnswer = incoming.textAnswer;
          } else {
            submission.answers.push(incoming);
          }
        });
      }

      if (typeof tabSwitchCount === 'number') {
        if (tabSwitchCount > submission.tabSwitchCount) {
          submission.tabSwitchLog.push({
            timestamp: new Date(),
            reason: `Tab switch event #${tabSwitchCount} recorded`,
          });
        }
        submission.tabSwitchCount = tabSwitchCount;
      }

      await submission.save();
      res.json({ success: true, message: 'Draft saved successfully', savedAt: new Date() });
    } catch (err) {
      console.error('[labExamController.saveDraft] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Submit exam: executes all test cases (sample + hidden), grades MCQs, and finalizes submission
   */
  async submitExam(req, res) {
    try {
      const { id: examId } = req.params;
      const { answers, tabSwitchCount, isAutoSubmit } = req.body;

      const student = await Student.findOne({ userId: req.user._id });
      if (!student) {
        return res.status(403).json({ success: false, message: 'Student profile not linked' });
      }

      const exam = await LabExam.findById(examId);
      if (!exam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }

      let submission = await LabSubmission.findOne({ examId, studentId: student._id });
      if (!submission) {
        submission = new LabSubmission({
          examId,
          studentId: student._id,
          userId: req.user._id,
          studentName: student.name || req.user.name,
          studentRollNumber: student.rollNumber || '',
          startedAt: new Date(),
          maxScore: exam.totalMarks,
        });
      }

      if (submission.status === 'submitted' || submission.status === 'evaluated') {
        return res.json({
          success: true,
          message: 'Exam already submitted previously.',
          data: submission,
        });
      }

      // Merge incoming answers
      if (Array.isArray(answers)) {
        answers.forEach((incoming) => {
          const existing = submission.answers.find((a) => a.questionId === incoming.questionId);
          if (existing) {
            if (incoming.language !== undefined) existing.language = incoming.language;
            if (incoming.code !== undefined) existing.code = incoming.code;
            if (incoming.mcqSelectedOption !== undefined) existing.mcqSelectedOption = incoming.mcqSelectedOption;
            if (incoming.textAnswer !== undefined) existing.textAnswer = incoming.textAnswer;
          } else {
            submission.answers.push(incoming);
          }
        });
      }

      if (typeof tabSwitchCount === 'number') {
        submission.tabSwitchCount = tabSwitchCount;
      }

      // Automated Evaluation of all questions
      let totalAutoScore = 0;
      let totalMaxMarks = 0;

      for (const question of exam.questions) {
        totalMaxMarks += question.marks || 10;
        const answer = submission.answers.find((a) => a.questionId === question._id.toString());
        if (!answer) continue;

        if (question.questionType === 'programming' || question.questionType === 'debugging') {
          const testCases = question.testCases || [];
          if (testCases.length > 0 && answer.code && answer.code.trim()) {
            const evalResult = await codeExecutionService.evaluateTestCases(
              answer.language || 'javascript',
              answer.code,
              testCases,
              { isStudentView: false }
            );

            answer.testCasesPassed = evalResult.passedCount;
            answer.totalTestCases = evalResult.totalTestCases;
            // Pro-rated marks according to test cases passed
            const questionScore = Math.round((evalResult.passedCount / evalResult.totalTestCases) * question.marks);
            answer.autoScore = questionScore;
            answer.totalScore = questionScore;
            answer.testResults = evalResult.results.map((r) => ({
              testCaseId: String(r.testCaseNumber),
              passed: r.passed,
              isHidden: r.isHidden,
              input: r.input,
              expectedOutput: r.expectedOutput,
              actualOutput: r.actualOutput,
              executionTimeMs: r.executionTimeMs,
              errorMessage: r.errorMessage,
            }));
            totalAutoScore += questionScore;
          } else {
            answer.testCasesPassed = 0;
            answer.totalTestCases = testCases.length;
            answer.autoScore = 0;
            answer.totalScore = 0;
          }
        } else if (question.questionType === 'mcq') {
          const correctOption = (question.mcqOptions || []).find((opt) => opt.isCorrect);
          if (correctOption && answer.mcqSelectedOption === correctOption.id) {
            answer.autoScore = question.marks;
            answer.totalScore = question.marks;
            totalAutoScore += question.marks;
          } else {
            answer.autoScore = 0;
            answer.totalScore = 0;
          }
        } else {
          // SQL / Viva / Observation questions: default to manual evaluation by faculty
          answer.autoScore = 0;
          answer.totalScore = 0;
        }
      }

      const totalMaxScore = totalMaxMarks > 0 ? totalMaxMarks : exam.totalMarks;
      const percentage = Math.round((totalAutoScore / totalMaxScore) * 100);

      submission.status = isAutoSubmit ? 'auto_submitted' : 'submitted';
      submission.submittedAt = new Date();
      submission.autoScore = totalAutoScore;
      submission.totalScore = totalAutoScore;
      submission.maxScore = totalMaxScore;
      submission.percentage = percentage;
      submission.grade = calculateGrade(percentage);

      await submission.save();

      res.json({
        success: true,
        message: isAutoSubmit ? 'Exam auto-submitted due to timer expiration.' : 'Exam submitted successfully!',
        data: {
          submissionId: submission._id,
          status: submission.status,
          submittedAt: submission.submittedAt,
          autoScore: submission.autoScore,
          maxScore: submission.maxScore,
          percentage: submission.percentage,
          grade: submission.grade,
          tabSwitchCount: submission.tabSwitchCount,
        },
      });
    } catch (err) {
      console.error('[labExamController.submitExam] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Get student's detailed exam result
   */
  async getStudentExamResult(req, res) {
    try {
      const { id: examId } = req.params;
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) {
        return res.status(403).json({ success: false, message: 'Student profile not linked' });
      }

      const exam = await LabExam.findById(examId).lean();
      if (!exam) {
        return res.status(404).json({ success: false, message: 'Lab exam not found' });
      }

      const submission = await LabSubmission.findOne({ examId, studentId: student._id }).lean();
      if (!submission) {
        return res.status(404).json({ success: false, message: 'No submission found for this exam' });
      }

      // Check visibility permission
      if (!exam.settings?.showResultImmediately && submission.status !== 'evaluated') {
        return res.json({
          success: true,
          isPendingEvaluation: true,
          message: 'Your submission has been recorded. Final results will be published after faculty evaluation.',
          data: {
            status: submission.status,
            submittedAt: submission.submittedAt,
          },
        });
      }

      // Prepare sanitized breakdown for student
      const questionsMap = new Map((exam.questions || []).map((q) => [q._id.toString(), q]));
      const breakdown = (submission.answers || []).map((ans) => {
        const q = questionsMap.get(ans.questionId);
        return {
          questionId: ans.questionId,
          title: q?.title || 'Question',
          questionType: ans.questionType,
          marks: q?.marks || 10,
          earnedScore: ans.totalScore || 0,
          testCasesPassed: ans.testCasesPassed || 0,
          totalTestCases: ans.totalTestCases || 0,
          language: ans.language,
          code: ans.code,
          textAnswer: ans.textAnswer,
          mcqSelectedOption: ans.mcqSelectedOption,
          facultyRemarks: ans.facultyRemarks || '',
          sampleTestResults: (ans.testResults || []).filter((tr) => !tr.isHidden),
        };
      });

      res.json({
        success: true,
        data: {
          examTitle: exam.title,
          examCode: exam.examCode,
          subjectName: exam.subjectName,
          status: submission.status,
          startedAt: submission.startedAt,
          submittedAt: submission.submittedAt,
          autoScore: submission.autoScore,
          manualScore: submission.manualScore,
          totalScore: submission.totalScore,
          maxScore: submission.maxScore,
          percentage: submission.percentage,
          grade: submission.grade,
          feedback: submission.feedback,
          tabSwitchCount: submission.tabSwitchCount,
          breakdown,
        },
      });
    } catch (err) {
      console.error('[labExamController.getStudentExamResult] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // ==========================================
  // FACULTY & ADMIN ENDPOINTS
  // ==========================================

  /**
   * Get all exams (Faculty / Admin view)
   */
  async getAllExams(req, res) {
    try {
      const { status, department } = req.query;
      const query = {};
      if (status) query.status = status;
      if (department) query.department = department;

      const exams = await LabExam.find(query).sort({ createdAt: -1 }).lean();

      // Enrich with submission counts
      const examIds = exams.map((e) => e._id);
      const submissions = await LabSubmission.aggregate([
        { $match: { examId: { $in: examIds } } },
        {
          $group: {
            _id: '$examId',
            totalSubmissions: { $sum: 1 },
            inProgressCount: {
              $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] },
            },
            submittedCount: {
              $sum: { $cond: [{ $in: ['$status', ['submitted', 'auto_submitted', 'evaluated']] }, 1, 0] },
            },
            avgScore: { $avg: '$totalScore' },
          },
        },
      ]);

      const subMap = new Map();
      submissions.forEach((s) => subMap.set(s._id.toString(), s));

      const enriched = exams.map((exam) => {
        const s = subMap.get(exam._id.toString()) || {
          totalSubmissions: 0,
          inProgressCount: 0,
          submittedCount: 0,
          avgScore: 0,
        };
        return {
          ...exam,
          stats: {
            totalSubmissions: s.totalSubmissions,
            inProgressCount: s.inProgressCount,
            submittedCount: s.submittedCount,
            avgScore: Math.round((s.avgScore || 0) * 10) / 10,
          },
        };
      });

      res.json({ success: true, count: enriched.length, data: enriched });
    } catch (err) {
      console.error('[labExamController.getAllExams] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Create a new Lab Exam
   */
  async createExam(req, res) {
    try {
      const {
        title,
        examCode,
        description,
        subjectCode,
        subjectName,
        department,
        semester,
        scheduledStart,
        scheduledEnd,
        durationMinutes,
        totalMarks,
        questions,
        assignedTarget,
        instructions,
        settings,
        allowedLanguages,
      } = req.body;

      if (!title || !examCode || !subjectCode || !subjectName || !durationMinutes) {
        return res.status(400).json({ success: false, message: 'Missing required exam fields' });
      }

      // Check examCode uniqueness
      const existing = await LabExam.findOne({ examCode: examCode.toUpperCase() });
      if (existing) {
        return res.status(400).json({ success: false, message: `Exam code ${examCode} is already in use` });
      }

      const newExam = await LabExam.create({
        title,
        examCode: examCode.toUpperCase(),
        description: description || '',
        subjectCode,
        subjectName,
        department: department || 'Computer Science & Engineering',
        semester: semester || 4,
        facultyId: req.user._id,
        scheduledStart: scheduledStart || new Date(),
        scheduledEnd: scheduledEnd || new Date(Date.now() + 7 * 24 * 3600 * 1000),
        durationMinutes: Number(durationMinutes) || 60,
        totalMarks: Number(totalMarks) || 50,
        questions: questions || [],
        assignedTarget: assignedTarget || { type: 'all' },
        instructions: instructions || undefined,
        settings: settings || undefined,
        allowedLanguages: allowedLanguages || ['javascript', 'python'],
        status: 'published',
      });

      res.status(201).json({ success: true, message: 'Lab Exam created successfully', data: newExam });
    } catch (err) {
      console.error('[labExamController.createExam] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Update an existing Lab Exam
   */
  async updateExam(req, res) {
    try {
      const { id } = req.params;
      const updated = await LabExam.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }
      res.json({ success: true, message: 'Lab Exam updated successfully', data: updated });
    } catch (err) {
      console.error('[labExamController.updateExam] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Delete an existing Lab Exam and its submissions
   */
  async deleteExam(req, res) {
    try {
      const { id } = req.params;
      const deleted = await LabExam.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }
      await LabSubmission.deleteMany({ examId: id });
      res.json({ success: true, message: 'Exam and all associated submissions deleted' });
    } catch (err) {
      console.error('[labExamController.deleteExam] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Duplicate an existing Lab Exam
   */
  async duplicateExam(req, res) {
    try {
      const { id } = req.params;
      const original = await LabExam.findById(id).lean();
      if (!original) {
        return res.status(404).json({ success: false, message: 'Original exam not found' });
      }

      delete original._id;
      delete original.createdAt;
      delete original.updatedAt;
      original.examCode = `${original.examCode}-COPY-${Date.now().toString().slice(-4)}`;
      original.title = `${original.title} (Copy)`;
      original.facultyId = req.user._id;
      original.status = 'draft';

      const copy = await LabExam.create(original);
      res.status(201).json({ success: true, message: 'Exam duplicated successfully', data: copy });
    } catch (err) {
      console.error('[labExamController.duplicateExam] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Start / Stop / Extend time of an ongoing exam
   */
  async updateExamStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, extendMinutes } = req.body;

      const exam = await LabExam.findById(id);
      if (!exam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }

      if (status) {
        exam.status = status;
      }

      if (extendMinutes && Number(extendMinutes) > 0) {
        exam.durationMinutes += Number(extendMinutes);
        exam.scheduledEnd = new Date(new Date(exam.scheduledEnd).getTime() + Number(extendMinutes) * 60 * 1000);
      }

      await exam.save();
      res.json({ success: true, message: 'Exam status updated successfully', data: exam });
    } catch (err) {
      console.error('[labExamController.updateExamStatus] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Real-time examinee monitoring dashboard
   */
  async getExamineeMonitoring(req, res) {
    try {
      const { id: examId } = req.params;
      const exam = await LabExam.findById(examId).lean();
      if (!exam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }

      const submissions = await LabSubmission.find({ examId })
        .populate('studentId', 'name rollNumber section department email')
        .sort({ submittedAt: -1, startedAt: -1 })
        .lean();

      const monitorList = submissions.map((sub) => {
        const studentInfo = sub.studentId || {};
        const totalQ = exam.questions?.length || 0;
        const answeredQ = (sub.answers || []).filter(
          (a) => (a.code && a.code.trim()) || a.mcqSelectedOption || a.textAnswer
        ).length;

        return {
          submissionId: sub._id,
          studentName: studentInfo.name || sub.studentName,
          studentRollNumber: studentInfo.rollNumber || sub.studentRollNumber,
          department: studentInfo.department || exam.department,
          section: studentInfo.section || 'A',
          status: sub.status,
          startedAt: sub.startedAt,
          submittedAt: sub.submittedAt,
          answeredCount: `${answeredQ} / ${totalQ}`,
          tabSwitchCount: sub.tabSwitchCount || 0,
          tabSwitchAlert: (sub.tabSwitchCount || 0) >= (exam.settings?.maxTabSwitches || 5),
          autoScore: sub.autoScore || 0,
          manualScore: sub.manualScore || 0,
          totalScore: sub.totalScore || 0,
          maxScore: sub.maxScore || exam.totalMarks,
          percentage: sub.percentage || 0,
          grade: sub.grade || 'Pending',
        };
      });

      res.json({
        success: true,
        examTitle: exam.title,
        examCode: exam.examCode,
        durationMinutes: exam.durationMinutes,
        status: exam.status,
        totalExaminees: monitorList.length,
        inProgress: monitorList.filter((m) => m.status === 'in_progress').length,
        submitted: monitorList.filter((m) => m.status === 'submitted' || m.status === 'auto_submitted').length,
        evaluated: monitorList.filter((m) => m.status === 'evaluated').length,
        examinees: monitorList,
      });
    } catch (err) {
      console.error('[labExamController.getExamineeMonitoring] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Get submissions for manual grading / review
   */
  async getSubmissions(req, res) {
    try {
      const { id: examId } = req.params;
      const submissions = await LabSubmission.find({ examId })
        .populate('studentId', 'name rollNumber section department')
        .populate('evaluatedBy', 'name')
        .sort({ submittedAt: -1 })
        .lean();

      res.json({ success: true, count: submissions.length, data: submissions });
    } catch (err) {
      console.error('[labExamController.getSubmissions] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Evaluate a student's submission (Viva marks, manual score override, feedback)
   */
  async evaluateSubmission(req, res) {
    try {
      const { id: examId, submissionId } = req.params;
      const { answerEvaluations, overallFeedback, publishResult } = req.body;

      const submission = await LabSubmission.findOne({ _id: submissionId, examId });
      if (!submission) {
        return res.status(404).json({ success: false, message: 'Submission not found' });
      }

      let totalManualScore = 0;

      if (Array.isArray(answerEvaluations)) {
        answerEvaluations.forEach((evalItem) => {
          const ans = submission.answers.find((a) => a.questionId === evalItem.questionId);
          if (ans) {
            if (evalItem.manualScore !== undefined) {
              ans.manualScore = Number(evalItem.manualScore) || 0;
              totalManualScore += ans.manualScore;
              ans.totalScore = (ans.autoScore || 0) + ans.manualScore;
            }
            if (evalItem.facultyRemarks) {
              ans.facultyRemarks = evalItem.facultyRemarks;
            }
          }
        });
      }

      submission.manualScore = totalManualScore;
      submission.totalScore = (submission.autoScore || 0) + totalManualScore;
      submission.percentage = Math.min(100, Math.round((submission.totalScore / (submission.maxScore || 50)) * 100));
      submission.grade = calculateGrade(submission.percentage);

      if (overallFeedback) {
        submission.feedback = overallFeedback;
      }

      submission.status = publishResult ? 'evaluated' : submission.status;
      submission.evaluatedBy = req.user._id;
      submission.evaluatedAt = new Date();

      await submission.save();

      res.json({
        success: true,
        message: publishResult ? 'Evaluation saved and results published!' : 'Draft evaluation saved',
        data: submission,
      });
    } catch (err) {
      console.error('[labExamController.evaluateSubmission] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // ==========================================
  // QUESTION BANK CRUD
  // ==========================================

  async getQuestionBank(req, res) {
    try {
      const { subjectCode, questionType, difficulty, search } = req.query;
      const query = {};
      if (subjectCode) query.subjectCode = subjectCode;
      if (questionType) query.questionType = questionType;
      if (difficulty) query.difficulty = difficulty;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { topic: { $regex: search, $options: 'i' } },
        ];
      }

      const questions = await LabQuestionBank.find(query).sort({ createdAt: -1 }).lean();
      res.json({ success: true, count: questions.length, data: questions });
    } catch (err) {
      console.error('[labExamController.getQuestionBank] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createQuestionBankItem(req, res) {
    try {
      const item = await LabQuestionBank.create({
        ...req.body,
        createdBy: req.user._id,
      });
      res.status(201).json({ success: true, message: 'Question saved to bank', data: item });
    } catch (err) {
      console.error('[labExamController.createQuestionBankItem] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateQuestionBankItem(req, res) {
    try {
      const { id } = req.params;
      const updated = await LabQuestionBank.findByIdAndUpdate(id, req.body, { new: true });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Question not found' });
      }
      res.json({ success: true, message: 'Question updated in bank', data: updated });
    } catch (err) {
      console.error('[labExamController.updateQuestionBankItem] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteQuestionBankItem(req, res) {
    try {
      const { id } = req.params;
      const deleted = await LabQuestionBank.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Question not found' });
      }
      res.json({ success: true, message: 'Question deleted from bank' });
    } catch (err) {
      console.error('[labExamController.deleteQuestionBankItem] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

