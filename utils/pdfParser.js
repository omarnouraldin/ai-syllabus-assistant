const pdfParse = require('pdf-parse');
const fs = require('fs');

/**
 * Extracts plain text from a PDF file.
 * @param {string} filePath - Absolute path to the PDF file
 * @returns {Promise<string>} - Extracted text content
 */
async function extractTextFromPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);

  // Clean up the text: remove excessive whitespace/newlines
  const cleanedText = data.text
    .replace(/\n{3,}/g, '\n\n')   // collapse 3+ newlines into 2
    .replace(/[ \t]{2,}/g, ' ')   // collapse multiple spaces
    .trim();

  return cleanedText;
}

module.exports = { extractTextFromPDF };
