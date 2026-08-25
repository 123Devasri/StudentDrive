import { findSubjectsByUserId, findSubjectById, createSubject as insertSubject, updateSubject as editSubject, deleteSubject as removeSubject } from '../models/subjectModel.js';

function validateSubject(data) {
	if (!data.name?.trim()) return 'Subject name is required';
	if (!Number.isInteger(Number(data.semester)) || Number(data.semester) < 1) return 'Semester must be a positive whole number';
	if (data.examDate && Number.isNaN(Date.parse(data.examDate))) return 'Exam date is invalid';
	return null;
}

export async function listSubjects(request, response, next) {
	try { response.json({ success: true, subjects: await findSubjectsByUserId(request.user.id) }); } catch (error) { next(error); }
}

export async function getSubject(request, response, next) {
	try {
		const subject = await findSubjectById(request.params.id, request.user.id);
		if (!subject) return response.status(404).json({ success: false, message: 'Subject not found' });
		response.json({ success: true, subject });
	} catch (error) { next(error); }
}

export async function createSubject(request, response, next) {
	try {
		const validationError = validateSubject(request.body);
		if (validationError) return response.status(400).json({ success: false, message: validationError });
		const subject = await insertSubject({ ...request.body, userId: request.user.id, semester: Number(request.body.semester) });
		response.status(201).json({ success: true, subject });
	} catch (error) { next(error); }
}

export async function updateSubject(request, response, next) {
	try {
		const validationError = validateSubject(request.body);
		if (validationError) return response.status(400).json({ success: false, message: validationError });
		const subject = await editSubject(request.params.id, request.user.id, { ...request.body, semester: Number(request.body.semester) });
		if (!subject) return response.status(404).json({ success: false, message: 'Subject not found' });
		response.json({ success: true, subject });
	} catch (error) { next(error); }
}

export async function deleteSubject(request, response, next) {
	try {
		const deleted = await removeSubject(request.params.id, request.user.id);
		if (!deleted) return response.status(404).json({ success: false, message: 'Subject not found' });
		response.json({ success: true, message: 'Subject deleted successfully' });
	} catch (error) { next(error); }
}