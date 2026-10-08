import React, { useState, useEffect } from 'react';
import { AppState, ManifestationKit } from './types';
import { loadState, saveState, getDefaultState } from './storage';
import { OrnateFrame } from './components/OrnateFrame';
import { BackgroundEffects } from './components/BackgroundEffects';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { FeedbackModal } from './components/FeedbackModal';
import { PrivacyModal } from './components/PrivacyModal';
import { AuthModal } from './components/AuthModal';
import { SanctuaryChatModal } from './components/SanctuaryChatModal';
import { subscribeToast } from './toast';

import { HomeView } from './views/HomeView';
import { CreateView } from './views/CreateView';
import { TodayView } from './views/TodayView';
import { JournalView } from './views/JournalView';
import { ToolsView } from './views/ToolsView';
import { SettingsView } from './views/SettingsView';
import { VisionBoardView } from './views/VisionBoardView';
import { ChallengesView } from './views/ChallengesView';
import { PracticeBuilderView } from './views/PracticeBuilderView';
import { ArchitectView } from './views/ArchitectView';
import { PersonalSpaceView } from './views/PersonalSpaceView';

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [view, setView] = useState<string>('home');

  // Modals
  const [showSearch, setShowSearch] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Global toast notifications
  useEffect(() => {
    return subscribeToast(msg => {
      setToastMsg(msg);
      const timer = setTimeout(() => {
        setToastMsg(prev => (prev === msg ? null : prev));
      }, 3500);
      return () => clearTimeout(timer);
    });
  }, []);

  // Sync to local storage
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Global keyboard shortcuts (e.g. '/' for search, 'Escape' to close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowFeedback(false);
        setShowPrivacy(false);
        setShowAuth(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (newView: string) => {
    setView(newView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveManifestation = (kit: ManifestationKit) => {
    const newSaved = {
      id: Date.now(),
      createdAt: new Date().toLocaleDateString(),
      data: kit,
      isFavorite: false,
    };
    setState(prev => ({
      ...prev,
      saved: [newSaved, ...prev.saved],
      activeManifestationId: newSaved.id,
    }));
  };

  const handleResetData = () => {
    localStorage.removeItem('mf');
    setState(getDefaultState());
    setView('home');
  };

  const NAV_ITEMS = [
    { key: 'home', label: '🏡 Home' },
    { key: 'create', label: '✨ Create' },
    { key: 'today', label: '☀️ Today' },
    { key: 'journal', label: '📖 Journal' },
    { key: 'tools', label: '🔮 Tools' },
    { key: 'vision_board', label: '🖼️ Vision Board' },
    { key: 'challenges', label: '🔥 Challenges' },
    { key: 'settings', label: '🎨 Settings' },
  ];

  return (
    <>
      <BackgroundEffects state={state} />
      <OrnateFrame />

      <div className="app">
        {/* Top utility bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => handleNavigate('home')}>
            <span style={{ fontSize: '1.2em' }}>❦</span>
            <span className="cinzel" style={{ fontSize: '1.1em', fontWeight: 600, letterSpacing: '0.08em' }}>MANIFEST</span>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              className="btn"
              style={{ padding: '4px 10px', fontSize: '0.78em' }}
              onClick={() => setShowChat(true)}
              title="Open Gemini Sanctuary Guide"
            >
              💬 Guide
            </button>
            <button
              className="btn"
              style={{ padding: '4px 10px', fontSize: '0.78em' }}
              onClick={() => setShowSearch(true)}
              title="Search everything (/)"
            >
              🔍 Search
            </button>
            <button
              className="btn"
              style={{ padding: '4px 10px', fontSize: '0.78em' }}
              onClick={() => setShowFeedback(true)}
              title="Send feedback"
            >
              💌 Feedback
            </button>
            <button
              className="btn"
              style={{ padding: '4px 10px', fontSize: '0.78em' }}
              onClick={() => setShowAuth(true)}
              title="Sanctuary account"
            >
              {state.user?.loggedIn ? `👤 ${state.user.name}` : '👤 Account'}
            </button>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav id="nav" aria-label="Main Navigation">
          {NAV_ITEMS.map(({ key, label }) => (
            <button
              key={key}
              className={view === key ? 'on' : ''}
              onClick={() => handleNavigate(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Main Content Area */}
        <main id="main" tabIndex={-1}>
          {view === 'home' && (
            <HomeView
              state={state}
              onNavigate={handleNavigate}
              onOpenPrivacy={() => setShowPrivacy(true)}
              onOpenChat={() => setShowChat(true)}
              onAddFavorite={aff => {
                setState(prev => ({
                  ...prev,
                  favoriteAffirmations: prev.favoriteAffirmations.includes(aff)
                    ? prev.favoriteAffirmations
                    : [aff, ...prev.favoriteAffirmations],
                }));
              }}
              onSaveJournalEntry={entry => {
                setState(prev => ({
                  ...prev,
                  journal: [entry, ...prev.journal],
                }));
              }}
            />
          )}

          {view === 'create' && (
            <CreateView
              onSave={handleSaveManifestation}
              onNavigate={handleNavigate}
            />
          )}

          {view === 'today' && (
            <TodayView
              state={state}
              onUpdateState={setState}
              onNavigate={handleNavigate}
            />
          )}

          {view === 'journal' && (
            <JournalView
              state={state}
              onUpdateState={setState}
            />
          )}

          {view === 'tools' && (
            <ToolsView
              state={state}
              onUpdateState={setState}
              onNavigate={handleNavigate}
            />
          )}

          {view === 'vision_board' && (
            <VisionBoardView
              state={state}
              onUpdateState={setState}
            />
          )}

          {view === 'challenges' && (
            <ChallengesView
              state={state}
              onUpdateState={setState}
              onNavigate={handleNavigate}
            />
          )}

          {view === 'practice_builder' && (
            <PracticeBuilderView
              state={state}
              onUpdateState={setState}
              onNavigate={handleNavigate}
            />
          )}

          {view === 'architect' && (
            <ArchitectView
              state={state}
              onUpdateState={setState}
              onNavigate={handleNavigate}
            />
          )}

          {view === 'personal' && (
            <PersonalSpaceView
              state={state}
              onNavigate={handleNavigate}
              onOpenAuth={() => setShowAuth(true)}
            />
          )}

          {view === 'settings' && (
            <SettingsView
              state={state}
              onUpdateState={setState}
              onResetData={handleResetData}
              onOpenPrivacy={() => setShowPrivacy(true)}
              onOpenFeedback={() => setShowFeedback(true)}
            />
          )}
        </main>

        {/* Responsible manifestation disclosure matching manifest.html */}
        <p className="small" style={{ textAlign: 'center', marginTop: 30, opacity: 0.75 }}>
          Manifestation practices are tools for intention, reflection, and motivation. They are not proven to produce outcomes.
        </p>
      </div>

      {/* Floating Action Button */}
      {view !== 'create' && (
        <button className="btn p fab" onClick={() => handleNavigate('create')}>
          ✨ Create
        </button>
      )}

      {/* Global Modals */}
      {showSearch && (
        <GlobalSearchModal
          state={state}
          onClose={() => setShowSearch(false)}
          onNavigate={handleNavigate}
        />
      )}

      {showFeedback && (
        <FeedbackModal onClose={() => setShowFeedback(false)} />
      )}

      {showPrivacy && (
        <PrivacyModal
          onClose={() => setShowPrivacy(false)}
          onClearData={handleResetData}
        />
      )}

      {showAuth && (
        <AuthModal
          state={state}
          onClose={() => setShowAuth(false)}
          onUpdateUser={u => setState(prev => ({ ...prev, user: u }))}
        />
      )}

      {showChat && (
        <SanctuaryChatModal
          onClose={() => setShowChat(false)}
          onSaveToJournal={text => {
            setState(prev => ({
              ...prev,
              journal: [
                {
                  id: Date.now(),
                  type: 'Guide Reflection',
                  tags: 'chat, guide, insight',
                  text,
                  at: new Date().toLocaleString(),
                },
                ...prev.journal,
              ],
            }));
          }}
        />
      )}

      {/* Non-blocking Sanctuary Toast Notification */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="in"
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            background: 'var(--card)',
            color: 'var(--ink)',
            border: '1px solid var(--pri)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
            borderRadius: 6,
            padding: '10px 18px',
            fontSize: '0.9em',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            maxWidth: '90vw',
          }}
        >
          <span style={{ color: 'var(--pri)' }}>❦</span>
          <span>{toastMsg}</span>
          <button
            onClick={() => setToastMsg(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--ink)',
              fontSize: '1em',
              padding: '0 4px',
              marginLeft: 6,
              opacity: 0.7,
            }}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
