import { PlacementJob, JobApplication, StudentPortfolio, Student } from '../models/index.js';

export const placementController = {
  // Get all active placement drives with eligibility check
  async getJobs(req, res) {
    try {
      const jobs = await PlacementJob.find({ isActive: true }).sort({ driveDate: 1 });
      let student = null;
      let appliedJobIds = new Set();

      if (req.user.role === 'student') {
        student = req.student || (await Student.findOne({ userId: req.user._id }));
        if (student) {
          const apps = await JobApplication.find({ studentId: student._id });
          apps.forEach((a) => appliedJobIds.add(String(a.jobId)));
        }
      }

      const enriched = jobs.map((j) => {
        let isEligible = true;
        let reasons = [];

        if (student) {
          if (student.cgpa < j.minCgpa) {
            isEligible = false;
            reasons.push(`CGPA (${student.cgpa}) below cutoff (${j.minCgpa})`);
          }
          if (student.backlogs > j.maxBacklogs) {
            isEligible = false;
            reasons.push(`Active backlogs (${student.backlogs}) exceed allowed (${j.maxBacklogs})`);
          }
        }

        return {
          ...j.toObject(),
          isEligible,
          eligibilityReasons: reasons,
          hasApplied: appliedJobIds.has(String(j._id)),
        };
      });

      return res.json({ success: true, count: enriched.length, jobs: enriched });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve placement drives.' });
    }
  },

  // Apply to a placement drive
  async applyToJob(req, res) {
    try {
      const { jobId } = req.body;
      const student = req.student || (await Student.findOne({ userId: req.user._id }));

      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found.' });
      }

      const application = await JobApplication.create({
        jobId,
        studentId: student._id,
        status: 'Applied',
      });

      return res.status(201).json({ success: true, message: 'Application submitted successfully.', application });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to submit job application.' });
    }
  },

  // Student Portfolio & ATS Resume Builder
  async getPortfolio(req, res) {
    try {
      const student = req.student || (await Student.findOne({ userId: req.user._id }));
      if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

      let portfolio = await StudentPortfolio.findOne({ studentId: student._id });
      if (!portfolio) {
        portfolio = await StudentPortfolio.create({
          studentId: student._id,
          summary: 'Passionate software engineering undergraduate skilled in Full-Stack web development and algorithms.',
          linkedin: 'https://linkedin.com/in/aarav-kapoor',
          github: 'https://github.com/aaravkapoor',
        });
      }

      return res.json({ success: true, portfolio, student });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch portfolio.' });
    }
  },

  async updatePortfolio(req, res) {
    try {
      const student = req.student || (await Student.findOne({ userId: req.user._id }));
      const portfolio = await StudentPortfolio.findOneAndUpdate(
        { studentId: student._id },
        { ...req.body },
        { upsert: true, new: true }
      );

      return res.json({ success: true, message: 'Portfolio updated successfully.', portfolio });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to update portfolio.' });
    }
  },
};

