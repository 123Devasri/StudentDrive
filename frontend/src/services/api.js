import { subjects, resources, syllabusUnits, knowledgeGaps } from '../data/mockData';

// These functions mirror the future REST API and use mock data for now.
export async function getSubjects() { return subjects; }
export async function getSubject(id) { return subjects.find((subject) => subject.id === Number(id)); }
export async function getResources() { return resources; }
export async function getSyllabus() { return syllabusUnits; }
export async function askStudyAssistant(message, subjectId) { return { message, subjectId, answer: 'This response will come from the study assistant API once it is connected.' }; }
export async function getAnalytics() { return knowledgeGaps; }
export async function submitQuiz(data) { return { score: 7, total: 10, ...data }; }
