import { useState, useRef } from 'react';
import { extractTextFromPDF } from '../utils/pdfParser.js';
import { extractSyllabusData } from '../utils/aiClient.js';

export default function UploadPage({ onSyllabusLoaded, onBack }) {
  const [mode, setMode] = useState('pdf');
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const fileInputRef = useRef(null);

  const handleFile = (f) => {
    if (f && f.type === 'application/pdf') { setFile(f); setError(''); }
    else setError('Please upload a PDF file.');
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      let rawText = '';

      if (mode === 'pdf') {
        if (!file) { setError('Please select a PDF file.'); setLoading(false); return; }
        setProgress('📄 Extracting text from PDF...');
        rawText = await extractTextFromPDF(file);
        if (!rawText || rawText.length < 50) {
          throw new Error('Could not extract text. This PDF may be scanned or image-based — try pasting the text instead.');
        }
      } else {
        if (!pastedText.trim() || pastedText.trim().length < 50) {
          setError('Please paste at least 50 characters.'); setLoading(false); return;
        }
        rawText = pastedText.trim();
      }

      setProgress('🤖 AI is analyzing your syllabus...');
      const data = await extractSyllabusData(rawText);

      setProgress('✅ Done!');
      onSyllabusLoaded(data, rawText.substring(0, 5000));

    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false); setProgress('');
    }
  };

  return (
    <div className="container">
      <div style={{ maxWidth: 580, margin: '0 auto' }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack} style={{ marginBottom: 20 }}>
          ← Back to Courses
        </button>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>📤</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 6 }}>Add a New Course</h1>
          <p className="text-muted text-sm">
            Upload your syllabus PDF or paste the text — AI will extract all the important info.
          </p>
        </div>

        <div className="card">
          {/* Mode Toggle */}
          <div style={{
            display:'flex', background:'var(--surface-2)',
            borderRadius:'var(--radius-sm)', padding:4, marginBottom:24,
          }}>
            {[{id:'pdf',label:'📄 Upload PDF'},{id:'text',label:'📝 Paste Text'}].map(m => (
              <button key={m.id} onClick={() => { setMode(m.id); setError(''); setFile(null); }}
                style={{
                  flex:1, padding:'8px 16px', border:'none', borderRadius:6,
                  cursor:'pointer', fontWeight:600, fontSize:'0.875rem', transition:'all 0.15s',
                  background: mode===m.id ? 'var(--surface)' : 'transparent',
                  color: mode===m.id ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: mode===m.id ? 'var(--shadow)' : 'none',
                }}>
                {m.label}
              </button>
            ))}
          </div>

          {/* PDF Upload */}
          {mode==='pdf' && (
            <div onDragOver={e=>{e.preventDefault();setDragOver(true);}}
              onDragLeave={()=>setDragOver(false)} onDrop={handleDrop}
              onClick={()=>fileInputRef.current?.click()}
              style={{
                border:`2px dashed ${dragOver?'var(--primary)':file?'var(--success)':'var(--border)'}`,
                borderRadius:'var(--radius)', padding:'36px 24px', textAlign:'center',
                cursor:'pointer',
                background: dragOver?'var(--primary-light)':file?'#f0fdf4':'var(--surface-2)',
                transition:'all 0.2s',
              }}>
              <input ref={fileInputRef} type="file" accept=".pdf" style={{display:'none'}}
                onChange={e=>handleFile(e.target.files[0])} />
              <div style={{fontSize:36, marginBottom:10}}>{file?'✅':'📤'}</div>
              {file ? (
                <div>
                  <div style={{fontWeight:600}}>{file.name}</div>
                  <div className="text-sm text-muted mt-1">
                    {(file.size/1024/1024).toFixed(2)} MB · Click to change
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{fontWeight:600, marginBottom:4}}>Drop your syllabus PDF here</div>
                  <div className="text-sm text-muted">or click to browse · Max 10MB</div>
                </div>
              )}
            </div>
          )}

          {/* Text Paste */}
          {mode==='text' && (
            <div>
              <textarea value={pastedText} onChange={e=>setPastedText(e.target.value)}
                placeholder="Paste your syllabus text here..."
                style={{minHeight:200, resize:'vertical', fontFamily:'inherit', fontSize:'0.875rem', lineHeight:1.6}} />
              <div className="text-xs text-muted mt-1">{pastedText.length} characters</div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{marginTop:14, padding:'10px 14px', background:'#fee2e2',
              color:'var(--danger)', borderRadius:'var(--radius-sm)', fontSize:'0.875rem'}}>
              ⚠️ {error}
            </div>
          )}

          {/* Progress */}
          {loading && progress && (
            <div style={{marginTop:14, padding:'10px 14px', background:'var(--primary-light)',
              color:'var(--primary)', borderRadius:'var(--radius-sm)', fontSize:'0.875rem',
              display:'flex', alignItems:'center', gap:8}}>
              <span className="spinner spinner-dark"
                style={{borderTopColor:'var(--primary)', borderColor:'rgba(99,102,241,0.2)'}} />
              {progress}
            </div>
          )}

          <button className="btn btn-primary btn-lg" onClick={handleSubmit}
            disabled={loading||(mode==='pdf'?!file:pastedText.trim().length<50)}
            style={{width:'100%', marginTop:18}}>
            {loading ? <><span className="spinner"/>Analyzing...</> : '🚀 Analyze Syllabus'}
          </button>
        </div>
      </div>
    </div>
  );
}
