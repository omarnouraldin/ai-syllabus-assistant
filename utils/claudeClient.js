const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-opus-4-6';

/**
 * Sends a syllabustext to Claude and returns structured JSON data.
 * @param {string} syllabusText - Raw text extracted from the syllabus
 * @returns {Promise<Object>} - Structured syllabus data
 */
async function extractSyllabusData(syllabusText) {
  const systemPrompt = `You are an expert academic assistant that analyzes university course syllabi.
Your job is to extract and structure ALL important information from a syllabus into a clean JSON format.
Be thorough. If a field is not found, use null. For dates, use ISO format (YYYY-MM-DD) when possible.
Return ONLY valid JSON — no markdown, no explanation, just the JSON object.`;

  const userPrompt = `Analyze this syllabus and extract all important information.
Return a JSON object with this exact structure:

{
  "course_name": "Full course name",
  "course_code": "e.g. CS101 or null",
  "instructor_name": "Instructor's name or null",
  "instructor_email": "Email or null",
  "semester": "e.g. Spring 2026 or null",
  "office_hours": "Office hours info or null",
  "description": "1-2 sentence course description",
  "grading": {
    "breakdown": [
      { "item": "Midterm Exam", "weight": 30 },
      { "item": "Final Exam", "weight": 40 },
      { "item": "Assignments", "weight": 20 },
      { "item": "Participation", "weight": 10 }
    ],
    "passing_grade": "e.g. 60% or C or null",
    "grading_scale": [
      { "grade": "A", "min": 90 },
      { "grade": "B", "min": 80 }
    ]
  },
  "assignments": [
    {
      "title": "Assignment name",
      "description": "Brief description or null",
      "due_date": "YYYY-MM-DD or null",
      "weight": "e.g. 10% or null"
    }
  ],
  "exams": [
    {
      "type": "Midterm / Final / Quiz",
      "title": "Specific title or null",
      "date": "YYYY-MM-DD or null",
      "time": "e.g. 10:00 AM or null",
      "location": "Room or online or null",
      "weight": "e.g. 30% or null",
      "topics": ["Topic 1", "Topic 2"]
    }
  ],
  "important_dates": [
    {
      "event": "Event name",
      "date": "YYYY-MM-DD or null"
    }
  ],
  "rules": {
    "attendance": "Attendance policy or null",
    "late_submission": "Late work policy or null",
    "academic_integrity": "Academic honesty policy or null",
    "other": ["Any other important rules"]
  },
  "textbooks": [
    {
      "title": "Book title",
      "author": "Author or null",
      "required": true
    }
  ],
  "weekly_schedule": [
    {
      "week": 1,
      "topic": "Topic for this week",
      "date": "YYYY-MM-DD or null"
    }
  ],
  "class_schedule": {
    "days": ["Monday", "Wednesday", "Friday"],
    "start_time": "10:00",
    "end_time": "11:15",
    "location": "Room 204 or Online or null"
  }
}

SYLLABUS TEXT:
---
${syllabusText}
---

Return only the JSON object, nothing else.`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      { role: 'user', content: userPrompt }
    ],
    system: systemPrompt,
  });

  const responseText = message.content[0].text.trim();

  // Parse the JSON response
  // Sometimes Claude wraps in ```json ... ``` even when told not to — handle that
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = jsonMatch ? jsonMatch[1].trim() : responseText;

  return JSON.parse(jsonText);
}

/**
 * Answers a student's question about their syllabus.
 * @param {string} question - The student's question
 * @param {Object} syllabusData - The structured syllabus data
 * @param {string} rawText - The original syllabus text (for context)
 * @param {Array} chatHistory - Previous messages in the conversation
 * @returns {Promise<string>} - AI answer
 */
async function answerSyllabusQuestion(question, syllabusData, rawText, chatHistory = []) {
  const systemPrompt = `You are a helpful academic assistant for the course: "${syllabusData.course_name || 'this course'}".
You have complete access to the course syllabus. Answer student questions clearly and concisely.

Guidelines:
- Be direct and specific. Students want quick answers.
- Reference specific dates, percentages, or rules from the syllabus when relevant.
- If something isn't in the syllabus, say so clearly.
- Keep answers short (2-4 sentences usually) unless the question requires more detail.
- Use a friendly, helpful tone.
- For deadline questions, always mention the exact date.
- For grade questions, show the calculation.`;

  // Build context from structured data
  const syllabusContext = `
STRUCTURED SYLLABUS DATA:
${JSON.stringify(syllabusData, null, 2)}

ORIGINAL SYLLABUS TEXT (for additional context):
${rawText ? rawText.substring(0, 3000) : 'Not available'}
`;

  // Build message history for multi-turn conversation
  const messages = [
    {
      role: 'user',
      content: `Here is the course syllabus data:\n${syllabusContext}\n\nNow I'll ask you questions about this course.`
    },
    {
      role: 'assistant',
      content: `Got it! I've reviewed the syllabus for ${syllabusData.course_name || 'this course'}. I'm ready to answer your questions about grades, deadlines, exams, assignments, and course policies.`
    },
    // Include recent chat history (last 6 messages)
    ...chatHistory.slice(-6).map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    {
      role: 'user',
      content: question
    }
  ];

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  return message.content[0].text;
}

module.exports = { extractSyllabusData, answerSyllabusQuestion };
