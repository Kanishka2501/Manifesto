import React from 'react';
import { AppState, JournalEntry } from '../types';
import { calcStreak, getActiveManifestation } from '../storage';
import { DailyAffirmationCard } from '../components/DailyAffirmationCard';
import { GratitudeMomentCard } from '../components/GratitudeMomentCard';
import { ZenSoundscapeCard } from '../components/ZenSoundscapeCard';
import { GrowthProgressChart } from '../components/GrowthProgressChart';

interface HomeViewProps {
  state: AppState;
  onNavigate: (view: string) => void;
  onOpenPrivacy: () => void;
  onOpenChat?: () => void;
  onAddFavorite?: (text: string) => void;
  onSaveJournalEntry: (entry: JournalEntry) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  state,
  onNavigate,
  onOpenPrivacy,
  onOpenChat,
  onAddFavorite,
  onSaveJournalEntry,
}) => {
  const streak = calcStreak(state.days);
  const active = getActiveManifestation(state);

  return (
    <>
      <div className="card hero">
        <div className="eyebrow">A private sanctuary for intention</div>
        <div className="orn">
          <span>❦</span>
        </div>
        <h1>Your wish. Your words. Your journey.</h1>
        <p>
          You don't need to know how to write the perfect affirmation. Tell us what you want, and let AI turn your intention into a personalized, grounded practice.
        </p>
        <div className="orn">
          <span>✦</span>
        </div>
        <div className="row">
          <button className="btn p" onClick={() => onNavigate('create')}>
            ✨ Create My Manifestation
          </button>
          <button className="btn" onClick={() => onNavigate('tools')}>
            🔮 Explore Manifestation Tools
          </button>
          {onOpenChat && (
            <button className="btn" onClick={onOpenChat}>
              💬 Sanctuary Guide
            </button>
          )}
          <button className="btn" onClick={() => onNavigate('personal')}>
            🕊️ Personal Space
          </button>
        </div>
      </div>

      {/* Daily Affirmation Card with Share, Listen, Favorite, and Shuffle */}
      <DailyAffirmationCard
        onAddFavorite={onAddFavorite}
        favoriteAffirmations={state.favoriteAffirmations}
      />

      {/* Daily Gratitude Moment Card */}
      <GratitudeMomentCard onSaveToJournal={onSaveJournalEntry} onNavigate={onNavigate} />

      {/* Zen Soundscape Web Audio Ambient Generator */}
      <ZenSoundscapeCard />

      {active && (
        <div className="card in" style={{ borderLeft: '4px solid var(--pri)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="eyebrow" style={{ fontSize: '0.7em' }}>Active Intention</span>
            <span className="small">🔥 {streak} Day Streak</span>
          </div>
          <h2 style={{ margin: '6px 0' }}>{active.customName || active.data.title}</h2>
          <p className="small" style={{ fontStyle: 'italic', margin: '4px 0 10px' }}>
            "{active.data.affirmations?.[0]}"
          </p>
          <div className="acts">
            <button className="btn p" onClick={() => onNavigate('today')}>
              Open Today's Practice ☀️
            </button>
            <button className="btn" onClick={() => onNavigate('journal')}>
              Reflect in Journal 📖
            </button>
          </div>
        </div>
      )}

      {/* Growth Progress Section with Recharts Line Chart */}
      <GrowthProgressChart state={state} onNavigate={onNavigate} />

      <div className="tri">
        <div className="card">
          <div className="num">I</div>
          <h3>🗣️ Speak your wish</h3>
          <p>In your own words, however unpolished. Share your genuine desire without self-censorship.</p>
        </div>
        <div className="card">
          <div className="num">II</div>
          <h3>🪄 Receive your words</h3>
          <p>Affirmations, sensory visualization, future-self writing, and practical aligned action steps.</p>
        </div>
        <div className="card">
          <div className="num">III</div>
          <h3>🌿 Practise &amp; reflect</h3>
          <p>Return daily to build consistency, journal synchronicities, and take real steps in the world.</p>
        </div>
      </div>

      <div className="card" style={{ textAlign: 'center', marginTop: 14 }}>
        <h3>🔒 Kept in confidence</h3>
        <p className="small" style={{ maxWidth: 600, margin: '0 auto 10px' }}>
          Your saved manifestations, journals, vision boards, and streaks remain private on your device. Only the wish you submit is securely transmitted for AI generation.
        </p>
        <button className="btn" onClick={onOpenPrivacy}>
          View Privacy Transparency Details
        </button>
      </div>
    </>
  );
};
