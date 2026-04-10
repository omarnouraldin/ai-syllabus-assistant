import { useState } from 'react';

// ── Assignment Modal ──────────────────────────────────────────────────────────
export function AssignmentModal({ item, onSave, onClose, color = 'var(--primary)' }) {
  const [form, setForm] = useState({
    title: item?.title || '',
    description: item?.description || '',
    due_date: item?.due_date || '',
    weight: item?.weight || '',
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const isValid = form.title.trim().length > 0;

  return (
    <Modal
      title={item ? '✏️ Edit Assignment' : '➕ Add Assignment'}
      color={color}
      onClose={onClose}
      onSave={() => isValid && onSave(form)}
      saveDisabled={!isValid}
    >
      <Field label="Title *">
        <input value={form.title} onChange={e => set('title', e.target.value)}
          placeholder="e.g. Homework 1, Research Paper..." autoFocus />
      </Field>
      <Field label="Description">
        <textarea value={form.description} onChange={e => set('description', e.target.value)}
          placeholder="Optional details..." style={{ minHeight: 70, resize: 'vertical' }} />
      </Field>
      <Row>
        <Field label="Due Date">
          <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
        </Field>
        <Field label="Weight">
          <input value={form.weight} onChange={e => set('weight', e.target.value)}
            placeholder="e.g. 10% or 20 pts" />
        </Field>
      </Row>
    </Modal>
  );
}

// ── Exam Modal ────────────────────────────────────────────────────────────────
export function ExamModal({ item, onSave, onClose, color = 'var(--danger)' }) {
  const [form, setForm] = useState({
    type: item?.type || 'Midterm',
    title: item?.title || '',
    date: item?.date || '',
    time: item?.time || '',
    location: item?.location || '',
    weight: item?.weight || '',
    topics: item?.topics?.join(', ') || '',
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = () => {
    onSave({
      ...form,
      topics: form.topics ? form.topics.split(',').map(t => t.trim()).filter(Boolean) : [],
    });
  };

  return (
    <Modal
      title={item ? '✏️ Edit Exam' : '➕ Add Exam'}
      color={color}
      onClose={onClose}
      onSave={handleSave}
    >
      <Row>
        <Field label="Type">
          <select value={form.type} onChange={e => set('type', e.target.value)}>
            {['Midterm', 'Final', 'Quiz', 'Lab Exam', 'Practical', 'Other'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Title (optional)">
          <input value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="e.g. Midterm 1" />
        </Field>
      </Row>
      <Row>
        <Field label="Date">
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </Field>
        <Field label="Time">
          <input type="time" value={form.time} onChange={e => set('time', e.target.value)} />
        </Field>
      </Row>
      <Row>
        <Field label="Location">
          <input value={form.location} onChange={e => set('location', e.target.value)}
            placeholder="Room 204, Online..." />
        </Field>
        <Field label="Weight">
          <input value={form.weight} onChange={e => set('weight', e.target.value)}
            placeholder="e.g. 30%" />
        </Field>
      </Row>
      <Field label="Topics (comma-separated)">
        <input value={form.topics} onChange={e => set('topics', e.target.value)}
          placeholder="e.g. Chapter 1, Recursion, Sorting..." />
      </Field>
    </Modal>
  );
}

// ── Course Info Modal ─────────────────────────────────────────────────────────
export function CourseInfoModal({ data, onSave, onClose, color }) {
  const [form, setForm] = useState({
    course_name: data.course_name || '',
    course_code: data.course_code || '',
    instructor_name: data.instructor_name || '',
    instructor_email: data.instructor_email || '',
    semester: data.semester || '',
    office_hours: data.office_hours || '',
    description: data.description || '',
  });
  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <Modal title="✏️ Edit Course Info" color={color} onClose={onClose} onSave={() => onSave(form)}>
      <Row>
        <Field label="Course Name">
          <input value={form.course_name} onChange={e => set('course_name', e.target.value)} />
        </Field>
        <Field label="Course Code">
          <input value={form.course_code} onChange={e => set('course_code', e.target.value)}
            placeholder="e.g. CS101" />
        </Field>
      </Row>
      <Row>
        <Field label="Instructor Name">
          <input value={form.instructor_name} onChange={e => set('instructor_name', e.target.value)} />
        </Field>
        <Field label="Instructor Email">
          <input type="email" value={form.instructor_email} onChange={e => set('instructor_email', e.target.value)} />
        </Field>
      </Row>
      <Row>
        <Field label="Semester">
          <input value={form.semester} onChange={e => set('semester', e.target.value)}
            placeholder="e.g. Spring 2026" />
        </Field>
        <Field label="Office Hours">
          <input value={form.office_hours} onChange={e => set('office_hours', e.target.value)} />
        </Field>
      </Row>
      <Field label="Course Description">
        <textarea value={form.description} onChange={e => set('description', e.target.value)}
          style={{ minHeight: 80, resize: 'vertical' }} />
      </Field>
    </Modal>
  );
}

// ── Grading Item Modal ────────────────────────────────────────────────────────
export function GradingItemModal({ item, onSave, onClose, color }) {
  const [form, setForm] = useState({
    item: item?.item || '',
    weight: item?.weight ?? '',
  });
  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const isValid = form.item.trim() && form.weight !== '';

  return (
    <Modal title={item ? '✏️ Edit Grade Item' : '➕ Add Grade Item'}
      color={color} onClose={onClose}
      onSave={() => isValid && onSave({ ...form, weight: parseFloat(form.weight) })}
      saveDisabled={!isValid}>
      <Field label="Item Name *">
        <input value={form.item} onChange={e => set('item', e.target.value)}
          placeholder="e.g. Midterm, Quizzes, Participation..." autoFocus />
      </Field>
      <Field label="Weight (%) *">
        <input type="number" min="0" max="100" value={form.weight}
          onChange={e => set('weight', e.target.value)} placeholder="e.g. 30" />
      </Field>
    </Modal>
  );
}

// ── Rule Edit Modal ───────────────────────────────────────────────────────────
export function RulesModal({ rules, onSave, onClose, color }) {
  const [form, setForm] = useState({
    attendance: rules?.attendance || '',
    late_submission: rules?.late_submission || '',
    academic_integrity: rules?.academic_integrity || '',
    other: rules?.other?.join('\n') || '',
  });
  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = () => {
    onSave({
      ...form,
      other: form.other ? form.other.split('\n').map(s => s.trim()).filter(Boolean) : [],
    });
  };

  return (
    <Modal title="✏️ Edit Course Rules" color={color} onClose={onClose} onSave={handleSave}>
      <Field label="Attendance Policy">
        <textarea value={form.attendance} onChange={e => set('attendance', e.target.value)}
          style={{ minHeight: 70, resize: 'vertical' }} placeholder="Attendance requirements..." />
      </Field>
      <Field label="Late Submission Policy">
        <textarea value={form.late_submission} onChange={e => set('late_submission', e.target.value)}
          style={{ minHeight: 70, resize: 'vertical' }} placeholder="Late work policy..." />
      </Field>
      <Field label="Academic Integrity">
        <textarea value={form.academic_integrity} onChange={e => set('academic_integrity', e.target.value)}
          style={{ minHeight: 70, resize: 'vertical' }} placeholder="Academic honesty policy..." />
      </Field>
      <Field label="Other Rules (one per line)">
        <textarea value={form.other} onChange={e => set('other', e.target.value)}
          style={{ minHeight: 80, resize: 'vertical' }} placeholder="Any other important rules..." />
      </Field>
    </Modal>
  );
}

// ── Shared primitives ─────────────────────────────────────────────────────────
function Modal({ title, color, onClose, onSave, saveDisabled = false, children }) {
  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        zIndex: 50, backdropFilter: 'blur(2px)',
      }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        zIndex: 51, width: '92%', maxWidth: 500,
        background: 'var(--surface)', borderRadius: 'var(--radius)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: `${color}15`, flexShrink: 0,
        }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>{title}</div>
          <button onClick={onClose} style={{
            border: 'none', background: 'transparent', cursor: 'pointer',
            fontSize: '1.3rem', color: 'var(--text-muted)', lineHeight: 1, padding: '0 4px',
          }}>×</button>
        </div>
        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {children}
        </div>
        {/* Footer */}
        <div style={{
          padding: '14px 20px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: 10, flexShrink: 0, background: 'var(--surface)',
        }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave} disabled={saveDisabled}
            style={{ flex: 1, background: color, borderColor: color }}>
            Save
          </button>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>{label}</label>
      {children}
    </div>
  );
}

function Row({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {children}
    </div>
  );
}
