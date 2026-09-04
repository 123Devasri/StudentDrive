import path from 'node:path';
import { spawn } from 'node:child_process';

const FALLBACK_RESPONSE = "I couldn't find this information in the notes provided for this unit.";

export async function searchRelevantChunks({ userId, subjectId, unitId, question, topK = 5 }) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.resolve('..', 'ai', 'rag_service.py');
    const child = spawn('python', [
      pythonScript, 'search',
      '--user-id', String(userId),
      '--subject-id', String(subjectId),
      '--unit-id', String(unitId),
      '--query', question,
      '--top-k', String(topK)
    ]);

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
      if (code !== 0) {
        console.error(`RAG search process exited with code ${code}: ${stderr}`);
        return resolve([]);
      }
      try {
        const parsed = JSON.parse(stdout);
        if (parsed.success && Array.isArray(parsed.results)) {
          resolve(parsed.results);
        } else {
          resolve([]);
        }
      } catch (parseError) {
        console.error(`Failed to parse RAG search output: ${stdout}`);
        resolve([]);
      }
    });

    child.on('error', (err) => {
      console.error(`Failed to spawn RAG search child process: ${err.message}`);
      resolve([]);
    });
  });
}

export async function getOllamaHealthAndModels() {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${ollamaUrl}/api/tags`, { signal: controller.signal }).finally(() => clearTimeout(timeout));
    if (!response.ok) {
      return { online: false, url: ollamaUrl, error: `Ollama returned status ${response.status}`, models: [] };
    }
    const data = await response.json();
    const models = (data.models || []).map((m) => m.name);
    return { online: true, url: ollamaUrl, models };
  } catch (error) {
    return { online: false, url: ollamaUrl, error: `Ollama server unreachable at ${ollamaUrl}`, models: [] };
  }
}

export async function resolveOllamaModel() {
  const configuredModel = process.env.OLLAMA_MODEL || 'llama3.2';
  const health = await getOllamaHealthAndModels();

  if (!health.online) {
    const connErr = new Error(`Local Ollama server is unreachable at ${health.url || 'http://127.0.0.1:11434'}. Please start Ollama by running 'ollama serve' in your terminal.`);
    connErr.statusCode = 503;
    connErr.providerMessage = `Ollama server offline at ${health.url}`;
    throw connErr;
  }

  if (health.models.length === 0) {
    const err = new Error(`The selected Ollama model '${configuredModel}' is not installed. Please install a model using 'ollama pull ${configuredModel}' in your terminal.`);
    err.statusCode = 404;
    err.providerMessage = `No local models found in Ollama. Please run 'ollama pull ${configuredModel}'`;
    throw err;
  }

  // Exact or prefix match (e.g., 'llama3.2' matches 'llama3.2:latest')
  const matched = health.models.find(
    (m) => m === configuredModel || m.startsWith(`${configuredModel}:`)
  );

  if (matched) {
    return matched;
  }

  // Auto-fallback to the first installed local model
  const fallbackModel = health.models[0];
  console.warn(`[AI ASSISTANT WARNING] Configured model '${configuredModel}' not found. Auto-selecting installed model '${fallbackModel}'.`);
  return fallbackModel;
}

export async function askLocalLLMStream({ prompt, onToken }) {
  // Option 1: Google Gemini API
  if (process.env.GEMINI_API_KEY) {
    try {
      const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || FALLBACK_RESPONSE;
        if (onToken) onToken(text);
        return text;
      }
    } catch (e) {
      console.warn(`Gemini API call failed: ${e.message}`);
    }
  }

  // Option 2: Groq API
  if (process.env.GROQ_API_KEY) {
    try {
      const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim() || FALLBACK_RESPONSE;
        if (onToken) onToken(text);
        return text;
      }
    } catch (e) {
      console.warn(`Groq API call failed: ${e.message}`);
    }
  }

  // Option 3: OpenAI API
  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey && !openAiKey.includes('sk-proj-7C_anmnbj')) {
    try {
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim() || FALLBACK_RESPONSE;
        if (onToken) onToken(text);
        return text;
      }
    } catch (e) {
      console.warn(`OpenAI API call failed: ${e.message}`);
    }
  }

  // Option 4: Local Ollama Streaming (Default)
  const ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
  const modelToUse = await resolveOllamaModel();
  const startTime = Date.now();
  let firstTokenTime = null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelToUse,
        prompt,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      const err = new Error(`Local Ollama service error (HTTP ${response.status}): ${errorText}`);
      err.statusCode = response.status;
      err.providerMessage = `Ollama service error: ${errorText}`;
      throw err;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullAnswer = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          if (json.response) {
            if (!firstTokenTime) {
              firstTokenTime = Date.now();
            }
            fullAnswer += json.response;
            if (onToken) onToken(json.response);
          }
        } catch (e) {
          // Ignore partial line JSON errors
        }
      }
    }

    const endTime = Date.now();
    console.log(`[AI ASSISTANT DIAGNOSTICS]`);
    console.log(`  Model Used: ${modelToUse}`);
    console.log(`  Prompt Length: ${prompt.length} chars`);
    console.log(`  TTFT (Time To First Token): ${firstTokenTime ? firstTokenTime - startTime : 'N/A'} ms`);
    console.log(`  Ollama Generation Time: ${endTime - startTime} ms`);

    return fullAnswer.trim() || FALLBACK_RESPONSE;
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutErr = new Error('Local Ollama LLM request timed out after 45 seconds');
      timeoutErr.statusCode = 504;
      throw timeoutErr;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function askLocalLLM({ prompt }) {
  return askLocalLLMStream({ prompt, onToken: null });
}

export async function answerQuestion({ question, subjectName, unitId, chunks, onToken = null }) {
  if (!chunks || chunks.length === 0) {
    if (onToken) onToken(FALLBACK_RESPONSE);
    return FALLBACK_RESPONSE;
  }

  const formattedContext = chunks
    .map((chunk, index) => `[Source ${index + 1}: ${chunk.resource_name} (Page ${chunk.page})]\n${chunk.text}`)
    .join('\n\n');

  const prompt = `SYSTEM:
You are a closed-knowledge academic assistant.

You MUST answer using ONLY the CONTEXT provided below.

Rules:
1. Do not use your pretrained/general knowledge.
2. Do not invent missing information.
3. Do not make assumptions.
4. If the answer cannot be found in the context, say:
   "${FALLBACK_RESPONSE}"
5. Do not use information from documents outside the selected subject, folder, or unit.

SUBJECT:
${subjectName}

UNIT:
Unit ${unitId}

CONTEXT:
${formattedContext}

QUESTION:
${question}`;

  return askLocalLLMStream({ prompt, onToken });
}