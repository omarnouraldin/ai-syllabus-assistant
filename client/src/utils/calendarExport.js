/**
 * Generates an ICS (iCalendar) file from all courses.
 * Can be imported into Google Calendar, Apple Calendar, Outlook, etc.
 */

function pad(n) { return String(n).padStart(2, '0'); }

function toICSDate(dateStr) {
  if (!dateStr) return null;
  // dateStr is YYYY-MM-DD
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}`;
}

function toICSDateTime(dateStr, timeStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T12:00:00');
  const base = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}`;
  if (!timeStr) return `${base}T120000`;

  // Parse time like "10:00", "10:00 AM", "14:30"
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return `${base}T120000`;
  let h = parseInt(match[1]), m = parseInt(match[2]);
  const period = (match[3] || '').toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${base}T${pad(h)}${pad(m)}00`;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}@syllabusai`;
}

function escapeICS(str) {
  if (!str) return '';
  return str.replace(/[\\;,]/g, c => '\\' + c).replace(/\n/g, '\\n');
}

export function exportToCalendar(courses) {
  const now = new Date();
  const stamp = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}T${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}Z`;

  let events = [];

  courses.forEach(course => {
    const courseName = course.data.course_name || 'Course';
    const code = course.data.course_code ? `[${course.data.course_code}] ` : '';

    // ── Assignments ────────────────────────────────────────────────────
    (course.data.assignments || []).forEach(a => {
      if (!a.due_date) return;
      const date = toICSDate(a.due_date);
      if (!date) return;

      events.push([
        'BEGIN:VEVENT',
        `UID:${uid()}`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${date}`,
        `DTEND;VALUE=DATE:${date}`,
        `SUMMARY:${escapeICS(`${code}📝 ${a.title}`)}`,
        `DESCRIPTION:${escapeICS(`Course: ${courseName}${a.weight ? '\\nWeight: ' + a.weight : ''}${a.description ? '\\n' + a.description : ''}`)}`,
        'CATEGORIES:ASSIGNMENT',
        'END:VEVENT',
      ].join('\r\n'));
    });

    // ── Exams ──────────────────────────────────────────────────────────
    (course.data.exams || []).forEach(e => {
      if (!e.date) return;
      const dtStart = toICSDateTime(e.date, e.time);
      if (!dtStart) return;

      const examLabel = e.type === 'Final' ? '🎓' : e.type === 'Quiz' ? '📋' : '📝';
      const title = e.title || e.type;

      events.push([
        'BEGIN:VEVENT',
        `UID:${uid()}`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtStart}`,
        `SUMMARY:${escapeICS(`${code}${examLabel} ${title}`)}`,
        `DESCRIPTION:${escapeICS(`Course: ${courseName}${e.weight ? '\\nWeight: ' + e.weight : ''}${e.location ? '\\nLocation: ' + e.location : ''}${e.topics?.length ? '\\nTopics: ' + e.topics.join(', ') : ''}`)}`,
        `LOCATION:${escapeICS(e.location || '')}`,
        'CATEGORIES:EXAM',
        'END:VEVENT',
      ].join('\r\n'));
    });

    // ── Important Dates ────────────────────────────────────────────────
    (course.data.important_dates || []).forEach(d => {
      if (!d.date) return;
      const date = toICSDate(d.date);
      if (!date) return;

      events.push([
        'BEGIN:VEVENT',
        `UID:${uid()}`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${date}`,
        `DTEND;VALUE=DATE:${date}`,
        `SUMMARY:${escapeICS(`${code}📅 ${d.event}`)}`,
        `DESCRIPTION:${escapeICS(`Course: ${courseName}`)}`,
        'CATEGORIES:IMPORTANT',
        'END:VEVENT',
      ].join('\r\n'));
    });
  });

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AI Syllabus Assistant//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:AI Syllabus Assistant',
    'X-WR-TIMEZONE:UTC',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  // Trigger download
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'syllabus-deadlines.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
