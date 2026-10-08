import React, { useState } from 'react';
import { AppState } from '../types';
import { sound } from '../audio';
import { toast } from '../toast';

interface ArchitectViewProps {
  state: AppState;
  onUpdateState: (fn: (prev: AppState) => AppState) => void;
  onNavigate: (view: string) => void;
}

const STAGES = [
  { id: 'desire', name: '1. Core Desire', prompt: 'State your intention in simple, unvarnished language. What is calling to you?' },
  { id: 'why', name: '2. The Deeper "Why"', prompt: 'Why does this desire matter to your soul? What pain or limitation will it heal?' },
  { id: 'identity', name: '3. Identity Shift', prompt: 'Who must you become to sustain this reality? What kind of person easily maintains this?' },
  { id: 'reality', name: '4. Desired Reality', prompt: 'Describe a moment in this completed reality. Notice the sensory textures, air, sounds, and peace.' },
  { id: 'beliefs', name: '5. Examining Beliefs', prompt: 'What doubt, guilt, or childhood story arises when you imagine having this completely?' },
  { id: 'emotions', name: '6. Emotional State', prompt: 'What emotion will this give you (freedom, relief, joy)? Practice feeling 5% of that emotion right now.' },
  { id: 'habits', name: '7. Micro-Habits', prompt: 'What 1-2 tiny daily habits does this version of you uphold effortlessly?' },
  { id: 'actions', name: '8. Aligned Actions', prompt: 'What practical physical move can you make within the next 48 hours to signal readiness?' },
  { id: 'milestones', name: '9. Tangible Milestones', prompt: 'What are three sequential milestones that mark your progress along the way?' },
  { id: 'reflection', name: '10. Surrender & Integration', prompt: 'Can you surrender attachment to the exact timeline and trust your daily dedication?' },
];

export const ArchitectView: React.FC<ArchitectViewProps> = ({ state, onUpdateState, onNavigate }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentInput, setCurrentInput] = useState('');
  const [guidance, setGuidance] = useState<{ feedback: string; enhancement: string; promptForNext: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const stage = STAGES[currentStep];

  const handleConsultGuide = async () => {
    if (!currentInput.trim()) return;

    setLoading(true);
    setGuidance(null);

    try {
      const res = await fetch('/api/architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepIndex: currentStep,
          stepName: stage.name,
          userInput: currentInput.trim(),
          previousSteps: answers,
        }),
      });

      const body = await res.json();
      if (res.ok && body.guidance) {
        setGuidance(body.guidance);
        sound.playChime(528, 2.0);
      }
    } catch (e) {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (!currentInput.trim()) return;

    const nextAnswers = { ...answers, [stage.id]: currentInput.trim() };
    setAnswers(nextAnswers);
    setCurrentInput('');
    setGuidance(null);

    if (currentStep < STAGES.length - 1) {
      setCurrentStep(prev => prev + 1);
      sound.playChime(432, 1.2);
    } else {
      setIsFinished(true);
      sound.playChime(528, 3.5);
    }
  };

  const handleSaveToJournal = () => {
    const fullText = STAGES.map((s, i) => `【${s.name}】\nPrompt: ${s.prompt}\nYour Reflection:\n${answers[s.id] || ''}\n`).join('\n═════════════════════════════════════════\n\n');

    onUpdateState(prev => ({
      ...prev,
      journal: [
        {
          id: Date.now(),
          type: 'Manifestation Architect',
          tags: 'architect, 10-steps, blueprint',
          text: fullText,
          at: new Date().toLocaleString(),
        },
        ...prev.journal,
      ],
    }));

    toast('Your complete 10-Stage Manifestation Blueprint has been saved to your Journal!');
    onNavigate('journal');
  };

  return (
    <>
      <div className="card in">
        <h2>🏛️ Manifestation Architect</h2>
        <p className="small" style={{ marginBottom: 12 }}>
          A 10-stage deep guided journey connecting the spiritual, psychological, and physical layers of your goal.
        </p>

        {/* Step Indicator */}
        <div style={{ display: 'flex', gap: 4, margin: '14px 0', overflowX: 'auto', paddingBottom: 6 }}>
          {STAGES.map((stg, i) => (
            <div
              key={stg.id}
              onClick={() => {
                if (answers[stg.id] || i <= currentStep) {
                  setCurrentStep(i);
                  setCurrentInput(answers[stg.id] || '');
                  setGuidance(null);
                }
              }}
              style={{
                flex: '1 1 auto',
                minWidth: 28,
                height: 6,
                borderRadius: 3,
                background: i === currentStep ? 'var(--pri)' : answers[stg.id] ? '#ffe68a' : 'rgba(255,255,255,0.15)',
                cursor: 'pointer',
                transition: 'background 0.3s',
              }}
              title={stg.name}
            />
          ))}
        </div>
      </div>

      {!isFinished ? (
        <div className="card in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="eyebrow" style={{ fontSize: '0.72em' }}>Stage {currentStep + 1} of 10</span>
            <span className="small">{STAGES.length - currentStep} stages remaining</span>
          </div>

          <h3 style={{ margin: '6px 0 10px' }}>{stage.name}</h3>

          <div className="card" style={{ background: 'rgba(255,255,255,0.06)', padding: '14px', margin: '10px 0' }}>
            <p style={{ fontStyle: 'italic', margin: 0 }}>{stage.prompt}</p>
          </div>

          <textarea
            rows={5}
            placeholder="Write your unreserved answer here..."
            value={currentInput}
            onChange={e => setCurrentInput(e.target.value)}
            style={{ marginBottom: 12 }}
          />

          {guidance && (
            <div className="card in" style={{ background: 'rgba(255,255,255,0.08)', padding: '14px', margin: '12px 0' }}>
              <span className="eyebrow" style={{ fontSize: '0.7em' }}>Architect Mentor Insight</span>
              <p className="small" style={{ margin: '6px 0' }}>{guidance.feedback}</p>
              <div style={{ marginTop: 8, padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
                <span className="small" style={{ fontWeight: 600 }}>Refined &amp; Deepened Expression:</span>
                <p style={{ margin: '4px 0 0', fontStyle: 'italic' }}>"{guidance.enhancement}"</p>
              </div>
              <p className="small" style={{ fontStyle: 'italic', opacity: 0.8, marginTop: 8 }}>
                Next Seed: {guidance.promptForNext}
              </p>
            </div>
          )}

          <div className="acts" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              className="btn"
              disabled={loading || !currentInput.trim()}
              onClick={handleConsultGuide}
            >
              {loading ? 'Consulting Guide… ✨' : '✨ Deepen with AI Insight'}
            </button>

            <button
              className="btn p"
              disabled={!currentInput.trim()}
              onClick={handleNextStep}
            >
              {currentStep === STAGES.length - 1 ? 'Complete Blueprint ✨' : 'Continue to Next Stage ➔'}
            </button>
          </div>
        </div>
      ) : (
        <div className="card in" style={{ textAlign: 'center', padding: '30px 20px' }}>
          <div className="orn"><span>❦</span></div>
          <h2>Your Manifestation Blueprint is Complete</h2>
          <p className="small" style={{ maxWidth: 500, margin: '10px auto' }}>
            You have journeyed from raw desire to grounded identity, clear habits, and realistic milestones.
          </p>

          <div className="acts" style={{ justifyContent: 'center', marginTop: 18 }}>
            <button className="btn p" onClick={handleSaveToJournal}>
              📖 Save Entire Blueprint to Journal
            </button>
            <button className="btn" onClick={() => onNavigate('today')}>
              Return to Today Dashboard ☀️
            </button>
          </div>
        </div>
      )}
    </>
  );
};
