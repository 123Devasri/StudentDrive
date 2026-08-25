import { syllabusUnits, knowledgeGaps } from '../data/mockData';

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getToken() {

	return localStorage.getItem('studentdrive_token');
}

export async function checkBackend() {
	const response = await fetch(`${BASE_URL}/health`);
	if (!response.ok) throw new Error('Backend health check failed');
	return response.json();
}

async function request(path, options = {}) {
	const token = getToken();
	const response = await fetch(`${BASE_URL}${path}`, {
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...options.headers,
		},
		...options,
	});
	const data = await response.json();
	if (!response.ok) throw new Error(data.message || 'Request failed');
	return data;
}

export async function getSubjects() {
	return request('/subjects');
}

export async function getSubject(subjectId) {
	return request(`/subjects/${subjectId}`);
}

export async function createSubject(subjectData) {
	return request('/subjects', { method: 'POST', body: JSON.stringify(subjectData) });
}

export async function updateSubject(subjectId, subjectData) {
	return request(`/subjects/${subjectId}`, { method: 'PUT', body: JSON.stringify(subjectData) });
}

export async function deleteSubject(subjectId) {
	return request(`/subjects/${subjectId}`, { method: 'DELETE' });
}

export async function getResources() {
	return request('/resources');
}

export async function getResource(resourceId) {
	return request(`/resources/${resourceId}`);
}

export async function uploadResource(formData) {
	const token = getToken();
	const response = await fetch(`${BASE_URL}/resources`, {
		method: 'POST',
		headers: token ? { Authorization: `Bearer ${token}` } : {},
		body: formData,
	});
	const data = await response.json();
	if (!response.ok) throw new Error(data.message || 'Resource upload failed');
	return data;
}

export async function updateResource(resourceId, resourceData) {
	return request(`/resources/${resourceId}`, { method: 'PUT', body: JSON.stringify(resourceData) });
}

export async function deleteResource(resourceId) {
	return request(`/resources/${resourceId}`, { method: 'DELETE' });
}

export function getResourceDownloadUrl(resourceId) {
	return `${BASE_URL}/resources/${resourceId}/download`;
}

export async function downloadResource(resourceId, fileName) {
	const response = await fetch(getResourceDownloadUrl(resourceId), {
		headers: { Authorization: `Bearer ${getToken()}` },
	});
	if (!response.ok) {
		const data = await response.json();
		throw new Error(data.message || 'Download failed');
	}
	const blob = await response.blob();
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = fileName;
	link.click();
	URL.revokeObjectURL(url);
}

export function registerUser(data) { return request('/auth/register', { method: 'POST', body: JSON.stringify(data) }); }
export function loginUser(data) { return request('/auth/login', { method: 'POST', body: JSON.stringify(data) }); }
export function getCurrentUser(token) { return request('/auth/me', { headers: { Authorization: `Bearer ${token}` } }); }
export function logoutUser(token) { return request('/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); }

// These functions mirror the future REST API and use mock data for now.
export async function getSyllabus() { return syllabusUnits; }
export async function askStudyAssistant(message, subjectId) { return { message, subjectId, answer: 'This response will come from the study assistant API once it is connected.' }; }
export async function getAnalytics() { return knowledgeGaps; }
export async function submitQuiz(data) { return { score: 7, total: 10, ...data }; }
