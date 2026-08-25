import { createFolder as insertFolder, deleteFolder as removeFolder, findFolderById, findFolderResources, findFoldersByUserId, updateFolder as editFolder } from '../models/folderModel.js';
import { findSubjectById } from '../models/subjectModel.js';

export async function listFolders(request, response, next) {
	try { response.json({ success: true, folders: await findFoldersByUserId(request.user.id) }); } catch (error) { next(error); }
}

export async function createFolder(request, response, next) {
	try {
		const name = request.body.name?.trim();
		if (!name) return response.status(400).json({ success: false, message: 'Folder name is required' });
		if (request.body.subjectId && !await findSubjectById(request.body.subjectId, request.user.id)) return response.status(404).json({ success: false, message: 'Subject not found' });
		const folder = await insertFolder({ userId: request.user.id, subjectId: request.body.subjectId, name });
		response.status(201).json({ success: true, folder });
	} catch (error) {
		if (error.code === 'ER_DUP_ENTRY') return response.status(409).json({ success: false, message: 'A folder with this name already exists' });
		next(error);
	}
}

export async function updateFolder(request, response, next) {
	try {
		const name = request.body.name?.trim();
		if (!name) return response.status(400).json({ success: false, message: 'Folder name is required' });
		const folder = await editFolder(request.params.id, request.user.id, name);
		if (!folder) return response.status(404).json({ success: false, message: 'Folder not found' });
		response.json({ success: true, folder });
	} catch (error) { next(error); }
}

export async function deleteFolder(request, response, next) {
	try {
		if (!await removeFolder(request.params.id, request.user.id)) return response.status(404).json({ success: false, message: 'Folder not found' });
		response.json({ success: true, message: 'Folder deleted successfully' });
	} catch (error) { next(error); }
}

export async function getFolderResources(request, response, next) {
	try {
		if (!await findFolderById(request.params.id, request.user.id)) return response.status(404).json({ success: false, message: 'Folder not found' });
		response.json({ success: true, resources: await findFolderResources(request.params.id, request.user.id) });
	} catch (error) { next(error); }
}