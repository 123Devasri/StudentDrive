import fs from 'node:fs/promises';
import path from 'node:path';
import { findSubjectById } from '../models/subjectModel.js';
import { findFolderById } from '../models/folderModel.js';
import { addTagsToResource, createResource as insertResource, findResourceById, findResourcesByUserId, updateResource as editResource, deleteResource as removeResource } from '../models/resourceModel.js';

function validateSubjectId(subjectId) {
	return Number.isInteger(Number(subjectId)) && Number(subjectId) > 0;
}

export async function listResources(request, response, next) {
	try { response.json({ success: true, resources: await findResourcesByUserId(request.user.id, request.query) }); } catch (error) { next(error); }
}

export async function getResource(request, response, next) {
	try {
		const resource = await findResourceById(request.params.id, request.user.id);
		if (!resource) return response.status(404).json({ success: false, message: 'Resource not found' });
		response.json({ success: true, resource });
	} catch (error) { next(error); }
}

export async function createResource(request, response, next) {
	try {
		if (!request.file) return response.status(400).json({ success: false, message: 'A resource file is required' });
		if (!validateSubjectId(request.body.subjectId)) return response.status(400).json({ success: false, message: 'A valid subject is required' });
		const subject = await findSubjectById(request.body.subjectId, request.user.id);
		if (!subject) { await fs.unlink(request.file.path).catch(() => {}); return response.status(404).json({ success: false, message: 'Subject not found' }); }
		const folder = request.body.folderId ? await findFolderById(request.body.folderId, request.user.id) : null;
		if (request.body.folderId && (!folder || (folder.subjectId !== null && folder.subjectId !== Number(request.body.subjectId)))) {
			await fs.unlink(request.file.path).catch(() => {});
			return response.status(404).json({ success: false, message: 'Folder not found' });
		}
		const resource = await insertResource({
			userId: request.user.id,
			subjectId: Number(request.body.subjectId),
			folderId: request.body.folderId,
			originalName: request.file.originalname,
			storedName: request.file.filename,
			fileType: path.extname(request.file.originalname).slice(1).toLowerCase(),
			fileSize: request.file.size,
			filePath: request.file.path,
			description: request.body.description,
		});
		const tagIds = Array.isArray(request.body.tagIds) ? request.body.tagIds : request.body.tagIds ? [request.body.tagIds] : [];
		await addTagsToResource(resource.id, request.user.id, tagIds.map(Number).filter(Number.isInteger));
		const populatedResource = await findResourceById(resource.id, request.user.id);
		response.status(201).json({ success: true, resource: populatedResource || resource });
	} catch (error) { if (request.file) await fs.unlink(request.file.path).catch(() => {}); next(error); }
}

export async function updateResource(request, response, next) {
	try {
		if (!validateSubjectId(request.body.subjectId)) return response.status(400).json({ success: false, message: 'A valid subject is required' });
		if (!await findSubjectById(request.body.subjectId, request.user.id)) return response.status(404).json({ success: false, message: 'Subject not found' });
		const folder = request.body.folderId ? await findFolderById(request.body.folderId, request.user.id) : null;
		if (request.body.folderId && (!folder || (folder.subjectId !== null && folder.subjectId !== Number(request.body.subjectId)))) return response.status(404).json({ success: false, message: 'Folder not found' });
		const resource = await editResource(request.params.id, request.user.id, Number(request.body.subjectId), request.body.folderId, request.body.description);
		if (!resource) return response.status(404).json({ success: false, message: 'Resource not found' });
		response.json({ success: true, resource });
	} catch (error) { next(error); }
}

export async function deleteResource(request, response, next) {
	try {
		const resource = await removeResource(request.params.id, request.user.id);
		if (!resource) return response.status(404).json({ success: false, message: 'Resource not found' });
		await fs.unlink(resource.filePath).catch(() => {});
		response.json({ success: true, message: 'Resource deleted successfully' });
	} catch (error) { next(error); }
}

export async function downloadResource(request, response, next) {
	try {
		const resource = await findResourceById(request.params.id, request.user.id);
		if (!resource) return response.status(404).json({ success: false, message: 'Resource not found' });
		await fs.access(resource.filePath);
		response.download(resource.filePath, resource.originalName);
	} catch (error) {
		if (error.code === 'ENOENT') return response.status(404).json({ success: false, message: 'Resource file is no longer available' });
		next(error);
	}
}