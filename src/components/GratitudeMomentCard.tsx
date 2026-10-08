import React, { useState, useEffect } from 'react';
import { sound } from '../audio';
import { JournalEntry } from '../types';

interface GratitudeMomentCardProps {
  onSaveToJournal: (entry: JournalEntry) => void;
  onNavigate: (view: string) => void;
}

const GRATITUDE_PROMPTS = [
  'What are 3 quiet blessings, unexpected kindnesses, or comforts that touched your life today?',
  'Name 3 small moments today that made you feel peaceful, grounded, or appreciative.',
  'What are 3 things about your body, your senses, or your immediate surroundings that you appreciate right now?',
  'List 3 people, opportunities, or simple pleasures you felt lucky to experience today.',
  'Reflect on 3 lessons, silver linings, or quiet strengths you noticed in yourself today.',
  'What are 3 simple things within your sight or reach right now that you are genuinely thankful for?',
  'What are 3 challenges you moved through that ultimately protected or guided you?',
  'Name 3 freedoms, choices, or gifts in your everyday life that you often take for granted.',
];

export const GratitudeMomentCard: React.FC<GratitudeMomentCardProps> = ({
  onSaveToJournal,
  onNavigate,
}) => {
  const [prompt, setPrompt] = useState('');
  const [item1, setItem1] = useState('');
  const [item2, setItem2] = useState('');
  const [item3, setItem3] = useState('');
  const [extraNote, setExtraNote] = useState('');
  const [saved, setSaved] = useState(false);

  // Pick a random prompt on load
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * GRATITUDE_PROMPTS.length);
    setPrompt(GRATITUDE_PROMPTS[randomIndex]);
  }, []);

  const handleShufflePrompt = () => {
    let nextIndex = Math.floor(Math.random() * GRATITUDE_PROMPTS.length);
    if (GRATITUDE_PROMPTS[nextIndex] === prompt && GRATITUDE_PROMPTS.length > 1) {
      nextIndex = (nextIndex + 1) % GRATITUDE_PROMPTS.length;
    }
    setPrompt(GRATITUDE_PROMPTS[nextIndex]);
    setSaved(false);
    sound.playChime(432, 1.0);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const items = [item1.trim(), item2.trim(), item3.trim()].filter(Boolean);
    if (items.length === 0 && !extraNote.trim()) return;

    let formattedText = `🌿 Gratitude Prompt: "${prompt}"\n\n`;
    items.forEach((item, index) => {
      formattedText += `${index + 1}. ${item}\n`;
    });

    if (extraNote.trim()) {
      formattedText += `\nReflection Note:\n${extraNote.trim()}`;
    }

    const newEntry: JournalEntry = {
      id: Date.now(),
      type: 'Gratitude',
      tags: 'gratitude, daily-moment, appreciation',
      text: formattedText,
      at: new Date().toLocaleString(),
    };

    onSaveToJournal(newEntry);
    setSaved(true);
    sound.playChime(528, 1.4);

    // Reset fields
    setItem1('');
    setItem2('');
    setItem3('');
    setExtraNote('');

    setTimeout(() => {
      setSaved(false);
    }, 5000);
  };

  const hasContent = item1.trim() || item2.trim() || item3.trim() || extraNote.trim();

  return (
    <div
      className="card in"
      style={{
        margin: '18px 0',
        padding: '24px 20px',
        border: '1px solid var(--pri)',
        background: 'color-mix(in srgb, var(--card) 94%, var(--pri))',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span className="eyebrow" style={{ fontSize: '0.72em' }}>
          🕯️ Daily Gratitude Moment
        </span>
        <button
          type="button"
          className="btn"
          style={{ padding: '3px 10px', fontSize: '0.74em' }}
          onClick={handleShufflePrompt}
          title="Receive another gratitude prompt"
        >
          🎲 New Prompt
        </button>
      </div>

      <div className="orn" style={{ margin: '4px auto 12px', textAlign: 'center' }}>
        <span>❦</span>
      </div>

      <h3
        style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 'clamp(1.15em, 3.5vw, 1.35em)',
          fontStyle: 'italic',
          lineHeight: 1.4,
          margin: '4px 0 16px',
          textAlign: 'center',
          color: 'var(--ink)',
        }}
      >
        "{prompt}"
      </h3>

      {saved && (
        <div
          className="in"
          style={{
            margin: '0 auto 16px',
            padding: '8px 16px',
            borderRadius: 4,
            background: 'var(--pri)',
            color: '#fff',
            fontSize: '0.88em',
            fontWeight: 600,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <span>✓ Saved to your Sanctuary Journal!</span>
          <button
            type="button"
            className="btn"
            style={{ padding: '2px 8px', fontSize: '0.76em', background: '#fff', color: '#111' }}
            onClick={() => onNavigate('journal')}
          >
            Open Journal 📖
          </button>
        </div>
      )}

      <form onSubmit={handleSave}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 600, color: 'var(--pri)', width: 20, textAlign: 'center' }}>1.</span>
            <input
              type="text"
              placeholder="First thing I am grateful for..."
              value={item1}
              onChange={e => setItem1(e.target.value)}
              style={{ flex: 1, margin: 0 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 600, color: 'var(--pri)', width: 20, textAlign: 'center' }}>2.</span>
            <input
              type="text"
              placeholder="Second thing I am grateful for..."
              value={item2}
              onChange={e => setItem2(e.target.value)}
              style={{ flex: 1, margin: 0 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 600, color: 'var(--pri)', width: 20, textAlign: 'center' }}>3.</span>
            <input
              type="text"
              placeholder="Third thing I am grateful for..."
              value={item3}
              onChange={e => setItem3(e.target.value)}
              style={{ flex: 1, margin: 0 }}
            />
          </div>

          <div style={{ marginTop: 4 }}>
            <textarea
              rows={2}
              placeholder="Optional: Add a quiet reflection or feeling note about these blessings..."
              value={extraNote}
              onChange={e => setExtraNote(e.target.value)}
              style={{ width: '100%', margin: 0, fontSize: '0.9em' }}
            />
          </div>
        </div>

        <div className="acts" style={{ justifyContent: 'center', marginTop: 14 }}>
          <button
            type="submit"
            className="btn p"
            disabled={!hasContent}
            style={{ minWidth: 200, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ✨ Save to My Journal
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => onNavigate('journal')}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            📖 View Past Gratitudes
          </button>
        </div>
      </form>
    </div>
  );
};
