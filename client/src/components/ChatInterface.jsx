import { useState, useRef, useEffect } from 'react';

const SUGGESTED_QUESTIONS = [
  'When is my next exam?',
  'What is the grading breakdown?',
  'Do I have any assignments due this week?',
  'What are the attendance requirements?',
  'What is the late submission policy?',
  'What topics are on the midterm?',
];

function Message({ msg }) {
  const isUser = msg.role === 'user';

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      gap: 8,
      alignItems: 'flex-end',
    }}>
      {!isUser && (
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          flexShrink: 0,
        }}>
          🤖
        </div>
      )}
      <div style={{
        maxWidth: '75%',
        padding: '10px 14px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isUser ? 'var(--primary)' : 'white',
        color: isUser ? 'white' : 'var(--text)',
        fontSize: '0.9rem',
        lineHeight: 1.6,
        border: !isUser ? '1px solid var(--border)' : 'none',
        boxShadow: 'var(--shadow)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {msg.content}
        {msg.loading && (
          <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', marginLeft: 6 }}>
            <span style={{
              display: 'inline-block',
              width: 6, height: 6,
              borderRadius: '50%',
              background: 'var(--text-muted)',
              animation: 'bounce 1s infinite',
            }} />
            <span style={{
              display: 'inline-block',
              width: 6, height: 6,
              borderRadius: '50%',
              background: 'var(--text-muted)',
              animation: 'bounce 1s infinite 0.15s',
            }} />
            <span style={{
              display: 'inline-block',
              width: 6, height: 6,
              borderRadius: '50%',
              background: 'var(--text-muted)',
              animation: 'bounce 1s infinite 0.3s',
            }} />
          </span>
        )}
      </div>
    </div>
  );
}

export default function ChatInterface({ syllabusData, rawText }) {
  const [messages, setMessages] = useState([
    {
      id: 0,
      role: 'assistant',
      content: `Hi! I've analyzed your ${syllabusData.course_name || 'course'} syllabus. Ask me anything — deadlines, grades, exam topics, course rules, or anything else!`,
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (question) => {
    const text = (question || input).trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now(), role: 'user', content: text };
    const thinkingMsg = { id: Date.now() + 1, role: 'assistant', content: '', loading: true };

    setMessages(prev => [...prev, userMsg, thinkingMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          syllabusData,
          rawText,
          chatHistory: messages.filter(m => !m.loading).slice(-6),
        }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Request failed');

      setMessages(prev =>
        prev.map(m =>
          m.id === thinkingMsg.id
            ? { ...m, content: result.answer, loading: false }
            : m
        )
      );
    } catch (err) {
      setMessages(prev =>
        prev.map(m =>
          m.id === thinkingMsg.id
            ? { ...m, content: `Sorry, I couldn't get an answer: ${err.message}`, loading: false }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="container">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            💬 Ask About Your Syllabus
          </h2>
          <div className="text-sm text-muted mt-1">
            Ask anything about {syllabusData.course_name || 'your course'} — deadlines, grades, policies, and more.
          </div>
        </div>

        {/* Chat window */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

          {/* Messages */}
          <div style={{
            height: 420,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}>
            {messages.map(msg => (
              <Message key={msg.id} msg={msg} />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Suggested questions */}
          {messages.length <= 1 && (
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border)',
              background: 'var(--surface-2)',
            }}>
              <div className="text-xs text-muted" style={{ marginBottom: 8 }}>Try asking:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {SUGGESTED_QUESTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    disabled={loading}
                    style={{
                      padding: '4px 10px',
                      border: '1px solid var(--border)',
                      borderRadius: 20,
                      background: 'white',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      color: 'var(--primary)',
                      fontWeight: 500,
                      transition: 'all 0.15s',
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input bar */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: 10,
            background: 'white',
          }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about deadlines, grades, exam dates..."
              disabled={loading}
              style={{
                flex: 1,
                minHeight: 44,
                maxHeight: 120,
                resize: 'none',
                border: '1.5px solid var(--border)',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                lineHeight: 1.5,
              }}
              rows={1}
            />
            <button
              className="btn btn-primary"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{ alignSelf: 'flex-end', minWidth: 80 }}
            >
              {loading ? <span className="spinner" /> : '↑ Send'}
            </button>
          </div>
        </div>

        <p className="text-xs text-muted" style={{ marginTop: 8, textAlign: 'center' }}>
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>

      {/* Bounce animation for typing dots */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
