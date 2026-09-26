import express from 'express';
import { documentController } from '../controllers/documentController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

/**
 * =========================================================================
 * ALL ROUTES PROTECTED BY `authenticate`
 * EQUAL FUNCTIONAL ACCESS FOR ALL AUTHENTICATED MEMBERS:
 * Student, Faculty, and Admin all have identical access!
 * Rule: if authenticated: allow
 * =========================================================================
 */
router.use(authenticate);

// Document CRUD & 14-Step Pipeline Actions
router.post('/upload', upload.single('document'), documentController.uploadDocument);
router.get('/', documentController.getMyDocuments);
router.get('/my', documentController.getMyDocuments);
router.get('/:id', documentController.getDocumentById);
router.post('/:id/verify', documentController.reverifyDocument);
router.get('/:id/status', documentController.getDocumentStatus);
router.get('/:id/steps', async (req, res) => {
  try {
    const doc = await documentController.getDocumentById(req, res);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});
router.post('/:id/reupload', upload.single('document'), documentController.reuploadDocument);
router.delete('/:id', documentController.deleteDocument);
router.get('/:id/report', documentController.downloadVerificationReport);

export default router;

