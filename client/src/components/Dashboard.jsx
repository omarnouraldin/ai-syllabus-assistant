import { useState } from 'react';
import EditScheduleModal from './EditScheduleModal.jsx';
import {
  AssignmentModal, ExamModal, CourseInfoModal,
  GradingItemModal, RulesModal
} from './ItemEditModal.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return 'TBD';
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  } catch { return dateStr; }
}

function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.ceil((new Date(dateStr + 'T00:00:00') - today) / 86400000);
}

function UrgencyBadge({ days }) {
  if (days === null) return null;
  if (days < 0)  return <span className="badge badge-primary">Past</span>;
  if (days === 0) return <span className="badge badge-danger">Today!</span>;
  if (days <= 3)  return <span className="badge badge-danger">{days}d left</span>;
  if (days <= 7)  return <span className="badge badge-warning">{days}d left</span>;
  return <span className="badge badge-primary">{days}d left</span>;
}

// ── Section header with add button ───────────────────────────────────────────
function SectionHeader({ icon, title, onAdd, addLabel }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
      <div className="card-title" style={{ margin: 0 }}>{icon} {title}</div>
      {onAdd && (
        <button onClick={onAdd} style={{
          border: 'none', background: 'var(--primary-light)', color: 'var(--primary)',
          borderRadius: 20, padding: '3px 12px', cursor: 'pointer',
          fontSize: '0.75rem', fontWeight: 700,
        }}>
          + {addLabel || 'Add'}
        </button>
      )}
    </div>
  );
}

// ── Editable item row ─────────────────────────────────────────────────────────
function EditableRow({ children, onEdit, onDelete, style = {} }) {
  return (
    <div className="editable-item" style={{
      padding: '10px 12px',
      background: 'var(--surface-2)',
      borderRadius: 'var(--radius-sm)',
      paddingRight: 80,
      ...style,
    }}>
      {children}
      <div className="item-actions">
        <button className="icon-btn" onClick={onEdit} title="Edit">✏️</button>
        <button className="icon-btn delete" onClick={() => { if(confirm('Delete this item?')) onDelete(); }} title="Delete">🗑</button>
      </div>
    </div>
  );
}

// ── Upcoming Deadlines ────────────────────────────────────────────────────────
function UpcomingItems({ assignments = [], exams = [] }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const items = [
    ...assignments.map(a => ({ ...a, kind: 'assignment', date: a.due_date })),
    ...exams.map(e => ({ ...e, kind: 'exam', title: e.title || e.type, date: e.date })),
  ]
    .filter(i => i.date)
    .map(i => ({ ...i, d: new Date(i.date + 'T00:00:00') }))
    .filter(i => i.d >= today)
    .sort((a,b) => a.d - b.d)
    .slice(0,6);

  return (
    <div className="card">
      <div className="card-title">📅 Upcoming Deadlines</div>
      {items.length === 0 ? (
        <div className="text-sm text-muted">No upcoming deadlines found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item, i) => {
            const days = getDaysUntil(item.date);
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 'var(--radius-sm)',
                background: days !== null && days <= 3 ? 'var(--danger-bg)' : 'var(--surface-2)',
                borderLeft: `3px solid ${item.kind === 'exam' ? 'var(--danger)' : 'var(--primary)'}`,
              }}>
                <span style={{ fontSize: 18 }}>{item.kind === 'exam' ? '🎓' : '📝'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.title}</div>
                  <div className="text-xs text-muted">{formatDate(item.date)}</div>
                </div>
                <UrgencyBadge days={days} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Grading Breakdown ─────────────────────────────────────────────────────────
function GradingSection({ grading, color, onUpdate }) {
  const [modal, setModal] = useState(null); // null | { mode: 'add' | 'edit', index, item }

  const breakdown = grading?.breakdown || [];
  const total = breakdown.reduce((s, g) => s + (g.weight || 0), 0);

  const save = (index, updated) => {
    const next = index === -1
      ? [...breakdown, updated]
      : breakdown.map((g,i) => i === index ? updated : g);
    onUpdate({ ...grading, breakdown: next });
    setModal(null);
  };

  const del = (index) => {
    onUpdate({ ...grading, breakdown: breakdown.filter((_,i) => i !== index) });
  };

  return (
    <div className="card">
      <SectionHeader icon="⚖️" title="Grading Breakdown"
        onAdd={() => setModal({ mode: 'add', index: -1, item: null })} addLabel="Item" />

      {breakdown.length === 0 ? (
        <div className="text-sm text-muted">No grading breakdown found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {breakdown.map((item, i) => (
            <EditableRow key={i}
              onEdit={() => setModal({ mode: 'edit', index: i, item })}
              onDelete={() => del(i)}
              style={{ background: 'transparent', padding: '0 0 0 0', paddingRight: 70 }}>
              <div style={{ marginBottom: 4 }}>
                <div className="flex justify-between text-sm" style={{ marginBottom: 4 }}>
                  <span style={{ fontWeight: 500 }}>{item.item}</span>
                  <span style={{ fontWeight: 700, color }}>{item.weight}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${item.weight}%`, background: color }} />
                </div>
              </div>
            </EditableRow>
          ))}
          <div className="text-xs text-muted" style={{ textAlign: 'right' }}>
            Total: <strong style={{ color: total === 100 ? 'var(--success)' : 'var(--warning)' }}>{total}%</strong>
            {total !== 100 && ' ⚠️ should equal 100%'}
          </div>
        </div>
      )}

      {grading?.passing_grade && (
        <div className="text-sm text-muted" style={{ marginTop: 10 }}>
          Passing grade: <strong>{grading.passing_grade}</strong>
        </div>
      )}

      {modal && (
        <GradingItemModal
          item={modal.item}
          color={color}
          onSave={(updated) => save(modal.index, updated)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ── Exams ─────────────────────────────────────────────────────────────────────
function ExamsSection({ exams = [], onUpdate }) {
  const [modal, setModal] = useState(null);

  const save = (index, updated) => {
    const next = index === -1 ? [...exams, updated] : exams.map((e,i) => i === index ? updated : e);
    onUpdate(next);
    setModal(null);
  };
  const del = (index) => onUpdate(exams.filter((_,i) => i !== index));

  return (
    <div className="card">
      <SectionHeader icon="🎓" title="Exams"
        onAdd={() => setModal({ mode: 'add', index: -1, item: null })} addLabel="Exam" />

      {exams.length === 0 ? (
        <div className="text-sm text-muted">No exams added yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {exams.map((exam, i) => (
            <EditableRow key={i}
              onEdit={() => setModal({ mode: 'edit', index: i, item: exam })}
              onDelete={() => del(i)}>
              <div className="flex justify-between items-center">
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    {exam.title || exam.type}
                    {exam.weight && <span className="badge badge-danger" style={{ marginLeft: 8 }}>{exam.weight}</span>}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    📅 {formatDate(exam.date)}
                    {exam.time && ` · ⏰ ${exam.time}`}
                    {exam.location && ` · 📍 ${exam.location}`}
                  </div>
                  {exam.topics?.length > 0 && (
                    <div className="text-xs text-muted mt-1">
                      Topics: {exam.topics.slice(0,4).join(', ')}{exam.topics.length > 4 ? '...' : ''}
                    </div>
                  )}
                </div>
                <UrgencyBadge days={getDaysUntil(exam.date)} />
              </div>
            </EditableRow>
          ))}
        </div>
      )}

      {modal && (
        <ExamModal
          item={modal.item}
          onSave={(updated) => save(modal.index, updated)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ── Assignments ───────────────────────────────────────────────────────────────
function AssignmentsSection({ assignments = [], color, onUpdate }) {
  const [modal, setModal] = useState(null);

  const save = (index, updated) => {
    const next = index === -1 ? [...assignments, updated] : assignments.map((a,i) => i === index ? updated : a);
    onUpdate(next);
    setModal(null);
  };
  const del = (index) => onUpdate(assignments.filter((_,i) => i !== index));

  return (
    <div className="card">
      <SectionHeader icon="📝" title="Assignments"
        onAdd={() => setModal({ mode: 'add', index: -1, item: null })} addLabel="Assignment" />

      {assignments.length === 0 ? (
        <div className="text-sm text-muted">No assignments added yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {assignments.map((a, i) => (
            <EditableRow key={i}
              onEdit={() => setModal({ mode: 'edit', index: i, item: a })}
              onDelete={() => del(i)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" style={{ width: 15, height: 15, cursor: 'pointer', flexShrink: 0 }}
                  onChange={() => {}} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{a.title}</div>
                  {a.description && (
                    <div className="text-xs text-muted mt-1"
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.description}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginRight: 4 }}>
                  <div className="text-xs text-muted">{formatDate(a.due_date)}</div>
                  {a.weight && <div className="text-xs" style={{ color, fontWeight: 700 }}>{a.weight}</div>}
                </div>
                <UrgencyBadge days={getDaysUntil(a.due_date)} />
              </div>
            </EditableRow>
          ))}
        </div>
      )}

      {modal && (
        <AssignmentModal
          item={modal.item}
          color={color}
          onSave={(updated) => save(modal.index, updated)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ── Rules ─────────────────────────────────────────────────────────────────────
function RulesSection({ rules, color, onUpdate }) {
  const [modal, setModal] = useState(false);
  if (!rules && !modal) return (
    <div className="card">
      <SectionHeader icon="📜" title="Course Rules" onAdd={() => setModal(true)} addLabel="Rules" />
      <div className="text-sm text-muted">No rules found.</div>
      {modal && <RulesModal rules={rules} color={color} onSave={(r) => { onUpdate(r); setModal(false); }} onClose={() => setModal(false)} />}
    </div>
  );

  const items = [
    { label: '🎒 Attendance', value: rules?.attendance },
    { label: '⏰ Late Work', value: rules?.late_submission },
    { label: '📖 Academic Integrity', value: rules?.academic_integrity },
  ].filter(i => i.value);

  return (
    <div className="card">
      <SectionHeader icon="📜" title="Course Rules">
        <button onClick={() => setModal(true)} style={{
          border: 'none', background: 'var(--surface-2)', color: 'var(--text-muted)',
          borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem',
        }}>✏️ Edit</button>
      </SectionHeader>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.map((item, i) => (
          <div key={i}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 }}>{item.label}</div>
            <div className="text-sm text-muted" style={{ lineHeight: 1.6 }}>{item.value}</div>
          </div>
        ))}
        {rules?.other?.map((rule, i) => (
          <div key={`o${i}`} className="text-sm text-muted">• {rule}</div>
        ))}
      </div>
      {modal && <RulesModal rules={rules} color={color} onSave={(r) => { onUpdate(r); setModal(false); }} onClose={() => setModal(false)} />}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard({ data, color = 'var(--primary)', schedule, onChat, onGrades, onDelete, onUpdateSchedule, onUpdateData }) {
  const [showEditSchedule, setShowEditSchedule] = useState(false);
  const [showEditInfo, setShowEditInfo] = useState(false);

  // Partial data update helper
  const update = (patch) => onUpdateData({ ...data, ...patch });

  return (
    <div className="container">

      {/* ── Course Header ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.2 }}>
                {data.course_name || 'Course Dashboard'}
              </h1>
              <button onClick={() => setShowEditInfo(true)} className="icon-btn hide-mobile"
                title="Edit course info" style={{ fontSize: '0.9rem', opacity: 0.6 }}>✏️</button>
            </div>

            <div className="text-sm text-muted" style={{ marginTop: 4 }}>
              {data.course_code && <span>📌 {data.course_code} · </span>}
              {data.instructor_name && <span>👤 {data.instructor_name} · </span>}
              {data.semester && <span>📅 {data.semester}</span>}
            </div>

            {/* Schedule row */}
            <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              {schedule?.days?.length > 0 ? (
                <>
                  {schedule.days.map(d => (
                    <span key={d} style={{
                      background: `${color}20`, color, borderRadius: 4,
                      padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700
                    }}>{d.slice(0,3)}</span>
                  ))}
                  {schedule.start_time && (
                    <span className="text-xs text-muted">
                      {schedule.start_time}{schedule.end_time ? `–${schedule.end_time}` : ''}
                    </span>
                  )}
                  {schedule.location && <span className="text-xs text-muted">· 📍 {schedule.location}</span>}
                </>
              ) : null}
              <button onClick={() => setShowEditSchedule(true)} className="text-xs"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, padding: 0 }}>
                {schedule?.days?.length ? '✏️ Edit schedule' : '+ Add schedule'}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-sm" onClick={onChat} style={{ background: color }}>💬 Ask AI</button>
            <button className="btn btn-secondary btn-sm" onClick={onGrades}>🎯 Grades</button>
            <button className="btn btn-secondary btn-sm hide-mobile" onClick={() => setShowEditInfo(true)}>✏️ Edit Info</button>
            <button className="btn btn-danger btn-sm" onClick={() => { if(confirm('Delete this course?')) onDelete(); }}>🗑</button>
          </div>
        </div>

        {data.description && (
          <div style={{
            marginTop: 14, padding: '12px 16px',
            background: `${color}15`, borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.6,
            borderLeft: `3px solid ${color}`,
          }}>
            {data.description}
          </div>
        )}
      </div>

      {/* ── Grid ─────────────────────────────────────────────────────── */}
      <div className="dashboard-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: 20,
      }}>
        <UpcomingItems assignments={data.assignments || []} exams={data.exams || []} />

        <GradingSection
          grading={data.grading}
          color={color}
          onUpdate={(grading) => update({ grading })}
        />

        <ExamsSection
          exams={data.exams || []}
          onUpdate={(exams) => update({ exams })}
        />

        <AssignmentsSection
          assignments={data.assignments || []}
          color={color}
          onUpdate={(assignments) => update({ assignments })}
        />

        <RulesSection
          rules={data.rules}
          color={color}
          onUpdate={(rules) => update({ rules })}
        />

        {/* Instructor info */}
        {(data.instructor_name || data.instructor_email || data.office_hours) && (
          <div className="card">
            <SectionHeader icon="👤" title="Instructor Info" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.instructor_name && <div className="text-sm"><strong>Name:</strong> {data.instructor_name}</div>}
              {data.instructor_email && (
                <div className="text-sm">
                  <strong>Email:</strong>{' '}
                  <a href={`mailto:${data.instructor_email}`} style={{ color }}>
                    {data.instructor_email}
                  </a>
                </div>
              )}
              {data.office_hours && <div className="text-sm"><strong>Office Hours:</strong> {data.office_hours}</div>}
            </div>
          </div>
        )}

        {/* Textbooks */}
        {data.textbooks?.length > 0 && (
          <div className="card">
            <div className="card-title">📚 Textbooks</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.textbooks.map((book, i) => (
                <div key={i} className="text-sm">
                  <span style={{ fontWeight: 600 }}>{book.title}</span>
                  {book.author && <span className="text-muted"> — {book.author}</span>}
                  {book.required && <span className="badge badge-warning" style={{ marginLeft: 6 }}>Required</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="card" style={{ border: `1.5px dashed ${color}`, background: `${color}08` }}>
          <div className="card-title" style={{ color }}>🚀 Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn btn-primary" onClick={onChat}
              style={{ justifyContent: 'flex-start', background: color }}>
              💬 Ask about deadlines
            </button>
            <button className="btn btn-secondary" onClick={onChat} style={{ justifyContent: 'flex-start' }}>
              📊 Explain grading system
            </button>
            <button className="btn btn-secondary" onClick={onGrades} style={{ justifyContent: 'flex-start' }}>
              🎯 Calculate my grade
            </button>
          </div>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────── */}
      {showEditSchedule && (
        <EditScheduleModal
          course={{ id: 'current', color, schedule, data }}
          onSave={(s) => { onUpdateSchedule(s); setShowEditSchedule(false); }}
          onClose={() => setShowEditSchedule(false)}
        />
      )}

      {showEditInfo && (
        <CourseInfoModal
          data={data}
          color={color}
          onSave={(updated) => { update(updated); setShowEditInfo(false); }}
          onClose={() => setShowEditInfo(false)}
        />
      )}
    </div>
  );
}
