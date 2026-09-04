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

export async function searchResources(filters = {}) {
	const query = new URLSearchParams();
	Object.entries(filters).forEach(([key, value]) => { if (value) query.set(key, value); });
	return request(`/resources?${query.toString()}`);
}

export async function getFolders() { return request('/folders'); }
export async function createFolder(folderData) { return request('/folders', { method: 'POST', body: JSON.stringify(folderData) }); }
export async function updateFolder(folderId, folderData) { return request(`/folders/${folderId}`, { method: 'PUT', body: JSON.stringify(folderData) }); }
export async function deleteFolder(folderId) { return request(`/folders/${folderId}`, { method: 'DELETE' }); }
export async function getFolderResources(folderId) { return request(`/folders/${folderId}/resources`); }
export async function getTags() { return request('/tags'); }
export async function createTag(name) { return request('/tags', { method: 'POST', body: JSON.stringify({ name }) }); }
export async function deleteTag(tagId) { return request(`/tags/${tagId}`, { method: 'DELETE' }); }
export async function addTagToResource(resourceId, tagId) { return request(`/resources/${resourceId}/tags`, { method: 'POST', body: JSON.stringify({ tagId }) }); }
export async function removeTagFromResource(resourceId, tagId) { return request(`/resources/${resourceId}/tags/${tagId}`, { method: 'DELETE' }); }
export async function getSyllabusTopics(subjectId) { return request(`/syllabus/${subjectId}`); }
export async function getSyllabusProgress(subjectId) { return request(`/syllabus/${subjectId}/progress`); }
export async function createSyllabusTopic(topicData) { return request('/syllabus', { method: 'POST', body: JSON.stringify(topicData) }); }
export async function updateSyllabusTopic(topicId, topicData) { return request(`/syllabus/${topicId}`, { method: 'PUT', body: JSON.stringify(topicData) }); }
export async function deleteSyllabusTopic(topicId) { return request(`/syllabus/${topicId}`, { method: 'DELETE' }); }
export async function linkResourceToTopic(topicId, resourceId) { return request(`/syllabus/topics/${topicId}/resources`, { method: 'POST', body: JSON.stringify({ resourceId }) }); }
export async function unlinkResourceFromTopic(topicId, resourceId) { return request(`/syllabus/topics/${topicId}/resources/${resourceId}`, { method: 'DELETE' }); }
export async function getDashboard() { return request('/dashboard'); }
export async function getAssistantHealth() { return request('/assistant/health'); }
export async function askAssistant(question, subjectId, unitId) { return request('/assistant/ask', { method: 'POST', body: JSON.stringify({ question, subjectId: Number(subjectId), unitId: Number(unitId) }) }); }
export async function askAssistantStream(question, subjectId, unitId, { onMetadata, onToken, onError, onDone }) {
	const token = getToken();
	const response = await fetch(`${BASE_URL}/assistant/ask-stream`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ question, subjectId: Number(subjectId), unitId: Number(unitId) }),
	});

	if (!response.ok) {
		const errorJson = await response.json().catch(() => ({}));
		throw new Error(errorJson.message || `Server error (HTTP ${response.status})`);
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder('utf-8');
	let buffer = '';

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		const parts = buffer.split('\n\n');
		buffer = parts.pop() || '';

		for (const part of parts) {
			if (!part.trim()) continue;
			let eventName = 'message';
			let dataStr = '';

			for (const line of part.split('\n')) {
				if (line.startsWith('event: ')) {
					eventName = line.slice(7).trim();
				} else if (line.startsWith('data: ')) {
					dataStr = line.slice(6).trim();
				}
			}

			if (!dataStr) continue;

			try {
				const payload = JSON.parse(dataStr);
				if (eventName === 'metadata' && onMetadata) {
					onMetadata(payload);
				} else if (eventName === 'token' && onToken) {
					onToken(payload.token);
				} else if (eventName === 'done' && onDone) {
					onDone(payload);
				} else if (eventName === 'error' && onError) {
					onError(payload.message || 'Stream error');
				}
			} catch (e) {
				// Ignore parse error
			}
		}
	}
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
export function updateUserProfile(data) { return request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }); }
export function changePassword(data) { return request('/auth/change-password', { method: 'PUT', body: JSON.stringify(data) }); }
export function logoutUser(token) { return request('/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); }

export async function generateQuiz(subjectId, unitId, questionCount = 10, difficulty = 'Medium') {
	return request('/quiz/generate', {
		method: 'POST',
		body: JSON.stringify({
			subjectId: Number(subjectId),
			unitId: Number(unitId),
			questionCount: Number(questionCount),
			difficulty,
		}),
	});
}

// These functions mirror the future REST API and use mock data for now.
export async function getSyllabus() { return { topics: [] }; }
export async function getAnalytics() { return { gaps: [] }; }
export async function submitQuiz() { return { score: 0, total: 0 }; }
