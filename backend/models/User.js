import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: [
        'student',
        'faculty',
        'parent',
        'hod',
        'admin',
        'principal',
        'accountant',
        'exam_cell',
        'placement_officer',
        'librarian',
        'hostel_warden',
        'transport_staff',
        'event_coordinator',
        'super_admin',
        'college_admin'
      ],
      default: 'student',
      index: true,
    },
    phone: { type: String, default: '' },
    avatar: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    lastLogin: { type: Date, default: null },
    refreshToken: { type: String, default: null },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model('User', userSchema);

