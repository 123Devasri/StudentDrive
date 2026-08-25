import pool from '../config/db.js';

export async function findTagsByUserId(userId) {
  const [rows] = await pool.query('SELECT * FROM tags WHERE user_id = ? ORDER BY name', [userId]);
  return rows;
}