import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { askAssistant, askAssistantStream, getAssistantHealth } from '../controllers/assistantController.js';

const router = Router();
router.use(authMiddleware);
router.get('/health', getAssistantHealth);
router.post('/ask', askAssistant);
router.post('/ask-stream', askAssistantStream);
export default router;