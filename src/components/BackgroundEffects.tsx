import React, { useEffect, useRef } from 'react';
import { THEMES, SHAPES } from '../storage';
import { AppState } from '../types';

interface BackgroundEffectsProps {
  state: AppState;
}

export const BackgroundEffects: React.FC<BackgroundEffectsProps> = ({ state }) => {
  const bgRef = useRef<HTMLDivElement>(null);

  // Apply theme CSS variables and generate background elements
  useEffect(() => {
    const t = state.customTheme
      ? [state.customTheme.name, state.customTheme.bg1, state.customTheme.bg2, state.customTheme.ink, state.customTheme.pri, state.customTheme.shape]
      : THEMES[state.theme] || THEMES.rose;

    const r = document.documentElement.style;
    r.setProperty('--bg1', t[1]);
    r.setProperty('--bg2', t[2]);
    r.setProperty('--ink', t[3]);
    r.setProperty('--pri', t[4]);
    r.setProperty('--fs', `${state.fs}px`);

    const inh = ['midnight', 'onyx'].includes(state.theme);
    const dark = inh || state.mode !== 'light';
    document.body.dataset.t = dark ? 'dark' : 'light';

    if (dark && !inh) {
      r.setProperty('--bg1', `color-mix(in srgb, ${t[4]} 20%, #06060c)`);
      r.setProperty('--bg2', `color-mix(in srgb, ${t[4]} 8%, #000)`);
      r.setProperty('--ink', '#f5f3f7');
      r.setProperty('--pri', `color-mix(in srgb, ${t[4]} 65%, #fff)`);
    }

    r.setProperty('--card', dark ? 'rgba(18, 18, 26, 0.72)' : 'rgba(255, 255, 255, 0.78)');
    document.body.dataset.anim = state.anim;

    if (state.reducedMotion) {
      document.body.classList.add('reduced-motion');
    } else {
      document.body.classList.remove('reduced-motion');
    }

    if (state.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    const bg = bgRef.current;
    if (!bg) return;
    bg.innerHTML = '';

    if (state.gfx && !state.reducedMotion && state.anim !== 'off') {
      // Atmospheric glowing blurred auras
      for (let a = 0; a < 3; a++) {
        const e = document.createElement('div');
        e.className = 'au';
        e.style.cssText = `width:${34 + a * 10}vw;height:${34 + a * 10}vw;left:${a * 32 - 8}%;top:${a * 22 - 10}%;animation-delay:-${a * 5}s`;
        bg.appendChild(e);
      }

      // Dynamic floating shape particles
      const count = { minimal: 6, soft: 14, immersive: 26 }[state.int] || 14;
      const shapeStyle = SHAPES[t[5]] || SHAPES.petal;

      for (let i = 0; i < count; i++) {
        const e = document.createElement('i');
        const z = 14 + Math.random() * 38;
        e.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;width:${z}px;height:${z}px;--op:${(
          0.12 +
          Math.random() * 0.25
        ).toFixed(2)};--d:${10 + Math.random() * 12}s;--dl:-${Math.random() * 10}s;${shapeStyle}`;
        bg.appendChild(e);
      }
    }
  }, [state.theme, state.customTheme, state.mode, state.int, state.anim, state.gfx, state.fs, state.reducedMotion, state.highContrast]);

  // Pointer move glow and sparkles
  useEffect(() => {
    let lastTime = 0;

    const spark = (x: number, y: number, n: number) => {
      if (state.anim === 'off' || !state.gfx || state.reducedMotion) return;
      const priColor = getComputedStyle(document.documentElement).getPropertyValue('--pri').trim() || '#b03a62';
      const colors = [priColor, '#ffffff', '#ffe98a'];

      for (let i = 0; i < n; i++) {
        const e = document.createElement('i');
        e.className = 'sp';
        const a = Math.random() * 6.28;
        const d = 30 + Math.random() * 55;
        e.style.cssText = `left:${x}px;top:${y}px;--z:${5 + Math.random() * 10}px;--c:${colors[i % 3]};--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d}px`;
        document.body.appendChild(e);
        setTimeout(() => e.remove(), 950);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const target = (e.target as HTMLElement)?.closest?.('.card, .btn, nav button') as HTMLElement | null;
      if (target) {
        const rect = target.getBoundingClientRect();
        target.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        target.style.setProperty('--my', `${e.clientY - rect.top}px`);
      }

      const now = Date.now();
      if (now - lastTime > 80) {
        lastTime = now;
        spark(e.clientX, e.clientY, 1);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      spark(e.clientX, e.clientY, 12);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [state.anim, state.gfx, state.reducedMotion]);

  return <div id="bg" ref={bgRef} aria-hidden="true" />;
};
