import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-opus-4-6';

function getClient() {
  const apiKey = localStorage.getItem('anthropic_api_key');
  if (!apiKey) throw new Error('No API key found. Please add your API key in Settings.');
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

/**
 * Sends syllabus text to Claude and returns structured JSON data.
 */
export async function extractSyllabusData(syllabusText) {
  const client = getClient();

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: `You are an expert academic assistant that analyzes university course syllabi.
Extract and structure ALL important information into a clean JSON format.
Be thorough. If a field is not found, use null. For dates, use ISO format (YYYY-MM-DD).
Return ONLY valid JSON — no markdown, no explanation, just the JSON object.`,
    messages: [{
      role: 'user',
      content: `Analyze this syllabus and extract all important information.
Return a JSON object with this exact structure:

{
  "course_name": "Full course name",
  "course_code": "e.g. CS101 or null",
  "instructor_name": "Instructor name or null",
  "instructor_email": "Email or null",
  "semester": "e.g. Spring 2026 or null",
  "office_hours": "Office hours or null",
  "description": "1-2 sentence description",
  "grading": {
    "breakdown": [{ "item": "Midterm", "weight": 30 }],
    "passing_grade": "e.g. 60% or null",
    "grading_scale": [{ "grade": "A", "min": 90 }]
  },
  "assignments": [{ "title": "HW1", "description": null, "due_date": "YYYY-MM-DD or null", "weight": "10% or null" }],
  "exams": [{ "type": "Midterm", "title": null, "date": "YYYY-MM-DD or null", "time": null, "location": null, "weight": null, "topics": [] }],
  "important_dates": [{ "event": "Event name", "date": "YYYY-MM-DD or null" }],
  "rules": { "attendance": null, "late_submission": null, "academic_integrity": null, "other": [] },
  "textbooks": [{ "title": "Book title", "author": null, "required": true }],
  "weekly_schedule": [{ "week": 1, "topic": "Topic", "date": null }],
  "class_schedule": { "days": ["Monday", "Wednesday"], "start_time": "10:00", "end_time": "11:15", "location": null }
}

SYLLABUS TEXT:
---
${syllabusText}
---

Return only the JSON object, nothing else.`
    }]
  });

  const responseText = message.content[0].text.trim();
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = jsonMatch ? jsonMatch[1].trim() : responseText;
  return JSON.parse(jsonText);
}

/**
 * Answers a student question about their syllabus.
 */
export async function answerSyllabusQuestion(question, syllabusData, rawText, chatHistory = []) {
  const client = getClient();

  const syllabusContext = `STRUCTURED SYLLABUS DATA:\n${JSON.stringify(syllabusData, null, 2)}\n\nORIGINAL TEXT (excerpt):\n${rawText ? rawText.substring(0, 3000) : 'Not available'}`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `You are a helpful academic assistant for the course: "${syllabusData.course_name || 'this course'}".
Answer student questions clearly and concisely.
- Be direct and specific. Students want quick answers.
- Reference specific dates, percentages, or rules when relevant.
- If something isn't in the syllabus, say so clearly.
- Keep answers short (2-4 sentences) unless more detail is needed.
- For deadline questions, always mention the exact date.`,
    messages: [
      {
        role: 'user',
        content: `Here is the course syllabus:\n${syllabusContext}\n\nNow I'll ask questions about this course.`
      },
      {
        role: 'assistant',
        content: `Got it! I've reviewed the syllabus for ${syllabusData.course_name || 'this course'}. Ask me anything about deadlines, grades, exams, or policies.`
      },
      ...chatHistory.slice(-6).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: question }
    ]
  });

  return message.content[0].text;
}
