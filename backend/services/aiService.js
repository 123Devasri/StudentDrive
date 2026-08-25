export async function answerQuestion({ question, subject, topics, resources }) {
  const apiKey = process.env.LLM_API_KEY;
  const apiUrl = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions';
  const model = process.env.LLM_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    console.error('LLM service is not configured: LLM_API_KEY is missing');
    const error = new Error('LLM service is not configured');
    error.statusCode = 503;
    error.providerMessage = 'LLM_API_KEY is missing';
    throw error;
  }

  const context = [
    `Subject: ${subject.name}`,
    'Syllabus topics:',
    ...topics.map((topic) => `Unit ${topic.unit}: ${topic.topic} (${topic.status})`),
    'Resource metadata:',
    ...resources.map((resource) => `${resource.originalName}: ${resource.description || 'No description'}`)
  ].join('\n');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: `You are a study assistant. Use this student's academic context:\n${context}`,
          },
          {
            role: 'user',
            content: question,
          },
        ],
      }),
    });

    if (!response.ok) {
      let details = {};
      try {
        details = await response.json();
      } catch (parseError) {
        details = {};
      }

      const statusCode = response.status;
      const providerMessage = details.error?.message || 'No provider error message';
      const errorType = details.error?.type || details.error?.code || 'unknown_error';

      console.error(
        `LLM request failed:\nstatus = ${statusCode}\nmessage = ${providerMessage}\ntype = ${errorType}`
      );

      const providerError = new Error(`LLM request failed: ${providerMessage}`);
      providerError.statusCode = statusCode;
      providerError.providerMessage = providerMessage;
      providerError.errorType = errorType;
      throw providerError;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'The AI service returned no answer.';
  } catch (error) {
    if (!error.statusCode && error.name !== 'AbortError') {
      console.error(`LLM network or execution error: ${error.message}`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}