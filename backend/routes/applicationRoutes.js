import express from 'express';
import { documentController } from '../controllers/documentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Equal Access for all authenticated members
router.use(authenticate);

router.get('/', documentController.getApplications);
router.get('/:id', documentController.getApplicationById);
router.get('/:id/requirements', documentController.getApplicationRequirements);
router.get('/:id/official-links', async (req, res) => {
  try {
    const { id } = req.params;
    const { Application } = await import('../models/DocumentVerification.js');
    const app = await Application.findById(id).select('name country authority officialWebsite officialApplyUrl requirementsUrl trackingUrl').lean();
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    return res.json({ success: true, data: app });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
router.get('/:id/progress', documentController.getApplicationProgress);

export default router;

