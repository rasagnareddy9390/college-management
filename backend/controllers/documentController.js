import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Application,
  ApplicationRequirement,
  MemberDocument,
  VerificationAuditLog,
  User,
} from '../models/index.js';
import { documentVerificationService } from '../services/documentVerificationService.js';

export const documentController = {
  /**
   * 1. List all available applications with optional filtering
   * Answering: "WHAT CAN I APPLY FOR?"
   */
  async getApplications(req, res) {
    try {
      const { country, category, search } = req.query;
      const query = { isActive: true };

      if (country && country !== 'All') {
        query.country = new RegExp(country, 'i');
      }
      if (category && category !== 'All') {
        query.category = category;
      }
      if (search) {
        query.$or = [
          { name: new RegExp(search, 'i') },
          { authority: new RegExp(search, 'i') },
          { purpose: new RegExp(search, 'i') },
          { country: new RegExp(search, 'i') },
        ];
      }

      const applications = await Application.find(query).sort({ name: 1 }).lean();

      // Include document requirements count for each application
      const enhancedApps = await Promise.all(
        applications.map(async (app) => {
          const reqCount = await ApplicationRequirement.countDocuments({ applicationId: app._id });
          return { ...app, requirementsCount: reqCount };
        })
      );

      return res.json({
        success: true,
        count: enhancedApps.length,
        data: enhancedApps,
      });
    } catch (err) {
      console.error('[DocumentController] getApplications error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve applications catalogue.' });
    }
  },

  /**
   * 2. Get specific application details, official links, and requirements
   * Answering: "WHERE DO I APPLY? & OFFICIAL LINKS"
   */
  async getApplicationById(req, res) {
    try {
      const { id } = req.params;
      const application = await Application.findById(id).lean();
      if (!application) {
        return res.status(404).json({ success: false, message: 'Application definition not found.' });
      }

      const requirements = await ApplicationRequirement.find({ applicationId: id }).sort({ required: -1, documentName: 1 }).lean();

      return res.json({
        success: true,
        data: {
          ...application,
          requirements,
        },
      });
    } catch (err) {
      console.error('[DocumentController] getApplicationById error:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch application details.' });
    }
  },

  /**
   * 3. Get Application Requirements list
   * Answering: "WHAT DOCUMENTS DO I NEED?"
   */
  async getApplicationRequirements(req, res) {
    try {
      const { id } = req.params;
      const requirements = await ApplicationRequirement.find({ applicationId: id })
        .populate('applicationId', 'name country authority officialWebsite officialApplyUrl')
        .sort({ required: -1, documentName: 1 })
        .lean();

      return res.json({
        success: true,
        count: requirements.length,
        data: requirements,
      });
    } catch (err) {
      console.error('[DocumentController] getApplicationRequirements error:', err);
      return res.status(500).json({ success: false, message: 'Failed to load document requirements.' });
    }
  },

  /**
   * 4. Compute Member's Progress on an Application Guide (e.g. "3 / 8 completed")
   */
  async getApplicationProgress(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const application = await Application.findById(id).lean();
      if (!application) {
        return res.status(404).json({ success: false, message: 'Application not found.' });
      }

      const requirements = await ApplicationRequirement.find({ applicationId: id }).lean();
      const userDocs = await MemberDocument.find({
        userId,
        $or: [{ applicationId: id }, { documentType: { $in: requirements.map((r) => r.documentType) } }],
      }).lean();

      // Check which required docs are uploaded and verified
      const requiredDocs = requirements.filter((r) => r.required);
      let verifiedCount = 0;
      let uploadedCount = 0;

      const requirementsChecklist = requirements.map((reqItem) => {
        const matchingDoc = userDocs.find(
          (d) => d.documentType.toLowerCase() === reqItem.documentType.toLowerCase()
        );

        const isUploaded = !!matchingDoc;
        const isVerified = matchingDoc && matchingDoc.status === 'verified';

        if (isUploaded && reqItem.required) uploadedCount++;
        if (isVerified && reqItem.required) verifiedCount++;

        return {
          requirement: reqItem,
          uploaded: isUploaded,
          verified: isVerified,
          document: matchingDoc || null,
        };
      });

      // 8 Standard Guidance Steps computation
      const totalSteps = application.guidanceSteps?.length || 8;
      let completedSteps = 1; // Step 1: Check eligibility is completed by viewing

      if (uploadedCount > 0) completedSteps = 2; // Prepared documents
      if (uploadedCount >= requiredDocs.length && requiredDocs.length > 0) completedSteps = 3; // Uploaded documents
      if (verifiedCount >= requiredDocs.length && requiredDocs.length > 0) completedSteps = 4; // Verified documents

      const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

      return res.json({
        success: true,
        data: {
          application: {
            _id: application._id,
            name: application.name,
            country: application.country,
            officialApplyUrl: application.officialApplyUrl,
            officialWebsite: application.officialWebsite,
            trackingUrl: application.trackingUrl,
            requirementsUrl: application.requirementsUrl,
          },
          guidanceSteps: application.guidanceSteps || [],
          currentStep: completedSteps,
          totalSteps: totalSteps,
          progressText: `${completedSteps} / ${totalSteps} completed`,
          progressPercentage,
          allRequiredVerified: verifiedCount >= requiredDocs.length && requiredDocs.length > 0,
          checklist: requirementsChecklist,
        },
      });
    } catch (err) {
      console.error('[DocumentController] getApplicationProgress error:', err);
      return res.status(500).json({ success: false, message: 'Failed to evaluate application progress.' });
    }
  },

  /**
   * 5. Upload Document & Execute 14-Step Real Verification Pipeline
   * EQUAL ACCESS: Student, Faculty, Admin can all upload!
   */
  async uploadDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded. Please attach a PDF, JPG, or PNG file.' });
      }

      const { applicationId, documentType, documentTitle, expiryDate } = req.body;
      if (!documentType) {
        return res.status(400).json({ success: false, message: 'Document type is required.' });
      }

      // Read buffer to calculate SHA-256 hash
      const buffer = fs.readFileSync(req.file.path);
      const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

      const user = req.user;
      const memberType = user.role || 'student';

      // Create MemberDocument record
      const newDoc = new MemberDocument({
        userId: user._id,
        memberType: memberType,
        applicationId: applicationId || null,
        documentType: documentType.trim(),
        documentTitle: documentTitle ? documentTitle.trim() : documentType.trim(),
        fileName: req.file.filename,
        originalFileName: req.file.originalname,
        filePath: req.file.path,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        fileHash: fileHash,
        status: 'processing',
        currentVersion: 1,
        versions: [],
      });

      await newDoc.save();

      // Log upload action
      await VerificationAuditLog.create({
        userId: user._id,
        memberType: memberType,
        action: 'DOCUMENT_UPLOADED',
        documentId: newDoc._id,
        status: 'SUCCESS',
        comment: `Uploaded '${req.file.originalname}' (${(req.file.size / 1024).toFixed(1)} KB) for ${documentType}.`,
      });

      // Execute 14-Step Real Verification Pipeline
      const processedDoc = await documentVerificationService.executeVerificationPipeline(newDoc, user);

      return res.status(201).json({
        success: true,
        message: 'Document uploaded and 14-step verification completed.',
        data: processedDoc,
      });
    } catch (err) {
      console.error('[DocumentController] uploadDocument error:', err);
      return res.status(500).json({ success: false, message: 'Internal error during document upload or verification.' });
    }
  },

  /**
   * 6. Fetch authenticated member's documents (My Documents)
   */
  async getMyDocuments(req, res) {
    try {
      const { status, documentType, applicationId, search } = req.query;
      const query = { userId: req.user._id };

      if (status && status !== 'All') {
        query.status = status;
      }
      if (documentType && documentType !== 'All') {
        query.documentType = documentType;
      }
      if (applicationId) {
        query.applicationId = applicationId;
      }
      if (search) {
        query.$or = [
          { documentTitle: new RegExp(search, 'i') },
          { documentType: new RegExp(search, 'i') },
          { originalFileName: new RegExp(search, 'i') },
        ];
      }

      const docs = await MemberDocument.find(query)
        .populate('applicationId', 'name country officialWebsite officialApplyUrl')
        .sort({ createdAt: -1 })
        .lean();

      return res.json({
        success: true,
        count: docs.length,
        data: docs,
      });
    } catch (err) {
      console.error('[DocumentController] getMyDocuments error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve your documents.' });
    }
  },

  /**
   * 7. Get specific document details with 14 steps and OCR data
   */
  async getDocumentById(req, res) {
    try {
      const { id } = req.params;
      const doc = await MemberDocument.findById(id)
        .populate('applicationId', 'name country authority officialWebsite officialApplyUrl')
        .populate('userId', 'name email role')
        .lean();

      if (!doc) {
        return res.status(404).json({ success: false, message: 'Document not found.' });
      }

      return res.json({
        success: true,
        data: doc,
      });
    } catch (err) {
      console.error('[DocumentController] getDocumentById error:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch document details.' });
    }
  },

  /**
   * 8. Re-verify an existing document (re-run 14 steps)
   */
  async reverifyDocument(req, res) {
    try {
      const { id } = req.params;
      const doc = await MemberDocument.findById(id);
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Document not found.' });
      }

      const updated = await documentVerificationService.executeVerificationPipeline(doc, req.user);

      return res.json({
        success: true,
        message: 'Document re-verification executed successfully.',
        data: updated,
      });
    } catch (err) {
      console.error('[DocumentController] reverifyDocument error:', err);
      return res.status(500).json({ success: false, message: 'Re-verification failed.' });
    }
  },

  /**
   * 9. Quick status check for progress indicator polling
   */
  async getDocumentStatus(req, res) {
    try {
      const { id } = req.params;
      const doc = await MemberDocument.findById(id).select('status riskLevel riskScore verificationSteps updatedAt').lean();
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Document not found.' });
      }

      const completedCount = (doc.verificationSteps || []).filter(
        (s) => s.status === 'completed' || s.status === 'passed' || s.status === 'needs_review' || s.status === 'warning'
      ).length;

      return res.json({
        success: true,
        data: {
          id: doc._id,
          status: doc.status,
          riskLevel: doc.riskLevel,
          riskScore: doc.riskScore,
          completedSteps: completedCount,
          totalSteps: 14,
          progressPercentage: Math.round((completedCount / 14) * 100),
          updatedAt: doc.updatedAt,
        },
      });
    } catch (err) {
      console.error('[DocumentController] getDocumentStatus error:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch status.' });
    }
  },

  /**
   * 10. Re-upload a new version of an existing document
   * Preserves version history (v1 -> v2) and re-executes 14 steps
   */
  async reuploadDocument(req, res) {
    try {
      const { id } = req.params;
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Please attach a replacement file.' });
      }

      const doc = await MemberDocument.findById(id);
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Document to update not found.' });
      }

      const updated = await documentVerificationService.reuploadNewVersion(doc, req.file, req.user);

      return res.json({
        success: true,
        message: `Version v${updated.currentVersion} successfully uploaded and verified.`,
        data: updated,
      });
    } catch (err) {
      console.error('[DocumentController] reuploadDocument error:', err);
      return res.status(500).json({ success: false, message: 'Failed to re-upload document.' });
    }
  },

  /**
   * 11. Delete document (safely with audit log)
   */
  async deleteDocument(req, res) {
    try {
      const { id } = req.params;
      const doc = await MemberDocument.findById(id);
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Document not found.' });
      }

      // Record audit history before removal
      await VerificationAuditLog.create({
        userId: req.user._id,
        memberType: req.user.role || 'student',
        action: 'DOCUMENT_DELETED',
        documentId: doc._id,
        status: 'DELETED',
        comment: `Document '${doc.documentTitle}' (v${doc.currentVersion}) deleted by user.`,
      });

      // Delete physical file if exists
      if (fs.existsSync(doc.filePath)) {
        try {
          fs.unlinkSync(doc.filePath);
        } catch (e) {
          console.warn('[Delete] Could not unlink file:', e.message);
        }
      }

      await MemberDocument.findByIdAndDelete(id);

      return res.json({
        success: true,
        message: 'Document deleted successfully and action archived in audit log.',
      });
    } catch (err) {
      console.error('[DocumentController] deleteDocument error:', err);
      return res.status(500).json({ success: false, message: 'Failed to delete document.' });
    }
  },

  /**
   * 12. Download Official PDF Verification Report
   */
  async downloadVerificationReport(req, res) {
    try {
      const { id } = req.params;
      const doc = await MemberDocument.findById(id).populate('userId', 'name email role').lean();
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Document record not found.' });
      }

      // Log report download
      await VerificationAuditLog.create({
        userId: req.user._id,
        memberType: req.user.role || 'student',
        action: 'REPORT_GENERATED',
        documentId: doc._id,
        status: 'SUCCESS',
        comment: `Downloaded official verification report for '${doc.documentTitle}'.`,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="VerifyHub-Report-${doc._id.toString().slice(-6)}.pdf"`
      );

      const pdfStream = documentVerificationService.generateVerificationPDFReport(doc, doc.userId || req.user);
      pdfStream.pipe(res);
    } catch (err) {
      console.error('[DocumentController] downloadVerificationReport error:', err);
      return res.status(500).json({ success: false, message: 'Failed to generate PDF verification report.' });
    }
  },

  /**
   * 13. Common Verification Queue (accessible to Student, Faculty, and Admin with privacy protection)
   */
  async getVerificationQueue(req, res) {
    try {
      const { status, documentType, search, limit = 50 } = req.query;
      const query = {};

      if (status && status !== 'All') {
        query.status = status;
      }
      if (documentType && documentType !== 'All') {
        query.documentType = documentType;
      }
      if (search) {
        query.$or = [
          { documentTitle: new RegExp(search, 'i') },
          { documentType: new RegExp(search, 'i') },
          { memberType: new RegExp(search, 'i') },
        ];
      }

      const docs = await MemberDocument.find(query)
        .populate('userId', 'name role email')
        .populate('applicationId', 'name country')
        .sort({ updatedAt: -1 })
        .limit(Number(limit))
        .lean();

      // Privacy protection: mask email addresses and sensitive doc numbers for other users' entries
      const sanitized = docs.map((doc) => {
        const isOwner = doc.userId?._id?.toString() === req.user._id.toString();
        return {
          _id: doc._id,
          documentTitle: doc.documentTitle,
          documentType: doc.documentType,
          memberType: doc.memberType,
          memberName: doc.userId?.name || 'Member',
          memberEmail: isOwner ? doc.userId?.email : '•••••••••@campus.edu',
          status: doc.status,
          riskLevel: doc.riskLevel,
          riskScore: doc.riskScore,
          currentVersion: doc.currentVersion,
          applicationName: doc.applicationId?.name || 'General Verification',
          country: doc.applicationId?.country || 'Global',
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          isOwner,
        };
      });

      return res.json({
        success: true,
        count: sanitized.length,
        data: sanitized,
      });
    } catch (err) {
      console.error('[DocumentController] getVerificationQueue error:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch verification queue.' });
    }
  },

  /**
   * 14. Verification Summary Statistics
   */
  async getVerificationStats(req, res) {
    try {
      const total = await MemberDocument.countDocuments();
      const verified = await MemberDocument.countDocuments({ status: 'verified' });
      const pending = await MemberDocument.countDocuments({
        status: { $in: ['uploaded', 'processing', 'under_verification', 'needs_review'] },
      });
      const reupload = await MemberDocument.countDocuments({ status: 'reupload_required' });
      const rejected = await MemberDocument.countDocuments({ status: { $in: ['rejected', 'verification_failed', 'expired'] } });
      const highRisk = await MemberDocument.countDocuments({ riskLevel: 'high' });

      // User's own counts
      const myTotal = await MemberDocument.countDocuments({ userId: req.user._id });
      const myVerified = await MemberDocument.countDocuments({ userId: req.user._id, status: 'verified' });
      const myPending = await MemberDocument.countDocuments({
        userId: req.user._id,
        status: { $in: ['uploaded', 'processing', 'under_verification', 'needs_review'] },
      });
      const myReupload = await MemberDocument.countDocuments({ userId: req.user._id, status: 'reupload_required' });

      return res.json({
        success: true,
        data: {
          global: { total, verified, pending, reupload, rejected, highRisk },
          member: { total: myTotal, verified: myVerified, pending: myPending, reupload: myReupload },
        },
      });
    } catch (err) {
      console.error('[DocumentController] getVerificationStats error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve stats.' });
    }
  },

  /**
   * 15. Audit Logs for Document Actions
   */
  async getAuditLogs(req, res) {
    try {
      const logs = await VerificationAuditLog.find()
        .populate('userId', 'name role')
        .populate('documentId', 'documentTitle documentType')
        .sort({ timestamp: -1 })
        .limit(40)
        .lean();

      return res.json({
        success: true,
        count: logs.length,
        data: logs,
      });
    } catch (err) {
      console.error('[DocumentController] getAuditLogs error:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch audit records.' });
    }
  },
};

