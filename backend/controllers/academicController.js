import { Department, Course, Subject, Section } from '../models/index.js';

export const academicController = {
  async getDepartments(req, res) {
    try {
      const departments = await Department.find().populate('hodId', 'name email');
      return res.json({ success: true, departments });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch departments.' });
    }
  },

  async createDepartment(req, res) {
    try {
      const { name, code, description, hodId } = req.body;
      const dept = await Department.create({ name, code, description, hodId });
      return res.status(201).json({ success: true, department: dept });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to create department.' });
    }
  },

  async getCourses(req, res) {
    try {
      const { departmentId } = req.query;
      const query = departmentId ? { departmentId } : {};
      const courses = await Course.find(query).populate('departmentId', 'name code');
      return res.json({ success: true, courses });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch courses.' });
    }
  },

  async getSubjects(req, res) {
    try {
      const { departmentId, semester } = req.query;
      const query = {};
      if (departmentId) query.departmentId = departmentId;
      if (semester) query.semester = Number(semester);

      const subjects = await Subject.find(query)
        .populate('departmentId', 'name code')
        .populate('facultyId', 'employeeId designation');

      return res.json({ success: true, subjects });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch subjects.' });
    }
  },

  async createSubject(req, res) {
    try {
      const subject = await Subject.create(req.body);
      return res.status(201).json({ success: true, subject });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to create subject.' });
    }
  },

  async getSections(req, res) {
    try {
      const { departmentId, semester } = req.query;
      const query = {};
      if (departmentId) query.departmentId = departmentId;
      if (semester) query.semester = Number(semester);

      const sections = await Section.find(query);
      return res.json({ success: true, sections });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch sections.' });
    }
  },
};

