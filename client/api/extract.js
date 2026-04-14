import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text || text.trim().length < 50) {
    return res.status(400).json({ error: 'Please provide at least 50 characters of syllabus text.' });
  }

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
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
${text}
---

Return only the JSON object, nothing else.`
      }]
    });

    const responseText = message.content[0].text.trim();
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonText = jsonMatch ? jsonMatch[1].trim() : responseText;
    const data = JSON.parse(jsonText);

    res.status(200).json({ success: true, data });

  } catch (error) {
    console.error('Extract error:', error);
    if (error.message?.includes('JSON')) {
      return res.status(500).json({ error: 'AI could not parse the syllabus. Please try again.' });
    }
    res.status(500).json({ error: error.message || 'Failed to analyze syllabus' });
  }
}
