import React, { useState, useEffect, useRef } from 'react';
import { AppState } from '../types';
import { sound } from '../audio';
import { todayDateString } from '../storage';
import { toast } from '../toast';

interface ToolsViewProps {
  state: AppState;
  onUpdateState: (fn: (prev: AppState) => AppState) => void;
  onNavigate: (view: string) => void;
}

export const ToolsView: React.FC<ToolsViewProps> = ({ state, onUpdateState, onNavigate }) => {
  // 1. Affirmation Rewriter state
  const [rewriteInput, setRewriteInput] = useState('');
  const [rewriteTone, setRewriteTone] = useState<'gentle' | 'confident' | 'powerful' | 'spiritual' | 'practical'>('gentle');
  const [rewriting, setRewriting] = useState(false);
  const [rewriteResults, setRewriteResults] = useState<string[]>([]);
  const [rewriteInsight, setRewriteInsight] = useState('');
  const [rewriteError, setRewriteError] = useState('');

  // 2. Breathing Orb state (4-4 rhythm)
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathLabel, setBreathLabel] = useState('Ready');
  const [isOrbBig, setIsOrbBig] = useState(false);
  const breathIntervalRef = useRef<any>(null);

  // 3. Wish Release state
  const [releaseInput, setReleaseInput] = useState('');
  const [releasingActive, setReleasingActive] = useState(false);

  // 4. Modal / active interactive tool runner
  const [activeModalTool, setActiveModalTool] = useState<string | null>(null);
  const [toolText, setToolText] = useState('');
  const [toolStep, setToolStep] = useState(0);
  const [toolFeedback, setToolFeedback] = useState('');

  // Handle Breathing
  const toggleBreathing = () => {
    if (isBreathing) {
      if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
      breathIntervalRef.current = null;
      setIsBreathing(false);
      setIsOrbBig(false);
      setBreathLabel('Ready');
      return;
    }

    setIsBreathing(true);
    let expanding = true;
    setIsOrbBig(true);
    setBreathLabel('Breathe in…');
    sound.playBreathBell(true);

    breathIntervalRef.current = setInterval(() => {
      expanding = !expanding;
      setIsOrbBig(expanding);
      setBreathLabel(expanding ? 'Breathe in…' : 'Breathe out…');
      sound.playBreathBell(expanding);
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
    };
  }, []);

  // Handle Wish Release
  const handleRelease = () => {
    const val = releaseInput.trim();
    if (!val) return;

    setReleasingActive(true);
    sound.playChime(528, 3.5);

    // Create floating element like original manifest.html
    const elem = document.createElement('div');
    elem.className = 'rel';
    elem.textContent = val.slice(0, 60);
    document.body.appendChild(elem);

    setTimeout(() => {
      elem.remove();
      setReleasingActive(false);
      setReleaseInput('');
    }, 3500);
  };

  // Handle Session Count
  const handleAddSession = (name: string) => {
    sound.playChime(432, 1.2);
    onUpdateState(prev => {
      const today = todayDateString();
      const newDays = prev.days.includes(today) ? prev.days : [...prev.days, today];
      return {
        ...prev,
        days: newDays,
        counts: {
          ...prev.counts,
          [name]: (prev.counts[name] || 0) + 1,
        },
      };
    });
  };

  // Handle Affirmation Rewriter
  const handleRewrite = async (tone: 'gentle' | 'confident' | 'powerful' | 'spiritual' | 'practical') => {
    if (!rewriteInput.trim()) return;
    setRewriteTone(tone);
    setRewriting(true);
    setRewriteError('');
    setRewriteResults([]);

    try {
      const res = await fetch('/api/rewrite-affirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rewriteInput.trim(),
          tone,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        setRewriteError(body.error || 'Failed to rewrite affirmation.');
        return;
      }

      setRewriteResults(body.options || []);
      setRewriteInsight(body.insight || '');
      sound.playChime(528, 1.5);
    } catch (e) {
      setRewriteError('Network error connecting to AI.');
    } finally {
      setRewriting(false);
    }
  };

  const handleSaveRewrittenAsFavorite = (aff: string) => {
    onUpdateState(prev => ({
      ...prev,
      favoriteAffirmations: prev.favoriteAffirmations.includes(aff)
        ? prev.favoriteAffirmations
        : [aff, ...prev.favoriteAffirmations],
    }));
    sound.playChime(528, 1.5);
    toast('Added to your favorite affirmations!');
  };

  // Practice tools definitions
  const NUMEROLOGY_TOOLS = [
    { id: '369', name: '369 Method', desc: 'Write your intention 3× morning, 6× afternoon, 9× night' },
    { id: '55x5', name: '55x5 Method', desc: 'Write your core intention 55 times for 5 consecutive days' },
    { id: '33x3', name: '33x3 Method', desc: 'Write your intention 33 times for 3 consecutive days' },
    { id: '777', name: '777 Method', desc: 'Write your intention 7 times, 3 times a day for 7 days' },
    { id: 'Visualization', name: 'Sensory Visualization', desc: 'Spend 5 minutes picturing the scene with all five senses' },
  ];

  const DEEP_TOOLS = [
    {
      id: 'scripting',
      name: '📜 Scripting in Present Tense',
      desc: 'Write an immersive journal entry as if the wish has already happened months ago.',
      prompt: 'Describe your current morning, what you are feeling, what you see, and why you are deeply grateful.',
    },
    {
      id: 'gratitude_rampage',
      name: '🙏 Gratitude Rampage',
      desc: 'Overwhelm your nervous system with 10 immediate things you are sincerely thankful for.',
      prompt: 'List 10 specific blessings right now, from the breath in your chest to the roof over your head.',
    },
    {
      id: 'mirror_work',
      name: '🪞 Mirror Work',
      desc: 'Look directly into your eyes and declare unconditional love, safety, and worthiness.',
      prompt: 'Look at yourself. Say aloud: "I love you. You are safe. You are completely worthy of the life you want."',
    },
    {
      id: 'self_concept',
      name: '💎 Self-Concept Reconditioning',
      desc: 'Shift the underlying assumptions of who you believe you are.',
      prompt: 'Identify one story you hold about yourself (e.g. "I always struggle with money") and write its sovereign replacement.',
    },
    {
      id: 'future_self',
      name: '✉️ Future-Self Letter',
      desc: 'Receive an encouraging letter written to you today from yourself 3 years into the future.',
      prompt: 'Write: "Dear Present Self, I am writing to you from 3 years ahead to tell you everything worked out…"',
    },
    {
      id: 'sats',
      name: '🌙 SATS (State Akin to Sleep)',
      desc: 'Neville Goddard method: Loop a 5-second imaginal scene while in the drowsy state right before falling asleep.',
      prompt: 'Construct one short 5-second scene implying your wish is fulfilled (e.g., someone congratulating you, or shaking hands).',
    },
    {
      id: 'ideal_life',
      name: '🏡 Ideal-Life Exercise',
      desc: 'Map out an ordinary Tuesday in your dream reality from waking up to going to bed.',
      prompt: 'Walk through your morning coffee, your work rhythm, your evening relaxation, and your emotional state.',
    },
    {
      id: 'release',
      name: '🕊️ Release / Let-Go Ritual',
      desc: 'Write down fear or attachment to the exact outcome, and consciously surrender the timeline.',
      prompt: 'What control, expectation, or panic are you ready to hand over to the universe today?',
    },
    {
      id: 'evidence_log',
      name: '🔍 Evidence Log (Synchronicities)',
      desc: 'Log even the smallest signs, coincidences, or shifts that prove things are moving in your favor.',
      prompt: 'Record 1 synchronicity or piece of subtle evidence you noticed in the past 48 hours.',
    },
    {
      id: 'goal_breakdown',
      name: '🪜 Goal Breakdown',
      desc: 'Deconstruct your grand intention into 3 tangible weekly milestones.',
      prompt: 'What are the 3 sequential physical milestones between where you stand today and your completed intention?',
    },
    {
      id: 'inspired_action',
      name: '⚡ Inspired Action Generator',
      desc: 'Filter between reactive panic-action and genuine inspired intuition.',
      prompt: 'What is one action you feel called to take with curiosity and joy, rather than anxiety?',
    },
    {
      id: 'belief_reframe',
      name: '🔄 Belief Reframing',
      desc: 'Cognitive reframing for doubts that arise when expanding your comfort zone.',
      prompt: 'State your doubt: "I am not ready." Reframe: "Every master started as a beginner; I am ready to learn as I go."',
    },
    {
      id: 'mental_rehearsal',
      name: '🧠 Mental Rehearsal',
      desc: 'Neuroscience-backed rehearsal of a pivotal upcoming conversation, presentation, or day.',
      prompt: 'Mentally rehearse performing with calm confidence, breathing steadily, and feeling rooted in poise.',
    },
  ];

  const handleOpenTool = (tool: typeof DEEP_TOOLS[0]) => {
    setActiveModalTool(tool.id);
    setToolText('');
    setToolStep(0);
    setToolFeedback('');
  };

  const handleSaveToolToJournal = (toolName: string) => {
    if (!toolText.trim()) return;
    onUpdateState(prev => ({
      ...prev,
      journal: [
        {
          id: Date.now(),
          type: toolName.replace(/[^\w\s-]/g, '').trim(),
          tags: 'practice, tool',
          text: toolText.trim(),
          at: new Date().toLocaleString(),
        },
        ...prev.journal,
      ],
      counts: {
        ...prev.counts,
        [toolName]: (prev.counts[toolName] || 0) + 1,
      },
    }));
    sound.playChime(528, 2.0);
    setToolFeedback('Saved to your private Journal and logged as a completed practice!');
    setTimeout(() => {
      setActiveModalTool(null);
      setToolFeedback('');
    }, 1400);
  };

  return (
    <>
      {/* 1. Affirmation Rewriter */}
      <div className="card in">
        <h2>💫 Affirmation Rewriter</h2>
        <p className="small" style={{ marginBottom: 12 }}>
          Enter any raw thought, fear, or unpolished affirmation. Transform it into a grounded, psychologically healthy affirmation.
        </p>

        <textarea
          rows={3}
          placeholder="e.g. I am terrified that I won't succeed and everyone will judge me."
          value={rewriteInput}
          onChange={e => setRewriteInput(e.target.value)}
        />

        <div className="acts" style={{ marginTop: 10 }}>
          {(['gentle', 'confident', 'powerful', 'spiritual', 'practical'] as const).map(t => (
            <button
              key={t}
              className={`btn ${rewriteTone === t ? 'p' : ''}`}
              disabled={rewriting || !rewriteInput.trim()}
              onClick={() => handleRewrite(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {rewriting && (
          <p className="small" style={{ fontStyle: 'italic', margin: '10px 0' }}>
            ✨ Composing grounded affirmations…
          </p>
        )}

        {rewriteError && (
          <p className="small" style={{ color: '#ff4fa3', margin: '8px 0' }}>
            {rewriteError}
          </p>
        )}

        {rewriteResults.length > 0 && (
          <div className="card in" style={{ marginTop: 14, background: 'rgba(255,255,255,0.08)', padding: '16px' }}>
            <span className="eyebrow" style={{ fontSize: '0.7em' }}>Rewritten Options ({rewriteTone})</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '10px 0' }}>
              {rewriteResults.map((aff, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
                  <span style={{ fontSize: '1.05em', fontStyle: 'italic' }}>"{aff}"</span>
                  <div className="acts" style={{ margin: 0 }}>
                    <button
                      className="btn"
                      style={{ padding: '3px 8px', fontSize: '0.76em' }}
                      onClick={() => {
                        navigator.clipboard?.writeText(aff);
                        toast('Copied to clipboard.');
                      }}
                    >
                      📋 Copy
                    </button>
                    <button
                      className="btn p"
                      style={{ padding: '3px 8px', fontSize: '0.76em' }}
                      onClick={() => handleSaveRewrittenAsFavorite(aff)}
                    >
                      ★ Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {rewriteInsight && (
              <p className="small" style={{ opacity: 0.85, margin: '8px 0 0', fontStyle: 'italic' }}>
                💡 {rewriteInsight}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 2. Breathing Orb (4-4 rhythm) */}
      <div className="card in">
        <h2>🌬️ Breathe with the Light</h2>
        <p className="small">
          A calm 4-second in, 4-second out rhythm accompanied by singing bowl tones to settle your nervous system before practice.
        </p>
        <div className={`orb ${isOrbBig ? 'big' : ''}`} id="orb" />
        <div style={{ textAlign: 'center', fontSize: '1.2em', fontWeight: 500, margin: '8px 0' }} role="status">
          {breathLabel}
        </div>
        <div className="acts" style={{ justifyContent: 'center' }}>
          <button className="btn p" onClick={toggleBreathing}>
            {isBreathing ? '⏹️ Stop Breathing Practice' : '▶ Start Breathing Practice'}
          </button>
        </div>
      </div>

      {/* 3. Floating Wish Release */}
      <div className="card in">
        <h2>🕊️ Release a Wish or Worry</h2>
        <p className="small">
          Write a worry, fear, or attachment to an outcome, then let it drift away as light. Nothing is saved.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            placeholder="Type your worry or desire to release..."
            value={releaseInput}
            onChange={e => setReleaseInput(e.target.value)}
            disabled={releasingActive}
            onKeyDown={e => {
              if (e.key === 'Enter') handleRelease();
            }}
          />
          <button className="btn p" onClick={handleRelease} disabled={releasingActive || !releaseInput.trim()}>
            Release 🕊️
          </button>
        </div>
      </div>

      {/* 4. Numerology & Habit Practices */}
      <div className="card in">
        <h2>🕯️ Popular Practice Trackers</h2>
        <p className="small" style={{ marginBottom: 12 }}>
          Consistency and structured focus reinforce neural pathways. Use these trackers to maintain your focus routines.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {NUMEROLOGY_TOOLS.map(tool => {
            const count = state.counts[tool.id] || 0;
            return (
              <div
                key={tool.id}
                className="card"
                style={{
                  margin: 0,
                  padding: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div>
                  <h4 style={{ margin: 0 }}><b>{tool.name}</b></h4>
                  <span className="small" style={{ opacity: 0.85 }}>{tool.desc}</span>
                  <div className="small" style={{ marginTop: 4 }}>
                    Sessions logged: <b>{count}</b>
                  </div>
                </div>
                <div className="acts" style={{ margin: 0 }}>
                  <button className="btn p" onClick={() => handleAddSession(tool.id)}>
                    +1 Session Completed ✨
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Deep Manifestation Toolkit */}
      <div className="card in">
        <h2>🔮 Deep Manifestation Toolkit</h2>
        <p className="small" style={{ marginBottom: 14 }}>
          Thirteen interactive, psychology-grounded practices for identity shifting, emotional regulation, and clear action.
        </p>
        <div className="tri">
          {DEEP_TOOLS.map(tool => (
            <div key={tool.id} className="card" style={{ textAlign: 'left', padding: '16px' }}>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.05em' }}>{tool.name}</h3>
              <p className="small" style={{ opacity: 0.85, margin: '0 0 12px' }}>{tool.desc}</p>
              <button className="btn p" style={{ width: '100%' }} onClick={() => handleOpenTool(tool)}>
                Practice Now ✍️
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Active Deep Tool Interactive Modal */}
      {activeModalTool && (
        <div className="modal-overlay" onClick={() => setActiveModalTool(null)}>
          <div className="modal-content in" onClick={e => e.stopPropagation()}>
            {(() => {
              const tool = DEEP_TOOLS.find(t => t.id === activeModalTool);
              if (!tool) return null;

              return (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ margin: 0 }}>{tool.name}</h3>
                    <button className="btn" onClick={() => setActiveModalTool(null)}>✕</button>
                  </div>
                  <p className="small" style={{ opacity: 0.85, marginBottom: 12 }}>{tool.desc}</p>

                  <div className="card" style={{ background: 'rgba(255,255,255,0.06)', padding: '14px', margin: '12px 0' }}>
                    <span className="eyebrow" style={{ fontSize: '0.7em' }}>Guided Prompt</span>
                    <p style={{ fontStyle: 'italic', margin: '4px 0 0' }}>{tool.prompt}</p>
                  </div>

                  <textarea
                    rows={6}
                    placeholder="Pour your thoughts and sensations here freely..."
                    value={toolText}
                    onChange={e => setToolText(e.target.value)}
                    style={{ marginBottom: 12 }}
                  />

                  {toolFeedback && (
                    <p className="small" style={{ color: 'var(--pri)', fontWeight: 600, margin: '8px 0' }}>
                      {toolFeedback}
                    </p>
                  )}

                  <div className="acts" style={{ justifyContent: 'space-between' }}>
                    <button className="btn" onClick={() => setActiveModalTool(null)}>Close</button>
                    <button
                      className="btn p"
                      disabled={!toolText.trim()}
                      onClick={() => handleSaveToolToJournal(tool.name)}
                    >
                      💾 Complete &amp; Save to Journal
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
};
