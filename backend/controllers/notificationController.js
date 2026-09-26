import { Notification } from '../models/index.js';

export const notificationController = {
  // Get notifications for current user with priority filtering
  async getNotifications(req, res) {
    try {
      const userRole = req.user?.role || 'student';
      const userId = req.user?._id;
      const { priority, category } = req.query;

      const query = {
        $or: [{ recipientRole: 'all' }, { recipientRole: userRole }, { recipientId: userId }],
      };

      if (priority) query.priority = priority;
      if (category) query.category = category;

      const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(40);
      const unreadCount = notifications.filter((n) => !n.isRead).length;

      return res.json({ success: true, count: notifications.length, unreadCount, notifications });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
    }
  },

  // Mark notification as read
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      if (id === 'all') {
        await Notification.updateMany({ recipientId: req.user._id }, { isRead: true });
        return res.json({ success: true, message: 'All notifications marked as read.' });
      }

      await Notification.findByIdAndUpdate(id, { isRead: true });
      return res.json({ success: true, message: 'Notification marked as read.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to update notification.' });
    }
  },

  // Create & broadcast notification (Admin/Faculty)
  async createNotification(req, res) {
    try {
      const { title, message, category, priority, recipientRole } = req.body;
      const notification = await Notification.create({
        title,
        message,
        category: category || 'College Announcements',
        priority: priority || 'COLLEGE',
        recipientRole: recipientRole || 'all',
      });

      return res.status(201).json({ success: true, notification });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to publish notification.' });
    }
  },
};

