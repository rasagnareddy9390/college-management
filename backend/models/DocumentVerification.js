import mongoose from 'mongoose';

/**
 * =========================================================================
 * 1. Application Schema
 * Represents an official academic, immigration, scholarship, or fellowship application
 * Stored in MongoDB so application types, requirements, and official links can be
 * updated dynamically without code changes.
 * =========================================================================
 */
const applicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['Higher Education', 'Student Visa', 'Government Scholarship', 'Faculty Fellowship', 'Work & Internship', 'General'],
      default: 'Higher Education',
    },
    purpose: {
      type: String,
      required: true,
      trim: true,
    },
    authority: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    eligibility: {
      type: String,
      default: 'Open to enrolled students, faculty members, and research staff with active institutional credentials.',
    },
    // Verified Official External URLs (No invented URLs)
    officialWebsite: {
      type: String,
      required: true,
      trim: true,
    },
    officialApplyUrl: {
      type: String,
      required: true,
      trim: true,
    },
    requirementsUrl: {
      type: String,
      required: true,
      trim: true,
    },
    trackingUrl: {
      type: String,
      default: '',
      trim: true,
    },
    // 8-Step Structured Application Guide
    guidanceSteps: [
      {
        stepNumber: { type: Number, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        requiresDocuments: { type: Boolean, default: false },
        relatedDocTypes: [{ type: String }],
        externalActionUrl: { type: String, default: '' },
        actionLabel: { type: String, default: 'Learn More' },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

/**
 * =========================================================================
 * 2. Application Requirement Schema
 * Configurable requirements for an application answering:
 * "WHAT DOCUMENTS DO I NEED FOR THIS APPLICATION?"
 * =========================================================================
 */
const applicationRequirementSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      required: true,
      trim: true,
    },
    documentName: {
      type: String,
      required: true,
      trim: true,
    },
    required: {
      type: Boolean,
      default: true, // Required vs Optional
    },
    description: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true, // Why this specific document is mandated by the authority
    },
    acceptedFormats: {
      type: [String],
      default: ['application/pdf', 'image/jpeg', 'image/png'],
    },
    maxFileSize: {
      type: Number,
      default: 10 * 1024 * 1024, // 10 MB in bytes
    },
    validityPeriodMonths: {
      type: Number,
      default: 12,
    },
    verificationRequired: {
      type: Boolean,
      default: true,
    },
    mandatoryFields: {
      type: [String],
      default: ['fullName', 'documentNumber'],
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

/**
 * =========================================================================
 * 3. Member Document Schema
 * Stores uploaded documents, multi-step verification state, OCR outputs,
 * risk assessments, and historical version snapshots.
 * EQUAL ACCESS: Student, Faculty, and Admin all map to MemberDocument!
 * =========================================================================
 */
const memberDocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    memberType: {
      type: String,
      enum: ['student', 'faculty', 'admin', 'hod', 'super_admin', 'college_admin'],
      required: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      index: true,
      default: null,
    },
    documentType: {
      type: String,
      required: true,
      trim: true,
    },
    documentTitle: {
      type: String,
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    fileHash: {
      type: String, // SHA-256 integrity hash
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        'uploaded',
        'processing',
        'under_verification',
        'verified',
        'needs_review',
        'rejected',
        'reupload_required',
        'expired',
        'verification_failed',
      ],
      default: 'uploaded',
      index: true,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'unassigned'],
      default: 'unassigned',
    },
    riskScore: {
      type: Number,
      default: 0, // 0 to 100
    },
    // OCR & Extracted Structured Data
    ocrData: {
      fullName: { type: String, default: '' },
      dateOfBirth: { type: String, default: '' },
      documentNumber: { type: String, default: '' },
      issueDate: { type: String, default: '' },
      expiryDate: { type: String, default: '' },
      issuingAuthority: { type: String, default: '' },
      address: { type: String, default: '' },
      institution: { type: String, default: '' },
      course: { type: String, default: '' },
      confidenceScore: { type: Number, default: 0 },
      rawText: { type: String, default: '' },
      detectedFields: { type: Map, of: String, default: {} },
    },
    // 14-Step Real Verification Pipeline Results
    verificationSteps: [
      {
        stepIndex: { type: Number, required: true },
        stepKey: { type: String, required: true },
        stepName: { type: String, required: true },
        description: { type: String, required: true },
        status: {
          type: String,
          enum: ['pending', 'processing', 'completed', 'passed', 'warning', 'failed', 'needs_review', 'skipped'],
          default: 'pending',
        },
        startedAt: { type: Date, default: null },
        completedAt: { type: Date, default: null },
        durationMs: { type: Number, default: 0 },
        result: { type: String, default: '' },
        explanation: { type: String, default: '' },
        diagnostics: { type: mongoose.Schema.Types.Mixed, default: {} },
      },
    ],
    // Strict Independent Verification Invariant
    externalVerificationNote: {
      type: String,
      default: 'Authenticity could not be independently verified. Additional review is required.',
    },
    currentVersion: {
      type: Number,
      default: 1,
    },
    // Version History snapshots
    versions: [
      {
        versionNumber: { type: Number, required: true },
        fileName: { type: String, required: true },
        fileHash: { type: String, required: true },
        fileSize: { type: Number, required: true },
        uploadedAt: { type: Date, default: Date.now },
        status: { type: String, required: true },
        riskLevel: { type: String, default: 'unassigned' },
        verificationSummary: { type: String, default: '' },
        rejectionReason: { type: String, default: '' },
      },
    ],
    reviewComment: {
      type: String,
      default: '',
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for fast querying
memberDocumentSchema.index({ userId: 1, status: 1 });
memberDocumentSchema.index({ applicationId: 1, documentType: 1 });
memberDocumentSchema.index({ createdAt: -1 });

/**
 * =========================================================================
 * 4. Verification Audit Log Schema
 * Records tamper-evident audit history of all document operations
 * =========================================================================
 */
const verificationAuditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    memberType: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'DOCUMENT_UPLOADED',
        'VERIFICATION_STARTED',
        'OCR_COMPLETED',
        'VALIDATION_COMPLETED',
        'VERIFICATION_COMPLETED',
        'VERIFICATION_FAILED',
        'NEEDS_REVIEW_FLAGGED',
        'DOCUMENT_REJECTED',
        'REUPLOAD_REQUESTED',
        'NEW_VERSION_UPLOADED',
        'DOCUMENT_DELETED',
        'REPORT_GENERATED',
        'OFFICIAL_LINK_OPENED',
      ],
      index: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MemberDocument',
      default: null,
      index: true,
    },
    status: {
      type: String,
      default: 'SUCCESS',
    },
    comment: {
      type: String,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

export const Application = mongoose.model('Application', applicationSchema);
export const ApplicationRequirement = mongoose.model('ApplicationRequirement', applicationRequirementSchema);
export const MemberDocument = mongoose.model('MemberDocument', memberDocumentSchema);
export const VerificationAuditLog = mongoose.model('VerificationAuditLog', verificationAuditLogSchema);

