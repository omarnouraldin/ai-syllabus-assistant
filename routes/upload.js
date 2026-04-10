const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { extractTextFromPDF } = require('../utils/pdfParser');
const { extractSyllabusData } = require('../utils/claudeClient');

// ── Multer config: save PDF to /uploads ──────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `syllabus-${unique}.pdf`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

// ── POST /api/upload/pdf ─────────────────────────────────────────────────────
// Accepts a PDF file, extracts text, sends to Claude, returns structured JSON
router.post('/pdf', upload.single('syllabus'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = req.file.path;

  try {
    // Step 1: Extract text from PDF
    console.log('📄 Extracting text from PDF...');
    const rawText = await extractTextFromPDF(filePath);

    if (!rawText || rawText.length < 50) {
      return res.status(400).json({
        error: 'Could not extract text from this PDF. It may be scanned or image-based.'
      });
    }

    // Step 2: Send to Claude for structured extraction
    console.log('🤖 Sending to Claude for analysis...');
    const structuredData = await extractSyllabusData(rawText);

    // Step 3: Clean up uploaded file (we don't need to store it)
    fs.unlink(filePath, () => {});

    // Step 4: Return both the structured data and raw text
    res.json({
      success: true,
      data: structuredData,
      rawText: rawText.substring(0, 5000), // Keep first 5000 chars for chat context
    });

  } catch (error) {
    // Clean up file on error
    if (fs.existsSync(filePath)) fs.unlink(filePath, () => {});

    console.error('Upload error:', error);

    if (error.message.includes('JSON')) {
      return res.status(500).json({ error: 'AI could not parse the syllabus. Please try again.' });
    }
    res.status(500).json({ error: error.message || 'Failed to process syllabus' });
  }
});

// ── POST /api/upload/text ────────────────────────────────────────────────────
// Accepts raw pasted text instead of a PDF file
router.post('/text', async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim().length < 50) {
    return res.status(400).json({ error: 'Please provide at least 50 characters of syllabus text.' });
  }

  try {
    console.log('🤖 Analyzing pasted text...');
    const structuredData = await extractSyllabusData(text);

    res.json({
      success: true,
      data: structuredData,
      rawText: text.substring(0, 5000),
    });

  } catch (error) {
    console.error('Text upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze syllabus text' });
  }
});

module.exports = router;
