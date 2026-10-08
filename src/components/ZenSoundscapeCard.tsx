import React, { useState, useEffect } from 'react';
import { sound, SoundscapePreset } from '../audio';

const PRESETS: { id: SoundscapePreset; name: string; desc: string }[] = [
  { id: 'harmony', name: '🌿 432 Hz Inner Harmony', desc: 'Solfeggio harmonic theta wave for calm, grounded presence' },
  { id: 'om', name: '🪐 136.1 Hz Cosmic Om', desc: 'Deep earth resonance to center breath and dissolve restlessness' },
  { id: 'crystal', name: '✨ 528 Hz Crystal Frequency', desc: 'Crystalline frequency of clarity, self-love, and transformation' },
  { id: 'stream', name: '🍃 Forest Stream & Breeze', desc: 'Soothing organic stream and gentle wind breeze' },
];

export const ZenSoundscapeCard: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(sound.isSoundscapePlaying);
  const [preset, setPreset] = useState<SoundscapePreset>(sound.soundscapePreset);
  const [volume, setVolume] = useState<number>(sound.soundscapeVolume || 0.5);

  useEffect(() => {
    // Keep state in sync with audio engine
    setIsPlaying(sound.isSoundscapePlaying);
  }, []);

  const handleToggle = () => {
    if (isPlaying) {
      sound.stopSoundscape(true);
      setIsPlaying(false);
    } else {
      sound.startSoundscape(preset, volume);
      setIsPlaying(true);
      sound.playChime(528, 1.2);
    }
  };

  const handlePresetChange = (newPreset: SoundscapePreset) => {
    setPreset(newPreset);
    if (isPlaying) {
      sound.startSoundscape(newPreset, volume);
      sound.playChime(432, 1.0);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    sound.setSoundscapeVolume(newVol);
  };

  return (
    <div
      className="card in"
      style={{
        margin: '16px 0',
        padding: '18px 20px',
        border: isPlaying ? '1px solid var(--pri)' : '1px solid rgba(255,255,255,0.12)',
        background: isPlaying
          ? 'color-mix(in srgb, var(--card) 90%, var(--pri))'
          : 'var(--card)',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.4em' }}>{isPlaying ? '🌊' : '🎵'}</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: '1.1em' }}>Zen Soundscape</h3>
              {isPlaying && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: '0.7em',
                    padding: '2px 8px',
                    borderRadius: 12,
                    background: 'var(--pri)',
                    color: '#fff',
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#fff',
                      animation: 'pulse 1.5s infinite',
                    }}
                  />
                  Live Flow
                </span>
              )}
            </div>
            <p className="small" style={{ margin: '2px 0 0', opacity: 0.85 }}>
              Continuous, ambient harmonic waves synthesized in real-time via Web Audio API.
            </p>
          </div>
        </div>

        <button
          className={`btn ${isPlaying ? 'p' : ''}`}
          onClick={handleToggle}
          style={{ minWidth: 150, padding: '8px 16px', fontSize: '0.82em' }}
        >
          {isPlaying ? '⏹️ Stop Soundscape' : '▶️ Play Zen Soundscape'}
        </button>
      </div>

      {isPlaying && (
        <div
          className="in"
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* Preset Buttons */}
          <div>
            <span className="eyebrow" style={{ fontSize: '0.68em', display: 'block', marginBottom: 6 }}>
              Atmosphere Frequency
            </span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PRESETS.map(p => (
                <button
                  key={p.id}
                  className={`btn ${preset === p.id ? 'p' : ''}`}
                  style={{ fontSize: '0.76em', padding: '5px 11px' }}
                  onClick={() => handlePresetChange(p.id)}
                  title={p.desc}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <p className="small" style={{ margin: '6px 0 0', fontStyle: 'italic', opacity: 0.8 }}>
              {PRESETS.find(p => p.id === preset)?.desc}
            </p>
          </div>

          {/* Volume Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 360 }}>
            <span className="small" style={{ whiteSpace: 'nowrap' }}>
              Volume: {Math.round(volume * 100)}%
            </span>
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={volume}
              onChange={e => handleVolumeChange(parseFloat(e.target.value))}
              style={{ flex: 1, margin: 0 }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
