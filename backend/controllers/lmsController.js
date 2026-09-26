import { StudyMaterial, LMSCourse, LMSProgress, Quiz, QuizAttempt, QuestionBank, Student, Subject } from '../models/index.js';
import { aiService } from '../services/aiService.js';

export const lmsController = {
  // 1. Study Materials
  async getStudyMaterials(req, res) {
    try {
      const { subjectId, unit, fileType } = req.query;
      const query = {};
      if (subjectId) query.subjectId = subjectId;
      if (unit) query.unit = Number(unit);
      if (fileType) query.fileType = fileType;

      const materials = await StudyMaterial.find(query)
        .populate('subjectId', 'name code')
        .populate('uploadedBy', 'name email')
        .sort({ createdAt: -1 });

      return res.json({ success: true, count: materials.length, materials });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve study materials.' });
    }
  },

  async uploadStudyMaterial(req, res) {
    try {
      const { subjectId, title, unit, topic, fileType, fileUrl } = req.body;
      const uploadedBy = req.user._id;

      const material = await StudyMaterial.create({
        subjectId,
        uploadedBy,
        title,
        unit: Number(unit) || 1,
        topic: topic || 'General Topic',
        fileType: fileType || 'PDF',
        fileUrl: fileUrl || req.file?.path || 'https://storage.nriit.ac.in/materials/lecture_note.pdf',
      });

      return res.status(201).json({ success: true, message: 'Material published successfully.', material });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to upload study material.' });
    }
  },

  // 2. LMS Courses & Interactive Progress
  async getCourses(req, res) {
    try {
      const courses = await LMSCourse.find().populate('subjectId instructorId', 'name email code');
      let progressMap = new Map();

      if (req.user.role === 'student') {
        const student = req.student || (await Student.findOne({ userId: req.user._id }));
        if (student) {
          const userProgress = await LMSProgress.find({ studentId: student._id });
          userProgress.forEach((p) => progressMap.set(String(p.courseId), p.progressPercentage));
        }
      }

      const enriched = courses.map((c) => ({
        ...c.toObject(),
        myProgress: progressMap.get(String(c._id)) || 0,
      }));

      return res.json({ success: true, count: enriched.length, courses: enriched });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve LMS courses.' });
    }
  },

  // Update lesson progress
  async updateProgress(req, res) {
    try {
      const { courseId, lessonTitle, percentage } = req.body;
      const student = req.student || (await Student.findOne({ userId: req.user._id }));
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found.' });
      }

      const progress = await LMSProgress.findOneAndUpdate(
        { courseId, studentId: student._id },
        {
          $addToSet: { completedLessons: lessonTitle },
          $set: { progressPercentage: Math.min(100, Number(percentage) || 10) },
        },
        { upsert: true, new: true }
      );

      return res.json({ success: true, progress });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to update progress.' });
    }
  },

  // 3. Quizzes & Timed Assessments
  async getQuizzes(req, res) {
    try {
      const { subjectId } = req.query;
      const query = subjectId ? { subjectId } : {};
      const quizzes = await Quiz.find(query).populate('subjectId', 'name code').sort({ createdAt: -1 });

      return res.json({ success: true, count: quizzes.length, quizzes });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to load quizzes.' });
    }
  },

  async submitQuiz(req, res) {
    try {
      const { quizId, answers } = req.body; // answers: [{ questionId, selectedIndex }]
      const student = req.student || (await Student.findOne({ userId: req.user._id }));

      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({ success: false, message: 'Quiz not found.' });
      }

      let score = 0;
      const evaluatedAnswers = (answers || []).map((ans) => {
        const q = quiz.questions.id(ans.questionId);
        const isCorrect = q && q.correctOptionIndex === ans.selectedIndex;
        if (isCorrect) score += q.marks || 1;
        return {
          questionId: ans.questionId,
          selectedIndex: ans.selectedIndex,
          isCorrect: !!isCorrect,
        };
      });

      const attempt = await QuizAttempt.create({
        quizId,
        studentId: student._id,
        score,
        totalScore: quiz.totalMarks,
        answers: evaluatedAnswers,
      });

      return res.json({
        success: true,
        message: `Quiz completed! You scored ${score} / ${quiz.totalMarks}.`,
        score,
        totalScore: quiz.totalMarks,
        attempt,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to submit quiz attempt.' });
    }
  },

  // 4. Question Bank & AI Exam Paper Synthesizer
  async getQuestionBank(req, res) {
    try {
      const { subjectId, unit, difficulty, type } = req.query;
      const query = {};
      if (subjectId) query.subjectId = subjectId;
      if (unit) query.unit = Number(unit);
      if (difficulty) query.difficulty = difficulty;
      if (type) query.type = type;

      const questions = await QuestionBank.find(query).populate('subjectId', 'name code');
      return res.json({ success: true, count: questions.length, questions });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to load question bank.' });
    }
  },

  async generateQuestionPaper(req, res) {
    try {
      const { subjectId, unit, marks } = req.body;
      const subject = await Subject.findById(subjectId);
      const subjectName = subject ? `${subject.name} (${subject.code})` : 'Engineering Curriculum Subject';

      const paper = await aiService.generateQuestionPaper(subjectName, unit, marks);
      return res.json({ success: true, paper });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to synthesize question paper.' });
    }
  },
};

