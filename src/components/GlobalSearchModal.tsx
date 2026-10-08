import React, { useState, useMemo } from 'react';
import { AppState } from '../types';

interface GlobalSearchModalProps {
  state: AppState;
  onClose: () => void;
  onNavigate: (view: string, targetId?: any) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ state, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const matches: Array<{
      category: string;
      title: string;
      snippet: string;
      view: string;
      id?: any;
    }> = [];

    // Search Manifestations
    state.saved.forEach(s => {
      const matchTitle = s.data.title.toLowerCase().includes(q);
      const matchIntent = s.data.intent.toLowerCase().includes(q);
      const matchAff = s.data.affirmations.some(a => a.toLowerCase().includes(q));
      const matchScript = s.data.manifestation_script.toLowerCase().includes(q);

      if (matchTitle || matchIntent || matchAff || matchScript) {
        matches.push({
          category: 'Manifestation',
          title: s.customName || s.data.title,
          snippet: s.data.intent || s.data.affirmations[0] || '',
          view: 'today',
          id: s.id,
        });
      }
    });

    // Search Affirmations
    state.favoriteAffirmations.forEach((aff, idx) => {
      if (aff.toLowerCase().includes(q)) {
        matches.push({
          category: 'Favorite Affirmation',
          title: aff,
          snippet: 'From your personal sanctuary',
          view: 'today',
        });
      }
    });

    // Search Journal Entries
    state.journal.forEach(j => {
      if ((j.text + j.tags + j.type).toLowerCase().includes(q)) {
        matches.push({
          category: `Journal (${j.type})`,
          title: j.tags ? `Tagged: ${j.tags}` : j.at,
          snippet: j.text.slice(0, 110) + '...',
          view: 'journal',
          id: j.id,
        });
      }
    });

    // Search Vision Boards
    state.visionBoards.forEach(vb => {
      const matchTitle = vb.title.toLowerCase().includes(q);
      const itemMatch = vb.items.find(it => it.content.toLowerCase().includes(q));
      if (matchTitle || itemMatch) {
        matches.push({
          category: 'Vision Board',
          title: vb.title,
          snippet: itemMatch ? itemMatch.content : `${vb.items.length} visual items`,
          view: 'vision_board',
          id: vb.id,
        });
      }
    });

    // Search Challenges
    state.challenges.forEach(ch => {
      if ((ch.title + ch.subtitle).toLowerCase().includes(q)) {
        matches.push({
          category: 'Challenge',
          title: ch.title,
          snippet: ch.subtitle,
          view: 'challenges',
          id: ch.id,
        });
      }
    });

    return matches;
  }, [query, state]);

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Global Search">
      <div className="modal-content in" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>🔍 Global Search</h2>
          <button className="btn" onClick={onClose} aria-label="Close search">✕</button>
        </div>

        <input
          autoFocus
          placeholder="Search manifestations, affirmations, journals, vision boards, challenges..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ marginBottom: 16, fontSize: '1.05em' }}
        />

        {query.trim() === '' ? (
          <p className="small" style={{ textAlign: 'center', margin: '24px 0', opacity: 0.7 }}>
            Type any keyword, intention, journal reflection, or practice to search your entire sanctuary.
          </p>
        ) : results.length === 0 ? (
          <p className="small" style={{ textAlign: 'center', margin: '24px 0' }}>
            No matches found for "{query}".
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '50vh', overflowY: 'auto' }}>
            {results.map((res, i) => (
              <div
                key={i}
                className="card"
                style={{ margin: 0, padding: '14px', cursor: 'pointer' }}
                onClick={() => {
                  onNavigate(res.view, res.id);
                  onClose();
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span className="eyebrow" style={{ fontSize: '0.7em' }}>{res.category}</span>
                  <span className="small">Open ↗</span>
                </div>
                <h3 style={{ margin: '4px 0', fontSize: '1em' }}>{res.title}</h3>
                <p className="small" style={{ margin: 0 }}>{res.snippet}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
