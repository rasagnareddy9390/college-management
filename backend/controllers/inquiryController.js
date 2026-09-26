import { Inquiry } from '../models/index.js';

export const inquiryController = {
  // Public submission of admission inquiry from College Website
  async submitInquiry(req, res) {
    try {
      const { name, email, phone, courseInterested, city, message } = req.body;

      if (!name || !email || !phone || !courseInterested) {
        return res.status(400).json({
          success: false,
          message: 'Please provide your name, email, phone, and course of interest.',
        });
      }

      const inquiry = await Inquiry.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        courseInterested,
        city: city || '',
        message: message || '',
        status: 'New',
      });

      return res.status(201).json({
        success: true,
        message: 'Thank you! Your admission enquiry has been submitted. Our counseling team will reach out shortly.',
        inquiry,
      });
    } catch (err) {
      console.error('[Inquiry] submitInquiry error:', err);
      return res.status(500).json({ success: false, message: 'Failed to submit admission enquiry.' });
    }
  },

  // Admin view all admission inquiries
  async getInquiries(req, res) {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const query = status ? { status } : {};

      const total = await Inquiry.countDocuments(query);
      const inquiries = await Inquiry.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

      return res.json({
        success: true,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        inquiries,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve inquiries.' });
    }
  },

  // Update inquiry status / notes
  async updateInquiryStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, counselorNotes } = req.body;

      const inquiry = await Inquiry.findByIdAndUpdate(
        id,
        { status, counselorNotes },
        { new: true }
      );

      return res.json({ success: true, message: 'Inquiry updated successfully.', inquiry });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to update inquiry.' });
    }
  },
};

