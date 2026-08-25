import { Router } from 'express';
import { listFolders, createFolder, updateFolder, deleteFolder } from '../controllers/folderController.js';

const router = Router();
router.get('/', listFolders);
router.post('/', createFolder);
router.put('/:id', updateFolder);
router.delete('/:id', deleteFolder);
export default router;