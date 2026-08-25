import { Router } from 'express';
import { listSyllabus, createSyllabus, updateSyllabus, deleteSyllabus } from '../controllers/syllabusController.js';

const router = Router();
router.get('/:subjectId', listSyllabus);
router.post('/', createSyllabus);
router.put('/:id', updateSyllabus);
router.delete('/:id', deleteSyllabus);
export default router;