import pool from '../config/db.js';
import { findResourcesForUnit } from '../models/resourceModel.js';
import { answerQuestion, searchRelevantChunks, getOllamaHealthAndModels, resolveOllamaModel } from '../services/aiService.js';

const NO_NOTES_RESPONSE = "There are no notes available for this unit yet. Upload notes before asking the Study Assistant.";
const FALLBACK_RESPONSE = "I couldn't find this information in the notes provided for this unit.";

export async function getAssistantHealth(request, response, next) {
  try {
    const health = await getOllamaHealthAndModels();
    const configuredModel = process.env.OLLAMA_MODEL || 'llama3.2';
    let activeModel = null;
    let modelError = null;

    if (health.online && health.models.length > 0) {
      activeModel = health.models.find(
        (m) => m === configuredModel || m.startsWith(`${configuredModel}:`)
      ) || health.models[0];
    } else if (health.online && health.models.length === 0) {
      modelError = `The selected Ollama model '${configuredModel}' is not installed. Please install a local model using 'ollama pull ${configuredModel}' in your terminal.`;
    } else {
      modelError = `Local Ollama server is offline at ${health.url}. Please start Ollama using 'ollama serve' in your terminal.`;
    }

    return response.json({
      success: true,
      online: health.online,
      url: health.url,
      configuredModel,
      activeModel,
      models: health.models,
      modelError,
    });
  } catch (error) {
    next(error);
  }
}

export async function askAssistant(request, response, next) {
  try {
    const question = request.body.question?.trim();
    const subjectId = request.body.subjectId;
    const unitId = request.body.unitId;

    if (!question) {
      return response.status(400).json({ success: false, message: 'Question is required' });
    }
    if (!subjectId) {
      return response.status(400).json({ success: false, message: 'Subject is required' });
    }
    if (!unitId || !Number.isInteger(Number(unitId)) || Number(unitId) < 1) {
      return response.status(400).json({ success: false, message: 'Please select a unit before asking a question.' });
    }

    const userId = request.user.id;

    // Verify user owns the subject
    const [[subject]] = await pool.execute(
      'SELECT id, name FROM subjects WHERE id = ? AND user_id = ?',
      [subjectId, userId]
    );
    if (!subject) {
      return response.status(404).json({ success: false, message: 'Subject not found or does not belong to you' });
    }

    // Check if user has uploaded notes for this subject -> unit
    const unitResources = await findResourcesForUnit(userId, Number(subjectId), Number(unitId));
    if (!unitResources || unitResources.length === 0) {
      return response.json({
        success: true,
        answer: NO_NOTES_RESPONSE,
        sources: [],
      });
    }

    // Search local vector index + hybrid matching (topK = 8 candidates)
    const rawChunks = await searchRelevantChunks({
      userId,
      subjectId: Number(subjectId),
      unitId: Number(unitId),
      question,
      topK: 8,
    });

    // Re-verify retrieved chunks strictly match user_id, subject_id, unit_id
    const validatedChunks = (rawChunks || []).filter(
      (chunk) =>
        Number(chunk.user_id) === Number(userId) &&
        Number(chunk.subject_id) === Number(subjectId) &&
        Number(chunk.unit_id) === Number(unitId)
    );

    if (validatedChunks.length === 0) {
      return response.json({
        success: true,
        answer: FALLBACK_RESPONSE,
        sources: [],
      });
    }

    // Format unique sources (Page vs Slide)
    const sourcesSet = new Set();
    const sources = [];
    for (const chunk of validatedChunks) {
      const isSlide = chunk.slide_number != null;
      const numLabel = isSlide ? `Slide ${chunk.slide_number}` : `Page ${chunk.page_number || chunk.page || 1}`;
      const key = `${chunk.resource_name}:${numLabel}`;
      if (!sourcesSet.has(key)) {
        sourcesSet.add(key);
        sources.push({
          fileName: chunk.resource_name,
          pageNumber: chunk.page_number || chunk.page,
          slideNumber: chunk.slide_number || null,
          label: numLabel,
        });
      }
    }

    const answer = await answerQuestion({
      question,
      subjectName: subject.name,
      unitId: Number(unitId),
      chunks: validatedChunks,
    });

    return response.json({
      success: true,
      answer,
      sources,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      return response.status(504).json({ success: false, message: 'AI request timed out' });
    }
    if (error.statusCode) {
      return response.status(error.statusCode).json({
        success: false,
        message: error.providerMessage || error.message || 'LLM request failed',
      });
    }
    next(error);
  }
}

export async function askAssistantStream(request, response, next) {
  try {
    const question = request.body.question?.trim();
    const subjectId = request.body.subjectId;
    const unitId = request.body.unitId;

    if (!question || !subjectId || !unitId) {
      return response.status(400).json({ success: false, message: 'Question, Subject, and Unit are required' });
    }

    const userId = request.user.id;

    // Verify user owns subject
    const [[subject]] = await pool.execute(
      'SELECT id, name FROM subjects WHERE id = ? AND user_id = ?',
      [subjectId, userId]
    );
    if (!subject) {
      return response.status(404).json({ success: false, message: 'Subject not found or does not belong to you' });
    }

    // Set Server-Sent Events headers
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');

    const sendEvent = (event, data) => {
      response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // Check notes existence
    const unitResources = await findResourcesForUnit(userId, Number(subjectId), Number(unitId));
    if (!unitResources || unitResources.length === 0) {
      sendEvent('metadata', { sources: [] });
      sendEvent('token', { token: NO_NOTES_RESPONSE });
      sendEvent('done', { answer: NO_NOTES_RESPONSE });
      return response.end();
    }

    // Retrieval timing
    const retrievalStart = Date.now();
    const rawChunks = await searchRelevantChunks({
      userId,
      subjectId: Number(subjectId),
      unitId: Number(unitId),
      question,
      topK: 8,
    });
    const retrievalEnd = Date.now();

    const validatedChunks = (rawChunks || []).filter(
      (chunk) =>
        Number(chunk.user_id) === Number(userId) &&
        Number(chunk.subject_id) === Number(subjectId) &&
        Number(chunk.unit_id) === Number(unitId)
    );

    const contextSize = validatedChunks.reduce((acc, c) => acc + (c.text?.length || 0), 0);
    console.log(`[AI ASSISTANT RAG AUDIT]`);
    console.log(`  Question: "${question}"`);
    console.log(`  User ID: ${userId} | Subject: ${subjectId} | Unit: ${unitId}`);
    console.log(`  Retrieval Time: ${retrievalEnd - retrievalStart} ms`);
    console.log(`  Validated Chunks: ${validatedChunks.length} (Total Context: ${contextSize} chars)`);

    if (validatedChunks.length === 0) {
      sendEvent('metadata', { sources: [] });
      sendEvent('token', { token: FALLBACK_RESPONSE });
      sendEvent('done', { answer: FALLBACK_RESPONSE });
      return response.end();
    }

    // Extract sources with Page vs Slide distinction
    const sourcesSet = new Set();
    const sources = [];
    for (const chunk of validatedChunks) {
      const isSlide = chunk.slide_number != null;
      const numLabel = isSlide ? `Slide ${chunk.slide_number}` : `Page ${chunk.page_number || chunk.page || 1}`;
      const key = `${chunk.resource_name}:${numLabel}`;
      if (!sourcesSet.has(key)) {
        sourcesSet.add(key);
        sources.push({
          fileName: chunk.resource_name,
          pageNumber: chunk.page_number || chunk.page,
          slideNumber: chunk.slide_number || null,
          label: numLabel,
        });
      }
    }

    sendEvent('metadata', { sources });

    // Stream LLM answer
    let fullText = '';
    await answerQuestion({
      question,
      subjectName: subject.name,
      unitId: Number(unitId),
      chunks: validatedChunks,
      onToken: (token) => {
        fullText += token;
        sendEvent('token', { token });
      },
    });

    sendEvent('done', { answer: fullText, sources });
    return response.end();
  } catch (error) {
    if (!response.headersSent) {
      return next(error);
    }
    response.write(`event: error\ndata: ${JSON.stringify({ message: error.message || 'Stream generation failed' })}\n\n`);
    return response.end();
  }
}