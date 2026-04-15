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
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
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
