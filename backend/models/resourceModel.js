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
  if (filters.unitId) { conditions.push('r.unit_id = ?'); parameters.push(filters.unitId); }
  if (filters.tag) {
    conditions.push('EXISTS (SELECT 1 FROM resource_tags rst3 JOIN tags t3 ON t3.id = rst3.tag_id WHERE rst3.resource_id = r.id AND t3.user_id = ? AND (t3.name = ? OR t3.id = ?))');
    parameters.push(userId, filters.tag, filters.tag);
  }
  if (filters.fileType) { conditions.push('LOWER(r.file_type) = LOWER(?)'); parameters.push(filters.fileType); }
  const [rows] = await pool.execute(`SELECT r.id, r.original_name AS originalName, r.file_type AS fileType,
    r.file_size AS fileSize, r.subject_id AS subjectId, s.name AS subjectName,
    r.folder_id AS folderId, f.name AS folderName, r.unit_id AS unitId, r.description, r.created_at AS createdAt,
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
    r.unit_id AS unitId, r.description, r.created_at AS createdAt, COALESCE(GROUP_CONCAT(DISTINCT CONCAT(t.id, ':', t.name)), '') AS tagNames
    FROM resources r JOIN subjects s ON s.id = r.subject_id LEFT JOIN folders f ON f.id = r.folder_id
    LEFT JOIN resource_tags rst ON rst.resource_id = r.id LEFT JOIN tags t ON t.id = rst.tag_id
    WHERE r.id = ? AND r.user_id = ? GROUP BY r.id`, [resourceId, userId]);
  if (!rows[0]) return undefined;
  return { ...rows[0], tags: rows[0].tagNames ? rows[0].tagNames.split(',').map((tag) => { const [id, name] = tag.split(':'); return { id: Number(id), name }; }) : [] };
}

export async function findResourcesForUnit(userId, subjectId, unitId) {
  const [rows] = await pool.execute(
    'SELECT id, original_name AS originalName, stored_name AS storedName, file_path AS filePath, file_type AS fileType FROM resources WHERE user_id = ? AND subject_id = ? AND unit_id = ?',
    [userId, subjectId, unitId]
  );
  return rows;
}

export async function createResource(resource) {
  const { userId, subjectId, folderId, unitId, originalName, storedName, fileType, fileSize, filePath, description } = resource;
  const [result] = await pool.execute(`INSERT INTO resources
    (user_id, subject_id, folder_id, unit_id, original_name, stored_name, file_type, file_size, file_path, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [userId, subjectId, folderId || null, unitId || null, originalName, storedName, fileType, fileSize, filePath, description || null]);
  return findResourceById(result.insertId, userId);
}

export async function addTagsToResource(resourceId, userId, tagIds) {
  const uniqueTagIds = [...new Set((tagIds || []).map(Number).filter((id) => Number.isInteger(id) && id > 0))];
  if (!uniqueTagIds.length) return;
  const placeholders = uniqueTagIds.map(() => '?').join(', ');
  const [validTags] = await pool.execute(`SELECT id FROM tags WHERE user_id = ? AND id IN (${placeholders})`, [userId, ...uniqueTagIds]);
  if (validTags.length !== uniqueTagIds.length) throw new Error('One or more tags are invalid');
  for (const tagId of uniqueTagIds) {
    await pool.execute('INSERT IGNORE INTO resource_tags (resource_id, tag_id) SELECT id, ? FROM resources WHERE id = ? AND user_id = ?', [tagId, resourceId, userId]);
  }
}

export async function updateResource(resourceId, userId, subjectId, folderId, unitId, description) {
  const [result] = await pool.execute('UPDATE resources SET subject_id = ?, folder_id = ?, unit_id = ?, description = ? WHERE id = ? AND user_id = ?', [subjectId, folderId || null, unitId || null, description || null, resourceId, userId]);
  if (!result.affectedRows) return null;
  return findResourceById(resourceId, userId);
}

export async function deleteResource(resourceId, userId) {
  const resource = await findResourceById(resourceId, userId);
  if (!resource) return null;
  await pool.execute('DELETE FROM resources WHERE id = ? AND user_id = ?', [resourceId, userId]);
  return resource;
}

export async function saveDocumentChunks(resourceId, userId, subjectId, folderId, unitId, chunks) {
  if (!chunks || chunks.length === 0) return;
  await pool.execute('DELETE FROM document_chunks WHERE resource_id = ? AND user_id = ?', [resourceId, userId]);

  const insertSql = `INSERT INTO document_chunks
    (resource_id, user_id, subject_id, folder_id, unit_id, chunk_index, page_number, slide_number, chunk_text)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  for (const chunk of chunks) {
    await pool.execute(insertSql, [
      resourceId,
      userId,
      subjectId,
      folderId || null,
      unitId,
      chunk.chunk_index ?? 0,
      chunk.page_number ?? (chunk.page ?? null),
      chunk.slide_number ?? null,
      chunk.text || '',
    ]);
  }
}

export async function deleteDocumentChunks(userId, resourceId) {
  await pool.execute('DELETE FROM document_chunks WHERE user_id = ? AND resource_id = ?', [userId, resourceId]);
}

export async function findDocumentChunksForUnit(userId, subjectId, unitId) {
  const [rows] = await pool.execute(
    `SELECT id, resource_id AS resourceId, chunk_index AS chunkIndex, page_number AS pageNumber,
     slide_number AS slideNumber, chunk_text AS chunkText, created_at AS createdAt
     FROM document_chunks
     WHERE user_id = ? AND subject_id = ? AND unit_id = ?
     ORDER BY resource_id, chunk_index ASC`,
    [userId, subjectId, unitId]
  );
  return rows;
}

export async function findDiverseDocumentChunksForUnit(userId, subjectId, unitId, limit = 25) {
  const [rows] = await pool.query(
    `SELECT dc.id, dc.resource_id AS resourceId, r.original_name AS fileName,
            dc.chunk_index AS chunkIndex, dc.page_number AS pageNumber,
            dc.slide_number AS slideNumber, dc.chunk_text AS text
     FROM document_chunks dc
     JOIN resources r ON r.id = dc.resource_id
     WHERE dc.user_id = ? AND dc.subject_id = ? AND dc.unit_id = ?
     ORDER BY RAND() LIMIT ?`,
    [userId, subjectId, unitId, Number(limit)]
  );
  return rows;
}