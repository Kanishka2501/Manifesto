import React, { useState } from 'react';
import { AppState, CustomTheme } from '../types';
import { THEMES } from '../storage';
import { sound } from '../audio';
import { toast } from '../toast';

interface SettingsViewProps {
  state: AppState;
  onUpdateState: (fn: (prev: AppState) => AppState) => void;
  onResetData: () => void;
  onOpenPrivacy: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ state, onUpdateState, onResetData, onOpenPrivacy }) => {
  // Custom theme builder form state
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [customName, setCustomName] = useState('My Sanctuary');
  const [customBg1, setCustomBg1] = useState('#fff1f5');
  const [customBg2, setCustomBg2] = useState('#ffd6e3');
  const [customInk, setCustomInk] = useState('#3a1b28');
  const [customPri, setCustomPri] = useState('#b03a62');
  const [customShape, setCustomShape] = useState('petal');

  const themeKeys = Object.keys(THEMES);

  // Audited "Surprise Me": Exactly equal probability for all 13 themes
  const handleSurpriseMe = () => {
    const randomIndex = Math.floor(Math.random() * themeKeys.length);
    const chosenTheme = themeKeys[randomIndex];
    onUpdateState(prev => ({
      ...prev,
      theme: chosenTheme,
      customTheme: undefined,
    }));
    sound.playChime(528, 1.2);
  };

  const handleSelectTheme = (themeKey: string) => {
    onUpdateState(prev => ({
      ...prev,
      theme: themeKey,
      customTheme: undefined,
    }));
    sound.playChime(432, 0.8);
  };

  const handleSaveCustomTheme = () => {
    const createdTheme: CustomTheme = {
      name: customName.trim() || 'Custom Sanctuary',
      bg1: customBg1,
      bg2: customBg2,
      ink: customInk,
      pri: customPri,
      shape: customShape,
    };

    onUpdateState(prev => ({
      ...prev,
      customTheme: createdTheme,
    }));

    sound.playChime(528, 2.0);
    toast(`Custom theme "${createdTheme.name}" applied and saved!`);
  };

  const handleExportAllData = () => {
    const jsonStr = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manifest-complete-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="card in">
        <h2>🎨 Appearance &amp; Sanctuary Atmosphere</h2>
        <p className="small" style={{ marginBottom: 14 }}>
          Fine-tune colors, sacred atmospheres, lighting, and accessibility to suit your personal aesthetic.
        </p>

        {/* Light / Dark Mode */}
        <div className="row" style={{ marginBottom: 14 }}>
          <button
            className="btn p"
            onClick={() => {
              onUpdateState(prev => ({
                ...prev,
                mode: prev.mode === 'light' ? 'dark' : 'light',
              }));
              sound.playChime(432, 0.8);
            }}
          >
            {state.mode === 'light' ? '☀ Light Mode (Tap for Dark)' : '🌙 Dark Mode (Tap for Light)'}
          </button>
        </div>

        {/* 13 Theme Swatches */}
        <div style={{ marginBottom: 14 }}>
          <span className="eyebrow" style={{ fontSize: '0.7em', display: 'block', marginBottom: 8 }}>
            13 Sacred Theme Palettes
          </span>
          <div className="row" style={{ alignItems: 'center' }}>
            {Object.entries(THEMES).map(([k, t]) => {
              const isSelected = state.theme === k && !state.customTheme;
              return (
                <button
                  key={k}
                  className="sw"
                  aria-label={t[0]}
                  title={`${t[0]} (${t[5]} atmosphere)`}
                  style={{
                    background: `linear-gradient(135deg, ${t[1]}, ${t[4]})`,
                    transform: isSelected ? 'scale(1.28) rotate(6deg)' : undefined,
                    boxShadow: isSelected ? '0 0 16px var(--pri), 0 0 0 3px #fff' : undefined,
                  }}
                  onClick={() => handleSelectTheme(k)}
                />
              );
            })}
            <button className="btn" onClick={handleSurpriseMe} title="Audited 1/13 equal probability selection">
              🎲 Surprise Me
            </button>
          </div>
          <span className="small" style={{ opacity: 0.75, display: 'block', marginTop: 4 }}>
            Current Theme: <b>{state.customTheme ? state.customTheme.name : THEMES[state.theme]?.[0]}</b> ({state.customTheme ? state.customTheme.shape : THEMES[state.theme]?.[5]} atmosphere)
          </span>
        </div>

        {/* Custom Theme Builder Toggle */}
        <div style={{ margin: '14px 0' }}>
          <button
            className="btn"
            onClick={() => setShowCustomBuilder(!showCustomBuilder)}
          >
            {showCustomBuilder ? '▲ Hide Custom Theme Builder' : '✨ Create Your Own Theme'}
          </button>
        </div>

        {/* Custom Theme Builder Form */}
        {showCustomBuilder && (
          <div className="card in" style={{ background: 'rgba(255,255,255,0.06)', padding: '16px' }}>
            <h3 style={{ margin: '0 0 8px' }}>🛠️ Custom Theme Studio</h3>
            <p className="small" style={{ margin: '0 0 12px' }}>
              Compose bespoke colors and kinetic shapes for your sanctuary.
            </p>

            <div className="row">
              <label className="small">
                Theme Name
                <input
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="e.g. Celestial Dawn"
                />
              </label>
              <label className="small">
                Graphic Shape
                <select value={customShape} onChange={e => setCustomShape(e.target.value)}>
                  <option value="petal">Petals (Floral)</option>
                  <option value="star">Stars (Celestial)</option>
                  <option value="bubble">Bubbles (Aqueous)</option>
                  <option value="leaf">Leaves (Botanical)</option>
                  <option value="ray">Rays (Solar)</option>
                  <option value="cloud">Clouds (Atmospheric)</option>
                  <option value="comet">Comets (Ethereal Streak)</option>
                  <option value="dot">Pearlescent Shimmer</option>
                </select>
              </label>
            </div>

            <div className="row" style={{ marginTop: 10 }}>
              <label className="small">
                Primary Color
                <input
                  type="color"
                  value={customPri}
                  onChange={e => setCustomPri(e.target.value)}
                  style={{ height: 42, padding: 2 }}
                />
              </label>
              <label className="small">
                Background 1
                <input
                  type="color"
                  value={customBg1}
                  onChange={e => setCustomBg1(e.target.value)}
                  style={{ height: 42, padding: 2 }}
                />
              </label>
              <label className="small">
                Background 2
                <input
                  type="color"
                  value={customBg2}
                  onChange={e => setCustomBg2(e.target.value)}
                  style={{ height: 42, padding: 2 }}
                />
              </label>
              <label className="small">
                Ink / Text Color
                <input
                  type="color"
                  value={customInk}
                  onChange={e => setCustomInk(e.target.value)}
                  style={{ height: 42, padding: 2 }}
                />
              </label>
            </div>

            <div className="acts" style={{ marginTop: 12 }}>
              <button className="btn p" onClick={handleSaveCustomTheme}>
                💾 Save &amp; Apply Custom Theme
              </button>
            </div>
          </div>
        )}

        {/* Atmosphere and Typography settings */}
        <div className="row" style={{ marginTop: 14 }}>
          <label className="small">
            Atmospheric Intensity
            <select
              value={state.int}
              onChange={e => onUpdateState(prev => ({ ...prev, int: e.target.value as any }))}
            >
              <option value="minimal">Minimal (6 particles)</option>
              <option value="soft">Soft (14 particles)</option>
              <option value="immersive">Immersive (26 particles)</option>
            </select>
          </label>

          <label className="small">
            Animation Dynamics
            <select
              value={state.anim}
              onChange={e => onUpdateState(prev => ({ ...prev, anim: e.target.value as any }))}
            >
              <option value="subtle">Subtle</option>
              <option value="dynamic">Dynamic</option>
              <option value="off">Off</option>
            </select>
          </label>

          <label className="small">
            Floating Graphics
            <select
              value={state.gfx ? 'on' : 'off'}
              onChange={e => onUpdateState(prev => ({ ...prev, gfx: e.target.value === 'on' }))}
            >
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
          </label>

          <label className="small">
            Base Font Size ({state.fs}px)
            <input
              type="range"
              min="14"
              max="22"
              value={state.fs}
              onChange={e => onUpdateState(prev => ({ ...prev, fs: Number(e.target.value) }))}
              style={{ marginTop: 6 }}
            />
          </label>
        </div>

        {/* Accessibility & Motion */}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 14, marginTop: 14 }}>
          <span className="eyebrow" style={{ fontSize: '0.7em', display: 'block', marginBottom: 8 }}>
            Accessibility &amp; Motion Controls
          </span>
          <div className="row">
            <button
              className={`btn ${state.reducedMotion ? 'p' : ''}`}
              onClick={() => onUpdateState(prev => ({ ...prev, reducedMotion: !prev.reducedMotion }))}
            >
              Reduced Motion: {state.reducedMotion ? 'ON' : 'OFF'}
            </button>
            <button
              className={`btn ${state.highContrast ? 'p' : ''}`}
              onClick={() => onUpdateState(prev => ({ ...prev, highContrast: !prev.highContrast }))}
            >
              High Contrast: {state.highContrast ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Data Management & Privacy */}
      <div className="card in">
        <h3>🔒 Sanctuary Data &amp; Privacy</h3>
        <p className="small">
          Your saved manifestations, journals, streak history, and vision boards are stored on this device.
        </p>

        <div className="acts" style={{ marginTop: 12 }}>
          <button className="btn" onClick={handleExportAllData}>
            📦 Backup Complete Sanctuary (JSON)
          </button>
          <button className="btn" onClick={onOpenPrivacy}>
            Transparency Policy 📋
          </button>
          <button
            className="btn"
            style={{ color: '#ff4fa3', borderColor: '#ff4fa3' }}
            onClick={() => {
              if (confirm('Permanently delete all saved data on this device? This action cannot be reversed.')) {
                onResetData();
              }
            }}
          >
            🗑️ Delete All My Data
          </button>
        </div>
      </div>
    </>
  );
};
