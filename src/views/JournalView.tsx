import React, { useState } from 'react';
import { AppState, JournalEntry } from '../types';
import { sound } from '../audio';
import { toast } from '../toast';

interface JournalViewProps {
  state: AppState;
  onUpdateState: (fn: (prev: AppState) => AppState) => void;
}

const JOURNAL_TYPES = [
  'Free Journal',
  'Gratitude',
  'Manifestation',
  'Future Self',
  'Reflection',
  'Wins',
  'Evidence Log',
  'Release',
  'Self-Concept',
  'Daily Check-In',
];

const AI_ACTIONS = [
  { id: 'reflect', label: '🪞 Reflect on my entry' },
  { id: 'affirmations', label: '💫 Turn this into affirmations' },
  { id: 'limiting_beliefs', label: '🔍 Find limiting beliefs' },
  { id: 'reframe', label: '🌱 Reframe this' },
  { id: 'extract_goals', label: '🎯 Extract my goals' },
  { id: 'action_plan', label: '👣 Create an action plan' },
];

export const JournalView: React.FC<JournalViewProps> = ({ state, onUpdateState }) => {
  const [entryType, setEntryType] = useState('Reflection');
  const [tags, setTags] = useState('');
  const [text, setText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [editTags, setEditTags] = useState('');

  // AI Action states
  const [aiActiveId, setAiActiveId] = useState<number | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ id: number; action: string; content: string } | null>(null);
  const [aiError, setAiError] = useState('');

  const handleAddEntry = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const newEntry: JournalEntry = {
      id: Date.now(),
      type: entryType,
      tags: tags.trim(),
      text: trimmed,
      at: new Date().toLocaleString(),
    };

    onUpdateState(prev => ({
      ...prev,
      journal: [newEntry, ...prev.journal],
    }));

    setText('');
    setTags('');
    sound.playChime(432, 1.5);
  };

  const handleDeleteEntry = (id: number) => {
    if (!confirm('Delete this journal entry?')) return;
    onUpdateState(prev => ({
      ...prev,
      journal: prev.journal.filter(j => j.id !== id),
    }));
    if (aiResult?.id === id) setAiResult(null);
  };

  const handleStartEdit = (j: JournalEntry) => {
    setEditingId(j.id);
    setEditText(j.text);
    setEditTags(j.tags);
  };

  const handleSaveEdit = (id: number) => {
    onUpdateState(prev => ({
      ...prev,
      journal: prev.journal.map(j => (j.id === id ? { ...j, text: editText.trim(), tags: editTags.trim() } : j)),
    }));
    setEditingId(null);
  };

  // Run Journal AI
  const handleRunAi = async (entry: JournalEntry, actionId: string) => {
    setAiActiveId(entry.id);
    setAiLoading(true);
    setAiError('');

    try {
      const res = await fetch('/api/journal-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: entry.text,
          action: actionId,
          entryType: entry.type,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        setAiError(body.error || 'AI analysis unavailable.');
        return;
      }

      setAiResult({
        id: entry.id,
        action: actionId,
        content: body.result,
      });
      sound.playChime(528, 2.0);
    } catch (e) {
      setAiError('Network error connecting to AI guide.');
    } finally {
      setAiLoading(false);
    }
  };

  // Standard browser export without Claude-only dependencies
  const handleExportText = () => {
    if (state.journal.length === 0) {
      toast('Your journal is currently empty.');
      return;
    }
    const txt = state.journal
      .map(j => `═════════════════════════════════════════\nDATE: ${j.at} | TYPE: [${j.type}] ${j.tags ? `| TAGS: ${j.tags}` : ''}\n═════════════════════════════════════════\n${j.text}\n`)
      .join('\n\n');

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manifest-journal-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(state.journal, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manifest-journal-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter journal list
  const filteredJournal = state.journal.filter(j => {
    const q = searchQuery.toLowerCase();
    const matchQuery = (j.text + j.tags + j.type + j.at).toLowerCase().includes(q);
    const matchType = filterType === 'All' || j.type === filterType;
    return matchQuery && matchType;
  });

  return (
    <>
      <div className="card in">
        <h2>📖 Sanctuary Journal</h2>
        <p className="small" style={{ marginBottom: 12 }}>
          Your private space for reflection, synchronicities, evidence of progress, and honest self-inquiry.
        </p>

        <div className="row">
          <select value={entryType} onChange={e => setEntryType(e.target.value)}>
            {JOURNAL_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            placeholder="Tags, comma-separated (e.g. gratitude, breakthrough, morning)"
            value={tags}
            onChange={e => setTags(e.target.value)}
          />
        </div>

        <textarea
          rows={5}
          placeholder="What did you notice today? What feels true? What are you ready to surrender or celebrate?"
          value={text}
          onChange={e => setText(e.target.value)}
          style={{ marginTop: 8 }}
        />

        <div className="acts" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn p" onClick={handleAddEntry} disabled={!text.trim()}>
            💾 Save Entry
          </button>
          <div className="acts" style={{ margin: 0 }}>
            <button className="btn" onClick={handleExportText}>
              📄 Export Text (.txt)
            </button>
            <button className="btn" onClick={handleExportJson}>
              📦 Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Filter and List Entries */}
      <div className="card in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>Entries ({filteredJournal.length})</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              style={{ width: 'auto', padding: '4px 8px', fontSize: '0.82em' }}
            >
              <option value="All">All Categories</option>
              {JOURNAL_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <input
          placeholder="Search journal entries by words, date or tags..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ marginBottom: 14 }}
        />

        {filteredJournal.length === 0 ? (
          <p className="small" style={{ opacity: 0.8, textAlign: 'center', padding: '16px 0' }}>
            {state.journal.length === 0 ? 'No journal entries yet. Your journal is private to this device.' : 'No entries match your search filter.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredJournal.map(j => {
              const isEditing = editingId === j.id;
              const hasAiResult = aiResult?.id === j.id;

              return (
                <div key={j.id} className="card" style={{ margin: 0, padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="eyebrow" style={{ fontSize: '0.72em' }}>{j.type}</span>
                      <span className="small" style={{ opacity: 0.7 }}>{j.at}</span>
                    </div>
                    {j.tags && (
                      <span className="small" style={{ fontStyle: 'italic', opacity: 0.85 }}>
                        #{j.tags.split(',').map(t => t.trim()).join(' #')}
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <div>
                      <textarea
                        rows={4}
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        style={{ marginBottom: 8 }}
                      />
                      <input
                        placeholder="Tags"
                        value={editTags}
                        onChange={e => setEditTags(e.target.value)}
                        style={{ marginBottom: 8 }}
                      />
                      <div className="acts">
                        <button className="btn p" onClick={() => handleSaveEdit(j.id)}>Save Changes</button>
                        <button className="btn" onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p style={{ whiteSpace: 'pre-wrap', margin: '4px 0 12px' }}>{j.text}</p>

                      {/* AI Action Menu */}
                      <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 10, marginTop: 10 }}>
                        <span className="small" style={{ opacity: 0.75, display: 'block', marginBottom: 6 }}>
                          ✨ Reflective AI Inquiries:
                        </span>
                        <div className="acts" style={{ margin: 0 }}>
                          {AI_ACTIONS.map(act => (
                            <button
                              key={act.id}
                              className="btn"
                              disabled={aiLoading}
                              style={{ padding: '3px 8px', fontSize: '0.76em' }}
                              onClick={() => handleRunAi(j, act.id)}
                            >
                              {act.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* AI Result Card */}
                      {hasAiResult && (
                        <div
                          className="card in"
                          style={{
                            marginTop: 12,
                            background: 'rgba(255,255,255,0.08)',
                            borderColor: 'var(--pri)',
                            padding: '14px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span className="eyebrow" style={{ fontSize: '0.7em' }}>
                              AI Reflection ({AI_ACTIONS.find(a => a.id === aiResult.action)?.label})
                            </span>
                            <button className="btn" style={{ padding: '2px 6px', fontSize: '0.7em' }} onClick={() => setAiResult(null)}>
                              ✕ Close
                            </button>
                          </div>
                          <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.94em' }}>{aiResult.content}</div>
                        </div>
                      )}

                      {aiLoading && aiActiveId === j.id && (
                        <p className="small" style={{ fontStyle: 'italic', margin: '8px 0' }}>
                          ✨ Tuning in to your reflection…
                        </p>
                      )}

                      {aiError && aiActiveId === j.id && (
                        <p className="small" style={{ color: '#ff4fa3', margin: '8px 0' }}>
                          {aiError}
                        </p>
                      )}

                      <div className="acts" style={{ marginTop: 12 }}>
                        <button className="btn" onClick={() => handleStartEdit(j)}>
                          ✏️ Edit
                        </button>
                        <button
                          className="btn"
                          onClick={() => {
                            navigator.clipboard?.writeText(j.text);
                            toast('Entry copied to clipboard.');
                          }}
                        >
                          📋 Copy
                        </button>
                        <button
                          className="btn"
                          style={{ color: '#ff4fa3' }}
                          onClick={() => handleDeleteEntry(j.id)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};
