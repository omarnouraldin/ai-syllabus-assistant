import { useState, useMemo } from 'react';

export default function GradeCalculator({ data }) {
  const breakdown = data?.grading?.breakdown || [];
  const scale = data?.grading?.grading_scale || [];

  // State: one score per grading item (0–100, or empty string = not yet taken)
  const [scores, setScores] = useState(
    Object.fromEntries(breakdown.map(item => [item.item, '']))
  );
  const [goalGrade, setGoalGrade] = useState(80);

  // ── Calculations ────────────────────────────────────────────────────────
  const { earned, possible, currentGrade, letterGrade } = useMemo(() => {
    let earned = 0;
    let possible = 0;

    breakdown.forEach(item => {
      const score = parseFloat(scores[item.item]);
      const weight = item.weight || 0;

      if (!isNaN(score) && score !== '') {
        earned += (score / 100) * weight;
        possible += weight;
      }
    });

    const currentGrade = possible > 0 ? (earned / possible) * 100 : null;

    // Determine letter grade from scale or default
    let letterGrade = '—';
    if (currentGrade !== null && scale.length > 0) {
      const match = [...scale].sort((a, b) => b.min - a.min).find(g => currentGrade >= g.min);
      if (match) letterGrade = match.grade;
    } else if (currentGrade !== null) {
      // Default scale
      if (currentGrade >= 90) letterGrade = 'A';
      else if (currentGrade >= 80) letterGrade = 'B';
      else if (currentGrade >= 70) letterGrade = 'C';
      else if (currentGrade >= 60) letterGrade = 'D';
      else letterGrade = 'F';
    }

    return { earned, possible, currentGrade, letterGrade };
  }, [scores, breakdown, scale]);

  // What average do I need on remaining items to hit goal?
  const { neededScore, remaining } = useMemo(() => {
    const completedWeight = breakdown.reduce((sum, item) => {
      const score = parseFloat(scores[item.item]);
      return !isNaN(score) ? sum + (item.weight || 0) : sum;
    }, 0);

    const remainingWeight = 100 - completedWeight;
    const neededPoints = goalGrade - earned;
    const neededScore = remainingWeight > 0 ? (neededPoints / remainingWeight) * 100 : null;

    const remaining = breakdown.filter(item => {
      const score = parseFloat(scores[item.item]);
      return isNaN(score) || scores[item.item] === '';
    });

    return { neededScore, remaining };
  }, [scores, earned, goalGrade, breakdown]);

  const handleScore = (item, value) => {
    const num = value === '' ? '' : Math.min(100, Math.max(0, parseFloat(value) || 0));
    setScores(prev => ({ ...prev, [item]: num }));
  };

  const getGradeColor = (grade) => {
    if (grade === null) return 'var(--primary)';
    if (grade >= 90) return '#059669';
    if (grade >= 80) return '#2563eb';
    if (grade >= 70) return '#d97706';
    if (grade >= 60) return '#ea580c';
    return '#dc2626';
  };

  if (!breakdown.length) {
    return (
      <div className="container">
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
            <h3 style={{ fontWeight: 600 }}>No Grading Info Found</h3>
            <p className="text-sm text-muted mt-2">
              The syllabus didn't include a grading breakdown. Try asking the AI chat about grades instead.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>🎯 Grade Calculator</h2>
          <p className="text-sm text-muted mt-1">
            Enter your scores to see your current grade and what you need to reach your goal.
          </p>
        </div>

        <div className="grade-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 16 }}>

          {/* Score Input */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-title">📝 Enter Your Scores (0–100)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {breakdown.map((item) => {
                const score = scores[item.item];
                const hasScore = score !== '' && !isNaN(parseFloat(score));
                return (
                  <div key={item.item}>
                    <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                      <label style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                        {item.item}
                        <span style={{ marginLeft: 8, color: 'var(--text-muted)', fontWeight: 400 }}>
                          ({item.weight}% of grade)
                        </span>
                      </label>
                      {hasScore && (
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          color: getGradeColor(parseFloat(score))
                        }}>
                          {((parseFloat(score) / 100) * item.weight).toFixed(1)} pts earned
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={score}
                        onChange={(e) => handleScore(item.item, e.target.value)}
                        placeholder="Not taken yet"
                        style={{ maxWidth: 160 }}
                      />
                      <span className="text-sm text-muted">/ 100</span>
                      {hasScore && (
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div
                            className="progress-fill"
                            style={{
                              width: `${score}%`,
                              background: getGradeColor(parseFloat(score))
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Grade */}
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="card-title" style={{ justifyContent: 'center' }}>📊 Current Grade</div>
            {currentGrade !== null ? (
              <>
                <div style={{
                  fontSize: '3rem',
                  fontWeight: 800,
                  color: getGradeColor(currentGrade),
                  lineHeight: 1.1,
                }}>
                  {letterGrade}
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: getGradeColor(currentGrade),
                  marginTop: 4,
                }}>
                  {currentGrade.toFixed(1)}%
                </div>
                <div className="text-xs text-muted mt-2">
                  Based on {possible.toFixed(0)}% of total grade
                </div>
              </>
            ) : (
              <div className="text-muted" style={{ padding: '20px 0' }}>
                Enter scores above to see your grade
              </div>
            )}
          </div>

          {/* Goal Calculator */}
          <div className="card">
            <div className="card-title">🎯 Goal Calculator</div>
            <div style={{ marginBottom: 14 }}>
              <label className="text-sm font-semibold" style={{ display: 'block', marginBottom: 6 }}>
                My target grade: {goalGrade}%
              </label>
              <input
                type="range"
                min="50"
                max="100"
                value={goalGrade}
                onChange={(e) => setGoalGrade(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  height: 6,
                  borderRadius: 3,
                  appearance: 'none',
                  background: `linear-gradient(to right, var(--primary) ${(goalGrade - 50) / 50 * 100}%, var(--border) 0)`,
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
              />
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {neededScore !== null && remaining.length > 0 ? (
              <div style={{
                padding: '12px 14px',
                background: neededScore > 100 ? '#fee2e2' : neededScore > 85 ? '#fef3c7' : '#d1fae5',
                borderRadius: 'var(--radius-sm)',
              }}>
                {neededScore > 100 ? (
                  <div>
                    <div style={{ fontWeight: 700, color: '#dc2626' }}>⚠️ Not possible</div>
                    <div className="text-sm" style={{ color: '#991b1b', marginTop: 4 }}>
                      You'd need {neededScore.toFixed(1)}% on remaining work, which exceeds 100%.
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 700, color: neededScore > 85 ? '#92400e' : '#065f46' }}>
                      Need avg: {neededScore.toFixed(1)}% on remaining work
                    </div>
                    <div className="text-sm text-muted mt-1">
                      Remaining: {remaining.map(r => r.item).join(', ')}
                    </div>
                  </div>
                )}
              </div>
            ) : remaining.length === 0 ? (
              <div style={{ padding: '12px 14px', background: '#d1fae5', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontWeight: 700, color: '#065f46' }}>✓ All grades entered!</div>
                <div className="text-sm" style={{ color: '#065f46', marginTop: 4 }}>
                  Final grade: {currentGrade?.toFixed(1)}% ({letterGrade})
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted">Enter some scores first to see what you need.</div>
            )}
          </div>

          {/* Grading Scale */}
          {(scale.length > 0 || true) && (
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <div className="card-title">📋 Grading Scale</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(scale.length > 0 ? scale : [
                  { grade: 'A', min: 90 }, { grade: 'B', min: 80 },
                  { grade: 'C', min: 70 }, { grade: 'D', min: 60 }, { grade: 'F', min: 0 },
                ]).map((g, i, arr) => {
                  const max = i === 0 ? 100 : arr[i - 1].min - 1;
                  const isCurrent = currentGrade !== null && currentGrade >= g.min && currentGrade <= max;
                  return (
                    <div key={g.grade} style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-sm)',
                      background: isCurrent ? 'var(--primary)' : 'var(--surface-2)',
                      color: isCurrent ? 'white' : 'var(--text)',
                      fontWeight: isCurrent ? 700 : 500,
                      fontSize: '0.875rem',
                      border: `1.5px solid ${isCurrent ? 'var(--primary)' : 'var(--border)'}`,
                    }}>
                      {g.grade}: {g.min}%{i === 0 ? '+' : `–${max}%`}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
