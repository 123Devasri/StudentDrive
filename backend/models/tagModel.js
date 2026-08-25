import pool from '../config/db.js';

export async function findTagsByUserId(userId) {
  const [rows] = await pool.execute('SELECT id, user_id AS userId, name FROM tags WHERE user_id = ? ORDER BY name', [userId]);
  return rows;
}

export async function createTag(userId, name) {
  const [result] = await pool.execute('INSERT INTO tags (user_id, name) VALUES (?, ?)', [userId, name]);
  const [rows] = await pool.execute('SELECT id, user_id AS userId, name FROM tags WHERE id = ?', [result.insertId]);
  return rows[0];
}

export async function deleteTag(tagId, userId) {
  const [result] = await pool.execute('DELETE FROM tags WHERE id = ? AND user_id = ?', [tagId, userId]);
  return result.affectedRows > 0;
}