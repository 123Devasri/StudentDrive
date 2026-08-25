import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { listFolders, createFolder, updateFolder, deleteFolder, getFolderResources } from '../controllers/folderController.js';

const router = Router();
router.use(authMiddleware);
router.get('/', listFolders);
router.post('/', createFolder);
router.get('/:id/resources', getFolderResources);
router.put('/:id', updateFolder);
router.delete('/:id', deleteFolder);
export default router;