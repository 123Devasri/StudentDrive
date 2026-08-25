import pool from '../config/db.js';

export async function getDashboardData(userId) {
  const [[counts]] = await pool.execute(`SELECT
    (SELECT COUNT(*) FROM subjects WHERE user_id = ?) AS totalSubjects,
    (SELECT COUNT(*) FROM resources WHERE user_id = ?) AS totalResources,
    (SELECT COUNT(*) FROM syllabus_topics WHERE user_id = ?) AS totalTopics,
    (SELECT COUNT(*) FROM syllabus_topics WHERE user_id = ? AND status = 'Covered') AS coveredTopics`, [userId, userId, userId, userId]);
  const [recentResources] = await pool.execute(`SELECT r.id, r.original_name AS originalName,
    r.file_type AS fileType, r.created_at AS createdAt, s.name AS subjectName
    FROM resources r JOIN subjects s ON s.id = r.subject_id
    WHERE r.user_id = ? ORDER BY r.created_at DESC LIMIT 5`, [userId]);
  const [subjectsProgress] = await pool.execute(`SELECT s.id, s.name,
    COUNT(st.id) AS totalTopics,
    COALESCE(SUM(st.status = 'Covered'), 0) AS coveredTopics
    FROM subjects s LEFT JOIN syllabus_topics st ON st.subject_id = s.id AND st.user_id = s.user_id
    WHERE s.user_id = ? GROUP BY s.id ORDER BY s.name`, [userId]);
  const [topicsToStudy] = await pool.execute(`SELECT id, subject_id AS subjectId, topic, status
    FROM syllabus_topics WHERE user_id = ? AND status IN ('Not Started', 'In Progress')
    ORDER BY status DESC, unit, topic LIMIT 10`, [userId]);
  const totalTopics = Number(counts.totalTopics);
  const coveredTopics = Number(counts.coveredTopics);
  return {
    totalSubjects: Number(counts.totalSubjects),
    totalResources: Number(counts.totalResources),
    totalTopics,
    coveredTopics,
    topicsRemaining: totalTopics - coveredTopics,
    coverage: totalTopics ? Math.round((coveredTopics / totalTopics) * 100) : 0,
    recentResources,
    subjectsProgress: subjectsProgress.map((subject) => ({ ...subject, totalTopics: Number(subject.totalTopics), coveredTopics: Number(subject.coveredTopics), coverage: Number(subject.totalTopics) ? Math.round((Number(subject.coveredTopics) / Number(subject.totalTopics)) * 100) : 0 })),
    topicsToStudy,
  };
}