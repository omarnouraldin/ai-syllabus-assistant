import { useState } from 'react';
import { supabase } from '../lib/supabase.js';

export default function AuthPage() {
  const [mode, setMode]       = useState('login'); // 'login' | 'signup' | 'reset'
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const clearMessages = () => { setError(''); setSuccess(''); };

  const handleGoogle = async () => {
    setLoading(true);
    clearMessages();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // App.jsx auth listener will handle the redirect

      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess('Account created! Check your email to confirm, then log in.');
        setMode('login');

      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setSuccess('Password reset email sent! Check your inbox.');
        setMode('login');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      background: 'var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo.png" alt="Logo" style={{ width: 90, height: 90, borderRadius: 20, objectFit: 'cover', marginBottom: 12 }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
            AI Syllabus Assistant
          </h1>
          <p className="text-sm text-muted" style={{ marginTop: 6 }}>
            {mode === 'login'  && 'Sign in to access your courses'}
            {mode === 'signup' && 'Create an account to get started'}
            {mode === 'reset'  && 'Reset your password'}
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 32 }}>
          {/* Google button — shown on login and signup, not reset */}
          {mode !== 'reset' && (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  width: '100%', padding: '11px 20px',
                  border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface)', color: 'var(--text)',
                  fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.7-2.9-11.9-7.2l-6.6 5.1C9.5 39.6 16.3 44 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.5-4.6 5.8l6.2 5.2C40.7 35.6 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/>
                </svg>
                Continue with Google
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span className="text-xs text-muted">or</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@university.edu"
                required
                autoFocus
              />
            </div>

            {/* Password (not shown in reset mode) */}
            {mode !== 'reset' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                  required
                  minLength={6}
                />
              </div>
            )}

            {/* Error / Success messages */}
            {error && (
              <div style={{
                padding: '10px 14px',
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
              }}>
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div style={{
                padding: '10px 14px',
                background: 'var(--success-bg)',
                color: 'var(--success)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
              }}>
                ✅ {success}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ marginTop: 4 }}
            >
              {loading ? <span className="spinner" /> : (
                mode === 'login'  ? 'Sign In' :
                mode === 'signup' ? 'Create Account' :
                'Send Reset Email'
              )}
            </button>
          </form>

          {/* Footer links */}
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            {mode === 'login' && (
              <>
                <button
                  onClick={() => { clearMessages(); setMode('reset'); }}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.825rem' }}
                >
                  Forgot password?
                </button>
                <div style={{ display: 'flex', gap: 6, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Don't have an account?
                  <button
                    onClick={() => { clearMessages(); setMode('signup'); }}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, padding: 0 }}
                  >
                    Sign up
                  </button>
                </div>
              </>
            )}
            {(mode === 'signup' || mode === 'reset') && (
              <div style={{ display: 'flex', gap: 6, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Already have an account?
                <button
                  onClick={() => { clearMessages(); setMode('login'); }}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, padding: 0 }}
                >
                  Sign in
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
