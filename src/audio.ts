// Safe, royalty-free audio synthesis and speech reading for Manifestation practices

export type SoundscapePreset = 'harmony' | 'om' | 'crystal' | 'stream';

class ManifestAudio {
  private ctx: AudioContext | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;

  // Soundscape audio nodes
  private soundscapeMasterGain: GainNode | null = null;
  private soundscapeSources: { stop?: () => void; disconnect?: () => void }[] = [];
  private soundscapeActive = false;
  private currentPreset: SoundscapePreset = 'harmony';
  private currentVolume = 0.5;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Starts or updates looping synthesized Zen soundscape
  startSoundscape(preset: SoundscapePreset = 'harmony', volume = 0.5) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // If already playing this preset, just update volume
    if (this.soundscapeActive && this.currentPreset === preset && this.soundscapeMasterGain) {
      this.setSoundscapeVolume(volume);
      return;
    }

    // Stop existing soundscape if switching preset
    this.stopSoundscape(false);

    this.currentPreset = preset;
    this.currentVolume = Math.max(0.01, Math.min(1, volume));

    try {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, now);
      // Smooth fade in over 1.6s
      masterGain.gain.exponentialRampToValueAtTime(this.currentVolume * 0.45, now + 1.6);
      masterGain.connect(ctx.destination);
      this.soundscapeMasterGain = masterGain;

      const sources: { stop?: () => void; disconnect?: () => void }[] = [];

      // Frequencies for each preset
      let freqs: number[] = [108, 216, 432];
      if (preset === 'om') {
        freqs = [68.05, 136.1, 272.2];
      } else if (preset === 'crystal') {
        freqs = [264, 528, 792];
      } else if (preset === 'stream') {
        freqs = [144, 216];
      }

      // Base harmonic tone cluster
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = idx === 0 ? 'sine' : idx === 1 ? 'triangle' : 'sine';
        // Subtle micro-detuning for binaural warmth
        osc.frequency.setValueAtTime(freq + (idx === 1 ? 0.35 : -0.25), now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(preset === 'crystal' ? 1200 : 450, now);

        // Gentle volume balance per harmonic
        const layerVol = idx === 0 ? 0.28 : idx === 1 ? 0.18 : 0.12;
        oscGain.gain.setValueAtTime(layerVol, now);

        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(masterGain);

        osc.start(now);
        sources.push(osc);
      });

      // Slow undulating LFO breathing swell
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(preset === 'om' ? 0.06 : 0.09, now); // ~11-second breathing wave
      lfoGain.gain.setValueAtTime(this.currentVolume * 0.08, now);

      lfo.connect(lfoGain.gain);
      lfo.start(now);
      sources.push(lfo);

      // Filtered noise generator for subtle organic texture / rain / breeze
      if (preset === 'stream' || preset === 'harmony') {
        const bufferSize = ctx.sampleRate * 2; // 2 seconds of pink/brownish noise
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99 * b0 + white * 0.05;
          b1 = 0.96 * b1 + white * 0.07;
          b2 = 0.88 * b2 + white * 0.1;
          output[i] = (b0 + b1 + b2) * 0.25;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(preset === 'stream' ? 420 : 280, now);
        noiseFilter.Q.setValueAtTime(1.8, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(preset === 'stream' ? 0.18 : 0.05, now);

        whiteNoise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);

        whiteNoise.start(now);
        sources.push(whiteNoise);
      }

      this.soundscapeSources = sources;
      this.soundscapeActive = true;
    } catch (err) {
      console.warn('Soundscape AudioContext init paused or blocked:', err);
    }
  }

  // Stops the soundscape with smooth 1.2s fade-out
  stopSoundscape(fade = true) {
    if (!this.soundscapeMasterGain || !this.soundscapeActive) {
      this.soundscapeActive = false;
      return;
    }

    const ctx = this.getAudioContext();
    const currentGain = this.soundscapeMasterGain;
    const currentSources = [...this.soundscapeSources];

    this.soundscapeActive = false;
    this.soundscapeSources = [];
    this.soundscapeMasterGain = null;

    if (ctx && fade) {
      try {
        const now = ctx.currentTime;
        currentGain.gain.setValueAtTime(currentGain.gain.value, now);
        currentGain.gain.exponentialRampToValueAtTime(0.00001, now + 1.2);
        setTimeout(() => {
          currentSources.forEach(s => {
            try {
              s.stop?.();
              s.disconnect?.();
            } catch (_) {}
          });
        }, 1300);
      } catch (_) {
        currentSources.forEach(s => {
          try {
            s.stop?.();
            s.disconnect?.();
          } catch (_) {}
        });
      }
    } else {
      currentSources.forEach(s => {
        try {
          s.stop?.();
          s.disconnect?.();
        } catch (_) {}
      });
    }
  }

  setSoundscapeVolume(vol: number) {
    this.currentVolume = Math.max(0.01, Math.min(1, vol));
    if (this.soundscapeMasterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.soundscapeMasterGain.gain.setValueAtTime(this.soundscapeMasterGain.gain.value, now);
      this.soundscapeMasterGain.gain.exponentialRampToValueAtTime(this.currentVolume * 0.45, now + 0.3);
    }
  }

  get isSoundscapePlaying() {
    return this.soundscapeActive;
  }

  get soundscapePreset() {
    return this.currentPreset;
  }

  get soundscapeVolume() {
    return this.currentVolume;
  }

  // Plays a soft singing bowl / crystal chime tone
  playChime(freq = 432, duration = 3.5) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Soft harmonic chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      // Gentle subtle vibrato
      osc.frequency.exponentialRampToValueAtTime(freq * 0.998, ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio autoplay policy or unavailable
    }
  }

  // Play gentle breathing bell (higher tone for inhale, deeper tone for exhale)
  playBreathBell(isInhale: boolean) {
    this.playChime(isInhale ? 528 : 396, 2.8);
  }

  // Speak text with calm, soothing pacing
  speak(text: string, onEnd?: () => void, onStart?: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return false;
    }

    this.stopSpeaking();

    const cleanText = text.replace(/[*#_~]/g, '').trim();
    if (!cleanText) return false;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    this.currentUtterance = utterance;

    // Pick a natural, calming voice if available
    const voices = window.speechSynthesis.getVoices();
    const calmVoice =
      voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Serena') || v.name.includes('Google') || v.name.includes('Karen'))) ||
      voices.find(v => v.lang.startsWith('en')) ||
      voices[0];

    if (calmVoice) utterance.voice = calmVoice;
    utterance.rate = 0.88; // Gentle, reflective pace
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isSpeaking = true;
      onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      onEnd?.();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
    return true;
  }

  stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  get speaking() {
    return this.isSpeaking;
  }
}

export const sound = new ManifestAudio();
