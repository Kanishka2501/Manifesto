import React, { useState, useEffect } from 'react';

interface FeedbackItem {
  id: string;
  type: string;
  message: string;
  date: string;
}

interface FeedbackModalProps {
  onClose: () => void;
  initialTab?: 'write' | 'view';
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose, initialTab = 'write' }) => {
  const [activeTab, setActiveTab] = useState<'write' | 'view'>(initialTab);
  const [type, setType] = useState<'love' | 'improve' | 'problem' | 'feature'>('love');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Inbox state
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);

  const fetchFeedbacks = async () => {
    setLoadingFeedbacks(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data.latestFeedback || []);
      }
    } catch (_) {
      // ignore
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus('submitting');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message }),
      });
      if (res.ok) {
        setStatus('success');
        setMessage('');
        fetchFeedbacks();
      } else {
        const body = await res.json().catch(() => ({}));
        setErrorMsg(body.error || 'Could not send feedback. Please try again.');
        setStatus('error');
      }
    } catch (err) {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  };

  const getBadge = (t: string) => {
    switch (t) {
      case 'love':
        return { label: '💖 Love it', bg: 'rgba(255, 79, 163, 0.15)', border: 'rgba(255, 79, 163, 0.4)' };
      case 'improve':
        return { label: '🌱 Improvement', bg: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.4)' };
      case 'problem':
        return { label: '⚠️ Problem', bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.4)' };
      case 'feature':
        return { label: '💡 Feature Idea', bg: 'rgba(96, 165, 250, 0.15)', border: 'rgba(96, 165, 250, 0.4)' };
      default:
        return { label: '💬 General', bg: 'rgba(255, 255, 255, 0.1)', border: 'rgba(255, 255, 255, 0.2)' };
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Feedback">
      <div className="modal-content in" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: '1.25em' }}>💌 Feedback &amp; Reflections</h2>
          <button className="btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>
          <button
            type="button"
            className={`btn ${activeTab === 'write' ? 'p' : ''}`}
            onClick={() => { setActiveTab('write'); setStatus('idle'); }}
          >
            ✍️ Send Feedback
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'view' ? 'p' : ''}`}
            onClick={() => { setActiveTab('view'); fetchFeedbacks(); }}
          >
            📬 View Submitted ({feedbacks.length})
          </button>
        </div>

        {activeTab === 'view' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span className="small" style={{ opacity: 0.8 }}>
                Saved feedback messages ({feedbacks.length})
              </span>
              <button
                className="btn"
                style={{ padding: '2px 8px', fontSize: '0.8em' }}
                onClick={fetchFeedbacks}
                disabled={loadingFeedbacks}
              >
                {loadingFeedbacks ? 'Refreshing…' : '🔄 Refresh'}
              </button>
            </div>

            {feedbacks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', opacity: 0.7 }}>
                <p className="small">No feedback entries recorded yet.</p>
                <button
                  type="button"
                  className="btn p"
                  style={{ marginTop: 8 }}
                  onClick={() => setActiveTab('write')}
                >
                  Be the first to share thoughts ✍️
                </button>
              </div>
            ) : (
              <div style={{ maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
                {feedbacks.map(item => {
                  const badge = getBadge(item.type);
                  const dateStr = item.date ? new Date(item.date).toLocaleString() : 'Just now';
                  return (
                    <div
                      key={item.id}
                      className="card in"
                      style={{
                        padding: '12px 14px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span
                          style={{
                            fontSize: '0.74em',
                            padding: '2px 8px',
                            borderRadius: 12,
                            background: badge.bg,
                            border: `1px solid ${badge.border}`,
                            fontWeight: 600,
                          }}
                        >
                          {badge.label}
                        </span>
                        <span style={{ fontSize: '0.7em', opacity: 0.6 }}>{dateStr}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.92em', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                        {item.message}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="acts" style={{ marginTop: 16, justifyContent: 'space-between' }}>
              <button type="button" className="btn" onClick={() => setActiveTab('write')}>
                ✍️ Write New Message
              </button>
              <button type="button" className="btn p" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        ) : status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <h3>❦ Thank You</h3>
            <p className="small">Your reflections have been received with care and saved to the Sanctuary records.</p>
            <div className="acts" style={{ justifyContent: 'center', marginTop: 14 }}>
              <button
                className="btn"
                onClick={() => { setActiveTab('view'); fetchFeedbacks(); }}
              >
                📬 View Submitted Feedback
              </button>
              <button className="btn p" onClick={onClose}>Done</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="small" style={{ marginBottom: 12 }}>
              How is Manifest serving your journey? Let us know what you cherish or what needs refining.
            </p>

            <div className="row" style={{ marginBottom: 14 }}>
              {[
                { id: 'love', label: '💖 Love it' },
                { id: 'improve', label: '🌱 Needs improvement' },
                { id: 'problem', label: '⚠️ Report a problem' },
                { id: 'feature', label: '💡 Suggest a feature' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  className={`btn ${type === opt.id ? 'p' : ''}`}
                  onClick={() => setType(opt.id as any)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              placeholder="Your honest thoughts..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
              style={{ marginBottom: 14 }}
            />

            {status === 'error' && (
              <p className="small" style={{ color: '#ff4fa3', marginBottom: 10 }}>{errorMsg}</p>
            )}

            <div className="acts" style={{ justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn"
                onClick={() => { setActiveTab('view'); fetchFeedbacks(); }}
              >
                📬 View Submitted ({feedbacks.length})
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn p" disabled={status === 'submitting' || !message.trim()}>
                  {status === 'submitting' ? 'Sending…' : 'Send Feedback ✨'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
