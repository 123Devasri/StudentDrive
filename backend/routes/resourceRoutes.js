import { Router } from 'express';
import { listResources, createResource, getResource, updateResource, deleteResource } from '../controllers/resourceController.js';

const router = Router();
router.get('/', listResources);
router.post('/', createResource);
router.get('/:id', getResource);
router.put('/:id', updateResource);
router.delete('/:id', deleteResource);
export default router;