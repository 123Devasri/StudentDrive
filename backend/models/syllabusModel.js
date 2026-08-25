import pool from '../config/db.js';

export async function findSyllabusBySubjectId(userId, subjectId) {
  const [rows] = await pool.query('SELECT * FROM syllabus_topics WHERE user_id = ? AND subject_id = ? ORDER BY unit, topic', [userId, subjectId]);
  return rows;
}