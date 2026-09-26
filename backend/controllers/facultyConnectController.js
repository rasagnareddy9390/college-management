import mongoose from 'mongoose';
import {
  FacultyProfile,
  FacultyQuestion,
  QuestionMessage,
  User,
  Student,
  Faculty,
  Notification,
} from '../models/index.js';

export const facultyConnectController = {
  // 1. Get Faculty Directory with search & filters
  async getFacultyDirectory(req, res) {
    try {
      const { search, department, subject, designation, availableToday } = req.query;
      const query = {};

      if (department && department !== 'all') {
        query.department = { $regex: new RegExp(department, 'i') };
      }

      if (designation && designation !== 'all') {
        query.designation = { $regex: new RegExp(designation, 'i') };
      }

      if (availableToday === 'true') {
        query.isAvailable = true;
      }

      if (subject && subject !== 'all') {
        query.subjects = { $in: [new RegExp(subject, 'i')] };
      }

      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [
          { name: regex },
          { email: regex },
          { department: regex },
          { designation: regex },
          { subjects: { $in: [regex] } },
          { expertise: { $in: [regex] } },
          { qualification: regex },
        ];
      }

      const facultyList = await FacultyProfile.find(query)
        .sort({ experienceYears: -1, 'stats.rating': -1 })
        .lean();

      return res.json({
        success: true,
        count: facultyList.length,
        faculty: facultyList,
      });
    } catch (err) {
      console.error('[FacultyConnect] Error in getFacultyDirectory:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve faculty directory.' });
    }
  },

  // 2. Get Faculty by ID or User ID
  async getFacultyById(req, res) {
    try {
      const { id } = req.params;
      const isObjectId = mongoose.Types.ObjectId.isValid(id);

      const query = isObjectId
        ? { $or: [{ _id: id }, { userId: id }] }
        : { email: id.toLowerCase() };

      const profile = await FacultyProfile.findOne(query).lean();
      if (!profile) {
        return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
      }

      // Recent answered public questions stats or sample
      const answeredCount = await FacultyQuestion.countDocuments({
        facultyId: profile.userId,
        status: { $in: ['Answered', 'Resolved'] },
      });

      return res.json({
        success: true,
        faculty: {
          ...profile,
          stats: {
            ...profile.stats,
            questionsAnswered: Math.max(profile.stats?.questionsAnswered || 0, answeredCount),
          },
        },
      });
    } catch (err) {
      console.error('[FacultyConnect] Error in getFacultyById:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve faculty details.' });
    }
  },

  // 3. Get Faculty by Subject
  async getFacultyBySubject(req, res) {
    try {
      const { subject } = req.params;
      const regex = new RegExp(subject, 'i');
      const facultyList = await FacultyProfile.find({
        $or: [{ subjects: { $in: [regex] } }, { expertise: { $in: [regex] } }],
      }).lean();

      return res.json({
        success: true,
        count: facultyList.length,
        faculty: facultyList,
      });
    } catch (err) {
      console.error('[FacultyConnect] Error in getFacultyBySubject:', err);
      return res.status(500).json({ success: false, message: 'Failed to find faculty by subject.' });
    }
  },

  // 4. Get Current Authenticated Faculty Member's Own Profile
  async getMyProfile(req, res) {
    try {
      const userId = req.user._id;
      let profile = await FacultyProfile.findOne({ userId });

      // If user is faculty/hod and profile record doesn't exist yet, auto-create one
      if (!profile && ['faculty', 'hod', 'principal', 'admin', 'super_admin'].includes(req.user.role)) {
        const facRecord = await Faculty.findOne({ userId });
        profile = await FacultyProfile.create({
          userId,
          name: req.user.name,
          email: req.user.email,
          designation: facRecord?.designation || (req.user.role === 'hod' ? 'Professor & HOD' : 'Associate Professor'),
          department: 'Computer Science & Engineering',
          departmentCode: 'CSE',
          qualification: facRecord?.qualification || 'Ph.D. in Computer Science',
          experienceYears: facRecord?.experienceYears || 8,
          photo: req.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(req.user.name)}`,
          subjects: ['Java', 'Data Structures', 'Database Management Systems', 'Web Technologies'],
          expertise: ['Cloud Computing', 'Artificial Intelligence', 'Full Stack Development'],
          bio: 'Faculty member dedicated to academic excellence, student mentorship, and advanced systems research.',
          officeLocation: facRecord?.cabinNumber ? `Academic Block, Cabin ${facRecord.cabinNumber}` : 'Academic Block-B, Cabin 304',
          officeHours: '02:00 PM - 04:30 PM',
          availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          isAvailable: true,
          officeSchedule: [
            { day: 'Monday', timeSlot: '02:00 PM - 04:00 PM', room: 'Cabin 304', status: 'Available' },
            { day: 'Wednesday', timeSlot: '02:00 PM - 04:00 PM', room: 'Cabin 304', status: 'Available' },
            { day: 'Friday', timeSlot: '03:00 PM - 05:00 PM', room: 'Lab CS-2', status: 'Available' },
          ],
        });
      }

      return res.json({ success: true, profile });
    } catch (err) {
      console.error('[FacultyConnect] Error in getMyProfile:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
    }
  },

  // 5. Update Current Faculty Member's Own Profile
  async updateMyProfile(req, res) {
    try {
      const userId = req.user._id;
      const {
        bio,
        subjects,
        expertise,
        officeLocation,
        officeHours,
        availableDays,
        isAvailable,
        officeSchedule,
        designation,
        qualification,
        experienceYears,
      } = req.body;

      const updateData = {};
      if (bio !== undefined) updateData.bio = bio;
      if (designation !== undefined) updateData.designation = designation;
      if (qualification !== undefined) updateData.qualification = qualification;
      if (experienceYears !== undefined) updateData.experienceYears = Number(experienceYears);
      if (officeLocation !== undefined) updateData.officeLocation = officeLocation;
      if (officeHours !== undefined) updateData.officeHours = officeHours;
      if (isAvailable !== undefined) updateData.isAvailable = Boolean(isAvailable);

      if (subjects) {
        updateData.subjects = Array.isArray(subjects)
          ? subjects
          : String(subjects).split(',').map((s) => s.trim()).filter(Boolean);
      }

      if (expertise) {
        updateData.expertise = Array.isArray(expertise)
          ? expertise
          : String(expertise).split(',').map((e) => e.trim()).filter(Boolean);
      }

      if (availableDays) {
        updateData.availableDays = Array.isArray(availableDays)
          ? availableDays
          : String(availableDays).split(',').map((d) => d.trim()).filter(Boolean);
      }

      if (officeSchedule && Array.isArray(officeSchedule)) {
        updateData.officeSchedule = officeSchedule;
      }

      const profile = await FacultyProfile.findOneAndUpdate(
        { userId },
        { $set: updateData },
        { new: true, upsert: true }
      );

      return res.json({
        success: true,
        message: 'Faculty profile updated successfully.',
        profile,
      });
    } catch (err) {
      console.error('[FacultyConnect] Error in updateMyProfile:', err);
      return res.status(500).json({ success: false, message: 'Failed to update profile.' });
    }
  },

  // 6. Ask Question (Student / Authenticated Member)
  async askQuestion(req, res) {
    try {
      const studentUser = req.user;
      const { facultyId, subject, category, priority, title, body, isPrivate } = req.body;

      if (!facultyId || !subject || !title || !body) {
        return res.status(400).json({
          success: false,
          message: 'Faculty, subject, title, and question body are required.',
        });
      }

      // Resolve Faculty Member
      let targetFacultyUser = null;
      let targetFacultyProfile = null;

      if (mongoose.Types.ObjectId.isValid(facultyId)) {
        targetFacultyProfile = await FacultyProfile.findOne({
          $or: [{ _id: facultyId }, { userId: facultyId }],
        });
        if (targetFacultyProfile) {
          targetFacultyUser = await User.findById(targetFacultyProfile.userId);
        } else {
          targetFacultyUser = await User.findById(facultyId);
          if (targetFacultyUser) {
            targetFacultyProfile = await FacultyProfile.findOne({ userId: targetFacultyUser._id });
          }
        }
      }

      if (!targetFacultyUser) {
        return res.status(404).json({ success: false, message: 'Selected faculty member not found.' });
      }

      // Generate Unique Question ID (e.g. QST-2026-83921)
      const randomCode = Math.floor(10000 + Math.random() * 90000);
      const questionId = `QST-${new Date().getFullYear()}-${randomCode}`;

      // Handle File Attachments
      const attachments = [];
      if (req.files && Array.isArray(req.files)) {
        for (const f of req.files) {
          attachments.push({
            name: f.originalname,
            url: `/uploads/${f.filename}`,
            type: f.mimetype,
            size: f.size,
          });
        }
      }

      // Student metadata
      const studentRecord = await Student.findOne({ userId: studentUser._id });

      const newQuestion = await FacultyQuestion.create({
        questionId,
        studentId: studentUser._id,
        studentName: studentUser.name,
        studentEmail: studentUser.email,
        studentRollNo: studentRecord?.rollNumber || 'STU-GEN',
        studentDepartment: studentRecord?.branch || 'Computer Science & Engineering',
        facultyId: targetFacultyUser._id,
        facultyName: targetFacultyProfile?.name || targetFacultyUser.name,
        facultyDepartment: targetFacultyProfile?.department || 'Computer Science & Engineering',
        subject: subject.trim(),
        category: category || 'Concept Clarification',
        priority: priority || 'Normal',
        title: title.trim(),
        body: body.trim(),
        attachments,
        isPrivate: isPrivate === 'false' || isPrivate === false ? false : true,
        status: 'New',
        lastReplyAt: new Date(),
      });

      // Create Initial Message in the thread
      await QuestionMessage.create({
        questionId,
        senderId: studentUser._id,
        senderName: studentUser.name,
        senderRole: studentUser.role,
        senderAvatar: studentUser.avatar || '',
        message: body.trim(),
        attachments,
        isFacultyAnswer: false,
        createdAt: new Date(),
      });

      // Update Faculty active discussions stat
      if (targetFacultyProfile) {
        await FacultyProfile.findByIdAndUpdate(targetFacultyProfile._id, {
          $inc: { 'stats.activeDiscussions': 1 },
        });
      }

      // Create In-App Notification for Faculty Member
      try {
        const notifPriority = priority === 'Urgent' ? 'URGENT' : priority === 'Important' ? 'IMPORTANT' : 'ACADEMIC';
        await Notification.create({
          recipientId: targetFacultyUser._id,
          recipientRole: 'faculty',
          title: `New Question from ${studentUser.name}`,
          message: `${studentUser.name} asked on ${subject}: "${title.trim()}" [${questionId}]`,
          category: 'Faculty Connect',
          priority: notifPriority,
          isRead: false,
          link: `faculty.html#faculty-connect?qid=${questionId}`,
          questionId,
          metadata: { questionId, studentName: studentUser.name, subject },
        });
      } catch (notifErr) {
        console.warn('[FacultyConnect] Failed to dispatch faculty notification:', notifErr.message);
      }

      return res.status(201).json({
        success: true,
        message: 'Your question has been sent to faculty successfully.',
        question: newQuestion,
      });
    } catch (err) {
      console.error('[FacultyConnect] Error in askQuestion:', err);
      return res.status(500).json({ success: false, message: 'Failed to submit question.' });
    }
  },

  // 7. Get Questions Asked by Current Student / Member
  async getMyQuestions(req, res) {
    try {
      const studentId = req.user._id;
      const { status, priority, subject, search } = req.query;

      const query = { studentId };

      if (status && status !== 'all') {
        if (status === 'pending') {
          query.status = { $in: ['New', 'In Progress'] };
        } else if (status === 'answered') {
          query.status = 'Answered';
        } else if (status === 'resolved') {
          query.status = { $in: ['Resolved', 'Closed'] };
        } else {
          query.status = new RegExp(status, 'i');
        }
      }

      if (priority && priority !== 'all') {
        query.priority = priority;
      }

      if (subject && subject !== 'all') {
        query.subject = new RegExp(subject, 'i');
      }

      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [{ title: regex }, { body: regex }, { questionId: regex }, { facultyName: regex }];
      }

      const questions = await FacultyQuestion.find(query).sort({ updatedAt: -1, createdAt: -1 }).lean();

      return res.json({
        success: true,
        count: questions.length,
        questions,
      });
    } catch (err) {
      console.error('[FacultyConnect] Error in getMyQuestions:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve your questions.' });
    }
  },

  // 8. Get Questions Received by Faculty Member (or all for Admin)
  async getReceivedQuestions(req, res) {
    try {
      const { status, priority, subject, search } = req.query;
      const user = req.user;

      const query = {};
      const isAdmin = ['admin', 'super_admin', 'college_admin', 'principal'].includes(user.role);

      if (!isAdmin) {
        query.facultyId = user._id;
      }

      if (status && status !== 'all') {
        if (status === 'new' || status === 'unread') {
          query.status = 'New';
        } else if (status === 'in_progress') {
          query.status = 'In Progress';
        } else if (status === 'answered') {
          query.status = 'Answered';
        } else if (status === 'resolved') {
          query.status = { $in: ['Resolved', 'Closed'] };
        } else {
          query.status = new RegExp(status, 'i');
        }
      }

      if (priority && priority !== 'all') {
        query.priority = priority;
      }

      if (subject && subject !== 'all') {
        query.subject = new RegExp(subject, 'i');
      }

      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [{ title: regex }, { body: regex }, { questionId: regex }, { studentName: regex }];
      }

      const questions = await FacultyQuestion.find(query).sort({ updatedAt: -1, createdAt: -1 }).lean();

      // Counts summary for dashboard tabs
      const baseFilter = !isAdmin ? { facultyId: user._id } : {};
      const allCount = await FacultyQuestion.countDocuments(baseFilter);
      const newCount = await FacultyQuestion.countDocuments({ ...baseFilter, status: 'New' });
      const inProgressCount = await FacultyQuestion.countDocuments({ ...baseFilter, status: 'In Progress' });
      const answeredCount = await FacultyQuestion.countDocuments({ ...baseFilter, status: 'Answered' });
      const resolvedCount = await FacultyQuestion.countDocuments({ ...baseFilter, status: { $in: ['Resolved', 'Closed'] } });

      return res.json({
        success: true,
        count: questions.length,
        counts: {
          all: allCount,
          new: newCount,
          in_progress: inProgressCount,
          answered: answeredCount,
          resolved: resolvedCount,
        },
        questions,
      });
    } catch (err) {
      console.error('[FacultyConnect] Error in getReceivedQuestions:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve received questions.' });
    }
  },

  // 9. Get Single Question Details with Conversation Messages
  async getQuestionDetails(req, res) {
    try {
      const { id } = req.params;
      const isObjectId = mongoose.Types.ObjectId.isValid(id);

      const question = await FacultyQuestion.findOne({
        $or: [{ questionId: id }, ...(isObjectId ? [{ _id: id }] : [])],
      });

      if (!question) {
        return res.status(404).json({ success: false, message: 'Question not found.' });
      }

      // Access control: only student, faculty, admin, or public questions can be viewed
      const userIdStr = String(req.user._id);
      const isStudent = String(question.studentId) === userIdStr;
      const isFaculty = String(question.facultyId) === userIdStr;
      const isAdmin = ['admin', 'super_admin', 'college_admin', 'principal'].includes(req.user.role);

      if (question.isPrivate && !isStudent && !isFaculty && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'This question is private and accessible only to the student and faculty.',
        });
      }

      // If assigned faculty opens a 'New' question, mark as 'In Progress'
      if (isFaculty && question.status === 'New') {
        question.status = 'In Progress';
        await question.save();
      }

      // Fetch message history
      const messages = await QuestionMessage.find({ questionId: question.questionId })
        .sort({ createdAt: 1 })
        .lean();

      return res.json({
        success: true,
        question,
        messages,
      });
    } catch (err) {
      console.error('[FacultyConnect] Error in getQuestionDetails:', err);
      return res.status(500).json({ success: false, message: 'Failed to load question details.' });
    }
  },

  // 10. Post Message in Question Thread (Two-way communication)
  async postMessage(req, res) {
    try {
      const { id } = req.params;
      const { message } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Message content cannot be blank.' });
      }

      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const question = await FacultyQuestion.findOne({
        $or: [{ questionId: id }, ...(isObjectId ? [{ _id: id }] : [])],
      });

      if (!question) {
        return res.status(404).json({ success: false, message: 'Question not found.' });
      }

      const userIdStr = String(req.user._id);
      const isStudent = String(question.studentId) === userIdStr;
      const isFaculty = String(question.facultyId) === userIdStr;
      const isAdmin = ['admin', 'super_admin', 'college_admin', 'principal'].includes(req.user.role);

      if (!isStudent && !isFaculty && !isAdmin) {
        return res.status(403).json({ success: false, message: 'You are not authorized to reply to this question.' });
      }

      // Process uploaded files if any
      const attachments = [];
      if (req.files && Array.isArray(req.files)) {
        for (const f of req.files) {
          attachments.push({
            name: f.originalname,
            url: `/uploads/${f.filename}`,
            type: f.mimetype,
            size: f.size,
          });
        }
      }

      const newMessage = await QuestionMessage.create({
        questionId: question.questionId,
        senderId: req.user._id,
        senderName: req.user.name,
        senderRole: req.user.role,
        senderAvatar: req.user.avatar || '',
        message: message.trim(),
        attachments,
        isFacultyAnswer: false,
        createdAt: new Date(),
      });

      question.lastReplyAt = new Date();

      // If student replies to an already answered or resolved question, change status to In Progress
      if (isStudent && (question.status === 'Resolved' || question.status === 'Answered')) {
        question.status = 'In Progress';
      }
      await question.save();

      // Send In-App Notification to counterparty
      try {
        if (isStudent) {
          await Notification.create({
            recipientId: question.facultyId,
            recipientRole: 'faculty',
            title: `Reply from ${req.user.name}`,
            message: `${req.user.name} sent a follow-up reply on #${question.questionId} (${question.subject}).`,
            category: 'Faculty Connect',
            priority: 'IMPORTANT',
            isRead: false,
            link: `faculty.html#faculty-connect?qid=${question.questionId}`,
            questionId: question.questionId,
          });
        } else {
          await Notification.create({
            recipientId: question.studentId,
            recipientRole: 'student',
            title: `Reply from ${req.user.name}`,
            message: `Prof. ${req.user.name} replied to your question #${question.questionId}.`,
            category: 'Faculty Connect',
            priority: 'IMPORTANT',
            isRead: false,
            link: `student.html#faculty-connect?qid=${question.questionId}`,
            questionId: question.questionId,
          });
        }
      } catch (notifErr) {
        console.warn('[FacultyConnect] Failed to notify on reply:', notifErr.message);
      }

      return res.status(201).json({
        success: true,
        message: 'Message sent successfully.',
        newMessage,
        questionStatus: question.status,
      });
    } catch (err) {
      console.error('[FacultyConnect] Error in postMessage:', err);
      return res.status(500).json({ success: false, message: 'Failed to post message.' });
    }
  },

  // 11. Faculty Official Answer Submission
  async answerQuestion(req, res) {
    try {
      const { id } = req.params;
      const { answer } = req.body;

      if (!answer || !answer.trim()) {
        return res.status(400).json({ success: false, message: 'Answer content cannot be empty.' });
      }

      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const question = await FacultyQuestion.findOne({
        $or: [{ questionId: id }, ...(isObjectId ? [{ _id: id }] : [])],
      });

      if (!question) {
        return res.status(404).json({ success: false, message: 'Question not found.' });
      }

      const userIdStr = String(req.user._id);
      const isFaculty = String(question.facultyId) === userIdStr;
      const isAdmin = ['admin', 'super_admin', 'college_admin', 'principal'].includes(req.user.role);

      if (!isFaculty && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Only assigned faculty can provide an official answer.' });
      }

      // Process attachments
      const attachments = [];
      if (req.files && Array.isArray(req.files)) {
        for (const f of req.files) {
          attachments.push({
            name: f.originalname,
            url: `/uploads/${f.filename}`,
            type: f.mimetype,
            size: f.size,
          });
        }
      }

      // Create official answer message
      const officialMessage = await QuestionMessage.create({
        questionId: question.questionId,
        senderId: req.user._id,
        senderName: req.user.name,
        senderRole: req.user.role,
        senderAvatar: req.user.avatar || '',
        message: answer.trim(),
        attachments,
        isFacultyAnswer: true,
        createdAt: new Date(),
      });

      question.status = 'Answered';
      question.draftAnswer = { text: '', savedAt: null };
      question.lastReplyAt = new Date();
      await question.save();

      // Update Faculty Profile Stats
      await FacultyProfile.findOneAndUpdate(
        { userId: question.facultyId },
        {
          $inc: { 'stats.questionsAnswered': 1 },
        }
      );

      // Notify Student
      try {
        await Notification.create({
          recipientId: question.studentId,
          recipientRole: 'student',
          title: `Answer Received: ${question.title}`,
          message: `${req.user.name} posted an official answer to your question #${question.questionId} (${question.subject}).`,
          category: 'Faculty Connect',
          priority: 'IMPORTANT',
          isRead: false,
          link: `student.html#faculty-connect?qid=${question.questionId}`,
          questionId: question.questionId,
          metadata: { questionId: question.questionId },
        });
      } catch (notifErr) {
        console.warn('[FacultyConnect] Failed to notify student of answer:', notifErr.message);
      }

      return res.json({
        success: true,
        message: 'Official answer published successfully.',
        officialMessage,
        question,
      });
    } catch (err) {
      console.error('[FacultyConnect] Error in answerQuestion:', err);
      return res.status(500).json({ success: false, message: 'Failed to submit answer.' });
    }
  },

  // 12. Save Draft Answer
  async saveDraftAnswer(req, res) {
    try {
      const { id } = req.params;
      const { draftText } = req.body;

      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const question = await FacultyQuestion.findOne({
        $or: [{ questionId: id }, ...(isObjectId ? [{ _id: id }] : [])],
      });

      if (!question) {
        return res.status(404).json({ success: false, message: 'Question not found.' });
      }

      question.draftAnswer = {
        text: draftText || '',
        savedAt: new Date(),
      };
      await question.save();

      return res.json({
        success: true,
        message: 'Draft answer saved successfully.',
        draftAnswer: question.draftAnswer,
      });
    } catch (err) {
      console.error('[FacultyConnect] Error in saveDraftAnswer:', err);
      return res.status(500).json({ success: false, message: 'Failed to save draft.' });
    }
  },

  // 13. Mark as Resolved
  async resolveQuestion(req, res) {
    try {
      const { id } = req.params;
      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const question = await FacultyQuestion.findOne({
        $or: [{ questionId: id }, ...(isObjectId ? [{ _id: id }] : [])],
      });

      if (!question) {
        return res.status(404).json({ success: false, message: 'Question not found.' });
      }

      const userIdStr = String(req.user._id);
      const isStudent = String(question.studentId) === userIdStr;
      const isFaculty = String(question.facultyId) === userIdStr;
      const isAdmin = ['admin', 'super_admin', 'college_admin', 'principal'].includes(req.user.role);

      if (!isStudent && !isFaculty && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Not authorized to resolve this question.' });
      }

      question.status = 'Resolved';
      question.resolvedAt = new Date();
      await question.save();

      // Decrement active discussions if > 0
      await FacultyProfile.findOneAndUpdate(
        { userId: question.facultyId, 'stats.activeDiscussions': { $gt: 0 } },
        { $inc: { 'stats.activeDiscussions': -1 } }
      );

      // Notify the counterparty
      try {
        const notifyTarget = isStudent ? question.facultyId : question.studentId;
        const targetRole = isStudent ? 'faculty' : 'student';
        await Notification.create({
          recipientId: notifyTarget,
          recipientRole: targetRole,
          title: `Question Resolved: #${question.questionId}`,
          message: `Question "${question.title}" has been marked as resolved by ${req.user.name}.`,
          category: 'Faculty Connect',
          priority: 'COLLEGE',
          isRead: false,
          link: `${targetRole}.html#faculty-connect?qid=${question.questionId}`,
          questionId: question.questionId,
        });
      } catch (notifErr) { }

      return res.json({
        success: true,
        message: 'Question marked as resolved.',
        question,
      });
    } catch (err) {
      console.error('[FacultyConnect] Error in resolveQuestion:', err);
      return res.status(500).json({ success: false, message: 'Failed to resolve question.' });
    }
  },

  // 14. Reopen Question
  async reopenQuestion(req, res) {
    try {
      const { id } = req.params;
      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const question = await FacultyQuestion.findOne({
        $or: [{ questionId: id }, ...(isObjectId ? [{ _id: id }] : [])],
      });

      if (!question) {
        return res.status(404).json({ success: false, message: 'Question not found.' });
      }

      question.status = 'In Progress';
      question.resolvedAt = null;
      await question.save();

      // Notify faculty
      try {
        await Notification.create({
          recipientId: question.facultyId,
          recipientRole: 'faculty',
          title: `Question Reopened: #${question.questionId}`,
          message: `${req.user.name} reopened the discussion on "${question.title}".`,
          category: 'Faculty Connect',
          priority: 'IMPORTANT',
          isRead: false,
          link: `faculty.html#faculty-connect?qid=${question.questionId}`,
          questionId: question.questionId,
        });
      } catch (notifErr) { }

      return res.json({
        success: true,
        message: 'Question discussion reopened.',
        question,
      });
    } catch (err) {
      console.error('[FacultyConnect] Error in reopenQuestion:', err);
      return res.status(500).json({ success: false, message: 'Failed to reopen question.' });
    }
  },
};

