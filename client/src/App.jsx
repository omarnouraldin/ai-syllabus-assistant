import { useState, useEffect } from 'react';
import ApiKeySetup from './components/ApiKeySetup.jsx';
import CoursesHome from './components/CoursesHome.jsx';
import UploadPage from './components/UploadPage.jsx';
import Dashboard from './components/Dashboard.jsx';
import ChatInterface from './components/ChatInterface.jsx';
import GradeCalculator from './components/GradeCalculator.jsx';
import { exportToCalendar } from './utils/calendarExport.js';

const STORAGE_KEY = 'asa_courses_v2';
const THEME_KEY   = 'asa_theme';

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
  const [hasApiKey, setHasApiKey]       = useState(!!localStorage.getItem('anthropic_api_key'));
  const [courses, setCourses]           = useState([]);
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [view, setView]                 = useState('home');
  const [darkMode, setDarkMode]         = useState(() => localStorage.getItem(THEME_KEY) === 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) { const p = JSON.parse(saved); setCourses(p); checkDeadlines(p); }
    } catch(e) { console.warn(e); }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  }, [courses]);

  const activeCourse = courses.find(c => c.id === activeCourseId) || null;

  const handleSyllabusLoaded = (data, rawText) => {
    const newCourse = {
      id: generateId(),
      color: COURSE_COLORS[courses.length % COURSE_COLORS.length],
      addedAt: new Date().toISOString(),
      data, rawText,
      schedule: data.class_schedule || { days:[], start_time:null, end_time:null, location:null },
    };
    setCourses(prev => [...prev, newCourse]);
    setActiveCourseId(newCourse.id);
    setView('dashboard');
  };

  const handleUpdateData     = (id, data)     => setCourses(p => p.map(c => c.id===id ? {...c,data} : c));
  const handleUpdateSchedule = (id, schedule) => setCourses(p => p.map(c => c.id===id ? {...c,schedule} : c));
  const handleUpdateColor    = (id, color)    => setCourses(p => p.map(c => c.id===id ? {...c,color} : c));
  const handleDeleteCourse   = (id) => { setCourses(p => p.filter(c => c.id!==id)); setView('home'); setActiveCourseId(null); };
  const handleOpenCourse     = (id) => { setActiveCourseId(id); setView('dashboard'); };

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

  const handleChangeApiKey = () => {
    if (confirm('Change your API key?')) {
      localStorage.removeItem('anthropic_api_key');
      setHasApiKey(false);
    }
  };

  // Show API key setup if no key
  if (!hasApiKey) {
    return <ApiKeySetup onKeySet={() => setHasApiKey(true)} />;
  }

  const navTabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'chat',      label: '💬 Ask AI' },
    { id: 'grades',    label: '🎯 Grades' },
  ];

  return (
    <div className="app">
      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-brand" onClick={() => setView('home')}>
            <span>📋</span>
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
            <button onClick={handleChangeApiKey}
              className="btn btn-secondary btn-sm hide-mobile" title="Change API key">
              🔑
            </button>
            <div className={`navbar-status ${activeCourse?'ready':''}`}>
              {activeCourse && view!=='home'
                ? <span style={{display:'flex',alignItems:'center',gap:5}}>
                    <span style={{width:9,height:9,borderRadius:'50%',background:activeCourse.color,display:'inline-block'}}/>
                    {activeCourse.data.course_code||activeCourse.data.course_name?.split(' ').slice(0,2).join(' ')}
                  </span>
                : `${courses.length} course${courses.length!==1?'s':''}`
              }
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
