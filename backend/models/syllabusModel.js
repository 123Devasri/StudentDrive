import pool from '../config/db.js';

export async function findSyllabusBySubjectId(userId, subjectId) {
  const [rows] = await pool.execute(`SELECT id, unit, topic, status, created_at AS createdAt,
    updated_at AS updatedAt FROM syllabus_topics WHERE user_id = ? AND subject_id = ? ORDER BY unit, topic`, [userId, subjectId]);
  return rows;
}

export async function createSyllabusTopic({ userId, subjectId, unit, topic, status }) {
  const [result] = await pool.execute('INSERT INTO syllabus_topics (user_id, subject_id, unit, topic, status) VALUES (?, ?, ?, ?, ?)', [userId, subjectId, unit, topic, status || 'Not Started']);
  return findSyllabusTopicById(result.insertId, userId);
}

export async function findSyllabusTopicById(topicId, userId) {
  const [rows] = await pool.execute('SELECT id, subject_id AS subjectId, unit, topic, status, created_at AS createdAt, updated_at AS updatedAt FROM syllabus_topics WHERE id = ? AND user_id = ?', [topicId, userId]);
  return rows[0];
}

export async function updateSyllabusTopic(topicId, userId, { unit, topic, status }) {
  const [result] = await pool.execute('UPDATE syllabus_topics SET unit = ?, topic = ?, status = ? WHERE id = ? AND user_id = ?', [unit, topic, status, topicId, userId]);
  return result.affectedRows ? findSyllabusTopicById(topicId, userId) : null;
}

export async function deleteSyllabusTopic(topicId, userId) {
  const [result] = await pool.execute('DELETE FROM syllabus_topics WHERE id = ? AND user_id = ?', [topicId, userId]);
  return result.affectedRows > 0;
}

export async function getSyllabusProgress(userId, subjectId) {
  const [rows] = await pool.execute(`SELECT COUNT(*) AS totalTopics,
    SUM(status = 'Covered') AS coveredTopics,
    SUM(status = 'In Progress') AS inProgressTopics,
    SUM(status = 'Not Started') AS notStartedTopics
    FROM syllabus_topics WHERE user_id = ? AND subject_id = ?`, [userId, subjectId]);
  const progress = rows[0];
  const totalTopics = Number(progress.totalTopics);
  const coveredTopics = Number(progress.coveredTopics || 0);
  return { totalTopics, coveredTopics, inProgressTopics: Number(progress.inProgressTopics || 0), notStartedTopics: Number(progress.notStartedTopics || 0), coverage: totalTopics ? Math.round((coveredTopics / totalTopics) * 100) : 0 };
}

export async function findTopicResources(topicId, userId) {
  const [rows] = await pool.execute(`SELECT r.id, r.original_name AS originalName, r.file_type AS fileType
    FROM resource_syllabus_topics rst JOIN resources r ON r.id = rst.resource_id
    WHERE rst.syllabus_topic_id = ? AND r.user_id = ? ORDER BY r.original_name`, [topicId, userId]);
  return rows;
}