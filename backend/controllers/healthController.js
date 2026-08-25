import pool from '../config/db.js';

export async function getHealth(request, response, next) {
  try {
    await pool.query('SELECT 1');
    response.json({ success: true, message: 'StudentDrive API is running', database: 'connected' });
  } catch (error) {
    next(error);
  }
}