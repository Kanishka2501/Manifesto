import React, { useState } from 'react';
import { AppState, SavedManifestation } from '../types';
import { calcStreak, getActiveManifestation, todayDateString } from '../storage';
import { sound } from '../audio';
import { toast } from '../toast';

interface TodayViewProps {
  state: AppState;
  onUpdateState: (fn: (prev: AppState) => AppState) => void;
  onNavigate: (view: string) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({ state, onUpdateState, onNavigate }) => {
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const streak = calcStreak(state.days);
  const isDoneToday = state.days.includes(todayDateString());
  const active = getActiveManifestation(state);
  const totalPracticeSessions = Object.values(state.counts).reduce((a, b) => a + b, 0);

  // Mark today's practice complete with celebration chime
  const handleMarkDone = () => {
    const today = todayDateString();
    onUpdateState(prev => {
      const alreadyDone = prev.days.includes(today);
      const newDays = alreadyDone ? prev.days.filter(d => d !== today) : [...prev.days, today];
      return { ...prev, days: newDays };
    });

    if (!isDoneToday) {
      sound.playChime(528, 3.0);
    }
  };

  const handleSetActive = (id: number) => {
    onUpdateState(prev => ({ ...prev, activeManifestationId: id }));
    sound.playChime(432, 1.2);
  };

  const handleToggleFavorite = (id: number) => {
    onUpdateState(prev => ({
      ...prev,
      saved: prev.saved.map(s => (s.id === id ? { ...s, isFavorite: !s.isFavorite } : s)),
    }));
  };

  const handleDelete = (id: number) => {
    if (!confirm('Are you sure you want to remove this manifestation from your sanctuary?')) return;
    onUpdateState(prev => {
      const newSaved = prev.saved.filter(s => s.id !== id);
      const newActiveId = prev.activeManifestationId === id ? (newSaved[0]?.id || null) : prev.activeManifestationId;
      return { ...prev, saved: newSaved, activeManifestationId: newActiveId };
    });
  };

  const handleDuplicate = (manifestation: SavedManifestation) => {
    const copy: SavedManifestation = {
      id: Date.now(),
      createdAt: new Date().toLocaleDateString(),
      isFavorite: false,
      customName: `${manifestation.customName || manifestation.data.title} (Copy)`,
      data: JSON.parse(JSON.stringify(manifestation.data)),
    };
    onUpdateState(prev => ({ ...prev, saved: [copy, ...prev.saved] }));
    sound.playChime(432, 1.2);
  };

  const handleStartRename = (s: SavedManifestation) => {
    setEditingId(s.id);
    setEditName(s.customName || s.data.title);
  };

  const handleSaveRename = (id: number) => {
    onUpdateState(prev => ({
      ...prev,
      saved: prev.saved.map(s => (s.id === id ? { ...s, customName: editName.trim() || s.data.title } : s)),
    }));
    setEditingId(null);
  };

  const handleSpeakAffirmation = (text: string) => {
    if (isSpeaking) {
      sound.stopSpeaking();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    sound.speak(text, () => setIsSpeaking(false), () => setIsSpeaking(true));
  };

  // Filter & sort saved manifestations
  const filteredSaved = state.saved
    .filter(s => {
      const q = search.toLowerCase();
      const title = (s.customName || s.data.title).toLowerCase();
      const intent = (s.data.intent || '').toLowerCase();
      return title.includes(q) || intent.includes(q);
    })
    .sort((a, b) => {
      if (sortOrder === 'title') {
        const titleA = a.customName || a.data.title;
        const titleB = b.customName || b.data.title;
        return titleA.localeCompare(titleB);
      }
      if (sortOrder === 'oldest') return a.id - b.id;
      return b.id - a.id;
    });

  return (
    <>
      <div className="card in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
          <h2>☀️ Today</h2>
          <span className="small">
            <b>🔥 Streak:</b> {streak} day(s) · <b>Practices logged:</b> {totalPracticeSessions}
          </span>
        </div>

        {!isDoneToday && (
          <p className="small" style={{ opacity: 0.85, margin: '4px 0 12px' }}>
            Welcome back to your sacred rhythm. What is aligned for you today?
          </p>
        )}

        {active ? (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span className="eyebrow" style={{ fontSize: '0.7em' }}>Active Manifestation</span>
              <span className="small" style={{ fontStyle: 'italic' }}>
                {active.isFavorite ? '★ Starred' : ''}
              </span>
            </div>

            <h3 style={{ margin: '4px 0 10px', fontSize: '1.3em' }}>
              🎯 {active.customName || active.data.title}
            </h3>

            <div className="card" style={{ background: 'rgba(255,255,255,0.06)', padding: '16px', margin: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>💫 Today's Affirmation</h4>
                <button
                  className="btn"
                  style={{ padding: '3px 8px', fontSize: '0.75em' }}
                  onClick={() => handleSpeakAffirmation(active.data.affirmations?.[0] || '')}
                >
                  {isSpeaking ? '⏹️ Stop' : '🔊 Listen'}
                </button>
              </div>
              <p style={{ fontSize: '1.15em', fontStyle: 'italic', margin: '8px 0' }}>
                "{active.data.affirmations?.[0]}"
              </p>
            </div>

            <div className="row" style={{ margin: '10px 0' }}>
              <div className="card" style={{ flex: '1 1 240px', margin: 0, padding: '14px', background: 'rgba(255,255,255,0.06)' }}>
                <h4 style={{ margin: '0 0 6px' }}>🌅 Morning Ritual</h4>
                <p className="small" style={{ margin: 0 }}>
                  {Array.isArray(active.data.morning_practice)
                    ? active.data.morning_practice.join(' · ')
                    : active.data.morning_practice || '3 deep breaths, reciting 1 affirmation.'}
                </p>
              </div>

              <div className="card" style={{ flex: '1 1 240px', margin: 0, padding: '14px', background: 'rgba(255,255,255,0.06)' }}>
                <h4 style={{ margin: '0 0 6px' }}>👣 Aligned Action Step</h4>
                <p className="small" style={{ margin: 0 }}>
                  {active.data.action_steps?.[0] || 'Take 1 small practical step in the real world today.'}
                </p>
              </div>
            </div>

            <div className="card" style={{ background: 'rgba(255,255,255,0.06)', padding: '14px', margin: '10px 0' }}>
              <h4 style={{ margin: '0 0 6px' }}>📝 Today's Reflection Prompt</h4>
              <p className="small" style={{ margin: '0 0 8px' }}>
                {active.data.reflection_prompt || 'What limiting story are you gently releasing today?'}
              </p>
              <button
                className="btn"
                style={{ padding: '4px 10px', fontSize: '0.8em' }}
                onClick={() => onNavigate('journal')}
              >
                Open in Journal 📖
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p>Nothing saved yet. Speak your wish to generate your first manifestation.</p>
            <button className="btn p" onClick={() => onNavigate('create')}>
              ✨ Create My Manifestation
            </button>
          </div>
        )}

        <div className="acts" style={{ marginTop: 14 }}>
          <button className={`btn ${isDoneToday ? 'p' : ''}`} onClick={handleMarkDone}>
            {isDoneToday ? '✓ Practice Complete Today' : "Mark Today's Practice Complete"}
          </button>
          <button className="btn" onClick={() => onNavigate('tools')}>
            Practice Breathing / 369 🔮
          </button>
        </div>
        <p className="small" style={{ opacity: 0.7, marginTop: 10 }}>
          Consistency builds identity. Numbers measure self-dedication, not guaranteed outcomes.
        </p>
      </div>

      {/* Saved Manifestations Library */}
      <div className="card in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Saved Manifestations ({state.saved.length})</h3>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as any)}
              style={{ width: 'auto', padding: '4px 8px', fontSize: '0.82em' }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">By Title</option>
            </select>
          </div>
        </div>

        <input
          placeholder="Filter saved manifestations..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 14, fontSize: '0.9em' }}
        />

        {filteredSaved.length === 0 ? (
          <p className="small" style={{ opacity: 0.8 }}>
            {state.saved.length === 0 ? 'No manifestations saved yet.' : 'No manifestations match your filter.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredSaved.map(s => {
              const isActive = active?.id === s.id;
              const isEditingThis = editingId === s.id;

              return (
                <div
                  key={s.id}
                  className="card"
                  style={{
                    margin: 0,
                    padding: '16px',
                    borderColor: isActive ? 'var(--pri)' : 'rgba(0,0,0,0.1)',
                    background: isActive ? 'color-mix(in srgb, var(--pri) 12%, var(--card))' : 'var(--card)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ flex: '1 1 200px' }}>
                      {isEditingThis ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            style={{ padding: '4px 8px' }}
                            autoFocus
                          />
                          <button className="btn p" onClick={() => handleSaveRename(s.id)}>Save</button>
                          <button className="btn" onClick={() => setEditingId(null)}>Cancel</button>
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <h4 style={{ margin: 0, fontSize: '1.1em' }}>
                              {s.customName || s.data.title}
                            </h4>
                            {isActive && (
                              <span style={{ fontSize: '0.72em', padding: '2px 6px', borderRadius: 4, background: 'var(--pri)', color: '#fff', textTransform: 'uppercase' }}>
                                Active
                              </span>
                            )}
                          </div>
                          <p className="small" style={{ margin: '4px 0 0', opacity: 0.85, fontStyle: 'italic' }}>
                            "{s.data.affirmations?.[0]}"
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="acts" style={{ margin: 0 }}>
                      {!isActive && (
                        <button className="btn" onClick={() => handleSetActive(s.id)}>
                          Make Active 🎯
                        </button>
                      )}
                      <button
                        className="btn"
                        onClick={() => handleToggleFavorite(s.id)}
                        title="Star / Favorite"
                      >
                        {s.isFavorite ? '★ Starred' : '☆ Star'}
                      </button>
                      <button className="btn" onClick={() => handleStartRename(s)}>
                        ✏️ Rename
                      </button>
                      <button className="btn" onClick={() => handleDuplicate(s)}>
                        📄 Duplicate
                      </button>
                      <button
                        className="btn"
                        onClick={() => {
                          navigator.clipboard?.writeText(JSON.stringify(s.data, null, 2));
                          toast('Manifestation JSON copied to clipboard.');
                        }}
                      >
                        📋 Copy
                      </button>
                      <button
                        className="btn"
                        style={{ color: '#ff4fa3' }}
                        onClick={() => handleDelete(s.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};
