import {
  Skill,
  SkillResource,
  LearningPlan,
  TypingSession,
  LearningSession,
  Certificate,
  Notification,
  Student,
} from '../models/index.js';
import { get30DayCurriculum } from '../config/curriculumData.js';

export const skillController = {
  /**
   * Get all skills catalog with category & search filter
   */
  async getSkills(req, res) {
    try {
      const { category, level, search } = req.query;
      const query = { isActive: true };

      if (category && category !== 'All') {
        query.category = category;
      }
      if (level && level !== 'All') {
        query.level = level;
      }
      if (search) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [{ title: regex }, { description: regex }, { tags: regex }];
      }

      const skills = await Skill.find(query).sort({ title: 1 }).lean();

      // Check user's active learning plans if authenticated
      let userPlans = [];
      if (req.user) {
        userPlans = await LearningPlan.find({ userId: req.user._id }).select('skillId status progressPercent').lean();
      }

      const planMap = new Map(userPlans.map((p) => [String(p.skillId), p]));
      const enrichedSkills = skills.map((s) => ({
        ...s,
        userPlan: planMap.get(String(s._id)) || null,
      }));

      return res.json({ success: true, skills: enrichedSkills });
    } catch (err) {
      console.error('[SkillController] getSkills error:', err);
      return res.status(500).json({ success: false, message: 'Failed to load skills.' });
    }
  },

  /**
   * Get single skill details with syllabus
   */
  async getSkillById(req, res) {
    try {
      const { id } = req.params;
      const skill = await Skill.findById(id).lean();
      if (!skill) {
        return res.status(404).json({ success: false, message: 'Skill not found.' });
      }

      const resources = await SkillResource.find({ skillId: skill._id }).lean();
      let userPlan = null;
      if (req.user) {
        userPlan = await LearningPlan.findOne({ userId: req.user._id, skillId: skill._id }).lean();
      }

      return res.json({
        success: true,
        skill: {
          ...skill,
          resources,
          userPlan,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch skill details.' });
    }
  },

  /**
   * Get Free Learning Resources Catalog
   */
  async getResources(req, res) {
    try {
      const { category, type, search } = req.query;
      const query = { isFree: true };

      if (category && category !== 'All') {
        query.category = category;
      }
      if (type && type !== 'All') {
        query.type = type;
      }
      if (search) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [{ title: regex }, { description: regex }, { provider: regex }];
      }

      const resources = await SkillResource.find(query).sort({ createdAt: -1 }).lean();
      return res.json({ success: true, resources });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to load resources.' });
    }
  },

  /**
   * Start or Enroll in a 30-Day Learning Plan
   */
  async enrollPlan(req, res) {
    try {
      const { skillId, title, category, targetDays = 30 } = req.body;
      const userId = req.user._id;

      let skill = null;
      if (skillId) {
        skill = await Skill.findById(skillId);
      }

      const planTitle = title || (skill ? skill.title : '30-Day Mastery Track');
      const planCategory = category || (skill ? skill.category : 'Technical');

      // Check if plan already exists for this user and skill
      let plan = await LearningPlan.findOne({
        userId,
        ...(skillId ? { skillId } : { title: planTitle }),
        status: { $in: ['In Progress', 'Paused'] },
      });

      if (plan) {
        return res.json({ success: true, message: 'You already have an active plan for this skill.', plan });
      }

      // Generate 30 days checklist from curated curriculum
      const curatedSyllabus = get30DayCurriculum(planTitle, planCategory);
      const checklist = [];
      const totalDays = Number(targetDays) || 30;
      for (let day = 1; day <= totalDays; day++) {
        const item = curatedSyllabus[day - 1] || {};
        checklist.push({
          day,
          title: item.title || `Day ${day}: Practical Application`,
          isCompleted: false,
          notes: '',
          taskDescription: item.taskDescription || 'Study core concepts and complete practical task.',
          taskUrl: item.taskUrl || `https://www.google.com/search?q=${encodeURIComponent(planTitle + ' day ' + day)}+tutorial`,
          videoUrl: item.videoUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(planTitle + ' day ' + day)}`,
        });
      }

      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + totalDays);

      plan = await LearningPlan.create({
        userId,
        skillId: skill ? skill._id : undefined,
        title: planTitle,
        category: planCategory,
        startDate: new Date(),
        targetCompletionDate: targetDate,
        totalDays,
        completedDays: [],
        dailyChecklist: checklist,
        status: 'In Progress',
        progressPercent: 0,
      });

      return res.status(201).json({
        success: true,
        message: `Enrolled successfully in 30-day ${planTitle} track!`,
        plan,
      });
    } catch (err) {
      console.error('[SkillController] enrollPlan error:', err);
      return res.status(500).json({ success: false, message: 'Failed to enroll in learning plan.' });
    }
  },

  /**
   * Get Current User's Learning Plans
   */
  async getUserPlans(req, res) {
    try {
      const userId = req.user._id;
      const plans = await LearningPlan.find({ userId })
        .populate('skillId', 'title icon slug category')
        .sort({ updatedAt: -1 })
        .lean();

      // Compute days remaining and enrich daily checklist items with rich descriptions & links
      const now = new Date();
      const enrichedPlans = plans.map((p) => {
        const target = new Date(p.targetCompletionDate);
        const diffTime = target - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isOverdue = diffDays < 0 && p.status === 'In Progress';

        const curatedSyllabus = get30DayCurriculum(p.title, p.category);
        const enrichedChecklist = (p.dailyChecklist || []).map((item) => {
          const match = curatedSyllabus[item.day - 1] || {};
          const isGeneric = !item.title || (item.title.startsWith('Day ') && item.title.includes('Core Concepts'));
          return {
            ...item,
            title: isGeneric ? (match.title || item.title) : item.title,
            taskDescription: item.taskDescription || match.taskDescription || 'Study the daily topic and complete practical exercises.',
            taskUrl: item.taskUrl || match.taskUrl || `https://www.google.com/search?q=${encodeURIComponent(p.title + ' day ' + item.day)}+tutorial`,
            videoUrl: item.videoUrl || match.videoUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(p.title + ' day ' + item.day)}`,
          };
        });

        return {
          ...p,
          dailyChecklist: enrichedChecklist,
          daysRemaining: diffDays > 0 ? diffDays : 0,
          isOverdue,
          overdueDays: diffDays < 0 ? Math.abs(diffDays) : 0,
        };
      });

      return res.json({ success: true, plans: enrichedPlans });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch user learning plans.' });
    }
  },

  /**
   * Toggle completion of a specific day in the learning checklist
   */
  async toggleChecklistDay(req, res) {
    try {
      const { planId, day } = req.params;
      const { isCompleted, notes } = req.body;
      const userId = req.user._id;

      const plan = await LearningPlan.findOne({ _id: planId, userId });
      if (!plan) {
        return res.status(404).json({ success: false, message: 'Learning plan not found.' });
      }

      const dayNumber = Number(day);
      const targetItem = plan.dailyChecklist.find((item) => item.day === dayNumber);
      if (!targetItem) {
        return res.status(404).json({ success: false, message: `Day ${day} not found in this plan.` });
      }

      targetItem.isCompleted = typeof isCompleted === 'boolean' ? isCompleted : !targetItem.isCompleted;
      if (targetItem.isCompleted) {
        targetItem.completedAt = new Date();
        if (!plan.completedDays.includes(dayNumber)) {
          plan.completedDays.push(dayNumber);
        }
      } else {
        targetItem.completedAt = undefined;
        plan.completedDays = plan.completedDays.filter((d) => d !== dayNumber);
      }

      if (notes !== undefined) {
        targetItem.notes = String(notes);
      }

      // Recompute progress %
      const completedCount = plan.dailyChecklist.filter((i) => i.isCompleted).length;
      plan.progressPercent = Math.round((completedCount / plan.totalDays) * 100);

      // Check if complete
      if (plan.progressPercent === 100 && plan.status !== 'Completed') {
        plan.status = 'Completed';
        plan.certificateEarned = true;
        plan.certificateUrl = `https://nriit.edu.in/certificates/verify?planId=${plan._id}`;

        // Notify user about certificate completion
        await Notification.create({
          recipientId: userId,
          recipientRole: req.user.role,
          title: `🏆 Skill Certificate Earned: ${plan.title}`,
          message: `Congratulations! You have completed all 30 days of ${plan.title}. Your certificate of completion is now ready in your profile.`,
          category: 'Skill',
          priority: 'IMPORTANT',
        });
      }

      await plan.save();

      return res.json({
        success: true,
        message: `Day ${dayNumber} marked as ${targetItem.isCompleted ? 'completed' : 'incomplete'}.`,
        plan,
      });
    } catch (err) {
      console.error('[SkillController] toggleChecklistDay error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update checklist day.' });
    }
  },

  /**
   * Save a Typing Practice Session
   */
  async saveTypingSession(req, res) {
    try {
      const {
        durationMinutes,
        wpm,
        netWpm,
        accuracy,
        charactersTyped,
        errorsCount,
        sampleTextUsed,
      } = req.body;
      const userId = req.user._id;

      if (!durationMinutes || wpm === undefined || accuracy === undefined) {
        return res.status(400).json({ success: false, message: 'Duration, WPM, and Accuracy are required.' });
      }

      const session = await TypingSession.create({
        userId,
        durationMinutes: Number(durationMinutes),
        wpm: Number(wpm),
        netWpm: Number(netWpm || wpm),
        accuracy: Number(accuracy),
        charactersTyped: Number(charactersTyped || 0),
        errorsCount: Number(errorsCount || 0),
        sampleTextUsed: sampleTextUsed || '',
        date: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: 'Typing practice session saved successfully!',
        session,
      });
    } catch (err) {
      console.error('[SkillController] saveTypingSession error:', err);
      return res.status(500).json({ success: false, message: 'Failed to save typing session.' });
    }
  },

  /**
   * Get User's Typing Practice Stats & History
   */
  async getTypingStats(req, res) {
    try {
      const userId = req.user._id;
      const sessions = await TypingSession.find({ userId })
        .sort({ date: -1 })
        .limit(20)
        .lean();

      if (sessions.length === 0) {
        return res.json({
          success: true,
          stats: {
            totalSessions: 0,
            bestWpm: 0,
            averageWpm: 0,
            averageAccuracy: 0,
            totalCharacters: 0,
          },
          history: [],
        });
      }

      const totalSessions = sessions.length;
      const bestWpm = Math.max(...sessions.map((s) => s.wpm || 0));
      const totalWpm = sessions.reduce((acc, curr) => acc + (curr.wpm || 0), 0);
      const totalAcc = sessions.reduce((acc, curr) => acc + (curr.accuracy || 0), 0);
      const totalCharacters = sessions.reduce((acc, curr) => acc + (curr.charactersTyped || 0), 0);

      const averageWpm = Math.round(totalWpm / totalSessions);
      const averageAccuracy = Math.round(totalAcc / totalSessions);

      return res.json({
        success: true,
        stats: {
          totalSessions,
          bestWpm,
          averageWpm,
          averageAccuracy,
          totalCharacters,
        },
        history: sessions,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve typing stats.' });
    }
  },

  /**
   * Log a Study / Pomodoro Session
   */
  async logStudySession(req, res) {
    try {
      const { type = 'Pomodoro', durationMinutes = 25, focusTask = 'Skill Practice' } = req.body;
      const userId = req.user._id;

      const session = await LearningSession.create({
        userId,
        type,
        durationMinutes: Number(durationMinutes),
        focusTask,
        completedAt: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: 'Study session logged successfully!',
        session,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to log study session.' });
    }
  },

  /**
   * Get Study Sessions Overview (Total hours, streaks)
   */
  async getStudyOverview(req, res) {
    try {
      const userId = req.user._id;
      const sessions = await LearningSession.find({ userId }).sort({ completedAt: -1 }).lean();

      const totalMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
      const totalHours = (totalMinutes / 60).toFixed(1);

      return res.json({
        success: true,
        overview: {
          totalSessions: sessions.length,
          totalMinutes,
          totalHours,
          recentSessions: sessions.slice(0, 10),
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch study overview.' });
    }
  },

  /**
   * Get Certificates
   */
  async getCertificates(req, res) {
    try {
      const userId = req.user._id;
      const certs = await Certificate.find({ userId }).sort({ issueDate: -1 }).lean();

      // Also gather completed learning plans
      const completedPlans = await LearningPlan.find({ userId, status: 'Completed' }).lean();

      return res.json({
        success: true,
        certificates: certs,
        completedPlans,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to load certificates.' });
    }
  },

  /**
   * Add / Track a New Certificate
   */
  async addCertificate(req, res) {
    try {
      const { title, issuer, issueDate, credentialUrl, category } = req.body;
      const userId = req.user._id;

      if (!title || !issuer) {
        return res.status(400).json({ success: false, message: 'Title and issuer are required.' });
      }

      const cert = await Certificate.create({
        userId,
        title: title.trim(),
        issuer: issuer.trim(),
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        credentialUrl: credentialUrl ? credentialUrl.trim() : '',
        category: category || 'Technical',
        verificationStatus: 'Self-Reported',
      });

      return res.status(201).json({
        success: true,
        message: 'Certificate recorded successfully!',
        certificate: cert,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to record certificate.' });
    }
  },

  /**
   * Skill Recommendations based on branch and enrolled tracks
   */
  async getRecommendations(req, res) {
    try {
      const userId = req.user._id;
      let branch = 'Computer Science & Engineering';

      const student = await Student.findOne({ userId });
      if (student && student.branch) {
        branch = student.branch;
      }

      const activePlans = await LearningPlan.find({ userId }).select('skillId');
      const enrolledSkillIds = activePlans.map((p) => p.skillId).filter(Boolean);

      // Recommend un-enrolled skills in high-demand areas
      const recommendations = await Skill.find({
        _id: { $nin: enrolledSkillIds },
        isActive: true,
      })
        .limit(6)
        .lean();

      return res.json({
        success: true,
        branch,
        recommendations,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to compute recommendations.' });
    }
  },
};

