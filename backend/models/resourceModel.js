import pool from '../config/db.js';

export async function findResourcesByUserId(userId) {
  const [rows] = await pool.execute(`SELECT r.id, r.original_name AS originalName, r.file_type AS fileType,
    r.file_size AS fileSize, r.subject_id AS subjectId, s.name AS subjectName,
    r.description, r.created_at AS createdAt
    FROM resources r JOIN subjects s ON s.id = r.subject_id
    WHERE r.user_id = ? ORDER BY r.created_at DESC`, [userId]);
  return rows;
}

export async function findResourceById(resourceId, userId) {
  const [rows] = await pool.execute(`SELECT r.id, r.original_name AS originalName, r.stored_name AS storedName,
    r.file_type AS fileType, r.file_size AS fileSize, r.file_path AS filePath,
    r.subject_id AS subjectId, s.name AS subjectName, r.description, r.created_at AS createdAt
    FROM resources r JOIN subjects s ON s.id = r.subject_id
    WHERE r.id = ? AND r.user_id = ?`, [resourceId, userId]);
  return rows[0];
}

export async function createResource(resource) {
  const { userId, subjectId, originalName, storedName, fileType, fileSize, filePath, description } = resource;
  const [result] = await pool.execute(`INSERT INTO resources
    (user_id, subject_id, original_name, stored_name, file_type, file_size, file_path, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [userId, subjectId, originalName, storedName, fileType, fileSize, filePath, description || null]);
  return findResourceById(result.insertId, userId);
}

export async function updateResource(resourceId, userId, subjectId, description) {
  const [result] = await pool.execute('UPDATE resources SET subject_id = ?, description = ? WHERE id = ? AND user_id = ?', [subjectId, description || null, resourceId, userId]);
  if (!result.affectedRows) return null;
  return findResourceById(resourceId, userId);
}

export async function deleteResource(resourceId, userId) {
  const resource = await findResourceById(resourceId, userId);
  if (!resource) return null;
  await pool.execute('DELETE FROM resources WHERE id = ? AND user_id = ?', [resourceId, userId]);
  return resource;
}