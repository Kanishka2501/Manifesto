import React, { useState, useEffect } from 'react';
import { ManifestationKit, SavedManifestation } from '../types';
import { sound } from '../audio';
import { toast } from '../toast';

interface CreateViewProps {
  onSave: (kit: ManifestationKit) => void;
  onNavigate: (view: string) => void;
}

const CATEGORIES = [
  'Personal Growth',
  'Career',
  'Money',
  'Love & Relationships',
  'Education',
  'Confidence',
  'Lifestyle',
  'Family',
  'Spirituality',
  'Health & Wellness',
  'Other',
];

const TONES = [
  'Calm',
  'Grounded',
  'Powerful',
  'Emotional',
  'Romantic',
  'Spiritual',
  'Gentle',
  'Ambitious',
];

const LOADING_MESSAGES = [
  'Turning your wish into words…',
  'Understanding your intention…',
  'Creating your personal manifestation…',
  'Grounding visions into aligned practical steps…',
  'Composing sensory imagery and affirmations…',
];

export const CreateView: React.FC<CreateViewProps> = ({ onSave, onNavigate }) => {
  const [wish, setWish] = useState('');
  const [category, setCategory] = useState('');
  const [tone, setTone] = useState('');
  const [pov, setPov] = useState('First person');
  const [len, setLen] = useState('Medium');

  const [loading, setLoading] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorCode, setErrorCode] = useState('');

  const [kit, setKit] = useState<ManifestationKit | null>(null);
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [regenKey, setRegenKey] = useState<string | null>(null);

  // Cycle loading messages smoothly
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [loading]);

  const handleCreate = async () => {
    const trimmed = wish.trim();
    if (!trimmed) {
      setErrorMsg('Please share a few words about what you want to work toward.');
      setErrorCode('empty_input');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setErrorCode('');
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wish: trimmed,
          category,
          tone,
          pov,
          length: len,
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorCode(body.code || 'api_error');
        if (body.code === 'not_configured') {
          setErrorMsg('AI is not connected yet. Add your GEMINI_API_KEY on the server, then try again.');
        } else if (body.code === 'rate_limited') {
          setErrorMsg("You've reached the AI request limit for this session window. Your saved content is completely safe. Please take a mindful breath and try again shortly.");
        } else if (body.code === 'input_too_long') {
          setErrorMsg('Your wish is a little too long. Please condense your core thought.');
        } else {
          setErrorMsg(body.error || 'Something went wrong while creating your manifestation. Please try again.');
        }
        return;
      }

      if (!body.data || typeof body.data !== 'object') {
        setErrorCode('bad_response');
        setErrorMsg('The AI response came back incomplete. Please tap Create again.');
        return;
      }

      setKit(body.data);
      sound.playChime(528, 2.5);
    } catch (err: any) {
      setErrorCode('network_error');
      setErrorMsg('Network error. Unable to reach server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenSection = async (sectionKey: keyof ManifestationKit, sectionName: string) => {
    if (!kit) return;
    setRegenKey(String(sectionKey));

    try {
      const res = await fetch('/api/regenerate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: kit.intent,
          sectionKey,
          sectionName,
          tone: tone || 'balanced and inspiring',
        }),
      });

      const body = await res.json();
      if (res.ok && body.text) {
        const text: string = body.text;
        setKit(prev => {
          if (!prev) return prev;
          const currentVal = prev[sectionKey];
          if (Array.isArray(currentVal)) {
            const lines = text.split('\n').map(s => s.replace(/^[-*•\d.]+\s*/, '').trim()).filter(Boolean);
            return { ...prev, [sectionKey]: lines.length ? lines : [text] };
          }
          return { ...prev, [sectionKey]: text };
        });
        sound.playChime(432, 1.5);
      }
    } catch (err) {
      // Graceful fallback
    } finally {
      setRegenKey(null);
    }
  };

  const handleCopySection = (content: string | string[]) => {
    const text = Array.isArray(content) ? content.join('\n') : content;
    navigator.clipboard?.writeText(text);
    toast('Copied to clipboard.');
  };

  const handleSpeakSection = (content: string | string[], key: string) => {
    if (speakingKey === key) {
      sound.stopSpeaking();
      setSpeakingKey(null);
      return;
    }
    const text = Array.isArray(content) ? content.join('. ') : content;
    setSpeakingKey(key);
    sound.speak(text, () => setSpeakingKey(null), () => setSpeakingKey(key));
  };

  const handleSaveKit = () => {
    if (!kit) return;
    onSave(kit);
    setSaveSuccess(true);
    sound.playChime(528, 2.5);
  };

  const sections: Array<{
    key: keyof ManifestationKit;
    label: string;
    icon: string;
    description: string;
  }> = [
    { key: 'intent', label: 'Core Intention', icon: '🎯', description: 'Your crystal-clear anchor' },
    { key: 'affirmations', label: 'Affirmations', icon: '💫', description: 'Present-tense empowering truths' },
    { key: 'manifestation_script', label: 'Manifestation Script', icon: '📜', description: 'Living as if it is already here' },
    { key: 'visualization', label: 'Sensory Visualization', icon: '🌅', description: 'Sights, sounds, and emotional textures' },
    { key: 'future_self', label: 'Future Self Scene', icon: '🦋', description: 'A transmission from the self who succeeded' },
    { key: 'ideal_life', label: 'A Day in My Ideal Life', icon: '🏡', description: 'Everyday peace and purpose in detail' },
    { key: 'gratitude', label: 'Gratitude Prompts', icon: '🙏', description: 'Anchoring in present abundance' },
    { key: 'self_concept', label: 'Self-Concept Identity', icon: '💎', description: 'Deep belief rewriting' },
    { key: 'morning_practice', label: 'Morning Practice', icon: '☀️', description: 'Mindful ritual to begin the day' },
    { key: 'night_practice', label: 'Night Practice', icon: '🌙', description: 'Gentle release before sleep' },
    { key: 'recommended_technique', label: 'Recommended Technique', icon: '🔮', description: 'The ideal manifestation tool for this wish' },
    { key: 'vision_board_ideas', label: 'Vision-Board Ideas', icon: '🖼️', description: 'Imagery concepts for your sanctuary board' },
    { key: 'action_steps', label: 'Aligned Action Steps', icon: '👣', description: 'Realistic physical steps within 24-48 hours' },
    { key: 'reflection_prompt', label: 'Reflection Prompt', icon: '📝', description: 'Deep inquiry for your journal' },
  ];

  return (
    <>
      <div className="card in">
        <h2>🌟 What do you want to work toward?</h2>
        <p className="small" style={{ marginBottom: 12 }}>
          Tell us in your own words. It does not have to sound perfect or polished.
        </p>

        <textarea
          id="wish"
          rows={4}
          placeholder="e.g. I want to transition into my own creative business, feel deeply financially secure, and have time for my family without burnout."
          value={wish}
          onChange={e => setWish(e.target.value)}
          disabled={loading}
        />

        <div className="row" style={{ marginTop: 10 }}>
          <select value={category} onChange={e => setCategory(e.target.value)} disabled={loading}>
            <option value="">Category (optional)</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select value={tone} onChange={e => setTone(e.target.value)} disabled={loading}>
            <option value="">Tone (optional)</option>
            {TONES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select value={pov} onChange={e => setPov(e.target.value)} disabled={loading}>
            <option value="First person">First person (I am / I have)</option>
            <option value="Second person">Second person (You are / You have)</option>
          </select>

          <select value={len} onChange={e => setLen(e.target.value)} disabled={loading}>
            <option value="Short">Short &amp; Focused</option>
            <option value="Medium">Medium &amp; Balanced</option>
            <option value="Deep">Deep &amp; Comprehensive</option>
          </select>
        </div>

        <div className="acts" style={{ marginTop: 14 }}>
          <button className="btn p" id="gobtn" onClick={handleCreate} disabled={loading || !wish.trim()}>
            {loading ? '✨ Composing…' : '✨ Create My Manifestation'}
          </button>
        </div>

        {loading && (
          <div style={{ marginTop: 16, padding: '14px', background: 'rgba(255,255,255,0.08)', borderRadius: 6, textAlign: 'center' }}>
            <div className="orn" style={{ margin: '6px auto' }}><span>❦</span></div>
            <p style={{ margin: 0, fontStyle: 'italic', letterSpacing: '0.02em' }}>
              {LOADING_MESSAGES[loadingMsgIndex]}
            </p>
          </div>
        )}

        {errorMsg && (
          <div style={{ marginTop: 14, padding: '12px', borderRadius: 6, border: '1px solid #ff4fa3', background: 'rgba(255, 79, 163, 0.1)' }}>
            <p style={{ margin: 0 }}>{errorMsg}</p>
            <button className="btn" style={{ marginTop: 8 }} onClick={handleCreate}>
              Try Again 🔄
            </button>
          </div>
        )}
      </div>

      {kit && (
        <div id="out" className="in">
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <span className="eyebrow" style={{ fontSize: '0.72em' }}>Manifestation Kit</span>
              <h2 style={{ margin: '4px 0' }}>{kit.title}</h2>
            </div>
            <div className="acts" style={{ margin: 0 }}>
              <button className="btn p" onClick={handleSaveKit}>
                {saveSuccess ? 'Saved to Today ✓' : '💾 Save this manifestation'}
              </button>
              {saveSuccess && (
                <button className="btn" onClick={() => onNavigate('today')}>
                  Open in Today ☀️
                </button>
              )}
            </div>
          </div>

          {sections.map(({ key, label, icon, description }) => {
            const content = kit[key];
            const isArray = Array.isArray(content);
            const isRegenerating = regenKey === key;
            const isSpeakingThis = speakingKey === key;

            return (
              <div key={key} className="card" style={{ opacity: isRegenerating ? 0.6 : 1, transition: 'opacity 0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{icon} {label}</h3>
                    <span className="small" style={{ opacity: 0.7 }}>{description}</span>
                  </div>
                  <div className="acts" style={{ margin: 0 }}>
                    <button
                      className="btn"
                      title={isSpeakingThis ? 'Stop audio' : 'Listen with calm voice'}
                      onClick={() => handleSpeakSection(content, key)}
                    >
                      {isSpeakingThis ? '⏹️ Stop' : '🔊 Listen'}
                    </button>
                    <button className="btn" onClick={() => handleCopySection(content)}>
                      📋 Copy
                    </button>
                    <button
                      className="btn"
                      disabled={isRegenerating}
                      onClick={() => handleRegenSection(key, label)}
                    >
                      {isRegenerating ? '🔄 Rewriting…' : '🔄 Regenerate'}
                    </button>
                  </div>
                </div>

                {isArray ? (
                  <ul style={{ margin: '10px 0', paddingLeft: 22 }}>
                    {(content as string[]).map((item, i) => (
                      <li
                        key={i}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={e => {
                          const newText = e.currentTarget.innerText;
                          setKit(prev => {
                            if (!prev) return prev;
                            const nextArr = [...(prev[key] as string[])];
                            nextArr[i] = newText;
                            return { ...prev, [key]: nextArr };
                          });
                        }}
                        style={{ margin: '6px 0', outline: 'none' }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={e => {
                      const newText = e.currentTarget.innerText;
                      setKit(prev => (prev ? { ...prev, [key]: newText } : prev));
                    }}
                    style={{ whiteSpace: 'pre-wrap', marginTop: 8, outline: 'none' }}
                  >
                    {String(content)}
                  </div>
                )}
              </div>
            );
          })}

          <div className="card" style={{ textAlign: 'center' }}>
            <h3>Ready to integrate this into your life?</h3>
            <p className="small">Save this manifestation to your Today dashboard to begin daily practice.</p>
            <div className="acts" style={{ justifyContent: 'center' }}>
              <button className="btn p" onClick={handleSaveKit}>
                {saveSuccess ? 'Saved to Today ✓' : '💾 Save this manifestation'}
              </button>
              <button className="btn" onClick={() => onNavigate('today')}>
                Go to Today Dashboard ☀️
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
