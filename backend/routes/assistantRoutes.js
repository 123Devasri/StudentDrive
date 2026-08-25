import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { askAssistant } from '../controllers/assistantController.js';

const router = Router();
router.use(authMiddleware);
router.post('/ask', askAssistant);
export default router;