import mongoose from 'mongoose';

const parentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    linkedStudentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    occupation: { type: String, default: '' },
    relationship: { type: String, enum: ['Father', 'Mother', 'Guardian'], default: 'Father' },
  },
  { timestamps: true }
);

export const Parent = mongoose.model('Parent', parentSchema);

