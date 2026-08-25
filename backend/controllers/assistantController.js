import pool from '../config/db.js';
import { answerQuestion } from '../services/aiService.js';

export async function askAssistant(request, response, next) {
  try {
    const question = request.body.question?.trim();
    if (!question) return response.status(400).json({ success: false, message: 'Question is required' });
    if (!request.body.subjectId) return response.status(400).json({ success: false, message: 'Subject is required' });
    const [[subject]] = await pool.execute('SELECT id, name FROM subjects WHERE id = ? AND user_id = ?', [request.body.subjectId, request.user.id]);
    if (!subject) return response.status(404).json({ success: false, message: 'Subject not found' });
    const [topics] = await pool.execute('SELECT unit, topic, status FROM syllabus_topics WHERE subject_id = ? AND user_id = ? ORDER BY unit, topic', [subject.id, request.user.id]);
    const [resources] = await pool.execute('SELECT original_name AS originalName, description FROM resources WHERE subject_id = ? AND user_id = ?', [subject.id, request.user.id]);
    const clarification = getClarification(question, topics);
    if (clarification) return response.json({ success: true, clarification: clarification.question, options: clarification.options, answer: '', sources: [] });
    const answer = await answerQuestion({ question, subject, topics, resources });
    response.json({ success: true, answer, sources: [] });
  } catch (error) {
    if (error.name === 'AbortError') return response.status(504).json({ success: false, message: 'AI request timed out' });
    if (error.message === 'LLM service is not configured' || error.message === 'LLM request failed') return response.status(503).json({ success: false, message: 'AI service is unavailable' });
    next(error);
  }
}

function getClarification(question, topics) {
  const match = question.match(/^(?:explain|define|tell me about)\s+(trees?|graphs?)\.?$/i);
  if (!match) return null;
  const options = topics.filter((topic) => topic.topic.toLowerCase().includes(match[1].toLowerCase().replace(/s$/, ''))).map((topic) => topic.topic);
  return options.length > 1 ? { question: 'Which topic would you like to study?', options } : null;
}