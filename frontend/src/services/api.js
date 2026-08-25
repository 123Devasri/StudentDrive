import { subjects, resources, syllabusUnits, knowledgeGaps } from '../data/mockData';

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function checkBackend() {
	const response = await fetch(`${BASE_URL}/health`);
	if (!response.ok) throw new Error('Backend health check failed');
	return response.json();
}

// These functions mirror the future REST API and use mock data for now.
export async function getSubjects() { return subjects; }
export async function getSubject(id) { return subjects.find((subject) => subject.id === Number(id)); }
export async function getResources() { return resources; }
export async function getSyllabus() { return syllabusUnits; }
export async function askStudyAssistant(message, subjectId) { return { message, subjectId, answer: 'This response will come from the study assistant API once it is connected.' }; }
export async function getAnalytics() { return knowledgeGaps; }
export async function submitQuiz(data) { return { score: 7, total: 10, ...data }; }
