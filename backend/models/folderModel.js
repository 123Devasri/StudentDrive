import pool from '../config/db.js';

export async function findFoldersByUserId(userId) {
  const [rows] = await pool.execute(`SELECT f.id, f.user_id AS userId, f.subject_id AS subjectId, f.name,
    f.created_at AS createdAt, COUNT(r.id) AS resourceCount FROM folders f
    LEFT JOIN resources r ON r.folder_id = f.id AND r.user_id = f.user_id
    WHERE f.user_id = ? GROUP BY f.id ORDER BY f.name`, [userId]);
  return rows;
}

export async function createFolder({ userId, subjectId, name }) {
  const [result] = await pool.execute('INSERT INTO folders (user_id, subject_id, name) VALUES (?, ?, ?)', [userId, subjectId || null, name]);
  return findFolderById(result.insertId, userId);
}

export async function findFolderById(folderId, userId) {
  const [rows] = await pool.execute('SELECT id, user_id AS userId, subject_id AS subjectId, name, created_at AS createdAt FROM folders WHERE id = ? AND user_id = ?', [folderId, userId]);
  return rows[0];
}

export async function updateFolder(folderId, userId, name) {
  const [result] = await pool.execute('UPDATE folders SET name = ? WHERE id = ? AND user_id = ?', [name, folderId, userId]);
  return result.affectedRows ? findFolderById(folderId, userId) : null;
}

export async function deleteFolder(folderId, userId) {
  const [resources] = await pool.execute('SELECT COUNT(*) AS resourceCount FROM resources WHERE folder_id = ? AND user_id = ?', [folderId, userId]);
  if (Number(resources[0].resourceCount) > 0) return { deleted: false, hasResources: true };
  const [result] = await pool.execute('DELETE FROM folders WHERE id = ? AND user_id = ?', [folderId, userId]);
  return { deleted: result.affectedRows > 0, hasResources: false };
}

export async function findFolderResources(folderId, userId) {
  const [rows] = await pool.execute(`SELECT r.id, r.original_name AS originalName, r.file_type AS fileType,
    r.file_size AS fileSize, r.subject_id AS subjectId, s.name AS subjectName,
    r.description, r.created_at AS createdAt FROM resources r
    JOIN subjects s ON s.id = r.subject_id WHERE r.folder_id = ? AND r.user_id = ? ORDER BY r.created_at DESC`, [folderId, userId]);
  return rows;
}