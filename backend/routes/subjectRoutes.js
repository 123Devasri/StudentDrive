import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { listSubjects, createSubject, getSubject, updateSubject, deleteSubject } from '../controllers/subjectController.js';

const router = Router();
router.use(authMiddleware);
router.get('/', listSubjects);
router.post('/', createSubject);
router.get('/:id', getSubject);
router.put('/:id', updateSubject);
router.delete('/:id', deleteSubject);
export default router;