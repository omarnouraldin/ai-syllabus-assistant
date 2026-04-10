/**
 * All AI calls go to Vercel serverless functions (/api/*)
 * The API key lives securely in Vercel environment variables — never in the browser.
 */

export async function extractSyllabusData(syllabusText) {
  const response = await fetch('/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: syllabusText }),
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Failed to analyze syllabus');
  return result.data;
}

export async function answerSyllabusQuestion(question, syllabusData, rawText, chatHistory = []) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, syllabusData, rawText, chatHistory }),
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Failed to get answer');
  return result.answer;
}
