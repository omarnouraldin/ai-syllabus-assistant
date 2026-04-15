import { useState } from 'react';
import WeeklySchedule from './WeeklySchedule.jsx';
import EditScheduleModal from './EditScheduleModal.jsx';

const COURSE_COLORS = [
  '#6366f1', '#ec4899', '#10b981', '#f59e0b',
  '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6',
];

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric'
    });
  } catch { return dateStr; }
}

function getNextDeadline(course) {
  const today = new Date(); today.setHours(0,0,0,0);
  const all = [
    ...(course.data.assignments || []).map(a => ({ title: a.title, date: a.due_date })),
    ...(course.data.exams || []).map(e => ({ title: e.title || e.type, date: e.date })),
  ].filter(i => i.date);

  const upcoming = all
    .map(i => ({ ...i, d: new Date(i.date + 'T00:00:00') }))
    .filter(i => i.d >= today)
    .sort((a,b) => a.d - b.d);

  return upcoming[0] || null;
}

function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.ceil((new Date(dateStr + 'T00:00:00') - today) / 86400000);
}

// ── Course Card ───────────────────────────────────────────────────────────────
function CourseCard({ course, onOpen, onDelete, onEditSchedule, onColorChange }) {
  const [showMenu, setShowMenu] = useState(false);
  const nextDeadline = getNextDeadline(course);
  const days = nextDeadline ? getDaysUntil(nextDeadline.date) : null;

  return (
    <div
      onClick={() => onOpen(course.id)}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        position: 'relative',
        boxShadow: 'var(--shadow)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = 'var(--shadow)';
      }}
    >
      {/* Color bar */}
      <div style={{ height: 6, background: course.color }} />

      <div style={{ padding: '16px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
            {course.data.course_code && (
              <div style={{
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em',
                color: course.color, textTransform: 'uppercase', marginBottom: 3
              }}>
                {course.data.course_code}
              </div>
            )}
            <div style={{
              fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3,
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {course.data.course_name || 'Unnamed Course'}
            </div>
          </div>

          {/* Menu button */}
          <div style={{ position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              style={{
                border: 'none', background: 'transparent', cursor: 'pointer',
                padding: '4px 8px', borderRadius: 6, fontSize: '1rem',
                color: 'var(--text-muted)',
              }}
            >
              ⋯
            </button>
            {showMenu && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 9 }}
                  onClick={() => setShowMenu(false)}
                />
                <div style={{
                  position: 'absolute', right: 0, top: '100%', zIndex: 10,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 10, boxShadow: 'var(--shadow-md)',
                  minWidth: 160, overflow: 'hidden',
                }}>
                  <button onClick={() => { onEditSchedule(course); setShowMenu(false); }}
                    style={menuBtnStyle}>📅 Edit Schedule</button>
                  <div style={{ padding: '8px 12px 4px', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    COLOR
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '4px 12px 10px' }}>
                    {COURSE_COLORS.map(c => (
                      <div key={c} onClick={() => { onColorChange(course.id, c); setShowMenu(false); }}
                        style={{
                          width: 20, height: 20, borderRadius: '50%', background: c,
                          cursor: 'pointer', border: course.color === c ? '2px solid #1e293b' : '2px solid transparent',
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ height: 1, background: 'var(--border)' }} />
                  <button onClick={() => { if (confirm('Delete this course?')) { onDelete(course.id); setShowMenu(false); } }}
                    style={{ ...menuBtnStyle, color: 'var(--danger)' }}>🗑 Delete Course</button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Instructor */}
        {course.data.instructor_name && (
          <div className="text-xs text-muted" style={{ marginTop: 8 }}>
            👤 {course.data.instructor_name}
          </div>
        )}

        {/* Class schedule */}
        {course.schedule?.days?.length > 0 && (
          <div className="text-xs" style={{ marginTop: 6, color: 'var(--text-muted)', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {course.schedule.days.map(d => (
              <span key={d} style={{
                background: `${course.color}20`, color: course.color,
                borderRadius: 4, padding: '1px 6px', fontWeight: 600
              }}>
                {d.slice(0,3)}
              </span>
            ))}
            {course.schedule.start_time && (
              <span>· {course.schedule.start_time}
                {course.schedule.end_time && `–${course.schedule.end_time}`}
              </span>
            )}
            {course.schedule.location && <span>· 📍 {course.schedule.location}</span>}
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />

        {/* Next deadline */}
        {nextDeadline ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="text-xs text-muted">Next deadline</div>
              <div className="text-sm" style={{ fontWeight: 600, marginTop: 2 }}>
                {nextDeadline.title}
              </div>
              <div className="text-xs text-muted">{formatDate(nextDeadline.date)}</div>
            </div>
            {days !== null && (
              <div style={{
                padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                background: days <= 3 ? 'var(--danger-bg)' : days <= 7 ? 'var(--warning-bg)' : `${course.color}20`,
                color: days <= 3 ? 'var(--danger)' : days <= 7 ? 'var(--warning)' : course.color,
              }}>
                {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-muted">No upcoming deadlines</div>
        )}
      </div>
    </div>
  );
}

const menuBtnStyle = {
  display: 'block', width: '100%', padding: '9px 14px',
  border: 'none', background: 'transparent', cursor: 'pointer',
  textAlign: 'left', fontSize: '0.875rem', color: 'var(--text)',
};

// ── Main CoursesHome ──────────────────────────────────────────────────────────
export default function CoursesHome({ courses, onOpenCourse, onAddCourse, onDeleteCourse, onUpdateSchedule, onUpdateColor }) {
  const [tab, setTab] = useState('cards');         // 'cards' | 'schedule'
  const [editingCourse, setEditingCourse] = useState(null);

  return (
    <div className="container">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>My Courses</h1>
          <div className="text-sm text-muted mt-1">
            {courses.length === 0 ? 'No courses yet — add your first one' : `${courses.length} course${courses.length > 1 ? 's' : ''} saved`}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* View toggle */}
          {courses.length > 0 && (
            <div style={{
              display: 'flex', background: 'var(--surface-2)',
              borderRadius: 'var(--radius-sm)', padding: 3,
            }}>
              {[{ id: 'cards', label: '⊞ Cards' }, { id: 'schedule', label: '📅 Schedule' }].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  padding: '6px 14px', border: 'none', borderRadius: 6, cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.15s',
                  background: tab === t.id ? 'var(--surface)' : 'transparent',
                  color: tab === t.id ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: tab === t.id ? 'var(--shadow)' : 'none',
                }}>
                  {t.label}
                </button>
              ))}
            </div>
          )}

          <button className="btn btn-primary" onClick={onAddCourse}>
            + Add Course
          </button>
        </div>
      </div>

      {/* Empty state */}
      {courses.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📚</div>
          <h2 style={{ fontWeight: 700, marginBottom: 8 }}>No courses yet</h2>
          <p className="text-muted" style={{ marginBottom: 24 }}>
            Upload your first syllabus and AI will extract all the important info automatically.
          </p>
          <button className="btn btn-primary btn-lg" onClick={onAddCourse}>
            📤 Upload Your First Syllabus
          </button>
        </div>
      )}

      {/* Cards View */}
      {courses.length > 0 && tab === 'cards' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 18,
        }}>
          {courses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onOpen={onOpenCourse}
              onDelete={onDeleteCourse}
              onEditSchedule={setEditingCourse}
              onColorChange={onUpdateColor}
            />
          ))}

          {/* Add course card */}
          <div
            onClick={onAddCourse}
            style={{
              border: '2px dashed var(--border)',
              borderRadius: 'var(--radius)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: 32, cursor: 'pointer', minHeight: 160,
              transition: 'all 0.15s', color: 'var(--text-muted)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>+</div>
            <div style={{ fontWeight: 600 }}>Add Course</div>
          </div>
        </div>
      )}

      {/* Schedule View */}
      {courses.length > 0 && tab === 'schedule' && (
        <WeeklySchedule
          courses={courses}
          onOpenCourse={onOpenCourse}
          onEditSchedule={setEditingCourse}
        />
      )}

      {/* Edit Schedule Modal */}
      {editingCourse && (
        <EditScheduleModal
          course={editingCourse}
          onSave={(schedule) => {
            onUpdateSchedule(editingCourse.id, schedule);
            setEditingCourse(null);
          }}
          onClose={() => setEditingCourse(null)}
        />
      )}
    </div>
  );
}
