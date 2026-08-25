import pool from '../config/db.js';

export async function findSubjectsByUserId(userId) {
  const [rows] = await pool.query('SELECT * FROM subjects WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return rows;
}

export async function createSubject(subject) {
  const { userId, name, code, semester, examDate, description } = subject;
  const [result] = await pool.query('INSERT INTO subjects (user_id, name, code, semester, exam_date, description) VALUES (?, ?, ?, ?, ?, ?)', [userId, name, code, semester, examDate, description]);
  return result.insertId;
}