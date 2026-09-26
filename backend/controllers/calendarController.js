import { Holiday, AcademicEvent } from '../models/index.js';

export const calendarController = {
  // Get holidays list
  async getHolidays(req, res) {
    try {
      const holidays = await Holiday.find().sort({ startDate: 1 });
      return res.json({ success: true, count: holidays.length, holidays });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve holidays.' });
    }
  },

  // Get academic events calendar
  async getAcademicCalendar(req, res) {
    try {
      const events = await AcademicEvent.find().sort({ startDate: 1 });
      return res.json({ success: true, count: events.length, events });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve academic calendar.' });
    }
  },

  // Add holiday (Admin)
  async createHoliday(req, res) {
    try {
      const holiday = await Holiday.create(req.body);
      return res.status(201).json({ success: true, holiday });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to create holiday.' });
    }
  },
};

