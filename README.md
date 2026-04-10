# 📋 AI Syllabus Assistant

Upload your university course syllabus (PDF or text) and instantly get answers about deadlines, grading, exams, and more — powered by Claude AI.

---

## ✨ Features

- **Upload PDF or paste text** — works with any syllabus format
- **AI extraction** — automatically extracts grading breakdown, assignments, exams, deadlines, rules
- **Dashboard** — see all upcoming deadlines and course info at a glance
- **AI Chat** — ask natural questions like "When is my midterm?" or "What's the late submission policy?"
- **Grade Calculator** — enter your scores and see your current grade + what you need to reach your goal

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| AI | Claude API (Anthropic) |
| PDF | pdf-parse |
| File uploads | multer |

---

## 🚀 Setup & Installation

### Prerequisites

1. **Node.js** — Download from [nodejs.org](https://nodejs.org) (choose LTS version)
2. **A Claude API key** — Get one at [console.anthropic.com](https://console.anthropic.com)

---

### Step 1 — Clone or download the project

If you pushed to GitHub:
```bash
git clone https://github.com/YOUR_USERNAME/ai-syllabus-assistant.git
cd ai-syllabus-assistant
```

---

### Step 2 — Set up your API key

Copy the example env file and add your key:
```bash
cp .env.example .env
```

Open `.env` and replace the placeholder:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
PORT=3001
```

> ⚠️ Never commit your `.env` file — it's already in `.gitignore`

---

### Step 3 — Install dependencies

Install everything at once:
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

---

### Step 4 — Run the app

You need **two terminal windows** running at the same time:

**Terminal 1 — Backend:**
```bash
npm run dev
```
You'll see: `🚀 Server running on http://localhost:3001`

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```
You'll see: `Local: http://localhost:5173`

Open **http://localhost:5173** in your browser.

---

## 📁 Project Structure

```
ai-syllabus-assistant/
├── .env.example          # Environment variable template
├── .gitignore
├── package.json          # Backend dependencies
├── server.js             # Express server entry point
├── routes/
│   ├── upload.js         # PDF/text upload + AI extraction
│   └── chat.js           # AI chat endpoint
├── utils/
│   ├── pdfParser.js      # PDF text extraction
│   └── claudeClient.js   # Claude API integration
└── client/               # React frontend (Vite)
    ├── package.json
    ├── vite.config.js    # Dev server + API proxy
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx        # Main app + routing + localStorage
        ├── index.css      # Global styles
        └── components/
            ├── UploadPage.jsx      # File upload + text paste
            ├── Dashboard.jsx       # Course overview
            ├── ChatInterface.jsx   # AI Q&A chat
            └── GradeCalculator.jsx # Grade tracking
```

---

## 🔄 How It Works

1. **Upload** — User uploads a PDF or pastes syllabus text
2. **Extract** — Backend uses `pdf-parse` to get the text
3. **AI Parse** — Text is sent to Claude, which returns structured JSON
4. **Store** — Data is saved in `localStorage` (persists between sessions)
5. **Dashboard** — Displays deadlines, grading breakdown, exams
6. **Chat** — User asks questions → Claude answers using the structured data
7. **Grades** — User enters scores → calculator shows current grade and what's needed

---

## 🔧 Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your Claude API key from console.anthropic.com |
| `PORT` | Backend port (default: 3001) |

---

## 🚢 Deploying to GitHub

```bash
git init
git add .
git commit -m "Initial commit: AI Syllabus Assistant"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-syllabus-assistant.git
git push -u origin main
```

---

## 📦 Future Features (planned)

- Moodle/e-campus auto-integration
- Browser extension
- Deadline notifications
- Multi-course support
- Mobile app

---

## 🤝 Contributing

This is a personal project. Feel free to fork and customize!

---

Built with ❤️ using React + Node.js + Claude AI
