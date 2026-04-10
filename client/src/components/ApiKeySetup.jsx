import { useState } from 'react';

export default function ApiKeySetup({ onKeySet }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [testing, setTesting] = useState(false);

  const handleSave = async () => {
    const trimmed = key.trim();
    if (!trimmed.startsWith('sk-ant-')) {
      setError('That doesn\'t look like a valid Claude API key. It should start with sk-ant-');
      return;
    }

    setTesting(true);
    setError('');

    try {
      // Quick test call to verify the key works
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': trimmed,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }]
        })
      });

      if (res.status === 401) {
        setError('Invalid API key. Please check it and try again.');
        setTesting(false);
        return;
      }

      // Save and proceed
      localStorage.setItem('anthropic_api_key', trimmed);
      onKeySet();

    } catch (e) {
      // If fetch fails due to CORS or network, save anyway and let user try
      localStorage.setItem('anthropic_api_key', trimmed);
      onKeySet();
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)', padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>📋</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 8 }}>
            AI Syllabus Assistant
          </h1>
          <p className="text-muted text-sm">
            Enter your Claude API key to get started.<br />
            It's stored only in your browser — never sent anywhere else.
          </p>
        </div>

        <div className="card">
          <div className="card-title">🔑 Your Claude API Key</div>

          <input
            type="password"
            value={key}
            onChange={e => { setKey(e.target.value); setError(''); }}
            placeholder="sk-ant-api03-..."
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            style={{ marginBottom: 8, fontFamily: 'monospace', fontSize: '0.85rem' }}
            autoFocus
          />

          {error && (
            <div style={{
              padding: '8px 12px', background: '#fee2e2', color: 'var(--danger)',
              borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', marginBottom: 12,
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!key.trim() || testing}
            style={{ width: '100%', marginTop: 4 }}
          >
            {testing ? <><span className="spinner" /> Verifying...</> : '🚀 Get Started'}
          </button>

          <div style={{
            marginTop: 16, padding: '12px 14px',
            background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)',
            fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6,
          }}>
            <strong>Where to get your key:</strong><br />
            1. Go to <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--primary)' }}>console.anthropic.com</a><br />
            2. Click <strong>API Keys</strong> → <strong>Create Key</strong><br />
            3. Copy and paste it here
          </div>
        </div>

        <p className="text-xs text-muted" style={{ textAlign: 'center', marginTop: 12 }}>
          🔒 Your key is saved only in this browser's localStorage
        </p>
      </div>
    </div>
  );
}
