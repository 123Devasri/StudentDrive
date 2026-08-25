import pool from '../config/db.js';

export async function findResourcesByUserId(userId, filters = {}) {
  const conditions = ['r.user_id = ?'];
  const parameters = [userId];
  if (filters.search) {
    conditions.push('(r.original_name LIKE ? OR r.description LIKE ? OR s.name LIKE ? OR f.name LIKE ? OR EXISTS (SELECT 1 FROM resource_tags rst2 JOIN tags t2 ON t2.id = rst2.tag_id WHERE rst2.resource_id = r.id AND t2.name LIKE ?))');
    const search = `%${filters.search}%`;
    parameters.push(search, search, search, search, search);
  }
  if (filters.subjectId) { conditions.push('r.subject_id = ?'); parameters.push(filters.subjectId); }
  if (filters.folderId) { conditions.push('r.folder_id = ?'); parameters.push(filters.folderId); }
  if (filters.tag) { conditions.push('EXISTS (SELECT 1 FROM resource_tags rst3 JOIN tags t3 ON t3.id = rst3.tag_id WHERE rst3.resource_id = r.id AND t3.user_id = ? AND t3.name = ?)'); parameters.push(userId, filters.tag); }
  if (filters.fileType) { conditions.push('LOWER(r.file_type) = LOWER(?)'); parameters.push(filters.fileType); }
  const [rows] = await pool.execute(`SELECT r.id, r.original_name AS originalName, r.file_type AS fileType,
    r.file_size AS fileSize, r.subject_id AS subjectId, s.name AS subjectName,
    r.folder_id AS folderId, f.name AS folderName, r.description, r.created_at AS createdAt,
    COALESCE(GROUP_CONCAT(DISTINCT CONCAT(t.id, ':', t.name)), '') AS tagNames
    FROM resources r JOIN subjects s ON s.id = r.subject_id
    LEFT JOIN folders f ON f.id = r.folder_id LEFT JOIN resource_tags rst ON rst.resource_id = r.id
    LEFT JOIN tags t ON t.id = rst.tag_id
    WHERE ${conditions.join(' AND ')} GROUP BY r.id ORDER BY r.created_at DESC`, parameters);
  return rows.map((resource) => ({
    ...resource,
    tags: resource.tagNames ? resource.tagNames.split(',').map((tag) => {
      const [id, name] = tag.split(':');
      return { id: Number(id), name };
    }) : [],
  }));
}

export async function findResourceById(resourceId, userId) {
  const [rows] = await pool.execute(`SELECT r.id, r.original_name AS originalName, r.stored_name AS storedName,
    r.file_type AS fileType, r.file_size AS fileSize, r.file_path AS filePath,
    r.subject_id AS subjectId, s.name AS subjectName, r.folder_id AS folderId, f.name AS folderName,
    r.description, r.created_at AS createdAt, COALESCE(GROUP_CONCAT(DISTINCT CONCAT(t.id, ':', t.name)), '') AS tagNames
    FROM resources r JOIN subjects s ON s.id = r.subject_id LEFT JOIN folders f ON f.id = r.folder_id
    LEFT JOIN resource_tags rst ON rst.resource_id = r.id LEFT JOIN tags t ON t.id = rst.tag_id
    WHERE r.id = ? AND r.user_id = ? GROUP BY r.id`, [resourceId, userId]);
  if (!rows[0]) return undefined;
  return { ...rows[0], tags: rows[0].tagNames ? rows[0].tagNames.split(',').map((tag) => { const [id, name] = tag.split(':'); return { id: Number(id), name }; }) : [] };
}

export async function createResource(resource) {
  const { userId, subjectId, folderId, originalName, storedName, fileType, fileSize, filePath, description } = resource;
  const [result] = await pool.execute(`INSERT INTO resources
    (user_id, subject_id, folder_id, original_name, stored_name, file_type, file_size, file_path, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [userId, subjectId, folderId || null, originalName, storedName, fileType, fileSize, filePath, description || null]);
  return findResourceById(result.insertId, userId);
}

export async function updateResource(resourceId, userId, subjectId, folderId, description) {
  const [result] = await pool.execute('UPDATE resources SET subject_id = ?, folder_id = ?, description = ? WHERE id = ? AND user_id = ?', [subjectId, folderId || null, description || null, resourceId, userId]);
  if (!result.affectedRows) return null;
  return findResourceById(resourceId, userId);
}

export async function deleteResource(resourceId, userId) {
  const resource = await findResourceById(resourceId, userId);
  if (!resource) return null;
  await pool.execute('DELETE FROM resources WHERE id = ? AND user_id = ?', [resourceId, userId]);
  return resource;
}