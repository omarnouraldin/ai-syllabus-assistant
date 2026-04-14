import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question, syllabusData, rawText, chatHistory = [] } = req.body;

  if (!question?.trim()) {
    return res.status(400).json({ error: 'Please provide a question.' });
  }

  if (!syllabusData) {
    return res.status(400).json({ error: 'No syllabus data provided.' });
  }

  try {
    const syllabusContext = `STRUCTURED SYLLABUS DATA:\n${JSON.stringify(syllabusData, null, 2)}\n\nORIGINAL TEXT (excerpt):\n${rawText ? rawText.substring(0, 3000) : 'Not available'}`;

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
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
          content: `Got it! I've reviewed the syllabus for ${syllabusData.course_name || 'this course'}. Ask me anything!`
        },
        ...chatHistory.slice(-6).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: question.trim() }
      ]
    });

    res.status(200).json({ success: true, answer: message.content[0].text });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to get answer' });
  }
}
