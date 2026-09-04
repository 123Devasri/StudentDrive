import pool from '../config/db.js';
import { findResourcesForUnit, findDiverseDocumentChunksForUnit } from '../models/resourceModel.js';
import { generateQuizFromChunks } from '../services/aiService.js';

const NO_NOTES_RESPONSE = "There are no notes available for this unit yet. Upload notes before generating a quiz.";

export async function generateQuizController(request, response, next) {
  try {
    const subjectId = Number(request.body.subjectId);
    const unitId = Number(request.body.unitId);
    const questionCount = Math.min(Math.max(Number(request.body.questionCount) || 10, 3), 20);
    const difficulty = request.body.difficulty || 'Medium';

    if (!subjectId || !unitId) {
      return response.status(400).json({ success: false, message: 'Subject and Unit are required.' });
    }

    const userId = request.user.id;

    // Verify user owns subject
    const [[subject]] = await pool.execute(
      'SELECT id, name FROM subjects WHERE id = ? AND user_id = ?',
      [subjectId, userId]
    );
    if (!subject) {
      return response.status(404).json({ success: false, message: 'Subject not found or does not belong to you.' });
    }

    // Check if unit resources exist
    const unitResources = await findResourcesForUnit(userId, subjectId, unitId);
    if (!unitResources || unitResources.length === 0) {
      return response.status(400).json({ success: false, message: NO_NOTES_RESPONSE });
    }

    // Retrieve existing diverse document chunks from MySQL document_chunks
    const existingChunks = await findDiverseDocumentChunksForUnit(userId, subjectId, unitId, 10);

    console.log(`[QUIZ] Selected subject: ${subjectId} (${subject.name})`);
    console.log(`[QUIZ] Selected unit: ${unitId}`);
    console.log(`[QUIZ] Existing chunks found in MySQL: ${existingChunks.length}`);

    if (!existingChunks || existingChunks.length === 0) {
      return response.status(400).json({
        success: false,
        message: 'These notes are still being processed or contain no extractable text. Please try again shortly.',
      });
    }

    console.log(`[QUIZ] Chunks sent to Ollama: ${existingChunks.length}`);
    console.log(`[QUIZ] Generating quiz (Difficulty: ${difficulty}, Questions requested: ${questionCount})...`);

    const questions = await generateQuizFromChunks({
      subjectName: subject.name,
      unitId,
      difficulty,
      questionCount,
      chunks: existingChunks,
    });

    console.log(`[QUIZ] Quiz generated successfully (Returned ${questions.length} questions).`);

    return response.json({
      success: true,
      quiz: {
        subjectId,
        subjectName: subject.name,
        unitId,
        difficulty,
        questions,
      },
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      return response.status(504).json({ success: false, message: 'Quiz generation request timed out.' });
    }
    if (error.statusCode) {
      return response.status(error.statusCode).json({
        success: false,
        message: error.providerMessage || error.message || 'LLM quiz generation failed.',
      });
    }
    next(error);
  }
}
