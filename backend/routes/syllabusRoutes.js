import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { listSyllabus, createSyllabus, updateSyllabus, deleteSyllabus, getProgress, linkResource, unlinkResource } from '../controllers/syllabusController.js';

const router = Router();
router.use(authMiddleware);
router.get('/:subjectId/progress', getProgress);
router.get('/:subjectId', listSyllabus);
router.post('/', createSyllabus);
router.put('/:id', updateSyllabus);
router.delete('/:id', deleteSyllabus);
router.post('/topics/:topicId/resources', linkResource);
router.delete('/topics/:topicId/resources/:resourceId', unlinkResource);
export default router;