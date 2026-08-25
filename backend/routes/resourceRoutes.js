import { Router } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { listResources, createResource, getResource, updateResource, deleteResource, downloadResource } from '../controllers/resourceController.js';

const uploadDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../uploads');
const allowedExtensions = new Set(['.pdf', '.ppt', '.pptx', '.doc', '.docx']);
const storage = multer.diskStorage({
	destination: uploadDirectory,
	filename: (request, file, callback) => callback(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(file.originalname).toLowerCase()}`),
});
const upload = multer({
	storage,
	limits: { fileSize: 10 * 1024 * 1024 },
	fileFilter: (request, file, callback) => {
		if (!allowedExtensions.has(path.extname(file.originalname).toLowerCase())) {
			const error = new Error('File type is not supported.');
			error.statusCode = 400;
			return callback(error);
		}
		callback(null, true);
	},
});

const router = Router();
router.use(authMiddleware);
router.get('/', listResources);
router.post('/', upload.single('file'), createResource);
router.get('/:id/download', downloadResource);
router.get('/:id', getResource);
router.put('/:id', updateResource);
router.delete('/:id', deleteResource);
export default router;