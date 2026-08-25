import pool from '../config/db.js';
import { createTag as insertTag, deleteTag as removeTag, findTagsByUserId } from '../models/tagModel.js';

export async function listTags(request, response, next) {
	try { response.json({ success: true, tags: await findTagsByUserId(request.user.id) }); } catch (error) { next(error); }
}

export async function createTag(request, response, next) {
	try {
		const name = request.body.name?.trim();
		if (!name) return response.status(400).json({ success: false, message: 'Tag name is required' });
		response.status(201).json({ success: true, tag: await insertTag(request.user.id, name) });
	} catch (error) {
		if (error.code === 'ER_DUP_ENTRY') return response.status(409).json({ success: false, message: 'Tag already exists' });
		next(error);
	}
}

export async function deleteTag(request, response, next) {
	try {
		if (!await removeTag(request.params.id, request.user.id)) return response.status(404).json({ success: false, message: 'Tag not found' });
		response.json({ success: true, message: 'Tag deleted successfully' });
	} catch (error) { next(error); }
}

export async function addTagToResource(request, response, next) {
	try {
		const [result] = await pool.execute(`INSERT INTO resource_tags (resource_id, tag_id)
			SELECT r.id, t.id FROM resources r JOIN tags t ON t.id = ?
			WHERE r.id = ? AND r.user_id = ? AND t.user_id = ?`, [request.body.tagId, request.params.id, request.user.id, request.user.id]);
		if (!result.affectedRows) return response.status(404).json({ success: false, message: 'Resource or tag not found' });
		response.status(201).json({ success: true, message: 'Tag added to resource' });
	} catch (error) {
		if (error.code === 'ER_DUP_ENTRY') return response.status(409).json({ success: false, message: 'Tag is already assigned' });
		next(error);
	}
}

export async function removeTagFromResource(request, response, next) {
	try {
		const [result] = await pool.execute(`DELETE rt FROM resource_tags rt
			JOIN resources r ON r.id = rt.resource_id JOIN tags t ON t.id = rt.tag_id
			WHERE rt.resource_id = ? AND rt.tag_id = ? AND r.user_id = ? AND t.user_id = ?`, [request.params.id, request.params.tagId, request.user.id, request.user.id]);
		if (!result.affectedRows) return response.status(404).json({ success: false, message: 'Resource tag not found' });
		response.json({ success: true, message: 'Tag removed from resource' });
	} catch (error) { next(error); }
}