import React, { useState } from 'react';
import { AppState, Challenge } from '../types';
import { sound } from '../audio';

interface ChallengesViewProps {
  state: AppState;
  onUpdateState: (fn: (prev: AppState) => AppState) => void;
  onNavigate: (view: string) => void;
}

export const ChallengesView: React.FC<ChallengesViewProps> = ({ state, onUpdateState, onNavigate }) => {
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>(state.challenges[0]?.id || 'c_3day');
  const [reflectionInput, setReflectionInput] = useState('');
  const [savedFeedback, setSavedFeedback] = useState('');

  const challenge = state.challenges.find(c => c.id === selectedChallengeId) || state.challenges[0];
  const completedCount = challenge.completedDays.length;
  const progressPercent = Math.round((completedCount / challenge.totalDays) * 100);

  const toggleDayCompletion = (dayNum: number) => {
    onUpdateState(prev => {
      return {
        ...prev,
        challenges: prev.challenges.map(ch => {
          if (ch.id !== challenge.id) return ch;
          const isDone = ch.completedDays.includes(dayNum);
          const nextCompleted = isDone
            ? ch.completedDays.filter(d => d !== dayNum)
            : [...ch.completedDays, dayNum];
          return { ...ch, completedDays: nextCompleted };
        }),
      };
    });

    if (!challenge.completedDays.includes(dayNum)) {
      sound.playChime(528, 2.0);
    }
  };

  const handleSaveReflection = (dayNum: number, taskTitle: string) => {
    if (!reflectionInput.trim()) return;

    onUpdateState(prev => ({
      ...prev,
      journal: [
        {
          id: Date.now(),
          type: 'Challenge Reflection',
          tags: `${challenge.title}, Day ${dayNum}`,
          text: `[${challenge.title} - Day ${dayNum}: ${taskTitle}]\n${reflectionInput.trim()}`,
          at: new Date().toLocaleString(),
        },
        ...prev.journal,
      ],
      challenges: prev.challenges.map(ch => {
        if (ch.id !== challenge.id) return ch;
        const nextCompleted = ch.completedDays.includes(dayNum) ? ch.completedDays : [...ch.completedDays, dayNum];
        return {
          ...ch,
          completedDays: nextCompleted,
          notes: { ...ch.notes, [dayNum]: reflectionInput.trim() },
        };
      }),
    }));

    setSavedFeedback(`Day ${dayNum} reflection logged and saved to your Journal!`);
    sound.playChime(528, 2.5);
    setReflectionInput('');
    setTimeout(() => setSavedFeedback(''), 3000);
  };

  return (
    <>
      <div className="card in">
        <h2>🔥 Manifestation Challenges</h2>
        <p className="small" style={{ marginBottom: 14 }}>
          Structured multi-day journeys to rewire subconscious defaults, cultivate emotional resilience, and build unstoppable momentum.
        </p>

        {/* Challenge selector pills */}
        <div className="row">
          {state.challenges.map(c => {
            const isSelected = c.id === challenge.id;
            const isComplete = c.completedDays.length === c.totalDays;
            return (
              <button
                key={c.id}
                className={`btn ${isSelected ? 'p' : ''}`}
                onClick={() => {
                  setSelectedChallengeId(c.id);
                  setSavedFeedback('');
                  setReflectionInput('');
                }}
              >
                {c.title} {isComplete ? '★' : `(${c.completedDays.length}/${c.totalDays})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Challenge Details */}
      <div className="card in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <span className="eyebrow" style={{ fontSize: '0.7em' }}>Active Challenge</span>
            <h3 style={{ margin: '4px 0' }}>{challenge.title}</h3>
            <p className="small" style={{ margin: 0, opacity: 0.85 }}>{challenge.subtitle}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="num" style={{ fontSize: '1.4em' }}>{progressPercent}%</span>
            <div className="small">{completedCount} of {challenge.totalDays} Days Completed</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, margin: '14px 0', overflow: 'hidden' }}>
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--pri), #ffe68a)',
              transition: 'width 0.4s ease-out',
            }}
          />
        </div>

        {progressPercent === 100 && (
          <div className="card" style={{ background: 'rgba(255,255,255,0.08)', textAlign: 'center', padding: '16px' }}>
            <div className="orn"><span>❦</span></div>
            <h3 style={{ margin: '4px 0' }}>🎉 Challenge Completed</h3>
            <p className="small">
              You showed up consistently for yourself. Honor this discipline as proof of your capacity to create lasting change.
            </p>
          </div>
        )}

        {savedFeedback && (
          <p className="small" style={{ color: 'var(--pri)', fontWeight: 600, padding: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: 4 }}>
            {savedFeedback}
          </p>
        )}

        {/* Days List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
          {challenge.tasks.map(task => {
            const isDone = challenge.completedDays.includes(task.day);
            const savedNote = challenge.notes?.[task.day];

            return (
              <div
                key={task.day}
                className="card"
                style={{
                  margin: 0,
                  padding: '16px',
                  background: isDone ? 'color-mix(in srgb, var(--pri) 10%, var(--card))' : 'var(--card)',
                  borderColor: isDone ? 'var(--pri)' : 'rgba(0,0,0,0.1)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h4 style={{ margin: 0 }}>
                    Day {task.day}: {task.title}
                  </h4>
                  <button
                    className={`btn ${isDone ? 'p' : ''}`}
                    style={{ padding: '4px 10px', fontSize: '0.8em' }}
                    onClick={() => toggleDayCompletion(task.day)}
                  >
                    {isDone ? '✓ Completed' : 'Mark Done'}
                  </button>
                </div>

                <p className="small" style={{ margin: '6px 0 10px' }}>
                  {task.instruction}
                </p>

                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: 4, marginTop: 8 }}>
                  <span className="small" style={{ fontStyle: 'italic', display: 'block', marginBottom: 4 }}>
                    📝 Prompt: {task.reflectionPrompt}
                  </span>

                  {savedNote ? (
                    <div style={{ marginTop: 6 }}>
                      <p className="small" style={{ margin: 0, opacity: 0.9 }}>
                        <b>Your Reflection:</b> {savedNote}
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      <input
                        placeholder="Write your quick reflection for this day..."
                        value={reflectionInput}
                        onChange={e => setReflectionInput(e.target.value)}
                        style={{ flex: '1 1 220px', padding: '6px 10px', fontSize: '0.88em' }}
                      />
                      <button
                        className="btn p"
                        style={{ padding: '6px 12px', fontSize: '0.8em' }}
                        onClick={() => handleSaveReflection(task.day, task.title)}
                        disabled={!reflectionInput.trim()}
                      >
                        Save Reflection 💾
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
