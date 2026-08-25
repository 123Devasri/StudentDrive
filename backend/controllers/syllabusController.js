import { findSubjectById } from '../models/subjectModel.js';
import pool from '../config/db.js';
import { createSyllabusTopic, deleteSyllabusTopic, findSyllabusBySubjectId, findSyllabusTopicById, findTopicResources, getSyllabusProgress, updateSyllabusTopic } from '../models/syllabusModel.js';

const statuses = new Set(['Not Started', 'In Progress', 'Covered']);

function validateTopic(data) {
	if (!Number.isInteger(Number(data.unit)) || Number(data.unit) < 1) return 'Unit must be a positive whole number';
	if (!data.topic?.trim()) return 'Topic is required';
	if (data.status && !statuses.has(data.status)) return 'Invalid topic status';
	return null;
}

export async function listSyllabus(request, response, next) {
	try {
		if (!await findSubjectById(request.params.subjectId, request.user.id)) return response.status(404).json({ success: false, message: 'Subject not found' });
		const topics = await findSyllabusBySubjectId(request.user.id, request.params.subjectId);
		const topicsWithResources = await Promise.all(topics.map(async (topic) => ({ ...topic, resources: await findTopicResources(topic.id, request.user.id) })));
		response.json({ success: true, topics: topicsWithResources });
	} catch (error) { next(error); }
}

export async function getProgress(request, response, next) {
	try {
		if (!await findSubjectById(request.params.subjectId, request.user.id)) return response.status(404).json({ success: false, message: 'Subject not found' });
		response.json({ success: true, progress: await getSyllabusProgress(request.user.id, request.params.subjectId) });
	} catch (error) { next(error); }
}

export async function createSyllabus(request, response, next) {
	try {
		const validationError = validateTopic(request.body);
		if (validationError) return response.status(400).json({ success: false, message: validationError });
		if (!await findSubjectById(request.body.subjectId, request.user.id)) return response.status(404).json({ success: false, message: 'Subject not found' });
		const topic = await createSyllabusTopic({ ...request.body, userId: request.user.id, subjectId: Number(request.body.subjectId), unit: Number(request.body.unit) });
		response.status(201).json({ success: true, topic });
	} catch (error) { next(error); }
}

export async function updateSyllabus(request, response, next) {
	try {
		const validationError = validateTopic(request.body);
		if (validationError) return response.status(400).json({ success: false, message: validationError });
		const topic = await updateSyllabusTopic(request.params.id, request.user.id, { ...request.body, unit: Number(request.body.unit) });
		if (!topic) return response.status(404).json({ success: false, message: 'Syllabus topic not found' });
		response.json({ success: true, topic });
	} catch (error) { next(error); }
}

export async function deleteSyllabus(request, response, next) {
	try {
		if (!await deleteSyllabusTopic(request.params.id, request.user.id)) return response.status(404).json({ success: false, message: 'Syllabus topic not found' });
		response.json({ success: true, message: 'Syllabus topic deleted successfully' });
	} catch (error) { next(error); }
}

export async function linkResource(request, response, next) {
	try {
		const topic = await findSyllabusTopicById(request.params.topicId, request.user.id);
		const resource = await findResourceForUser(request.body.resourceId, request.user.id);
		if (!topic || !resource || topic.subjectId !== resource.subjectId) return response.status(404).json({ success: false, message: 'Topic or resource not found' });
		await pool.execute('INSERT INTO resource_syllabus_topics (resource_id, syllabus_topic_id) VALUES (?, ?)', [resource.id, topic.id]);
		response.status(201).json({ success: true, message: 'Resource linked to topic' });
	} catch (error) { next(error); }
}

export async function unlinkResource(request, response, next) {
	try {
		const [result] = await pool.execute(`DELETE rst FROM resource_syllabus_topics rst
			JOIN resources r ON r.id = rst.resource_id JOIN syllabus_topics st ON st.id = rst.syllabus_topic_id
			WHERE rst.resource_id = ? AND rst.syllabus_topic_id = ? AND r.user_id = ? AND st.user_id = ?`, [request.params.resourceId, request.params.topicId, request.user.id, request.user.id]);
		if (!result.affectedRows) return response.status(404).json({ success: false, message: 'Resource topic link not found' });
		response.json({ success: true, message: 'Resource unlinked from topic' });
	} catch (error) { next(error); }
}

async function findResourceForUser(resourceId, userId) {
	const [rows] = await pool.execute('SELECT id, subject_id AS subjectId FROM resources WHERE id = ? AND user_id = ?', [resourceId, userId]);
	return rows[0];
}