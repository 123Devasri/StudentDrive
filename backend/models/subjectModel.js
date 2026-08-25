import pool from '../config/db.js';

export async function findSubjectsByUserId(userId) {
  const [rows] = await pool.execute('SELECT id, name, code, semester, exam_date AS examDate, description, created_at AS createdAt FROM subjects WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return rows;
}

export async function findSubjectById(subjectId, userId) {
  const [rows] = await pool.execute('SELECT id, name, code, semester, exam_date AS examDate, description, created_at AS createdAt FROM subjects WHERE id = ? AND user_id = ?', [subjectId, userId]);
  return rows[0];
}

export async function createSubject(subject) {
  const { userId, name, code, semester, examDate, description } = subject;
  const [result] = await pool.execute('INSERT INTO subjects (user_id, name, code, semester, exam_date, description) VALUES (?, ?, ?, ?, ?, ?)', [userId, name, code || null, semester, examDate || null, description || null]);
  return findSubjectById(result.insertId, userId);
}

export async function updateSubject(subjectId, userId, subject) {
  const { name, code, semester, examDate, description } = subject;
  const [result] = await pool.execute('UPDATE subjects SET name = ?, code = ?, semester = ?, exam_date = ?, description = ? WHERE id = ? AND user_id = ?', [name, code || null, semester, examDate || null, description || null, subjectId, userId]);
  if (!result.affectedRows) return null;
  return findSubjectById(subjectId, userId);
}

export async function deleteSubject(subjectId, userId) {
  const [result] = await pool.execute('DELETE FROM subjects WHERE id = ? AND user_id = ?', [subjectId, userId]);
  return result.affectedRows > 0;
}