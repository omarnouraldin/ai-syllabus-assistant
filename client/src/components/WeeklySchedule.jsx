// ── Time helpers ──────────────────────────────────────────────────────────────
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const START_HOUR = 7;   // 7 AM
const END_HOUR   = 21;  // 9 PM
const PX_PER_HOUR = 64; // pixels per hour in the grid

function timeToMinutes(timeStr) {
  if (!timeStr) return null;
  // Handles "10:00", "10:00 AM", "14:30", "2:30 PM"
  const cleaned = timeStr.trim().toUpperCase();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (!match) return null;

  let hours = parseInt(match[1]);
  const mins = parseInt(match[2]);
  const period = match[3];

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + mins;
}

function minutesToLabel(totalMins) {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}${m > 0 ? ':' + String(m).padStart(2,'0') : ''} ${period}`;
}

// ── Build per-day events from all courses ────────────────────────────────────
function buildEvents(courses) {
  const byDay = {};
  DAY_NAMES.forEach(d => { byDay[d] = []; });

  courses.forEach(course => {
    const sched = course.schedule;
    if (!sched?.days?.length) return;

    const startMins = timeToMinutes(sched.start_time);
    const endMins   = timeToMinutes(sched.end_time);

    sched.days.forEach(day => {
      // Normalize: "Mon" → "Monday"
      const normalized = DAY_NAMES.find(d =>
        d.toLowerCase().startsWith(day.toLowerCase().slice(0,3))
      );
      if (!normalized) return;

      byDay[normalized].push({
        courseId: course.id,
        courseName: course.data.course_name || 'Unnamed',
        courseCode: course.data.course_code || '',
        color: course.color,
        location: sched.location,
        startMins: startMins ?? (9 * 60),   // fallback: 9 AM
        endMins:   endMins   ?? (startMins ? startMins + 75 : 10 * 60 + 15),
      });
    });
  });

  return byDay;
}

// ── Single time block in the grid ────────────────────────────────────────────
function EventBlock({ event, onOpen }) {
  const top    = ((event.startMins - START_HOUR * 60) / 60) * PX_PER_HOUR;
  const height = Math.max(((event.endMins - event.startMins) / 60) * PX_PER_HOUR, 28);

  return (
    <div
      onClick={() => onOpen(event.courseId)}
      title={`${event.courseName}\n${minutesToLabel(event.startMins)} – ${minutesToLabel(event.endMins)}${event.location ? '\n📍 ' + event.location : ''}`}
      style={{
        position: 'absolute',
        top: top + 1,
        left: 2, right: 2,
        height: height - 2,
        background: `${event.color}22`,
        border: `1.5px solid ${event.color}`,
        borderLeft: `4px solid ${event.color}`,
        borderRadius: 6,
        padding: '4px 6px',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'all 0.15s',
        zIndex: 1,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `${event.color}40`; e.currentTarget.style.zIndex = 2; }}
      onMouseLeave={e => { e.currentTarget.style.background = `${event.color}22`; e.currentTarget.style.zIndex = 1; }}
    >
      {event.courseCode && (
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: event.color, letterSpacing: '0.05em' }}>
          {event.courseCode}
        </div>
      )}
      {height > 36 && (
        <div style={{
          fontSize: '0.7rem', fontWeight: 600, color: '#1e293b',
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          lineHeight: 1.3,
        }}>
          {event.courseName}
        </div>
      )}
      {height > 56 && event.location && (
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
          📍 {event.location}
        </div>
      )}
      {height > 48 && (
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 1 }}>
          {minutesToLabel(event.startMins)}–{minutesToLabel(event.endMins)}
        </div>
      )}
    </div>
  );
}

// ── Main WeeklySchedule ───────────────────────────────────────────────────────
export default function WeeklySchedule({ courses, onOpenCourse, onEditSchedule }) {
  const events = buildEvents(courses);
  const totalHeight = (END_HOUR - START_HOUR) * PX_PER_HOUR;

  // Which days actually have classes?
  const activeDays = DAY_NAMES.filter(d => events[d].length > 0);
  const displayDays = activeDays.length > 0 ? activeDays : DAY_NAMES.slice(0,5);

  // Courses with no schedule set
  const unscheduled = courses.filter(c =>
    !c.schedule?.days?.length
  );

  return (
    <div>
      {/* Unscheduled warning */}
      {unscheduled.length > 0 && (
        <div style={{
          marginBottom: 16, padding: '10px 16px',
          background: '#fef3c7', borderRadius: 'var(--radius-sm)',
          border: '1px solid #fde68a', fontSize: '0.875rem',
          display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
        }}>
          <span>⚠️ <strong>{unscheduled.length} course{unscheduled.length > 1 ? 's' : ''}</strong> not on the schedule yet:</span>
          <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {unscheduled.map(c => (
              <button key={c.id} onClick={() => onEditSchedule(c)}
                style={{
                  border: 'none', background: '#fde68a', borderRadius: 4,
                  padding: '2px 10px', cursor: 'pointer', fontWeight: 600,
                  fontSize: '0.8rem', color: '#92400e',
                }}>
                {c.data.course_code || c.data.course_name?.split(' ')[0]} + Add Time
              </button>
            ))}
          </span>
        </div>
      )}

      {/* Grid container */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 560 }}>

            {/* Day headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `56px repeat(${displayDays.length}, 1fr)`,
              borderBottom: '1px solid var(--border)',
              background: 'var(--surface-2)',
              position: 'sticky', top: 0, zIndex: 5,
            }}>
              <div /> {/* Time gutter */}
              {displayDays.map((day, i) => (
                <div key={day} style={{
                  padding: '10px 6px', textAlign: 'center',
                  fontWeight: 700, fontSize: '0.8rem',
                  borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
                  color: 'var(--text)',
                }}>
                  {DAY_SHORT[DAY_NAMES.indexOf(day)]}
                </div>
              ))}
            </div>

            {/* Grid body */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `56px repeat(${displayDays.length}, 1fr)`,
              position: 'relative',
            }}>

              {/* Time labels column */}
              <div style={{ position: 'relative', height: totalHeight }}>
                {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    top: i * PX_PER_HOUR - 8,
                    right: 8,
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    userSelect: 'none',
                  }}>
                    {minutesToLabel((START_HOUR + i) * 60)}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {displayDays.map((day, i) => (
                <div key={day} style={{
                  position: 'relative', height: totalHeight,
                  borderLeft: '1px solid var(--border)',
                }}>
                  {/* Hour grid lines */}
                  {Array.from({ length: END_HOUR - START_HOUR }, (_, j) => (
                    <div key={j} style={{
                      position: 'absolute', top: j * PX_PER_HOUR, left: 0, right: 0,
                      borderTop: '1px solid var(--border)',
                    }} />
                  ))}

                  {/* Events */}
                  {events[day].map((ev, k) => (
                    <EventBlock key={k} event={ev} onOpen={onOpenCourse} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      {courses.length > 0 && (
        <div style={{ marginTop: 14, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {courses.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: c.color, flexShrink: 0 }} />
              <span style={{ fontWeight: 600 }}>{c.data.course_code || c.data.course_name?.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
