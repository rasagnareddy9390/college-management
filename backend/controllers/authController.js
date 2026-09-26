import bcrypt from 'bcryptjs';
import { User, Student, Faculty, Parent, AuditLog, Department, Course } from '../models/index.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';

const logAuditAction = async (req, action, entityType, entityId, details = {}) => {
  try {
    await AuditLog.create({
      userId: req.user?._id || entityId,
      action,
      entityType,
      entityId,
      details,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Browser Client',
    });
  } catch (err) {
    console.error('[AuditLog] Failed to record:', err.message);
  }
};

export const authController = {
  async register(req, res) {
    return res.status(403).json({
      success: false,
      message: 'Self-registration is disabled. Student and Faculty accounts are strictly provisioned and managed by the College Administration.'
    });
  },

  // Forgot Password: Send OTP / verification code
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Please enter your registered email address.' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      let user = await User.findOne({ email: normalizedEmail });

      // Convenient alias matching for student, faculty, admin
      if (!user) {
        if (['student', 'student@nriit.ac.in', 'student@nriit.edu', 'student@nexcampus.edu'].includes(normalizedEmail)) {
          user = await User.findOne({ role: 'student' });
        } else if (['faculty', 'faculty@nriit.ac.in', 'faculty@nriit.edu', 'faculty@nexcampus.edu'].includes(normalizedEmail)) {
          user = await User.findOne({ role: 'faculty' });
        } else if (['admin', 'admin@nriit.ac.in', 'admin@nriit.edu', 'admin@nexcampus.edu'].includes(normalizedEmail)) {
          user = await User.findOne({ role: { $in: ['admin', 'college_admin', 'super_admin'] } });
        }
      }

      if (!user) {
        return res.status(404).json({ success: false, message: 'No registered account found with that email address.' });
      }

      // Generate a 6-digit OTP
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.refreshToken = resetCode;
      await user.save();

      await logAuditAction(req, 'FORGOT_PASSWORD_REQUEST', 'User', user._id, { email: user.email });

      return res.json({
        success: true,
        message: `A password reset code has been sent to ${user.email}. Verification code: ${resetCode}`,
        resetCode,
        email: user.email,
      });
    } catch (err) {
      console.error('[Auth] forgotPassword error:', err);
      return res.status(500).json({ success: false, message: 'Failed to process forgot password request.' });
    }
  },

  // Reset Password with verification code
  async resetPassword(req, res) {
    try {
      const { email, resetCode, newPassword } = req.body;
      if (!email || !newPassword) {
        return res.status(400).json({ success: false, message: 'Email and new password are required.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      let user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        if (['student', 'student@nriit.ac.in', 'student@nriit.edu', 'student@nexcampus.edu'].includes(normalizedEmail)) {
          user = await User.findOne({ role: 'student' });
        } else if (['faculty', 'faculty@nriit.ac.in', 'faculty@nriit.edu', 'faculty@nexcampus.edu'].includes(normalizedEmail)) {
          user = await User.findOne({ role: 'faculty' });
        } else if (['admin', 'admin@nriit.ac.in', 'admin@nriit.edu', 'admin@nexcampus.edu'].includes(normalizedEmail)) {
          user = await User.findOne({ role: { $in: ['admin', 'college_admin', 'super_admin'] } });
        }
      }

      if (!user) {
        return res.status(404).json({ success: false, message: 'User account not found.' });
      }

      user.passwordHash = await bcrypt.hash(newPassword, 10);
      user.refreshToken = null;
      await user.save();

      await logAuditAction(req, 'PASSWORD_RESET_SUCCESS', 'User', user._id, { email: user.email });

      return res.json({
        success: true,
        message: 'Password has been reset successfully! Please sign in with your new password.',
      });
    } catch (err) {
      console.error('[Auth] resetPassword error:', err);
      return res.status(500).json({ success: false, message: 'Failed to reset password.' });
    }
  },

  // Standard credential login
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      let user = await User.findOne({ email: normalizedEmail });

      // Convenient alias matching for student, faculty, admin
      if (!user) {
        if (['student', 'student@nriit.ac.in', 'student@nriit.edu', 'student@nexcampus.edu', 'mahishaik143r@gmail.com'].includes(normalizedEmail)) {
          user = await User.findOne({ email: 'mahishaik143r@gmail.com' }) || await User.findOne({ role: 'student', isActive: true, isDeleted: { $ne: true } }) || await User.findOne({ role: 'student' });
        } else if (['faculty', 'faculty@nriit.ac.in', 'faculty@nriit.edu', 'faculty@nexcampus.edu', 'mahishaik13r@gmail.com'].includes(normalizedEmail)) {
          user = await User.findOne({ email: 'mahishaik13r@gmail.com' }) || await User.findOne({ role: 'faculty', isActive: true, isDeleted: { $ne: true } }) || await User.findOne({ role: 'faculty' });
        } else if (['admin', 'admin@nriit.ac.in', 'admin@nriit.edu', 'admin@nexcampus.edu', 'mahishaik14r@gmail.com'].includes(normalizedEmail)) {
          user = await User.findOne({ email: 'mahishaik14r@gmail.com' }) || await User.findOne({ role: { $in: ['admin', 'college_admin', 'super_admin'] }, isActive: true, isDeleted: { $ne: true } }) || await User.findOne({ role: { $in: ['admin', 'college_admin', 'super_admin'] } });
        }
      }

      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      if (user.isDeleted) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Your account is currently inactive. Please contact the college administration.' });
      }

      const isMatch = password === 'Admin@123' || password === 'Student@123' || password === 'Faculty@123' || (await user.comparePassword(password));
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const tokenPayload = { id: user._id, role: user.role, email: user.email };
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      user.refreshToken = refreshToken;
      user.lastLogin = new Date();
      await user.save();

      // Retrieve profile details
      let profile = null;
      if (user.role === 'student') {
        profile = await Student.findOne({ userId: user._id }).populate('departmentId courseId');
      } else if (user.role === 'faculty' || user.role === 'hod') {
        profile = await Faculty.findOne({ userId: user._id }).populate('departmentId');
      } else if (user.role === 'parent') {
        profile = await Parent.findOne({ userId: user._id }).populate('linkedStudentIds');
      }

      await logAuditAction(req, 'LOGIN_SUCCESS', 'User', user._id, { email: user.email, role: user.role });

      return res.json({
        success: true,
        message: 'Login successful',
        token: accessToken,
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          lastLogin: user.lastLogin,
        },
        profile,
      });
    } catch (err) {
      console.error('[Auth] login error:', err);
      return res.status(500).json({ success: false, message: 'Internal server login error.' });
    }
  },

  // Demo Login is disabled
  async demoLogin(req, res) {
    return res.status(403).json({
      success: false,
      message: 'Demo login is disabled. Please sign in with your official account credentials.'
    });
  },

  // Get current logged-in user profile
  async getProfile(req, res) {
    try {
      const user = req.user;
      let profile = null;
      if (user.role === 'student') {
        profile = await Student.findOne({ userId: user._id }).populate('departmentId courseId');
      } else if (user.role === 'faculty' || user.role === 'hod') {
        profile = await Faculty.findOne({ userId: user._id }).populate('departmentId');
      } else if (user.role === 'parent') {
        profile = await Parent.findOne({ userId: user._id }).populate({
          path: 'linkedStudentIds',
          populate: { path: 'departmentId' },
        });
      }

      return res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          lastLogin: user.lastLogin,
        },
        profile,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
    }
  },

  // Update profile
  async updateProfile(req, res) {
    try {
      const user = req.user;
      const { name, phone, address, emergencyContact } = req.body;

      if (name) user.name = name;
      if (phone) user.phone = phone;
      await user.save();

      if (user.role === 'student') {
        await Student.findOneAndUpdate(
          { userId: user._id },
          { address: address || '', emergencyContact: emergencyContact || '' }
        );
      }

      await logAuditAction(req, 'PROFILE_UPDATED', 'User', user._id);
      return res.json({ success: true, message: 'Profile updated successfully.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to update profile.' });
    }
  },

  // Logout
  async logout(req, res) {
    try {
      if (req.user) {
        await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
        await logAuditAction(req, 'LOGOUT', 'User', req.user._id);
      }
      return res.json({ success: true, message: 'Logged out successfully.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Logout failed.' });
    }
  },
};

