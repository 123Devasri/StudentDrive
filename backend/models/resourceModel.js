import pool from '../config/db.js';

export async function findResourcesByUserId(userId) {
  const [rows] = await pool.query('SELECT * FROM resources WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return rows;
}