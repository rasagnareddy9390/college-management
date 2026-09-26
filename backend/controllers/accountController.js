import bcrypt from 'bcryptjs';
import { User, Student, Faculty, FacultyProfile, Department, AuditLog } from '../models/index.js';

const logAudit = async (req, action, entityId, details = {}) => {
  try {
    await AuditLog.create({
      userId: req.user?._id || entityId,
      action,
      entityType: 'UserAccount',
      entityId,
      details,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Browser Client',
    });
  } catch (err) {
    console.warn('[AccountController] Audit log failed:', err.message);
  }
};

export const accountController = {
  /**
   * Get MongoDB live account statistics
   */
  async getAccountStats(req, res) {
    try {
      const [
        totalStudents,
        activeStudents,
        inactiveStudents,
        totalFaculty,
        activeFaculty,
        inactiveFaculty,
      ] = await Promise.all([
        User.countDocuments({ role: 'student', isDeleted: { $ne: true } }),
        User.countDocuments({ role: 'student', isActive: true, isDeleted: { $ne: true } }),
        User.countDocuments({ role: 'student', isActive: false, isDeleted: { $ne: true } }),
        User.countDocuments({ role: { $in: ['faculty', 'hod'] }, isDeleted: { $ne: true } }),
        User.countDocuments({ role: { $in: ['faculty', 'hod'] }, isActive: true, isDeleted: { $ne: true } }),
        User.countDocuments({ role: { $in: ['faculty', 'hod'] }, isActive: false, isDeleted: { $ne: true } }),
      ]);

      const recentAccounts = await User.find({ isDeleted: { $ne: true } })
        .select('name email role isActive createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      return res.json({
        success: true,
        stats: {
          students: {
            total: totalStudents,
            active: activeStudents,
            inactive: inactiveStudents,
          },
          faculty: {
            total: totalFaculty,
            active: activeFaculty,
            inactive: inactiveFaculty,
          },
          recentAccounts,
        },
      });
    } catch (err) {
      console.error('[AccountController] getAccountStats error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve account stats.' });
    }
  },

  /**
   * List Students with search & filters
   */
  async getStudents(req, res) {
    try {
      const { search = '', status = 'all', page = 1, limit = 20 } = req.query;
      const userQuery = { role: 'student', isDeleted: { $ne: true } };

      if (status === 'active') userQuery.isActive = true;
      if (status === 'inactive') userQuery.isActive = false;

      let matchedUserIds = null;
      if (search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        // Search in User name/email or Student rollNumber/branch
        const studentMatches = await Student.find({
          $or: [{ rollNumber: regex }, { branch: regex }, { studentId: regex }],
        }).select('userId');

        const studentUserIds = studentMatches.map((s) => s.userId);

        userQuery.$or = [
          { name: regex },
          { email: regex },
          { phone: regex },
          { _id: { $in: studentUserIds } },
        ];
      }

      const total = await User.countDocuments(userQuery);
      const users = await User.find(userQuery)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean();

      const userIds = users.map((u) => u._id);
      const studentProfiles = await Student.find({ userId: { $in: userIds } })
        .populate('departmentId', 'name code')
        .lean();

      const profileMap = new Map(studentProfiles.map((p) => [String(p.userId), p]));

      const data = users.map((u) => ({
        ...u,
        student: profileMap.get(String(u._id)) || null,
      }));

      return res.json({
        success: true,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        students: data,
      });
    } catch (err) {
      console.error('[AccountController] getStudents error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve students.' });
    }
  },

  /**
   * Create Student Account
   */
  async createStudent(req, res) {
    try {
      const {
        name,
        email,
        password = 'Password@123',
        phone = '',
        rollNumber,
        departmentId,
        branch = 'Computer Science & Engineering',
        year = 1,
        semester = 1,
        section = 'A',
        batch,
      } = req.body;

      if (!name || !email) {
        return res.status(400).json({ success: false, message: 'Name and email are required.' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const existing = await User.findOne({ email: normalizedEmail, isDeleted: { $ne: true } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
      }

      const uniqueSuffix = Date.now().toString().slice(-4);
      const computedRollNo = (rollNumber || `STU${new Date().getFullYear()}${uniqueSuffix}`).toUpperCase().trim();

      const existingStudent = await Student.findOne({ rollNumber: computedRollNo });
      if (existingStudent) {
        return res.status(409).json({ success: false, message: `Roll Number '${computedRollNo}' is already registered.` });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'student',
        phone: String(phone).trim(),
        isActive: true,
      });

      // Find or create default department if not passed
      let deptId = departmentId;
      if (!deptId) {
        const defaultDept = await Department.findOne({ code: 'CSE' }) || await Department.findOne();
        deptId = defaultDept?._id;
      }

      const student = await Student.create({
        userId: user._id,
        rollNumber: computedRollNo,
        studentId: `NRIIT-${computedRollNo}`,
        departmentId: deptId,
        branch: branch || 'Computer Science & Engineering',
        year: Number(year) || 1,
        semester: Number(semester) || 1,
        section: (section || 'A').toUpperCase(),
        batch: batch || `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`,
        attendancePercentage: 85.0,
        cgpa: 8.0,
      });

      await logAudit(req, 'STUDENT_ACCOUNT_CREATED', user._id, { rollNumber: computedRollNo, email: normalizedEmail });

      return res.status(201).json({
        success: true,
        message: `Student account created successfully for ${user.name} (${computedRollNo}).`,
        user: user.toObject(),
        student: {
          ...user.toObject(),
          student,
        },
      });
    } catch (err) {
      console.error('[AccountController] createStudent error:', err);
      return res.status(500).json({ success: false, message: err.message || 'Failed to create student account.' });
    }
  },

  /**
   * Edit Student Account
   */
  async updateStudent(req, res) {
    try {
      const { id } = req.params;
      const { name, phone, rollNumber, branch, year, semester, section, batch, attendancePercentage, cgpa } = req.body;

      const user = await User.findOne({ _id: id, role: 'student', isDeleted: { $ne: true } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'Student account not found.' });
      }

      if (name) user.name = name.trim();
      if (phone !== undefined) user.phone = String(phone).trim();
      await user.save();

      const studentUpdate = {};
      if (rollNumber) studentUpdate.rollNumber = rollNumber.toUpperCase().trim();
      if (branch) studentUpdate.branch = branch.trim();
      if (year) studentUpdate.year = Number(year);
      if (semester) studentUpdate.semester = Number(semester);
      if (section) studentUpdate.section = section.toUpperCase().trim();
      if (batch) studentUpdate.batch = batch.trim();
      if (attendancePercentage !== undefined) studentUpdate.attendancePercentage = Number(attendancePercentage);
      if (cgpa !== undefined) studentUpdate.cgpa = Number(cgpa);

      const updatedStudent = await Student.findOneAndUpdate(
        { userId: user._id },
        { $set: studentUpdate },
        { new: true }
      );

      await logAudit(req, 'STUDENT_ACCOUNT_UPDATED', user._id, { changes: req.body });

      return res.json({
        success: true,
        message: 'Student account updated successfully.',
        user: { ...user.toObject(), student: updatedStudent },
      });
    } catch (err) {
      console.error('[AccountController] updateStudent error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update student account.' });
    }
  },

  /**
   * Activate / Deactivate Student Account
   */
  async toggleStudentStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ success: false, message: "'isActive' boolean is required." });
      }

      const user = await User.findOne({ _id: id, role: 'student', isDeleted: { $ne: true } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'Student account not found.' });
      }

      user.isActive = isActive;
      await user.save();

      await logAudit(req, isActive ? 'STUDENT_ACCOUNT_ACTIVATED' : 'STUDENT_ACCOUNT_DEACTIVATED', user._id);

      return res.json({
        success: true,
        message: `Student account has been ${isActive ? 'activated' : 'deactivated'} successfully.`,
        isActive: user.isActive,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to update student status.' });
    }
  },

  /**
   * Delete Student Account (Soft Delete)
   */
  async deleteStudent(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findOne({ _id: id, role: 'student', isDeleted: { $ne: true } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'Student account not found.' });
      }

      user.isDeleted = true;
      user.isActive = false;
      await user.save();

      await logAudit(req, 'STUDENT_ACCOUNT_DELETED', user._id, { email: user.email });

      return res.json({
        success: true,
        message: `Student account for ${user.name} has been deleted.`,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to delete student account.' });
    }
  },

  /**
   * Reset Student Password
   */
  async resetStudentPassword(req, res) {
    try {
      const { id } = req.params;
      const { newPassword = 'Password@123' } = req.body;

      const user = await User.findOne({ _id: id, role: 'student', isDeleted: { $ne: true } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'Student account not found.' });
      }

      user.passwordHash = await bcrypt.hash(newPassword, 10);
      user.refreshToken = null;
      await user.save();

      await logAudit(req, 'STUDENT_PASSWORD_RESET', user._id);

      return res.json({
        success: true,
        message: `Password has been reset successfully for ${user.name}. Default/New password: ${newPassword}`,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to reset password.' });
    }
  },

  /**
   * List Faculty Accounts
   */
  async getFaculty(req, res) {
    try {
      const { search = '', status = 'all', page = 1, limit = 20 } = req.query;
      const userQuery = { role: { $in: ['faculty', 'hod'] }, isDeleted: { $ne: true } };

      if (status === 'active') userQuery.isActive = true;
      if (status === 'inactive') userQuery.isActive = false;

      if (search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        const facultyMatches = await Faculty.find({
          $or: [{ employeeId: regex }, { designation: regex }, { specialization: regex }],
        }).select('userId');

        const connectMatches = await FacultyProfile.find({
          $or: [{ subjects: regex }, { expertise: regex }, { designation: regex }],
        }).select('userId');

        const userIdsFromSearch = [
          ...facultyMatches.map((f) => f.userId),
          ...connectMatches.map((c) => c.userId),
        ];

        userQuery.$or = [
          { name: regex },
          { email: regex },
          { phone: regex },
          { _id: { $in: userIdsFromSearch } },
        ];
      }

      const total = await User.countDocuments(userQuery);
      const users = await User.find(userQuery)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean();

      const userIds = users.map((u) => u._id);
      const [faculties, profiles] = await Promise.all([
        Faculty.find({ userId: { $in: userIds } }).populate('departmentId', 'name code').lean(),
        FacultyProfile.find({ userId: { $in: userIds } }).lean(),
      ]);

      const facultyMap = new Map(faculties.map((f) => [String(f.userId), f]));
      const profileMap = new Map(profiles.map((p) => [String(p.userId), p]));

      const data = users.map((u) => ({
        ...u,
        faculty: facultyMap.get(String(u._id)) || null,
        connectProfile: profileMap.get(String(u._id)) || null,
      }));

      return res.json({
        success: true,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        faculty: data,
      });
    } catch (err) {
      console.error('[AccountController] getFaculty error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve faculty list.' });
    }
  },

  /**
   * Create Faculty Account (Auto-adds to Faculty Connect!)
   */
  async createFaculty(req, res) {
    try {
      const {
        name,
        email,
        password = 'Password@123',
        phone = '',
        employeeId,
        department = 'Computer Science & Engineering',
        departmentCode = 'CSE',
        designation = 'Assistant Professor',
        qualification = 'M.Tech / Ph.D.',
        experienceYears = 5,
        subjects = ['Programming', 'Data Structures'],
        expertise = ['Computer Science'],
        officeLocation = 'Academic Block-B, Cabin 204',
        officeHours = '02:00 PM - 04:00 PM',
        bio = '',
      } = req.body;

      if (!name || !email) {
        return res.status(400).json({ success: false, message: 'Name and email are required.' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const existing = await User.findOne({ email: normalizedEmail, isDeleted: { $ne: true } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
      }

      const uniqueSuffix = Date.now().toString().slice(-4);
      const computedEmpId = (employeeId || `FAC${uniqueSuffix}`).toUpperCase().trim();

      const existingFaculty = await Faculty.findOne({ employeeId: computedEmpId });
      if (existingFaculty) {
        return res.status(409).json({ success: false, message: `Employee ID '${computedEmpId}' is already registered.` });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'faculty',
        phone: String(phone).trim(),
        isActive: true,
      });

      // Find or create department
      let dept = await Department.findOne({ code: departmentCode }) || await Department.findOne();
      if (!dept) {
        dept = await Department.create({
          name: department,
          code: departmentCode,
          description: department,
        });
      }

      const facultyRecord = await Faculty.create({
        userId: user._id,
        employeeId: computedEmpId,
        departmentId: dept._id,
        designation,
        specialization: Array.isArray(expertise) ? expertise.join(', ') : expertise,
        qualification,
        experienceYears: Number(experienceYears) || 5,
        cabinNumber: officeLocation,
      });

      // Automatically create FacultyProfile for Faculty Connect module!
      const subjectsArray = Array.isArray(subjects)
        ? subjects
        : String(subjects).split(',').map((s) => s.trim()).filter(Boolean);

      const expertiseArray = Array.isArray(expertise)
        ? expertise
        : String(expertise).split(',').map((e) => e.trim()).filter(Boolean);

      const connectProfile = await FacultyProfile.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          name: user.name,
          email: user.email,
          designation,
          department,
          departmentCode,
          qualification,
          experienceYears: Number(experienceYears) || 5,
          subjects: subjectsArray.length ? subjectsArray : ['Core Engineering'],
          expertise: expertiseArray.length ? expertiseArray : ['Academic Mentorship'],
          bio: bio || `Faculty member at Department of ${department}, NRI Institute of Technology.`,
          officeLocation,
          officeHours,
          availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          isAvailable: true,
          stats: {
            questionsAnswered: 0,
            avgResponseTime: '< 2 hours',
            activeDiscussions: 0,
            rating: 5.0,
            studentSatisfaction: '100%',
          },
        },
        { upsert: true, new: true }
      );

      await logAudit(req, 'FACULTY_ACCOUNT_CREATED', user._id, { employeeId: computedEmpId, email: user.email });

      return res.status(201).json({
        success: true,
        message: `Faculty account created successfully for Prof. ${user.name} and synced with Faculty Connect.`,
        user: user.toObject(),
        faculty: {
          ...user.toObject(),
          facultyRecord,
          connectProfile,
        },
      });
    } catch (err) {
      console.error('[AccountController] createFaculty error:', err);
      return res.status(500).json({ success: false, message: err.message || 'Failed to create faculty account.' });
    }
  },

  /**
   * Update Faculty Account (Syncs with FacultyProfile)
   */
  async updateFaculty(req, res) {
    try {
      const { id } = req.params;
      const {
        name,
        phone,
        designation,
        department,
        qualification,
        experienceYears,
        subjects,
        expertise,
        officeLocation,
        officeHours,
        bio,
      } = req.body;

      const user = await User.findOne({ _id: id, role: { $in: ['faculty', 'hod'] }, isDeleted: { $ne: true } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'Faculty account not found.' });
      }

      if (name) user.name = name.trim();
      if (phone !== undefined) user.phone = String(phone).trim();
      await user.save();

      // Update Faculty model
      const facultyUpdate = {};
      if (designation) facultyUpdate.designation = designation;
      if (qualification) facultyUpdate.qualification = qualification;
      if (experienceYears !== undefined) facultyUpdate.experienceYears = Number(experienceYears);
      if (officeLocation) facultyUpdate.cabinNumber = officeLocation;
      if (expertise) {
        facultyUpdate.specialization = Array.isArray(expertise) ? expertise.join(', ') : expertise;
      }

      await Faculty.findOneAndUpdate({ userId: user._id }, { $set: facultyUpdate });

      // Synchronize FacultyProfile in Faculty Connect
      const profileUpdate = {};
      if (name) profileUpdate.name = name.trim();
      if (designation) profileUpdate.designation = designation;
      if (department) profileUpdate.department = department;
      if (qualification) profileUpdate.qualification = qualification;
      if (experienceYears !== undefined) profileUpdate.experienceYears = Number(experienceYears);
      if (officeLocation) profileUpdate.officeLocation = officeLocation;
      if (officeHours) profileUpdate.officeHours = officeHours;
      if (bio !== undefined) profileUpdate.bio = bio;

      if (subjects) {
        profileUpdate.subjects = Array.isArray(subjects)
          ? subjects
          : String(subjects).split(',').map((s) => s.trim()).filter(Boolean);
      }
      if (expertise) {
        profileUpdate.expertise = Array.isArray(expertise)
          ? expertise
          : String(expertise).split(',').map((e) => e.trim()).filter(Boolean);
      }

      const updatedProfile = await FacultyProfile.findOneAndUpdate(
        { userId: user._id },
        { $set: profileUpdate },
        { new: true, upsert: true }
      );

      await logAudit(req, 'FACULTY_ACCOUNT_UPDATED', user._id, { changes: req.body });

      return res.json({
        success: true,
        message: 'Faculty account and Faculty Connect profile updated successfully.',
        user,
        profile: updatedProfile,
      });
    } catch (err) {
      console.error('[AccountController] updateFaculty error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update faculty account.' });
    }
  },

  /**
   * Activate / Deactivate Faculty Account
   */
  async toggleFacultyStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ success: false, message: "'isActive' boolean is required." });
      }

      const user = await User.findOne({ _id: id, role: { $in: ['faculty', 'hod'] }, isDeleted: { $ne: true } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'Faculty account not found.' });
      }

      user.isActive = isActive;
      await user.save();

      // Also toggle availability on FacultyProfile in Faculty Connect
      await FacultyProfile.findOneAndUpdate({ userId: user._id }, { isAvailable: isActive });

      await logAudit(req, isActive ? 'FACULTY_ACCOUNT_ACTIVATED' : 'FACULTY_ACCOUNT_DEACTIVATED', user._id);

      return res.json({
        success: true,
        message: `Faculty account has been ${isActive ? 'activated' : 'deactivated'} successfully.`,
        isActive: user.isActive,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to update faculty status.' });
    }
  },

  /**
   * Delete Faculty Account (Soft Delete)
   */
  async deleteFaculty(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findOne({ _id: id, role: { $in: ['faculty', 'hod'] }, isDeleted: { $ne: true } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'Faculty account not found.' });
      }

      user.isDeleted = true;
      user.isActive = false;
      await user.save();

      // Mark un-available in Faculty Connect
      await FacultyProfile.findOneAndUpdate({ userId: user._id }, { isAvailable: false });

      await logAudit(req, 'FACULTY_ACCOUNT_DELETED', user._id, { email: user.email });

      return res.json({
        success: true,
        message: `Faculty account for Prof. ${user.name} has been deleted.`,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to delete faculty account.' });
    }
  },

  /**
   * Reset Faculty Password
   */
  async resetFacultyPassword(req, res) {
    try {
      const { id } = req.params;
      const { newPassword = 'Password@123' } = req.body;

      const user = await User.findOne({ _id: id, role: { $in: ['faculty', 'hod'] }, isDeleted: { $ne: true } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'Faculty account not found.' });
      }

      user.passwordHash = await bcrypt.hash(newPassword, 10);
      user.refreshToken = null;
      await user.save();

      await logAudit(req, 'FACULTY_PASSWORD_RESET', user._id);

      return res.json({
        success: true,
        message: `Password has been reset successfully for Prof. ${user.name}. Default/New password: ${newPassword}`,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to reset faculty password.' });
    }
  },
};

