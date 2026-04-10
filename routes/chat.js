const express = require('express');
const router = express.Router();
const { answerSyllabusQuestion } = require('../utils/claudeClient');

// ── POST /api/chat ───────────────────────────────────────────────────────────
// Accepts a question + syllabus context, returns an AI answer
router.post('/', async (req, res) => {
  const { question, syllabusData, rawText, chatHistory } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({ error: 'Please provide a question.' });
  }

  if (!syllabusData) {
    return res.status(400).json({ error: 'No syllabus data found. Please upload a syllabus first.' });
  }

  try {
    console.log(`💬 Question: "${question}"`);
    const answer = await answerSyllabusQuestion(
      question.trim(),
      syllabusData,
      rawText || '',
      chatHistory || []
    );

    res.json({ success: true, answer });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to get an answer. Please try again.' });
  }
});

module.exports = router;
