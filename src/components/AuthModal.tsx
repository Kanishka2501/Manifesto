import React, { useState } from 'react';
import { AppState } from '../types';

interface AuthModalProps {
  state: AppState;
  onClose: () => void;
  onUpdateUser: (user: { email: string; name: string; loggedIn: boolean } | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ state, onClose, onUpdateUser }) => {
  const [tab, setTab] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(state.user?.email || '');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setMessage('Please enter your email and password.');
      return;
    }
    const cleanName = email.split('@')[0];
    onUpdateUser({
      email: email.trim(),
      name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
      loggedIn: true,
    });
    setMessage('Welcome back to your private sanctuary.');
    setTimeout(() => onClose(), 800);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setMessage('Please fill in all fields.');
      return;
    }
    onUpdateUser({
      email: email.trim(),
      name: name.trim() || 'Manifestor',
      loggedIn: true,
    });
    setMessage('Your sanctuary account has been prepared.');
    setTimeout(() => onClose(), 800);
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage('Please enter your email address.');
      return;
    }
    setMessage(`Password reset instructions have been dispatched to ${email}.`);
  };

  const handleLogout = () => {
    onUpdateUser(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Account Sanctuary">
      <div className="modal-content in" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>✨ Sanctuary Account</h2>
          <button className="btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {state.user?.loggedIn ? (
          <div>
            <p className="small">
              You are currently signed into your private Manifest sanctuary as:
            </p>
            <div className="card" style={{ padding: '16px', margin: '14px 0' }}>
              <h3 style={{ margin: '0 0 4px' }}>👤 {state.user.name}</h3>
              <p className="small" style={{ margin: 0, opacity: 0.8 }}>{state.user.email}</p>
              <div style={{ marginTop: 10, display: 'inline-block', padding: '3px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.1)', fontSize: '0.8em' }}>
                🟢 Cloud Sync Architecture Ready · Free-First Tier
              </div>
            </div>
            <div className="acts" style={{ justifyContent: 'space-between' }}>
              <button className="btn" onClick={handleLogout}>Log Out of This Device</button>
              <button className="btn p" onClick={onClose}>Close</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="row" style={{ marginBottom: 14 }}>
              <button className={`btn ${tab === 'signin' ? 'p' : ''}`} onClick={() => setTab('signin')}>Sign In</button>
              <button className={`btn ${tab === 'signup' ? 'p' : ''}`} onClick={() => setTab('signup')}>Create Account</button>
              <button className={`btn ${tab === 'reset' ? 'p' : ''}`} onClick={() => setTab('reset')}>Reset Password</button>
            </div>

            {message && (
              <p className="small" style={{ padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: 4, margin: '8px 0' }}>
                {message}
              </p>
            )}

            {tab === 'signin' && (
              <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="submit" className="btn p" style={{ marginTop: 8 }}>Enter Sanctuary ✨</button>
              </form>
            )}

            {tab === 'signup' && (
              <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  type="text"
                  placeholder="Your preferred name or moniker"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
                <input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Choose a password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <p className="small" style={{ opacity: 0.7, margin: '4px 0' }}>
                  Manifest is 100% Free-First. You can use every core feature with or without an account.
                </p>
                <button type="submit" className="btn p" style={{ marginTop: 8 }}>Register Sanctuary ✨</button>
              </form>
            )}

            {tab === 'reset' && (
              <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="btn p" style={{ marginTop: 8 }}>Send Reset Link</button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
