import { verifyAccessToken } from '../utils/jwt.js';
import { User, Student, Faculty, Parent } from '../models/index.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user || user.isDeleted) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account is currently inactive. Please contact the college administration.' });
    }

    req.user = user;

    // Attach role-specific profiles for convenient and fast access in controllers
    if (user.role === 'student') {
      req.student = await Student.findOne({ userId: user._id });
    } else if (user.role === 'faculty' || user.role === 'hod') {
      req.faculty = await Faculty.findOne({ userId: user._id });
    } else if (user.role === 'parent') {
      req.parent = await Parent.findOne({ userId: user._id });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    // super_admin / admin / principal have elevated access
    if (req.user.role === 'super_admin' || req.user.role === 'college_admin' || req.user.role === 'admin') {
      return next();
    }

    if (allowedRoles.includes('*') || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access forbidden: Role '${req.user.role}' is not authorized to access this resource.`,
    });
  };
};
