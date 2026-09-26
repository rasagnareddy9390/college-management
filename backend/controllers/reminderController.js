import {
  Reminder,
  Notification,
  Assignment,
  UpcomingExam,
  LearningPlan,
} from '../models/index.js';

export const reminderController = {
  /**
   * Get all reminders for current user, including deadline health check
   */
  async getReminders(req, res) {
    try {
      const userId = req.user._id;
      const { category, status = 'all' } = req.query;

      const query = { userId };
      if (category && category !== 'All') {
        query.category = category;
      }
      if (status === 'active') {
        query.isCompleted = false;
      } else if (status === 'completed') {
        query.isCompleted = true;
      }

      const reminders = await Reminder.find(query).sort({ dueDate: 1 }).lean();

      // Run automated deadline check across assignments, exams, and plans
      const automatedDeadlines = await reminderController._checkAutomatedDeadlines(req.user);

      // Compute days remaining and overdue status for each reminder
      const now = new Date();
      const enriched = reminders.map((r) => {
        const due = new Date(r.dueDate);
        const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        let urgency = 'upcoming';
        if (r.isCompleted) {
          urgency = 'completed';
        } else if (diffDays < 0) {
          urgency = 'overdue';
        } else if (diffDays === 0) {
          urgency = 'today';
        } else if (diffDays <= 3) {
          urgency = 'critical';
        } else if (diffDays <= 7) {
          urgency = 'approaching';
        }

        return {
          ...r,
          daysRemaining: diffDays,
          urgency,
          isOverdue: !r.isCompleted && diffDays < 0,
        };
      });

      return res.json({
        success: true,
        reminders: enriched,
        automatedDeadlines,
      });
    } catch (err) {
      console.error('[ReminderController] getReminders error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve reminders.' });
    }
  },

  /**
   * Internal helper to scan deadlines and emit notifications (7d, 3d, 1d, today, overdue)
   */
  async _checkAutomatedDeadlines(user) {
    const deadlines = [];
    const now = new Date();

    try {
      // 1. Scan Personal Reminders
      const activeReminders = await Reminder.find({ userId: user._id, isCompleted: false });
      for (const rem of activeReminders) {
        const diffDays = Math.ceil((new Date(rem.dueDate) - now) / (1000 * 60 * 60 * 24));
        let stage = null;

        if (diffDays < 0) stage = 'overdue';
        else if (diffDays === 0) stage = 'today';
        else if (diffDays === 1) stage = '1d';
        else if (diffDays <= 3) stage = '3d';
        else if (diffDays <= 7) stage = '7d';

        if (stage && !rem.notifiedStages.includes(stage)) {
          rem.notifiedStages.push(stage);
          await rem.save();

          const label = stage === 'overdue' ? '⚠️ OVERDUE' : (stage === 'today' ? '🚨 DUE TODAY' : `⏰ DUE IN ${diffDays} DAYS`);
          await Notification.create({
            recipientId: user._id,
            recipientRole: user.role,
            title: `${label}: ${rem.title}`,
            message: `Reminder for "${rem.title}" is ${stage === 'overdue' ? 'past due' : `scheduled for ${new Date(rem.dueDate).toLocaleDateString()}`}.`,
            category: 'Reminder',
            priority: stage === 'overdue' || stage === 'today' ? 'URGENT' : 'IMPORTANT',
          }).catch(() => { });
        }

        deadlines.push({
          type: 'Personal Reminder',
          title: rem.title,
          dueDate: rem.dueDate,
          diffDays,
          priority: rem.priority,
        });
      }

      // 2. Scan Upcoming Exams
      const upcomingExams = await UpcomingExam.find({ examDate: { $gte: now }, isActive: true }).limit(5);
      for (const exam of upcomingExams) {
        const diffDays = Math.ceil((new Date(exam.examDate) - now) / (1000 * 60 * 60 * 24));
        deadlines.push({
          type: 'Exam',
          title: `${exam.subject} - ${exam.examName}`,
          dueDate: exam.examDate,
          diffDays,
          priority: 'High',
        });
      }

      // 3. Scan Active Learning Plans
      const plans = await LearningPlan.find({ userId: user._id, status: 'In Progress' }).limit(5);
      for (const plan of plans) {
        const diffDays = Math.ceil((new Date(plan.targetCompletionDate) - now) / (1000 * 60 * 60 * 24));
        deadlines.push({
          type: 'Skill Plan',
          title: plan.title,
          dueDate: plan.targetCompletionDate,
          diffDays,
          priority: 'Medium',
        });
      }
    } catch (err) {
      console.warn('[ReminderController] Deadline scan note:', err.message);
    }

    return deadlines.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  },

  /**
   * Create a new personal reminder
   */
  async createReminder(req, res) {
    try {
      const { title, description = '', dueDate, priority = 'Medium', category = 'Personal' } = req.body;
      const userId = req.user._id;

      if (!title || !dueDate) {
        return res.status(400).json({ success: false, message: 'Title and Due Date are required.' });
      }

      const reminder = await Reminder.create({
        userId,
        title: title.trim(),
        description: description.trim(),
        dueDate: new Date(dueDate),
        priority,
        category,
        isCompleted: false,
        notifiedStages: [],
      });

      return res.status(201).json({
        success: true,
        message: 'Reminder scheduled successfully!',
        reminder,
      });
    } catch (err) {
      console.error('[ReminderController] createReminder error:', err);
      return res.status(500).json({ success: false, message: 'Failed to create reminder.' });
    }
  },

  /**
   * Update a reminder
   */
  async updateReminder(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;
      const { title, description, dueDate, priority, category } = req.body;

      const reminder = await Reminder.findOne({ _id: id, userId });
      if (!reminder) {
        return res.status(404).json({ success: false, message: 'Reminder not found.' });
      }

      if (title) reminder.title = title.trim();
      if (description !== undefined) reminder.description = description.trim();
      if (dueDate) reminder.dueDate = new Date(dueDate);
      if (priority) reminder.priority = priority;
      if (category) reminder.category = category;

      await reminder.save();

      return res.json({
        success: true,
        message: 'Reminder updated successfully.',
        reminder,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to update reminder.' });
    }
  },

  /**
   * Toggle completion status
   */
  async toggleReminderStatus(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const reminder = await Reminder.findOne({ _id: id, userId });
      if (!reminder) {
        return res.status(404).json({ success: false, message: 'Reminder not found.' });
      }

      reminder.isCompleted = !reminder.isCompleted;
      reminder.completedAt = reminder.isCompleted ? new Date() : null;
      await reminder.save();

      return res.json({
        success: true,
        message: `Reminder marked as ${reminder.isCompleted ? 'completed' : 'active'}.`,
        reminder,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to update reminder status.' });
    }
  },

  /**
   * Delete a reminder
   */
  async deleteReminder(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const deleted = await Reminder.findOneAndDelete({ _id: id, userId });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Reminder not found.' });
      }

      return res.json({
        success: true,
        message: 'Reminder deleted successfully.',
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to delete reminder.' });
    }
  },
};

