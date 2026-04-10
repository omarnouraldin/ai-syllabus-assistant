import { useState } from 'react';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function EditScheduleModal({ course, onSave, onClose }) {
  const s = course.schedule || {};

  const [days, setDays] = useState(s.days || []);
  const [startTime, setStartTime] = useState(s.start_time || '');
  const [endTime, setEndTime] = useState(s.end_time || '');
  const [location, setLocation] = useState(s.location || '');

  const toggleDay = (day) => {
    setDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSave = () => {
    onSave({
      days,
      start_time: startTime || null,
      end_time: endTime || null,
      location: location || null,
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          zIndex: 50, backdropFilter: 'blur(2px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        zIndex: 51, width: '90%', maxWidth: 440,
        background: 'white', borderRadius: 'var(--radius)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: `${course.color}10`,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>📅 Edit Schedule</div>
            <div className="text-xs text-muted mt-1">
              {course.data.course_code && `${course.data.course_code} · `}
              {course.data.course_name}
            </div>
          </div>
          <button onClick={onClose} style={{
            border: 'none', background: 'transparent', cursor: 'pointer',
            fontSize: '1.2rem', color: 'var(--text-muted)', lineHeight: 1,
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>

          {/* Days of week */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontWeight: 600, fontSize: '0.875rem', display: 'block', marginBottom: 10 }}>
              Class Days
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ALL_DAYS.map(day => {
                const selected = days.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    style={{
                      padding: '6px 14px', border: 'none', borderRadius: 20,
                      cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                      transition: 'all 0.15s',
                      background: selected ? course.color : 'var(--surface-2)',
                      color: selected ? 'white' : 'var(--text-muted)',
                    }}
                  >
                    {day.slice(0,3)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Times */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            <div>
              <label style={{ fontWeight: 600, fontSize: '0.875rem', display: 'block', marginBottom: 6 }}>
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 600, fontSize: '0.875rem', display: 'block', marginBottom: 6 }}>
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Location */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontWeight: 600, fontSize: '0.875rem', display: 'block', marginBottom: 6 }}>
              Location / Room
            </label>
            <input
              type="text"
              placeholder="e.g. Room 204, Building A, or Online"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              style={{ flex: 1, background: course.color }}
            >
              Save Schedule
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
