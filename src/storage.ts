import { AppState, Challenge, SavedManifestation, VisionBoard } from './types';

export const THEMES: Record<string, [string, string, string, string, string, string]> = {
  rose: ['Rose', '#fff1f5', '#ffd6e3', '#3a1b28', '#b03a62', 'petal'],
  lavender: ['Lavender', '#f3eeff', '#d9ccff', '#2a2046', '#6d4fc2', 'star'],
  pearl: ['Pearl', '#fbfbfd', '#e6e8ef', '#26282e', '#5b6577', 'dot'],
  ocean: ['Ocean', '#e6f6ff', '#a8dcf5', '#0d2f45', '#1b6f9e', 'bubble'],
  sun: ['Sunlight', '#fffbe0', '#ffe68a', '#40340a', '#a87b00', 'ray'],
  sage: ['Sage', '#eef5ec', '#c5dcbf', '#1f3320', '#4a7c4f', 'leaf'],
  sunset: ['Sunset', '#fff0e3', '#ffb98a', '#48210c', '#c2500f', 'cloud'],
  crimson: ['Crimson', '#fff0f0', '#f2a3a3', '#3d0b0b', '#a01722', 'petal'],
  sky: ['Sky', '#eafcff', '#b5eaf7', '#0c3a44', '#127a8c', 'cloud'],
  midnight: ['Midnight', '#141a3a', '#05060f', '#eceefc', '#9aa7ff', 'star'],
  earth: ['Earth', '#f6efe4', '#d9c3a3', '#392a18', '#8a5a2b', 'leaf'],
  onyx: ['Onyx Black', '#0a0a0a', '#000000', '#f5f5f5', '#ff4fa3', 'comet'],
  gold: ['Gold', '#fff9ea', '#efd8a0', '#3c2f0d', '#a5801f', 'dot'],
};

export const SHAPES: Record<string, string> = {
  comet: 'width:3px!important;height:120px!important;border-radius:3px;background:linear-gradient(var(--pri),transparent)!important;transform:rotate(35deg)',
  petal: 'border-radius:50%;box-shadow:0 0 34px 12px var(--pri)',
  star: 'clip-path:polygon(50% 0,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0 50%,39% 39%)',
  dot: 'border-radius:50%',
  bubble: 'border-radius:50%;background:transparent!important;border:2px solid var(--pri)',
  leaf: 'border-radius:0 100% 0 100%',
  ray: 'width:6px!important;border-radius:6px;transform:rotate(25deg)',
  cloud: 'border-radius:60px;filter:blur(6px)',
};

export const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: 'c_3day',
    title: '3-Day Mental Reset',
    subtitle: 'Clear mental clutter and clarify your singular priority.',
    totalDays: 3,
    completedDays: [],
    tasks: [
      { day: 1, title: 'Brain Dump & Release', instruction: 'Spend 5 minutes writing every worry, then use the Release Tool to let them drift away.', reflectionPrompt: 'What weight felt lighter once you wrote it down?' },
      { day: 2, title: 'The One Core Wish', instruction: 'Choose just one desire for the next month. Formulate it without perfectionism.', reflectionPrompt: 'Why does this specific goal matter to your peace?' },
      { day: 3, title: 'First Grounded Action', instruction: 'Take one physical 10-minute action toward your wish today.', reflectionPrompt: 'How did taking physical action shift your energy?' },
    ],
  },
  {
    id: 'c_7self',
    title: '7-Day Self-Concept Shift',
    subtitle: 'Realign your identity with the person who naturally lives your wish.',
    totalDays: 7,
    completedDays: [],
    tasks: [
      { day: 1, title: 'Current Identity Inventory', instruction: 'List 3 stories you tell yourself about what you "always" or "never" do.', reflectionPrompt: 'Are these stories facts, or just repeated thoughts?' },
      { day: 2, title: 'The Future Persona', instruction: 'Write down 3 qualities of your future self who has reached this milestone.', reflectionPrompt: 'How does that future self breathe and speak?' },
      { day: 3, title: 'Mirror Work', instruction: 'Look into the mirror for 90 seconds and speak one heartfelt affirmation of worthiness.', reflectionPrompt: 'What resistance arose, and can you meet it with compassion?' },
      { day: 4, title: 'Setting a Gentle Boundary', instruction: 'Say no to one small demand that drains your focus.', reflectionPrompt: 'What space opened up when you honored your boundary?' },
      { day: 5, title: 'Future-Self Decision', instruction: 'Make one small daily choice (e.g. food, posture, tidy desk) as your future self.', reflectionPrompt: 'How did it feel to act from the future rather than the past?' },
      { day: 6, title: 'Reframe a Self-Doubt', instruction: 'Use the Affirmation Rewriter to transform one recurring self-doubt.', reflectionPrompt: 'Notice the sensation in your body when reading the reframe.' },
      { day: 7, title: 'Integration & Celebration', instruction: 'Write a note of deep appreciation to yourself for completing this week.', reflectionPrompt: 'What truth about yourself are you claiming now?' },
    ],
  },
  {
    id: 'c_7grat',
    title: '7-Day Gratitude Rampage',
    subtitle: 'Train your brain to perceive everyday evidence of abundance.',
    totalDays: 7,
    completedDays: [],
    tasks: [
      { day: 1, title: 'Body Appreciation', instruction: 'Acknowledge 3 things your body did for you today without you asking.', reflectionPrompt: 'What simple physical gift do you often take for granted?' },
      { day: 2, title: 'Micro-Pleasures', instruction: 'Notice 3 subtle pleasures today (a warm beverage, a soft breeze, a kind smile).', reflectionPrompt: 'How does paying attention to small joys shift your mood?' },
      { day: 3, title: 'Past Overcoming', instruction: 'Reflect on a past difficulty that taught you resilience.', reflectionPrompt: 'What inner strength did that challenge reveal in you?' },
      { day: 4, title: 'Unseen Helpers', instruction: 'Send quiet gratitude to someone who made your day easier or safer.', reflectionPrompt: 'Who supports your life behind the scenes?' },
      { day: 5, title: 'Anticipatory Gratitude', instruction: 'Thank the universe in advance for your wish as if it is already underway.', reflectionPrompt: 'How does feeling gratitude beforehand dissolve anxiety?' },
      { day: 6, title: 'Nature Connection', instruction: 'Spend 5 uninterrupted minutes observing something natural (sky, tree, plant).', reflectionPrompt: 'What does nature remind you about divine timing?' },
      { day: 7, title: 'The Abundance Overflow', instruction: 'Write 10 rapid gratitudes without filtering or overthinking.', reflectionPrompt: 'How expansive does your chest feel right now?' },
    ],
  },
  {
    id: 'c_21con',
    title: '21-Day Habit & Practice Anchor',
    subtitle: 'Build an unbreakable daily morning and evening manifestation ritual.',
    totalDays: 21,
    completedDays: [],
    tasks: Array.from({ length: 21 }, (_, i) => ({
      day: i + 1,
      title: `Day ${i + 1}: Daily Anchor`,
      instruction: 'Complete your morning practice, take 1 aligned micro-action, and mark your practice done.',
      reflectionPrompt: `Day ${i + 1}: What small victory did you claim today?`,
    })),
  },
  {
    id: 'c_30id',
    title: '30-Day Identity Transmutation',
    subtitle: 'A month of deep psychological alignment and steady progress.',
    totalDays: 30,
    completedDays: [],
    tasks: Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      title: `Day ${i + 1}: Embodiment`,
      instruction: 'Live through the eyes of the version of you who has already manifested peace.',
      reflectionPrompt: `Day ${i + 1}: What proof did you notice today that you are changing from within?`,
    })),
  },
];

const INITIAL_BOARDS: VisionBoard[] = [
  {
    id: 'vb_main',
    title: 'My Ideal Horizon',
    updatedAt: new Date().toISOString(),
    items: [
      { id: 'vbi_1', type: 'text', content: 'Calm mind, steady heart, limitless possibility.', color: '#b03a62' },
      { id: 'vbi_2', type: 'affirmation', content: 'I am worthy of peace, prosperity, and creative joy.', color: '#6d4fc2' },
      { id: 'vbi_3', type: 'goal', content: 'Cultivate deep financial freedom through purpose-led work.', color: '#1b6f9e' },
      { id: 'vbi_4', type: 'image', content: 'Morning sunlight through a window onto open journal', imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' },
      { id: 'vbi_5', type: 'image', content: 'Serene mountain dawn with pink clouds', imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80' },
    ],
  },
];

export const todayDateString = () => new Date().toISOString().slice(0, 10);

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem('mf');
    if (!raw) return getDefaultState();
    const data = JSON.parse(raw);

    // Merge with defaults to guarantee all fields exist without breaking legacy data
    const def = getDefaultState();
    return {
      mode: data.mode === 'light' ? 'light' : 'dark',
      theme: THEMES[data.theme] ? data.theme : 'rose',
      customTheme: data.customTheme || undefined,
      int: ['minimal', 'soft', 'immersive'].includes(data.int) ? data.int : 'soft',
      anim: ['off', 'subtle', 'dynamic'].includes(data.anim) ? data.anim : 'subtle',
      gfx: typeof data.gfx === 'boolean' ? data.gfx : true,
      fs: typeof data.fs === 'number' ? Math.max(14, Math.min(24, data.fs)) : 16,
      reducedMotion: Boolean(data.reducedMotion),
      highContrast: Boolean(data.highContrast),
      activeManifestationId: data.activeManifestationId ?? (data.saved?.[0]?.id || null),
      saved: Array.isArray(data.saved) ? data.saved : [],
      journal: Array.isArray(data.journal) ? data.journal : [],
      days: Array.isArray(data.days) ? data.days : [],
      counts: typeof data.counts === 'object' && data.counts ? data.counts : {},
      favoriteAffirmations: Array.isArray(data.favoriteAffirmations) ? data.favoriteAffirmations : [],
      visionBoards: Array.isArray(data.visionBoards) && data.visionBoards.length > 0 ? data.visionBoards : INITIAL_BOARDS,
      challenges: Array.isArray(data.challenges) && data.challenges.length > 0 ? data.challenges : INITIAL_CHALLENGES,
      routine: data.routine || null,
      user: data.user || null,
    };
  } catch (e) {
    return getDefaultState();
  }
}

export function saveState(state: AppState) {
  try {
    localStorage.setItem('mf', JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state to localStorage:', e);
  }
}

export function getDefaultState(): AppState {
  return {
    mode: 'dark',
    theme: 'rose',
    int: 'soft',
    anim: 'subtle',
    gfx: true,
    fs: 16,
    reducedMotion: false,
    highContrast: false,
    activeManifestationId: null,
    saved: [],
    journal: [],
    days: [],
    counts: {},
    favoriteAffirmations: [
      'I am grounded, capable, and guided by my genuine intentions.',
      'My pace is peaceful, and my focus creates real momentum.',
      'I welcome clarity, aligned opportunities, and steady growth.',
    ],
    visionBoards: INITIAL_BOARDS,
    challenges: INITIAL_CHALLENGES,
    routine: null,
    user: null,
  };
}

export function calcStreak(days: string[]): number {
  if (!days || !days.length) return 0;
  let streak = 0;
  const d = new Date();
  const today = todayDateString();

  if (!days.includes(today)) {
    d.setDate(d.getDate() - 1);
  }

  while (days.includes(d.toISOString().slice(0, 10))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }

  return streak;
}

export function getActiveManifestation(state: AppState): SavedManifestation | null {
  if (!state.saved || state.saved.length === 0) return null;
  if (state.activeManifestationId) {
    const found = state.saved.find(s => s.id === state.activeManifestationId);
    if (found) return found;
  }
  return state.saved[0] || null;
}
