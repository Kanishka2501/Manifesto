import React, { useState, useEffect } from 'react';
import { sound } from '../audio';

interface DailyAffirmationCardProps {
  onAddFavorite?: (text: string) => void;
  favoriteAffirmations?: string[];
  isFavorited?: boolean;
}

const DAILY_AFFIRMATIONS = [
  'I am rooted in my own worth, moving at a pace that honors my soul.',
  'Everything I need to take the next brave step is already within me.',
  'My mind is calm, my heart is open, and my focus creates real momentum.',
  'I release the urge to control the timeline and trust the quiet power of daily dedication.',
  'I am worthy of peace, creative abundance, and genuine fulfillment.',
  'Where I place my attention, my life naturally blossoms.',
  'I meet uncertainty with steady breath and curiosity rather than fear.',
  'My thoughts are intentional seeds; I choose to nurture what is good and true.',
  'I allow myself to receive the ease, support, and clarity waiting for me today.',
  'I am becoming the person who naturally lives my deepest intentions.',
  'Small, grounded actions taken in faith move mountains over time.',
  'I release comparison and celebrate the sacred authenticity of my unique journey.',
  'Today I choose presence over hurry, and gratitude over doubt.',
  'I am deeply deserving of love, respect, and prosperous new beginnings.',
  'The universe supports my honest labor and rewards my quiet discipline.',
];

export const DailyAffirmationCard: React.FC<DailyAffirmationCardProps> = ({
  onAddFavorite,
  favoriteAffirmations,
  isFavorited,
}) => {
  const [affirmation, setAffirmation] = useState('');
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [justFavorited, setJustFavorited] = useState(false);

  const favorited =
    justFavorited ||
    (favoriteAffirmations && affirmation ? favoriteAffirmations.includes(affirmation) : false) ||
    isFavorited ||
    false;

  // Pick a random affirmation on load
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * DAILY_AFFIRMATIONS.length);
    setAffirmation(DAILY_AFFIRMATIONS[randomIndex]);
  }, []);

  const handleShuffle = () => {
    let nextIndex = Math.floor(Math.random() * DAILY_AFFIRMATIONS.length);
    if (DAILY_AFFIRMATIONS[nextIndex] === affirmation && DAILY_AFFIRMATIONS.length > 1) {
      nextIndex = (nextIndex + 1) % DAILY_AFFIRMATIONS.length;
    }
    setAffirmation(DAILY_AFFIRMATIONS[nextIndex]);
    setCopied(false);
    setJustFavorited(false);
    sound.playChime(528, 1.2);
  };

  const handleShare = async () => {
    const shareText = `"${affirmation}" — via Manifest`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Daily Affirmation · Manifest',
          text: shareText,
          url: window.location.href,
        });
        return;
      } catch (err) {
        // Fallback to clipboard if share was cancelled or unsupported
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      sound.playChime(432, 1.2);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      // Manual fallback
      prompt('Copy this affirmation:', shareText);
    }
  };

  const handleSpeak = () => {
    if (speaking) {
      sound.stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    sound.speak(
      affirmation,
      () => setSpeaking(false),
      () => setSpeaking(true)
    );
  };

  const handleFavorite = () => {
    if (onAddFavorite) {
      onAddFavorite(affirmation);
    }
    setJustFavorited(true);
    sound.playChime(528, 1.5);
  };

  if (!affirmation) return null;

  return (
    <div
      className="card in"
      style={{
        margin: '16px 0',
        padding: '24px 20px',
        textAlign: 'center',
        background: 'color-mix(in srgb, var(--card) 92%, var(--pri))',
        border: '1px solid var(--pri)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className="eyebrow" style={{ fontSize: '0.72em' }}>
          💫 Daily Affirmation
        </span>
        <button
          className="btn"
          style={{ padding: '3px 10px', fontSize: '0.74em' }}
          onClick={handleShuffle}
          title="Receive another affirmation"
        >
          🎲 New Affirmation
        </button>
      </div>

      <div className="orn" style={{ margin: '8px auto 14px' }}>
        <span>❦</span>
      </div>

      <p
        style={{
          fontSize: 'clamp(1.2em, 4vw, 1.5em)',
          fontStyle: 'italic',
          lineHeight: 1.45,
          margin: '12px auto',
          maxWidth: 620,
          color: 'var(--ink)',
        }}
      >
        "{affirmation}"
      </p>

      {copied && (
        <div
          className="in"
          style={{
            display: 'inline-block',
            margin: '6px 0 10px',
            padding: '4px 12px',
            borderRadius: 4,
            background: 'var(--pri)',
            color: '#fff',
            fontSize: '0.82em',
            fontWeight: 600,
          }}
        >
          ✓ Copied to clipboard! Ready to share.
        </div>
      )}

      <div className="acts" style={{ justifyContent: 'center', marginTop: 14 }}>
        <button
          className="btn p"
          onClick={handleShare}
          title="Share this affirmation (copies to clipboard or opens device share sheet)"
        >
          {copied ? '✓ Copied' : '📤 Share Affirmation'}
        </button>

        <button
          className="btn"
          onClick={handleSpeak}
          title={speaking ? 'Stop speech' : 'Listen with calm voice'}
        >
          {speaking ? '⏹️ Stop' : '🔊 Listen'}
        </button>

        <button
          className="btn"
          onClick={handleFavorite}
          disabled={favorited}
          title="Save to your favorite affirmations"
        >
          {favorited ? '★ Saved' : '☆ Favorite'}
        </button>
      </div>
    </div>
  );
};
