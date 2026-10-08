import React, { useState, useRef, useEffect } from 'react';
import { sound } from '../audio';
import { toast } from '../toast';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface SanctuaryChatModalProps {
  onClose: () => void;
  onSaveToJournal?: (text: string) => void;
}

const ROLES = [
  { id: 'mentor', name: '🌿 Mindset Mentor', desc: 'Grounded wisdom, calm encouragement, and practical intention' },
  { id: 'sculptor', name: '💫 Affirmation Sculptor', desc: 'Crafting resonant, present-tense, believable affirmations' },
  { id: 'reframe', name: '🔍 Shadow & Resistance Reframe', desc: 'Gently uncovering and reframing hidden doubts & fears' },
  { id: 'evening', name: '🌙 Evening Reflection Companion', desc: 'Celebrating daily micro-wins and quiet night surrender' },
];

const STARTER_PROMPTS = [
  'I feel overwhelmed by my goals. How can I find calm focus today?',
  'Help me turn this fear into a grounded affirmation: "I am not good enough."',
  'What is a healthy perspective on divine timing vs aligned physical action?',
  'Help me celebrate a subtle win I had today.',
];

export const SanctuaryChatModal: React.FC<SanctuaryChatModalProps> = ({ onClose, onSaveToJournal }) => {
  const [role, setRole] = useState('mentor');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: 'Welcome to your private dialogue space. What is stirring in your thoughts today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (userText?: string) => {
    const textToSend = userText || input.trim();
    if (!textToSend || loading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: textToSend }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          rolePreset: role,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        setErrorMsg(body.error || 'The Guide could not answer at this moment.');
        return;
      }

      if (body.reply) {
        setMessages([...newMessages, { role: 'model', content: body.reply }]);
        sound.playChime(528, 1.2);
      }
    } catch (err) {
      setErrorMsg('Network error connecting to the Sanctuary Guide.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (!confirm('Clear this conversation history?')) return;
    setMessages([
      {
        role: 'model',
        content: 'The slate is clear. What intention or reflection would you like to explore?',
      },
    ]);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Sanctuary Guide Chat">
      <div
        className="modal-content in"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 680, height: '88vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.3em' }}>❦</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2em' }}>Sanctuary Guide</h3>
              <span className="small" style={{ opacity: 0.75 }}>Multi-turn Mindset &amp; Intention Companion</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button className="btn" style={{ padding: '3px 8px', fontSize: '0.74em' }} onClick={handleClear} title="Clear conversation">
              🗑️ Clear
            </button>
            <button className="btn" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        {/* Role Selector */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 8 }}>
          {ROLES.map(r => (
            <button
              key={r.id}
              className={`btn ${role === r.id ? 'p' : ''}`}
              style={{ padding: '4px 10px', fontSize: '0.78em', flex: '0 0 auto' }}
              onClick={() => setRole(r.id)}
            >
              {r.name}
            </button>
          ))}
        </div>

        {/* Scrollable Conversation Thread */}
        <div
          style={{
            flex: '1 1 auto',
            overflowY: 'auto',
            padding: '12px 6px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            borderTop: '1px solid rgba(0,0,0,0.06)',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          {messages.map((m, idx) => {
            const isModel = m.role === 'model';
            return (
              <div
                key={idx}
                style={{
                  alignSelf: isModel ? 'flex-start' : 'flex-end',
                  maxWidth: '85%',
                  background: isModel ? 'rgba(255,255,255,0.08)' : 'var(--pri)',
                  color: isModel ? 'var(--ink)' : '#fff',
                  border: isModel ? '1px solid var(--pri)' : 'none',
                  borderRadius: 8,
                  padding: '12px 16px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span className="eyebrow" style={{ fontSize: '0.65em', color: isModel ? 'var(--pri)' : '#ffe68a' }}>
                    {isModel ? '✨ Guide' : 'You'}
                  </span>
                  {isModel && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="btn"
                        style={{ padding: '1px 5px', fontSize: '0.68em' }}
                        onClick={() => sound.speak(m.content)}
                        title="Listen"
                      >
                        🔊
                      </button>
                      <button
                        className="btn"
                        style={{ padding: '1px 5px', fontSize: '0.68em' }}
                        onClick={() => {
                          navigator.clipboard?.writeText(m.content);
                          toast('Copied insight to clipboard!');
                        }}
                        title="Copy"
                      >
                        📋
                      </button>
                    </div>
                  )}
                </div>

                <p style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.98em', lineHeight: 1.5 }}>
                  {m.content}
                </p>
              </div>
            );
          })}

          {loading && (
            <div
              style={{
                alignSelf: 'flex-start',
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 8,
                border: '1px solid var(--pri)',
              }}
            >
              <span className="small" style={{ fontStyle: 'italic' }}>
                ✨ The Guide is tuning in with care…
              </span>
            </div>
          )}

          {errorMsg && (
            <p className="small" style={{ color: '#ff4fa3', margin: '4px 0' }}>
              {errorMsg}
            </p>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Starter Suggestions (if short thread) */}
        {messages.length <= 3 && (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '6px 0' }}>
            {STARTER_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                className="btn"
                style={{ fontSize: '0.74em', padding: '3px 8px', whiteSpace: 'nowrap' }}
                onClick={() => handleSend(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          style={{ display: 'flex', gap: 8, marginTop: 10 }}
        >
          <input
            placeholder="Ask for grounding, reframe a fear, or sculpt an affirmation..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn p" disabled={loading || !input.trim()}>
            Send ✨
          </button>
        </form>
      </div>
    </div>
  );
};
