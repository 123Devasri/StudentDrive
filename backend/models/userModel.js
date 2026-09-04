import pool from '../config/db.js';

export async function findUserByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
}

export async function findUserById(id) {
  const [rows] = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = ?', [id]);
  return rows[0];
}

export async function findUserWithPasswordById(id) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0];
}

export async function createUser({ name, email, passwordHash }) {
  const [result] = await pool.query('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [name, email, passwordHash]);
  return result.insertId;
}

export async function updateUserProfile(id, { name, email }) {
  await pool.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id]);
  return findUserById(id);
}

export async function updateUserPassword(id, passwordHash) {
  const [result] = await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
  return result.affectedRows > 0;
}