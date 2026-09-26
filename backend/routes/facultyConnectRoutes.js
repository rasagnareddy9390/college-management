import express from 'express';
import { facultyConnectController } from '../controllers/facultyConnectController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

export const facultyRouter = express.Router();
export const questionRouter = express.Router();

// ==========================================
// Faculty Directory & Profile Endpoints
// ==========================================
facultyRouter.get('/profile/me', authenticate, facultyConnectController.getMyProfile);
facultyRouter.put('/profile', authenticate, facultyConnectController.updateMyProfile);
facultyRouter.get('/subject/:subject', authenticate, facultyConnectController.getFacultyBySubject);
facultyRouter.get('/:id', authenticate, facultyConnectController.getFacultyById);
facultyRouter.get('/', authenticate, facultyConnectController.getFacultyDirectory);

// ==========================================
// Question Lifecycle & Conversation Endpoints
// ==========================================
questionRouter.get('/my', authenticate, facultyConnectController.getMyQuestions);
questionRouter.get('/received', authenticate, facultyConnectController.getReceivedQuestions);
questionRouter.get('/:id', authenticate, facultyConnectController.getQuestionDetails);
questionRouter.post('/', authenticate, upload.array('attachments', 5), facultyConnectController.askQuestion);
questionRouter.post('/:id/messages', authenticate, upload.array('attachments', 5), facultyConnectController.postMessage);
questionRouter.post('/:id/answer', authenticate, upload.array('attachments', 5), facultyConnectController.answerQuestion);
questionRouter.post('/:id/draft', authenticate, facultyConnectController.saveDraftAnswer);
questionRouter.post('/:id/resolve', authenticate, facultyConnectController.resolveQuestion);
questionRouter.post('/:id/reopen', authenticate, facultyConnectController.reopenQuestion);

export default {
  facultyRouter,
  questionRouter,
};

