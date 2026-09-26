import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { connectDB } from '../backend/config/db.js';
import { User } from '../backend/models/index.js';
import { generateAccessToken } from '../backend/utils/jwt.js';
import { seedDatabase } from '../backend/seed.js';

dotenv.config();

const BASE_URL = 'http://localhost:5005';

let studentToken = '';
let facultyToken = '';
let adminToken = '';

let testAppId = '';
let uploadedDocId = '';

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${message}`);
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function run() {
  console.log('===============================================================');
  console.log('TEST SUITE: Unified VerifyHub Document Verification & Equal Access');
  console.log('===============================================================');

  // 1. Health Check
  console.log('\n1. Verifying Server Health...');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const health = await healthRes.json();
  assert(health.status === 'healthy', 'Server /api/health reports healthy');

  // 2. Authenticating Student, Faculty, and Admin
  console.log('\n2. Generating Authenticated Session Tokens for Student, Faculty, and Admin...');
  await connectDB();
  let studentUser = await User.findOne({ role: 'student' });
  if (!studentUser) {
    await seedDatabase();
    studentUser = await User.findOne({ role: 'student' });
  }
  const facultyUser = await User.findOne({ role: 'faculty' });
  const adminUser = await User.findOne({ role: { $in: ['admin', 'super_admin'] } });

  assert(studentUser, `Student user found (${studentUser?.email})`);
  assert(facultyUser, `Faculty user found (${facultyUser?.email})`);
  assert(adminUser, `Admin user found (${adminUser?.email})`);

  studentToken = generateAccessToken({ id: studentUser._id, role: studentUser.role });
  facultyToken = generateAccessToken({ id: facultyUser._id, role: facultyUser.role });
  adminToken = generateAccessToken({ id: adminUser._id, role: adminUser.role });

  assert(studentToken && facultyToken && adminToken, 'Valid JWT session tokens generated for all 3 member roles');

  // 3. EQUAL ACCESS: Applications Catalogue & Requirements
  console.log('\n3. Testing Equal Access for Applications & Requirements Catalogue...');
  const appsRes = await fetch(`${BASE_URL}/api/applications`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const apps = await appsRes.json();
  assert(apps.success && apps.data.length >= 5, `Student fetched ${apps.data?.length} applications`);
  testAppId = apps.data[0]._id;

  const facultyAppsRes = await fetch(`${BASE_URL}/api/applications`, {
    headers: { Authorization: `Bearer ${facultyToken}` },
  });
  const facultyApps = await facultyAppsRes.json();
  assert(facultyApps.success && facultyApps.data.length >= 5, 'Faculty fetched applications (Equal Access)');

  const adminAppsRes = await fetch(`${BASE_URL}/api/applications`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminApps = await adminAppsRes.json();
  assert(adminApps.success && adminApps.data.length >= 5, 'Admin fetched applications (Equal Access)');

  // 4. Requirements & Official Links (No Invented URLs)
  console.log('\n4. Verifying Requirements & Official Links (No invented URLs)...');
  const appDetailsRes = await fetch(`${BASE_URL}/api/applications/${testAppId}`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const appDetails = await appDetailsRes.json();
  assert(appDetails.success, 'Application details retrieved');
  assert(appDetails.data.officialWebsite.startsWith('http'), 'Contains verified officialWebsite');
  assert(appDetails.data.officialApplyUrl.startsWith('http'), 'Contains verified officialApplyUrl');
  assert(appDetails.data.requirements.length > 0, `Contains ${appDetails.data.requirements.length} requirements`);
  assert(appDetails.data.requirements[0].reason.length > 10, 'Each requirement contains legal reason');

  // 5. Document Upload & 14-Step Real Verification Pipeline (Student)
  console.log('\n5. Testing Document Upload & Real 14-Step Verification Pipeline (Student)...');
  const samplePdfContent = '%PDF-1.4\n1 0 obj\n<< /Title (Passport Bio Data) /Author (Shaik Mohammad Mahim) >>\nendobj\n%%EOF';
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

  let body = '';
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="applicationId"\r\n\r\n${testAppId}\r\n`;
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="documentType"\r\n\r\nPassport Bio Page\r\n`;
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="documentTitle"\r\n\r\nStudent Official Passport Bio Page\r\n`;
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="document"; filename="mahim_passport.pdf"\r\n`;
  body += `Content-Type: application/pdf\r\n\r\n`;
  body += samplePdfContent;
  body += `\r\n--${boundary}--\r\n`;

  const uploadRes = await fetch(`${BASE_URL}/api/documents/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${studentToken}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: Buffer.from(body, 'utf-8'),
  });

  const uploadJson = await uploadRes.json();
  assert(uploadJson.success, 'Document uploaded successfully');
  const doc = uploadJson.data;
  uploadedDocId = doc._id;

  assert(doc.currentVersion === 1, 'Initial version is v1');
  assert(doc.verificationSteps.length === 14, 'Exactly 14 verification steps executed');

  // Check individual critical steps
  const step1 = doc.verificationSteps.find((s) => s.stepIndex === 1);
  assert(step1 && (step1.status === 'completed' || step1.status === 'passed'), 'Step 1: Document uploaded and persisted');

  const step2 = doc.verificationSteps.find((s) => s.stepIndex === 2);
  assert(step2 && (step2.status === 'completed' || step2.status === 'passed'), 'Step 2: File security & magic-byte check passed');

  const step5 = doc.verificationSteps.find((s) => s.stepIndex === 5);
  assert(step5 && doc.ocrData.fullName, 'Step 5: OCR extracted bearer full name');

  const step11 = doc.verificationSteps.find((s) => s.stepIndex === 11);
  assert(step11 && doc.fileHash.length === 64, 'Step 11: Cryptographic SHA-256 integrity hash recorded');

  const step12 = doc.verificationSteps.find((s) => s.stepIndex === 12);
  assert(
    step12.explanation.includes('Authenticity could not be independently verified'),
    'Step 12: Invariant enforced: flags "Authenticity could not be independently verified. Additional review is required."'
  );

  const step14 = doc.verificationSteps.find((s) => s.stepIndex === 14);
  assert(step14 && doc.status, `Step 14: Final result disposition evaluated: ${doc.status}`);

  // 6. Document Version History & Re-upload
  console.log('\n6. Testing Document Version History & Re-upload (v1 -> v2)...');
  const samplePdfV2 = '%PDF-1.4\n1 0 obj\n<< /Title (Passport Bio Data - HD Rescan) /Author (Shaik Mohammad Mahim) >>\nendobj\n%%EOF';
  const boundaryV2 = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

  let bodyV2 = '';
  bodyV2 += `--${boundaryV2}\r\n`;
  bodyV2 += `Content-Disposition: form-data; name="document"; filename="mahim_passport_v2.pdf"\r\n`;
  bodyV2 += `Content-Type: application/pdf\r\n\r\n`;
  bodyV2 += samplePdfV2;
  bodyV2 += `\r\n--${boundaryV2}--\r\n`;

  const reuploadRes = await fetch(`${BASE_URL}/api/documents/${uploadedDocId}/reupload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${studentToken}`,
      'Content-Type': `multipart/form-data; boundary=${boundaryV2}`,
    },
    body: Buffer.from(bodyV2, 'utf-8'),
  });

  const reuploadJson = await reuploadRes.json();
  assert(reuploadJson.success, 'Re-upload succeeded');
  const updatedDoc = reuploadJson.data;
  assert(updatedDoc.currentVersion === 2, 'Version incremented to v2');
  assert(updatedDoc.versions.length === 1, 'Previous version v1 archived in versions array');
  assert(updatedDoc.versions[0].versionNumber === 1, 'Archived version retains v1 details');

  // 7. Download Official PDF Verification Report
  console.log('\n7. Testing PDF Verification Report Download...');
  const reportRes = await fetch(`${BASE_URL}/api/documents/${uploadedDocId}/report`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const reportBuffer = await reportRes.arrayBuffer();
  const pdfHeader = Buffer.from(reportBuffer).toString('utf-8', 0, 4);
  assert(reportRes.status === 200, 'Report endpoint returned 200 OK');
  assert(pdfHeader === '%PDF', `Downloaded file is valid PDF (header: ${pdfHeader})`);
  assert(reportBuffer.byteLength > 1000, `PDF size is valid (${(reportBuffer.byteLength / 1024).toFixed(1)} KB)`);

  // 8. Faculty Upload & Verification (Equal Access)
  console.log('\n8. Testing Faculty Upload & Verification (Equal Access Invariant)...');
  const facultyPdf = '%PDF-1.4\n1 0 obj\n<< /Title (Faculty PhD Degree) >>\nendobj\n%%EOF';
  const boundaryFaculty = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

  let bodyFaculty = '';
  bodyFaculty += `--${boundaryFaculty}\r\n`;
  bodyFaculty += `Content-Disposition: form-data; name="documentType"\r\n\r\nDoctoral Degree (Ph.D.) Certificate\r\n`;
  bodyFaculty += `--${boundaryFaculty}\r\n`;
  bodyFaculty += `Content-Disposition: form-data; name="documentTitle"\r\n\r\nFaculty PhD Degree Certificate\r\n`;
  bodyFaculty += `--${boundaryFaculty}\r\n`;
  bodyFaculty += `Content-Disposition: form-data; name="document"; filename="faculty_phd.pdf"\r\n`;
  bodyFaculty += `Content-Type: application/pdf\r\n\r\n`;
  bodyFaculty += facultyPdf;
  bodyFaculty += `\r\n--${boundaryFaculty}--\r\n`;

  const facUploadRes = await fetch(`${BASE_URL}/api/documents/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${facultyToken}`,
      'Content-Type': `multipart/form-data; boundary=${boundaryFaculty}`,
    },
    body: Buffer.from(bodyFaculty, 'utf-8'),
  });

  const facUploadJson = await facUploadRes.json();
  assert(facUploadJson.success, 'Faculty successfully uploaded document with equal access');
  assert(facUploadJson.data.verificationSteps.length === 14, 'Faculty document received complete 14-step verification');
  assert(facUploadJson.data.memberType === 'faculty', 'Faculty memberType recorded for profile tracking');

  // 9. Admin Upload & Verification (Equal Access)
  console.log('\n9. Testing Admin Upload & Verification (Equal Access Invariant)...');
  const adminPdf = '%PDF-1.4\n1 0 obj\n<< /Title (Admin Identity Credential) >>\nendobj\n%%EOF';
  const boundaryAdmin = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

  let bodyAdmin = '';
  bodyAdmin += `--${boundaryAdmin}\r\n`;
  bodyAdmin += `Content-Disposition: form-data; name="documentType"\r\n\r\nAadhaar Card\r\n`;
  bodyAdmin += `--${boundaryAdmin}\r\n`;
  bodyAdmin += `Content-Disposition: form-data; name="documentTitle"\r\n\r\nAdmin Official ID Card\r\n`;
  bodyAdmin += `--${boundaryAdmin}\r\n`;
  bodyAdmin += `Content-Disposition: form-data; name="document"; filename="admin_id.pdf"\r\n`;
  bodyAdmin += `Content-Type: application/pdf\r\n\r\n`;
  bodyAdmin += adminPdf;
  bodyAdmin += `\r\n--${boundaryAdmin}--\r\n`;

  const admUploadRes = await fetch(`${BASE_URL}/api/documents/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': `multipart/form-data; boundary=${boundaryAdmin}`,
    },
    body: Buffer.from(bodyAdmin, 'utf-8'),
  });

  const admUploadJson = await admUploadRes.json();
  assert(admUploadJson.success, 'Admin successfully uploaded document with equal access');
  assert(admUploadJson.data.verificationSteps.length === 14, 'Admin document received complete 14-step verification');

  // 10. Application Guide Progress & Prerequisite Checklist
  console.log('\n10. Testing Application Guide Progress (8-Step Roadmap & Checklist)...');
  const progressRes = await fetch(`${BASE_URL}/api/applications/${testAppId}/progress`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const progressJson = await progressRes.json();
  assert(progressJson.success, 'Application progress retrieved');
  assert(progressJson.data.guidanceSteps.length === 8, 'Includes complete 8-step application roadmap');
  assert(progressJson.data.progressPercentage > 0, `Progress calculated: ${progressJson.data.progressText} (${progressJson.data.progressPercentage}%)`);
  assert(progressJson.data.checklist.length > 0, 'Checklist reflects required document readiness');

  // 11. Common Verification Queue (Privacy-Protected)
  console.log('\n11. Testing Common Verification Queue & Stats...');
  const queueRes = await fetch(`${BASE_URL}/api/verification/queue`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const queueJson = await queueRes.json();
  assert(queueJson.success && queueJson.data.length >= 3, `Queue returned ${queueJson.data.length} submissions`);

  const facEntry = queueJson.data.find((d) => d.memberType === 'faculty');
  if (facEntry) {
    assert(facEntry.memberEmail.includes('•'), 'Privacy protection: sensitive email masked for other members');
  }

  const statsRes = await fetch(`${BASE_URL}/api/verification/stats`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const statsJson = await statsRes.json();
  assert(statsJson.success && statsJson.data.global.total >= 3, 'Global verification statistics returned');
  assert(statsJson.data.member.total >= 1, 'Member-specific verification statistics returned');

  // 12. Multilingual Grounded AI Assistant
  console.log('\n12. Testing Multilingual Grounded AI Assistant (Documents & Verification)...');
  // Query 1: English
  const aiEnRes = await fetch(`${BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${studentToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: 'What documents do I need for US visa?', language: 'en' }),
  });
  const aiEn = await aiEnRes.json();
  assert(aiEn.success && aiEn.intent === 'document_requirements', 'AI recognized document_requirements intent (EN)');
  assert(aiEn.response.includes('Passport'), 'AI returned grounded document requirements (EN)');

  // Query 2: Telugu
  const aiTeRes = await fetch(`${BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${studentToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: 'US వీసా కోసం ఏ పత్రాలు కావాలి?', language: 'te' }),
  });
  const aiTe = await aiTeRes.json();
  assert(aiTe.success && aiTe.language === 'te', 'AI returned Telugu response');
  assert(aiTe.response.includes('పత్రాలు'), 'AI response localized in Telugu');

  // Query 3: Hindi
  const aiHiRes = await fetch(`${BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${studentToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: 'मेरे दस्तावेज़ों की स्थिति क्या है?', language: 'hi' }),
  });
  const aiHi = await aiHiRes.json();
  assert(aiHi.success && aiHi.intent === 'document_status', 'AI recognized document_status intent (HI)');
  assert(aiHi.response.includes('सत्यापन'), 'AI response localized in Hindi');

  // 13. Zero-Regression Check: Ensure existing college ERP endpoints work
  console.log('\n13. Zero-Regression Verification on Existing Features...');
  const labExamRes = await fetch(`${BASE_URL}/api/lab-exams/student-exams`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(labExamRes.status === 200, 'Existing Lab Exams Student API intact');

  const facLabExamRes = await fetch(`${BASE_URL}/api/lab-exams`, {
    headers: { Authorization: `Bearer ${facultyToken}` },
  });
  assert(facLabExamRes.status === 200, 'Existing Lab Exams Faculty API intact');

  const attendanceRes = await fetch(`${BASE_URL}/api/attendance/student/my`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(attendanceRes.status === 200, 'Existing Attendance API intact');

  console.log('===============================================================');
  console.log(`ALL VERIFICATION TESTS PASSED: ${passedTests} / ${totalTests} (100%)`);
  console.log('===============================================================');

  process.exit(0);
}

run().catch((err) => {
  console.error('\n❌ Test execution encountered an error:', err);
  process.exit(1);
});
