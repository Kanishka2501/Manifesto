import React from 'react';
import { AppState } from '../types';
import { calcStreak, getActiveManifestation } from '../storage';
import { sound } from '../audio';
import { toast } from '../toast';

interface PersonalSpaceViewProps {
  state: AppState;
  onNavigate: (view: string) => void;
  onOpenAuth: () => void;
}

export const PersonalSpaceView: React.FC<PersonalSpaceViewProps> = ({ state, onNavigate, onOpenAuth }) => {
  const streak = calcStreak(state.days);
  const active = getActiveManifestation(state);
  const totalPractices = Object.values(state.counts).reduce((a, b) => a + b, 0);

  return (
    <>
      <div className="card in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <span className="eyebrow" style={{ fontSize: '0.7em' }}>Private Sanctuary</span>
            <h2 style={{ margin: '4px 0' }}>
              {state.user?.loggedIn ? `${state.user.name}'s Sanctuary` : 'Your Personal Space'}
            </h2>
            <p className="small" style={{ margin: 0, opacity: 0.85 }}>
              A high-level view of your intentions, daily consistency, and sacred creations.
            </p>
          </div>
          <div className="acts" style={{ margin: 0 }}>
            <button className="btn" onClick={onOpenAuth}>
              {state.user?.loggedIn ? `👤 ${state.user.name}` : '👤 Account & Sync'}
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="tri" style={{ marginTop: 14 }}>
          <div className="card" style={{ margin: 0, padding: '16px' }}>
            <div className="num">🔥 {streak}</div>
            <h4 style={{ margin: '4px 0 2px' }}>Day Streak</h4>
            <span className="small">Daily dedication</span>
          </div>
          <div className="card" style={{ margin: 0, padding: '16px' }}>
            <div className="num">✨ {state.saved.length}</div>
            <h4 style={{ margin: '4px 0 2px' }}>Manifestations</h4>
            <span className="small">Intentions saved</span>
          </div>
          <div className="card" style={{ margin: 0, padding: '16px' }}>
            <div className="num">📖 {state.journal.length}</div>
            <h4 style={{ margin: '4px 0 2px' }}>Journal Entries</h4>
            <span className="small">Reflections logged</span>
          </div>
          <div className="card" style={{ margin: 0, padding: '16px' }}>
            <div className="num">🕯️ {totalPractices}</div>
            <h4 style={{ margin: '4px 0 2px' }}>Tool Sessions</h4>
            <span className="small">Focus methods completed</span>
          </div>
        </div>
      </div>

      {/* Active Manifestation Spotlight */}
      <div className="card in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>🎯 Active Manifestation</h3>
          <button className="btn" onClick={() => onNavigate('today')}>Manage ➔</button>
        </div>

        {active ? (
          <div>
            <h4 style={{ margin: '4px 0', fontSize: '1.2em' }}>
              {active.customName || active.data.title}
            </h4>
            <p className="small" style={{ fontStyle: 'italic', margin: '4px 0 10px' }}>
              "{active.data.affirmations?.[0]}"
            </p>
            <div className="acts">
              <button className="btn p" onClick={() => onNavigate('today')}>
                Begin Today's Practice ☀️
              </button>
              <button
                className="btn"
                onClick={() => {
                  sound.speak(active.data.manifestation_script);
                }}
              >
                🔊 Listen to Script
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="small">No active manifestation set yet.</p>
            <button className="btn p" onClick={() => onNavigate('create')}>
              ✨ Create My First Manifestation
            </button>
          </div>
        )}
      </div>

      {/* Favorite Affirmations Sanctuary */}
      <div className="card in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>💫 Favorite Affirmations</h3>
          <button className="btn" onClick={() => onNavigate('tools')}>Add More ➔</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {state.favoriteAffirmations.map((aff, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 4,
              }}
            >
              <span style={{ fontStyle: 'italic', fontSize: '1.05em' }}>"{aff}"</span>
              <div className="acts" style={{ margin: 0 }}>
                <button
                  className="btn"
                  style={{ padding: '2px 8px', fontSize: '0.74em' }}
                  onClick={() => sound.speak(aff)}
                >
                  🔊
                </button>
                <button
                  className="btn"
                  style={{ padding: '2px 8px', fontSize: '0.74em' }}
                  onClick={() => {
                    navigator.clipboard?.writeText(aff);
                    toast('Copied affirmation!');
                  }}
                >
                  📋
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vision Board & Challenges Quick Access */}
      <div className="row">
        <div className="card" style={{ flex: '1 1 280px', margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>🖼️ Vision Boards</h3>
            <button className="btn" onClick={() => onNavigate('vision_board')}>Open ➔</button>
          </div>
          <p className="small">
            <b>{state.visionBoards.length}</b> board(s) · Current board: "{state.visionBoards[0]?.title}" ({state.visionBoards[0]?.items.length} items)
          </p>
        </div>

        <div className="card" style={{ flex: '1 1 280px', margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>🔥 Challenges</h3>
            <button className="btn" onClick={() => onNavigate('challenges')}>View ➔</button>
          </div>
          <p className="small">
            <b>5</b> transformational challenges available · 3-Day, 7-Day, 21-Day, and 30-Day tracks.
          </p>
        </div>
      </div>

      {/* Deep Tools Quick Actions */}
      <div className="card in">
        <h3 style={{ margin: '0 0 10px' }}>🌟 Guided Architecture Hub</h3>
        <div className="acts">
          <button className="btn p" onClick={() => onNavigate('practice_builder')}>
            🌿 Build My Practice Routine
          </button>
          <button className="btn" onClick={() => onNavigate('architect')}>
            🏛️ Manifestation Architect (10 Stages)
          </button>
          <button className="btn" onClick={() => onNavigate('journal')}>
            📖 Journal Reflection
          </button>
        </div>
      </div>
    </>
  );
};
