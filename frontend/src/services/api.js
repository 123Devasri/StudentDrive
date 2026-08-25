import { subjects, resources, syllabusUnits, knowledgeGaps } from '../data/mockData';

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function checkBackend() {
	const response = await fetch(`${BASE_URL}/health`);
	if (!response.ok) throw new Error('Backend health check failed');
	return response.json();
}

async function request(path, options = {}) {
	const response = await fetch(`${BASE_URL}${path}`, {
		headers: { 'Content-Type': 'application/json', ...options.headers },
		...options,
	});
	const data = await response.json();
	if (!response.ok) throw new Error(data.message || 'Request failed');
	return data;
}

export function registerUser(data) { return request('/auth/register', { method: 'POST', body: JSON.stringify(data) }); }
export function loginUser(data) { return request('/auth/login', { method: 'POST', body: JSON.stringify(data) }); }
export function getCurrentUser(token) { return request('/auth/me', { headers: { Authorization: `Bearer ${token}` } }); }
export function logoutUser(token) { return request('/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); }

// These functions mirror the future REST API and use mock data for now.
export async function getSubjects() { return subjects; }
export async function getSubject(id) { return subjects.find((subject) => subject.id === Number(id)); }
export async function getResources() { return resources; }
export async function getSyllabus() { return syllabusUnits; }
export async function askStudyAssistant(message, subjectId) { return { message, subjectId, answer: 'This response will come from the study assistant API once it is connected.' }; }
export async function getAnalytics() { return knowledgeGaps; }
export async function submitQuiz(data) { return { score: 7, total: 10, ...data }; }
