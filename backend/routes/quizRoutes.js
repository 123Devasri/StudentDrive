import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { generateQuizController } from '../controllers/quizController.js';

const router = Router();
router.use(authMiddleware);
router.post('/generate', generateQuizController);

export default router;
