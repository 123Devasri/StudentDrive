import pool from '../config/db.js';

export async function findFoldersByUserId(userId) {
  const [rows] = await pool.query('SELECT * FROM folders WHERE user_id = ? ORDER BY name', [userId]);
  return rows;
}