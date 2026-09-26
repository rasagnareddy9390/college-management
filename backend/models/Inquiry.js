import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    courseInterested: { type: String, required: true }, // e.g. "B.Tech Computer Science"
    city: { type: String, default: '' },
    message: { type: String, default: '' },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Counseling Scheduled', 'Admitted', 'Closed'],
      default: 'New',
    },
    counselorNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Inquiry = mongoose.model('Inquiry', inquirySchema);

