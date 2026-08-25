import { Router } from 'express';
import { listSubjects, createSubject, getSubject, updateSubject, deleteSubject } from '../controllers/subjectController.js';

const router = Router();
router.get('/', listSubjects);
router.post('/', createSubject);
router.get('/:id', getSubject);
router.put('/:id', updateSubject);
router.delete('/:id', deleteSubject);
export default router;