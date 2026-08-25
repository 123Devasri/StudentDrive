export async function answerQuestion({ question, subject, topics, resources }) {
  const apiKey = process.env.LLM_API_KEY;
  const apiUrl = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions';
  const model = process.env.LLM_MODEL || 'gpt-4o-mini';
  if (!apiKey) throw new Error('LLM service is not configured');
  const context = [`Subject: ${subject.name}`, 'Syllabus topics:', ...topics.map((topic) => `Unit ${topic.unit}: ${topic.topic} (${topic.status})`), 'Resource metadata:', ...resources.map((resource) => `${resource.originalName}: ${resource.description || 'No description'}`)].join('\n');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(apiUrl, { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model, messages: [{ role: 'system', content: `You are a study assistant. Use this student's academic context:\n${context}` }, { role: 'user', content: question }] }) });
    if (!response.ok) {
      let details = {};
      try { details = await response.json(); } catch (parseError) { details = {}; }
      const providerError = new Error('LLM request failed');
      providerError.statusCode = response.status;
      providerError.providerMessage = details.error?.message || 'No provider error message';
      throw providerError;
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'The AI service returned no answer.';
  } catch (error) {
    if (error.statusCode) console.error(`LLM request failed with status ${error.statusCode}: ${error.providerMessage}`);
    throw error;
  } finally { clearTimeout(timeout); }
}