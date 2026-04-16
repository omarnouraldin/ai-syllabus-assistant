import { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase.js';
import AuthPage from './components/AuthPage.jsx';
import CoursesHome from './components/CoursesHome.jsx';
import UploadPage from './components/UploadPage.jsx';
import Dashboard from './components/Dashboard.jsx';
import ChatInterface from './components/ChatInterface.jsx';
import GradeCalculator from './components/GradeCalculator.jsx';
import { exportToCalendar } from './utils/calendarExport.js';

const THEME_KEY = 'asa_theme';

const COURSE_COLORS = [
  '#6366f1','#ec4899','#10b981','#f59e0b',
  '#3b82f6','#8b5cf6','#ef4444','#14b8a6',
];

function generateId() {
  return `course_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
}

function checkDeadlines(courses, daysAhead = 2) {
  if (Notification.permission !== 'granted') return;
  const today = new Date(); today.setHours(0,0,0,0);
  courses.forEach(course => {
    [...(course.data.assignments||[]).map(a=>({title:a.title,date:a.due_date})),
     ...(course.data.exams||[]).map(e=>({title:e.title||e.type,date:e.date}))]
    .filter(i=>i.date)
    .forEach(item => {
      const diff = Math.ceil((new Date(item.date+'T00:00:00') - today) / 86400000);
      if (diff >= 0 && diff <= daysAhead) {
        const label = diff===0?'TODAY':diff===1?'tomorrow':`in ${diff} days`;
        new Notification(`📋 ${course.data.course_code||course.data.course_name}`,{
          body:`${item.title} is due ${label}`, icon:'/favicon.svg'
        });
      }
    });
  });
}

export default function App() {
  const [session, setSession]           = useState(undefined); // undefined = loading
  const [courses, setCourses]           = useState([]);
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [view, setView]                 = useState('home');
  const [darkMode, setDarkMode]         = useState(() => localStorage.getItem(THEME_KEY) === 'dark');
  const [saving, setSaving]             = useState(false);

  // ── Theme ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // ── Auth listener ────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Load courses from Supabase when logged in ─────────────────────────────────
  useEffect(() => {
    if (!session) { setCourses([]); return; }
    loadCourses();
  }, [session]);

  const loadCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('added_at', { ascending: true });
    if (error) { console.error('Load error:', error); return; }
    const mapped = (data || []).map(row => ({
      id: row.id,
      color: row.color,
      addedAt: row.added_at,
      data: row.data,
      rawText: row.raw_text,
      schedule: row.schedule || { days:[], start_time:null, end_time:null, location:null },
    }));
    setCourses(mapped);
    checkDeadlines(mapped);
  };

  // ── Persist a single course to Supabase ───────────────────────────────────────
  const upsertCourse = useCallback(async (course) => {
    if (!session) return;
    setSaving(true);
    const { error } = await supabase.from('courses').upsert({
      id: course.id,
      user_id: session.user.id,
      color: course.color,
      added_at: course.addedAt,
      data: course.data,
      raw_text: course.rawText,
      schedule: course.schedule,
    });
    if (error) console.error('Save error:', error);
    setSaving(false);
  }, [session]);

  const deleteCourseDb = useCallback(async (id) => {
    if (!session) return;
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) console.error('Delete error:', error);
  }, [session]);

  // ── Course actions ────────────────────────────────────────────────────────────
  const handleSyllabusLoaded = (data, rawText) => {
    const newCourse = {
      id: generateId(),
      color: COURSE_COLORS[courses.length % COURSE_COLORS.length],
      addedAt: new Date().toISOString(),
      data, rawText,
      schedule: data.class_schedule || { days:[], start_time:null, end_time:null, location:null },
    };
    setCourses(prev => [...prev, newCourse]);
    upsertCourse(newCourse);
    setActiveCourseId(newCourse.id);
    setView('dashboard');
  };

  const handleUpdateData = (id, data) => {
    setCourses(p => {
      const next = p.map(c => c.id===id ? {...c,data} : c);
      upsertCourse(next.find(c=>c.id===id));
      return next;
    });
  };

  const handleUpdateSchedule = (id, schedule) => {
    setCourses(p => {
      const next = p.map(c => c.id===id ? {...c,schedule} : c);
      upsertCourse(next.find(c=>c.id===id));
      return next;
    });
  };

  const handleUpdateColor = (id, color) => {
    setCourses(p => {
      const next = p.map(c => c.id===id ? {...c,color} : c);
      upsertCourse(next.find(c=>c.id===id));
      return next;
    });
  };

  const handleDeleteCourse = (id) => {
    setCourses(p => p.filter(c => c.id!==id));
    deleteCourseDb(id);
    setView('home');
    setActiveCourseId(null);
  };

  const handleOpenCourse = (id) => { setActiveCourseId(id); setView('dashboard'); };

  const handleToggleNotifications = async () => {
    if (Notification.permission === 'granted') {
      checkDeadlines(courses, 3);
      alert('🔔 Checked! Notifications fired for deadlines in the next 3 days.');
    } else if (Notification.permission !== 'denied') {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') { checkDeadlines(courses, 3); }
    } else {
      alert('Notifications are blocked. Please enable them in your browser settings.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCourses([]);
    setView('home');
    setActiveCourseId(null);
  };

  const navTabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'chat',      label: '💬 Ask AI' },
    { id: 'grades',    label: '🎯 Grades' },
  ];

  // ── Loading state (checking auth) ─────────────────────────────────────────────
  if (session === undefined) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>📋</div>
          <div className="text-muted">Loading...</div>
        </div>
      </div>
    );
  }

  // ── Not logged in ─────────────────────────────────────────────────────────────
  if (!session) return <AuthPage />;

  // ── App ───────────────────────────────────────────────────────────────────────
  const activeCourse = courses.find(c => c.id === activeCourseId) || null;

  return (
    <div className="app">
      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-brand" onClick={() => setView('home')}>
            <img src="/logo.png" alt="Logo" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
            <span>AI Syllabus Assistant</span>
          </div>

          {activeCourse && view !== 'home' && view !== 'upload' && (
            <div className="navbar-tabs">
              <button className="tab-btn" onClick={() => setView('home')}
                style={{ color:'var(--text-muted)', marginRight:4 }}>← All Courses</button>
              {navTabs.map(tab => (
                <button key={tab.id}
                  className={`tab-btn ${view===tab.id?'active':''}`}
                  onClick={() => setView(tab.id)}>
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {saving && (
              <span className="text-xs text-muted hide-mobile" style={{ display:'flex', alignItems:'center', gap:4 }}>
                <span className="spinner spinner-dark" style={{ width:12, height:12 }} /> Saving…
              </span>
            )}
            {view==='home' && courses.length>0 && (
              <button onClick={() => exportToCalendar(courses)}
                className="btn btn-secondary btn-sm hide-mobile" title="Export to calendar">
                📅 Export
              </button>
            )}
            {courses.length>0 && (
              <button onClick={handleToggleNotifications}
                className="btn btn-secondary btn-sm hide-mobile" title="Check notifications">
                🔔
              </button>
            )}
            <button onClick={() => setDarkMode(d => !d)}
              className="btn btn-secondary btn-sm"
              title={darkMode ? 'Light mode' : 'Dark mode'}
              style={{ fontSize:'1rem', padding:'6px 10px' }}>
              {darkMode ? '☀️' : '🌙'}
            </button>

            {/* User menu */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:4 }}>
              <span className="text-xs text-muted hide-mobile"
                style={{ maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {session.user.email}
              </span>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Sign out">
                ↪ Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main ──────────────────────────────────────────────────── */}
      <main style={{ flex:1, padding:'24px 0' }}>
        {view==='home' && (
          <CoursesHome courses={courses} onOpenCourse={handleOpenCourse}
            onAddCourse={() => setView('upload')} onDeleteCourse={handleDeleteCourse}
            onUpdateSchedule={handleUpdateSchedule} onUpdateColor={handleUpdateColor} />
        )}
        {view==='upload' && (
          <UploadPage onSyllabusLoaded={handleSyllabusLoaded} onBack={() => setView('home')} />
        )}
        {view==='dashboard' && activeCourse && (
          <Dashboard data={activeCourse.data} color={activeCourse.color}
            schedule={activeCourse.schedule}
            onChat={() => setView('chat')} onGrades={() => setView('grades')}
            onDelete={() => handleDeleteCourse(activeCourse.id)}
            onUpdateSchedule={s => handleUpdateSchedule(activeCourse.id, s)}
            onUpdateData={d => handleUpdateData(activeCourse.id, d)} />
        )}
        {view==='chat' && activeCourse && (
          <ChatInterface syllabusData={activeCourse.data} rawText={activeCourse.rawText} />
        )}
        {view==='grades' && activeCourse && (
          <GradeCalculator data={activeCourse.data} />
        )}
      </main>
    </div>
  );
}
