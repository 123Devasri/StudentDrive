import { Router } from 'express';
import { listTags, createTag, deleteTag } from '../controllers/tagController.js';

const router = Router();
router.get('/', listTags);
router.post('/', createTag);
router.delete('/:id', deleteTag);
export default router;