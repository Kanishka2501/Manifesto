import React, { useState } from 'react';
import { AppState, PracticeRoutine } from '../types';
import { sound } from '../audio';
import { toast } from '../toast';

interface PracticeBuilderViewProps {
  state: AppState;
  onUpdateState: (fn: (prev: AppState) => AppState) => void;
  onNavigate: (view: string) => void;
}

export const PracticeBuilderView: React.FC<PracticeBuilderViewProps> = ({ state, onUpdateState, onNavigate }) => {
  const [goal, setGoal] = useState('');
  const [availableTime, setAvailableTime] = useState('15 minutes');
  const [preferences, setPreferences] = useState('Affirmations, Visualization, Mindful Breathing');
  const [intensity, setIntensity] = useState('Gentle & Sustainable');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const routine = state.routine;

  const handleGenerate = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/practice-routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: goal.trim() || 'Cultivate peace, abundance, and aligned action',
          availableTime,
          preferences,
          intensity,
        }),
      });

      const body = await res.json();
      if (!res.ok || !body.routine) {
        setErrorMsg(body.error || 'Failed to design custom routine. Please try again.');
        return;
      }

      onUpdateState(prev => ({
        ...prev,
        routine: body.routine,
      }));
      sound.playChime(528, 2.5);
    } catch (e) {
      setErrorMsg('Network error connecting to AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRoutineField = (field: keyof PracticeRoutine, val: any) => {
    onUpdateState(prev => {
      if (!prev.routine) return prev;
      return {
        ...prev,
        routine: { ...prev.routine, [field]: val },
      };
    });
  };

  return (
    <>
      <div className="card in">
        <h2>🌿 Build My Practice Routine</h2>
        <p className="small" style={{ marginBottom: 14 }}>
          Design a custom daily ritual calibrated to your exact schedule, nervous system, and manifestation style.
        </p>

        <div className="row">
          <input
            placeholder="What is your core focus or intention right now?"
            value={goal}
            onChange={e => setGoal(e.target.value)}
            style={{ flex: '2 1 280px' }}
          />
          <select value={availableTime} onChange={e => setAvailableTime(e.target.value)}>
            <option>5 minutes total (Micro-practice)</option>
            <option>10 minutes total (Essential)</option>
            <option>15 minutes total (Balanced)</option>
            <option>25 minutes total (Immersive)</option>
          </select>
        </div>

        <div className="row">
          <select value={intensity} onChange={e => setIntensity(e.target.value)}>
            <option>Gentle &amp; Sustainable</option>
            <option>Deep &amp; Reflective</option>
            <option>Ambitious &amp; Action-Oriented</option>
          </select>
          <input
            placeholder="Preferred techniques (e.g. Scripting, 369, SATS, Mirror Work)"
            value={preferences}
            onChange={e => setPreferences(e.target.value)}
            style={{ flex: '2 1 280px' }}
          />
        </div>

        <div className="acts" style={{ marginTop: 12 }}>
          <button className="btn p" onClick={handleGenerate} disabled={loading}>
            {loading ? 'Designing Your Daily Routine… ✨' : '✨ Generate My Personalized Routine'}
          </button>
        </div>

        {errorMsg && (
          <p className="small" style={{ color: '#ff4fa3', marginTop: 10 }}>{errorMsg}</p>
        )}
      </div>

      {routine && (
        <div className="card in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <span className="eyebrow" style={{ fontSize: '0.7em' }}>Your Personalized Daily Architecture</span>
              <h3 style={{ margin: '4px 0' }}>{routine.routineName || 'Daily Sacred Cadence'}</h3>
            </div>
            <button
              className="btn"
              onClick={() => {
                const text = `ROUTINE: ${routine.routineName}\n\n🌅 MORNING (${routine.morning.duration}): ${routine.morning.practice}\n${routine.morning.details}\n\n☀️ AFTERNOON (${routine.afternoon.duration}): ${routine.afternoon.practice}\n${routine.afternoon.details}\n\n🌙 EVENING (${routine.evening.duration}): ${routine.evening.practice}\n${routine.evening.details}\n\n👣 DAILY ACTION: ${routine.dailyAction}\n\n💫 MANTRA: "${routine.mantra}"`;
                navigator.clipboard?.writeText(text);
                toast('Routine copied to clipboard!');
              }}
            >
              📋 Copy Complete Routine
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
            {/* Morning */}
            <div className="card" style={{ margin: 0, padding: '16px', background: 'rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>🌅 Morning Awakening</h4>
                <span className="small">{routine.morning.duration}</span>
              </div>
              <p style={{ fontWeight: 600, margin: '6px 0 2px' }}>{routine.morning.practice}</p>
              <p className="small" style={{ margin: 0 }}>{routine.morning.details}</p>
            </div>

            {/* Afternoon */}
            <div className="card" style={{ margin: 0, padding: '16px', background: 'rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>☀️ Midday Grounding</h4>
                <span className="small">{routine.afternoon.duration}</span>
              </div>
              <p style={{ fontWeight: 600, margin: '6px 0 2px' }}>{routine.afternoon.practice}</p>
              <p className="small" style={{ margin: 0 }}>{routine.afternoon.details}</p>
            </div>

            {/* Evening */}
            <div className="card" style={{ margin: 0, padding: '16px', background: 'rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>🌙 Evening Surrender &amp; Reflection</h4>
                <span className="small">{routine.evening.duration}</span>
              </div>
              <p style={{ fontWeight: 600, margin: '6px 0 2px' }}>{routine.evening.practice}</p>
              <p className="small" style={{ margin: 0 }}>{routine.evening.details}</p>
            </div>

            {/* Daily Aligned Action */}
            <div className="card" style={{ margin: 0, padding: '16px', background: 'rgba(255,255,255,0.06)' }}>
              <h4 style={{ margin: '0 0 4px' }}>👣 Daily Aligned Action Principle</h4>
              <p className="small" style={{ margin: 0 }}>{routine.dailyAction}</p>
            </div>

            {/* Daily Mantra */}
            <div className="card" style={{ margin: 0, padding: '16px', textAlign: 'center', background: 'color-mix(in srgb, var(--pri) 12%, var(--card))' }}>
              <span className="eyebrow" style={{ fontSize: '0.7em' }}>Daily Anchor Mantra</span>
              <p style={{ fontSize: '1.2em', fontStyle: 'italic', margin: '6px 0 0' }}>"{routine.mantra}"</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
