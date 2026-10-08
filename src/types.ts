export interface ManifestationKit {
  intent: string;
  title: string;
  affirmations: string[];
  manifestation_script: string;
  visualization: string;
  future_self: string;
  ideal_life: string;
  gratitude: string[];
  self_concept: string[];
  morning_practice: string[] | string;
  night_practice: string[] | string;
  recommended_technique: string;
  vision_board_ideas: string[];
  action_steps: string[];
  reflection_prompt: string;
}

export interface SavedManifestation {
  id: number;
  createdAt: string;
  data: ManifestationKit;
  isFavorite?: boolean;
  customName?: string;
}

export interface JournalEntry {
  id: number;
  type: string;
  tags: string;
  text: string;
  at: string;
}

export interface VisionBoardItem {
  id: string;
  type: 'text' | 'affirmation' | 'goal' | 'image';
  content: string;
  imageUrl?: string;
  color?: string;
  x?: number;
  y?: number;
}

export interface VisionBoard {
  id: string;
  title: string;
  items: VisionBoardItem[];
  updatedAt: string;
}

export interface DailyChallengeTask {
  day: number;
  title: string;
  instruction: string;
  reflectionPrompt: string;
}

export interface Challenge {
  id: string;
  title: string;
  subtitle: string;
  totalDays: number;
  completedDays: number[];
  tasks: DailyChallengeTask[];
  notes?: Record<number, string>;
  active?: boolean;
}

export interface PracticeRoutine {
  routineName: string;
  morning: { duration: string; practice: string; details: string };
  afternoon: { duration: string; practice: string; details: string };
  evening: { duration: string; practice: string; details: string };
  dailyAction: string;
  mantra: string;
}

export interface CustomTheme {
  name: string;
  bg1: string;
  bg2: string;
  ink: string;
  pri: string;
  shape: string;
}

export interface AppState {
  mode: 'light' | 'dark';
  theme: string;
  customTheme?: CustomTheme;
  int: 'minimal' | 'soft' | 'immersive';
  anim: 'off' | 'subtle' | 'dynamic';
  gfx: boolean;
  fs: number;
  reducedMotion: boolean;
  highContrast: boolean;
  activeManifestationId: number | null;
  saved: SavedManifestation[];
  journal: JournalEntry[];
  days: string[];
  counts: Record<string, number>;
  favoriteAffirmations: string[];
  visionBoards: VisionBoard[];
  challenges: Challenge[];
  routine: PracticeRoutine | null;
  user: { email?: string; name?: string; loggedIn: boolean } | null;
}
