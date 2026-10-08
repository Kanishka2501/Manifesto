import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// Express body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Resilient model caller that handles regional surges transparently
async function generateWithModelFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
  }
) {
  const models = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let lastErr: any;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await ai.models.generateContent({
          model,
          ...params,
        });
      } catch (err: any) {
        lastErr = err;
        const isQuota =
          err?.status === 429 ||
          err?.message?.includes('429') ||
          err?.message?.includes('RESOURCE_EXHAUSTED') ||
          err?.message?.includes('resource_exhausted') ||
          err?.message?.includes('Quota') ||
          err?.message?.includes('quota');

        if (isQuota) {
          // Immediately throw so endpoint graceful fallback responds instantly
          throw err;
        }

        const isTransient =
          err?.status === 503 ||
          err?.message?.includes('503') ||
          err?.message?.includes('high demand') ||
          err?.message?.includes('UNAVAILABLE') ||
          err?.message?.includes('overloaded') ||
          err?.message?.includes('not found') ||
          err?.status === 404;

        if (isTransient) {
          console.warn(`Transient surge on ${model} (attempt ${attempt + 1}), pausing briefly...`);
          await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
          continue;
        }
        throw err;
      }
    }
  }
  throw lastErr;
}
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const ipRateLimits = new Map<string, RateLimitRecord>();
const MAX_REQUESTS_PER_WINDOW = 30; // 30 AI requests
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

const stats = {
  startedAt: new Date().toISOString(),
  generationsCount: 0,
  rewritesCount: 0,
  journalAiCount: 0,
  errorsCount: 0,
  feedbacks: [] as Array<{ id: string; type: string; message: string; date: string }>,
};

function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  let record = ipRateLimits.get(ip);

  if (!record || now > record.resetAt) {
    record = { count: 0, resetAt: now + WINDOW_MS };
    ipRateLimits.set(ip, record);
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({
      code: 'rate_limited',
      error: 'You have reached the AI request limit for this session window. Please take a mindful moment and try again shortly.',
    });
    return;
  }

  record.count++;
  next();
}

// Lazy Gemini client getter
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    model: 'gemini-3.8-flash',
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// Helper to sanitize array of strings
function sanitizeStringArray(val: unknown, fallbackCount = 3, fallbackPrefix = 'Intention'): string[] {
  if (Array.isArray(val)) {
    const cleaned = val.map(x => String(x ?? '').trim()).filter(Boolean);
    if (cleaned.length > 0) return cleaned;
  } else if (typeof val === 'string' && val.trim()) {
    const lines = val.split('\n').map(s => s.replace(/^[-*•\d.]+\s*/, '').trim()).filter(Boolean);
    if (lines.length > 0) return lines;
  }
  return Array.from({ length: fallbackCount }, (_, i) => `${fallbackPrefix} ${i + 1}`);
}

function isQuotaOrTransientError(err: any): boolean {
  if (!err) return false;
  const status = err.status || err.statusCode;
  const msg = String(err.message || '').toLowerCase();
  return (
    status === 429 ||
    status === 503 ||
    status === 500 ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('rate_limit') ||
    msg.includes('rate limit') ||
    msg.includes('overloaded') ||
    msg.includes('high demand') ||
    msg.includes('unavailable') ||
    msg.includes('429') ||
    msg.includes('503')
  );
}

function generateGracefulManifestationKit(
  wish: string,
  category = 'Personal Growth',
  tone = 'grounded',
  pov = 'First person'
) {
  const isSecond = typeof pov === 'string' && pov.includes('Second');
  const I = isSecond ? 'You' : 'I';
  const my = isSecond ? 'your' : 'my';
  const am = isSecond ? 'are' : 'am';

  const cleanWish = (wish || 'Living with deep purpose, clarity, and peace').trim();
  const title = `The Path of ${cleanWish.slice(0, 38).replace(/[^\w\s]/g, '') || 'Inner Alignment'}`;

  return {
    intent: cleanWish,
    title,
    affirmations: [
      `${I} ${am} aligned with the realization of ${cleanWish}, moving forward with steady faith.`,
      `Every mindful step ${I} take brings ${cleanWish} naturally into tangible reality.`,
      `${I} ${am} deeply grounded, open to inspiration, and worthy of positive growth.`,
      `Peace and clarity are ${my} natural state as ${my} intentions unfold.`,
      `${I} release hurry, honor ${my} personal pace, and trust the process of daily dedication.`,
    ],
    manifestation_script: `Take a deep breath and settle into quiet presence. In this moment, know that the desire for "${cleanWish}" is an authentic seed seeking expression through you. You walk forward with calm confidence, knowing that consistent, honest labor combined with a peaceful heart creates true transformation. You release comparison and trust that everything necessary is arriving in right timing.`,
    visualization: `Close your eyes and breathe into your center. Envision yourself having fully integrated "${cleanWish}" into daily life. Notice the lightness in your chest, the serene focus in your eyes, and the quiet satisfaction of living in alignment with your true values. Feel the physical environment around you and anchor this grounded feeling in your body.`,
    future_self: `From this place in your future: thank you for holding space for "${cleanWish}". Every patient breath and brave choice you made in uncertainty led directly to this peace. Continue honoring yourself.`,
    ideal_life: `A morning that begins with clarity and spacious breath. Meaningful hours spent creating, learning, and sharing your gifts, followed by peaceful evenings rooted in deep gratitude and restful renewal.`,
    gratitude: [
      `Grateful for the wisdom to recognize and define "${cleanWish}".`,
      `Grateful for the inner resilience that supports my quiet growth each day.`,
      `Grateful for the present breath and the sanctuary of this moment.`,
    ],
    self_concept: [
      `${I} ${am} a person who honors commitments to ${my} highest intentions.`,
      `${my} peace, boundaries, and focus are worthy of protection.`,
      `${I} deserve authentic fulfillment, sustainable prosperity, and peace of mind.`,
    ],
    morning_practice: [
      `Begin with 3 slow mindful breaths before engaging with screens, holding "${cleanWish}" in mind.`,
      `Recite your core affirmation aloud with gentle conviction.`,
    ],
    night_practice: [
      `Celebrate 1 small action or moment from today that honored "${cleanWish}".`,
      `Release lingering tension into the exhale and enter restorative rest.`,
    ],
    recommended_technique: `Present-Tense Scripting: Writing your lived reality with sensory detail anchors deep subconscious alignment.`,
    vision_board_ideas: [
      `A calm sunrise or tranquil horizon symbolizing fresh beginnings.`,
      `An evocative handwritten intention note for "${cleanWish}".`,
      `A warm, uncluttered workspace or living space reflecting calm focus.`,
      `An image representing mastery, quiet strength, and grounded celebration.`,
    ],
    action_steps: [
      `Dedicate 15 focused minutes today to take the single most immediate practical step for "${cleanWish}".`,
      `Clear one small space in your environment to symbolize creating physical room for new abundance.`,
      `Write one thoughtful journal reflection noting the fears you are consciously releasing.`,
    ],
    reflection_prompt: `What is one outdated assumption about myself that I am ready to gently release to allow "${cleanWish}" to flourish?`,
  };
}

function generateGracefulSectionRegen(intent: string, sectionKey: string, sectionName = '', tone = 'grounded') {
  const clean = String(intent || 'inner peace').slice(0, 100);
  switch (sectionKey) {
    case 'affirmations':
      return `I am steadily creating ${clean} through honest daily effort.\nMy inner calm and confidence grow stronger with every breath.\nI trust my timing and release the need to control every outcome.\nI welcome abundance, peace, and clarity into my life today.\nI celebrate every milestone on my path to fulfillment.`;
    case 'visualization':
      return `Close your eyes and breathe gently. Picture yourself having fully realized "${clean}". Notice the ease in your shoulders, the peaceful clarity in your mind, and the grounded joy in your heart. Take in the colors, light, and sensory textures of this reality, knowing you have created it through patient dedication.`;
    case 'future_self':
      return `A letter from your future self: "Thank you for not giving up when the path was unclear. Every single time you chose courage over comfort, you were building the bridge to the life I am living now. Keep going; you are doing beautifully."`;
    case 'ideal_life':
      return `You awaken feeling rested and unhurried. Your morning begins with quiet intention and nourishing stillness. Throughout the day, you engage in meaningful, creative action with focused ease. As evening falls, you look back with profound gratitude for a life built on authenticity and grace.`;
    case 'gratitude':
      return `I am grateful for the quiet strength within me.\nI am grateful for the lessons that have shaped my resilience.\nI am grateful for the gift of this present breath and fresh start.`;
    case 'self_concept':
      return `I am worthy of peace, joy, and meaningful success.\nI honor my boundaries and direct my energy toward what truly matters.\nI am capable of turning clear intentions into grounded physical results.`;
    case 'morning_practice':
      return `Take 3 deep, grounding breaths before looking at your phone or checking notifications.\nSpeak your primary intention aloud into the morning air with steady conviction.\nDrink a glass of water mindfully, visualizing clarity washing through your mind.`;
    case 'night_practice':
      return `Acknowledge three specific moments of gratitude or progress from today.\nGently release any unfinished tasks to tomorrow with a conscious exhale.\nRest in the knowing that your body and subconscious will restore you overnight.`;
    case 'action_steps':
      return `Block out 15 minutes of uninterrupted focus today to take the first tangible step.\nDeclutter or organize one area of your workspace to create physical clarity.\nReach out or research one resource that directly supports your path.`;
    case 'vision_board_ideas':
      return `A photograph of a calm, sunlit open window symbolizing clarity.\nA minimal handwritten card featuring your core affirmation.\nA serene natural landscape representing spaciousness and grounded peace.\nA symbol of creative achievement and shared celebration with loved ones.`;
    default:
      return `Focus your awareness on "${clean}". Trust that through quiet consistency, authentic alignment, and patient action, what is meant for you will naturally take form.`;
  }
}

function generateGracefulAffirmationRewrite(text: string, tone = 'gentle') {
  const clean = text.trim();
  const lowerTone = (tone || 'gentle').toLowerCase();

  let options: string[] = [];
  let insight = '';

  const cleanSubject = clean.replace(/^(i want|i wish|i need|can i)\s*/i, '');

  if (lowerTone === 'confident' || lowerTone === 'powerful') {
    options = [
      `I have the capability and resilience to navigate ${cleanSubject} with unwavering focus.`,
      `My dedication creates unstoppable momentum, and I stand firmly in my personal power.`,
      `I trust my decisions, honor my boundaries, and command my own trajectory with poise.`,
    ];
    insight = 'Confident framing replaces self-doubt with grounded personal agency and decisiveness.';
  } else if (lowerTone === 'spiritual') {
    options = [
      `I trust the unfolding of my journey and welcome divine clarity into ${cleanSubject}.`,
      `Peace is my center, and I allow grace to guide each step I take today.`,
      `The universe supports my honest labor and honors the sincerity of my heart.`,
    ];
    insight = 'Spiritual reframing elevates intention into trust, surrender, and sacred purpose.';
  } else if (lowerTone === 'practical') {
    options = [
      `One focused step each day is all I need to build real momentum with ${cleanSubject}.`,
      `I focus on what is within my direct control and take steady, manageable action.`,
      `Progress over perfection: every small effort counts toward my long-term goal.`,
    ];
    insight = 'Practical affirmations anchor the mind in immediate, executable behavior rather than overwhelm.';
  } else {
    // gentle
    options = [
      `I allow myself to move at a pace that honors my nervous system while moving toward ${cleanSubject}.`,
      `I am doing the best I can, and my best is worthy of patience, love, and respect.`,
      `I release the need to force the outcome and give myself permission to rest and receive.`,
    ];
    insight = 'Gentle affirmations calm the nervous system, reducing cortisol and opening space for natural focus.';
  }

  return { options, insight };
}

function generateGracefulJournalAi(text: string, action = 'reflect', entryType = 'Reflection') {
  switch (action) {
    case 'affirmations':
      return `✨ Tailored Affirmations from Your Entry:\n\n• I honor the courage it took to put these honest thoughts into words.\n• I am larger than my current circumstances, and I hold space for gentle growth.\n• My feelings are valid signals guiding me toward deeper alignment and peace.`;
    case 'limiting_beliefs':
      return `🔍 Compassionate Reframe:\n\n1. Felt Limitation: Wondering whether things will work out or if enough progress is being made.\nCompassionate Truth: You are in the middle of the unfolding process. Roots grow deeply in darkness before the flower blooms in light.\n\n2. Reframe: Replace "I must have it all figured out today" with "I only need enough light for the very next step."`;
    case 'extract_goals':
      return `🎯 Heart-Centered Goals from This Reflection:\n\n1. Protect your inner peace by setting intentional daily boundaries.\n2. Dedicate a small window of regular time to cultivate what brings genuine joy.\n3. Practice self-compassion when facing moments of uncertainty or fatigue.`;
    case 'action_plan':
      return `🌱 3 Simple Micro-Steps for the Next 48 Hours:\n\n1. Take a 10-minute mindful pause outdoors without devices.\n2. Journal 3 specific things you did well this week, no matter how small.\n3. Make one clear choice that honors your energy and self-respect.`;
    default:
      return `🌿 Guide Reflection:\n\nReading your words, there is a clear current of resilience beneath the surface. You are paying attention to what truly matters to your heart. Allow yourself to acknowledge how much courage it takes to look honestly at your thoughts. You are already in the process of becoming the person who embodies this growth. Keep honoring your inner rhythm.`;
  }
}

function generateGracefulPracticeRoutine(goal = 'Peace and abundance', availableTime = '15 minutes', preferences = 'Visualization', intensity = 'Gentle') {
  return {
    routineName: `Daily Sanctuary: ${goal.slice(0, 30) || 'Inner Growth'} Flow`,
    morning: {
      duration: '5 minutes',
      practice: 'Centering Breath & Core Affirmation',
      details: 'Sit quietly. Take 3 deep diaphragmatic breaths. Speak your intention aloud and feel its resonance.',
    },
    afternoon: {
      duration: '2 minutes',
      practice: 'Midday Reset & Grounding',
      details: 'Pause, step away from screens, place a hand over your heart, and remember why this goal matters.',
    },
    evening: {
      duration: '8 minutes',
      practice: 'Sensory Visualization & Gratitude Reflection',
      details: 'Close your eyes. Rehearse living your desired reality in rich sensory detail, then note 1 win from today.',
    },
    dailyAction: 'Take 1 concrete physical action step toward your intention before the sun sets.',
    mantra: 'I am grounded in peace, guided by intention, and growing each day.',
  };
}

function generateGracefulArchitectGuidance(stepIndex = 0, stepName = 'Core Desire', userInput = '') {
  return {
    feedback: `Your articulation in ${stepName} shows genuine self-honesty and depth. By speaking directly to what you value, you cut through superficial distractions.`,
    enhancement: `"${userInput || 'My core intention'}" — deepened by anchoring it into the visceral feeling of freedom, sustainable peace, and authentic creative contribution.`,
    promptForNext: `As you look at this clarity, what is the deeper "Why" behind it? Who else benefits when you embody this reality?`,
  };
}

function generateGracefulChatReply(messages: any[], rolePreset = 'mentor') {
  const lastMsg = messages[messages.length - 1]?.content || messages[messages.length - 1]?.text || '';
  const cleanQuery = String(lastMsg).toLowerCase();

  if (cleanQuery.includes('doubt') || cleanQuery.includes('fear') || cleanQuery.includes('worry')) {
    return `It is completely natural for doubts to surface whenever we step into new growth. Notice the doubt without judging yourself for having it. Doubt is simply your nervous system checking for safety. Place a hand on your chest, take a slow deep breath, and remind yourself: "I do not need to be fearless to take the next faithful step." What is one small, kind action you can take right now?`;
  }

  if (cleanQuery.includes('affirmation') || cleanQuery.includes('words')) {
    return `Here is a grounding affirmation tailored for this moment:\n\n"I am grounded in my own worth, moving at a pace that honors my soul. Where I place my calm attention, my life naturally blossoms."\n\nSpeak it aloud three times, noticing how your body feels with each repetition.`;
  }

  if (cleanQuery.includes('routine') || cleanQuery.includes('habit') || cleanQuery.includes('discipline')) {
    return `True transformation thrives on small, sustainable consistency rather than intense, fleeting bursts. Even 5 minutes of morning breath and visualization, paired with 1 concrete action step, builds massive momentum over 30 days. Protect your morning quiet, honor your evening rest, and trust the compounding nature of quiet dedication.`;
  }

  return `I hear you, and your intention is deeply valid. Remember that manifestation is not about forcing an outcome, but about becoming the person who naturally lives in alignment with what they desire. Focus today on what is within your immediate influence: your breath, your presence, and your next faithful action. How does that feel in your body right now?`;
}

// 2. Core Manifestation Kit Generation
app.post('/api/generate', rateLimiter, async (req: Request, res: Response) => {
  try {
    const { wish, category, tone, pov, length } = req.body || {};

    if (!wish || typeof wish !== 'string' || !wish.trim()) {
      res.status(400).json({
        code: 'empty_input',
        error: 'Please share your wish or intention to create a manifestation kit.',
      });
      return;
    }

    const trimmedWish = wish.trim();
    if (trimmedWish.length > 1500) {
      res.status(400).json({
        code: 'input_too_long',
        error: 'Your wish is a little too long (maximum 1,500 characters). Please condense your core thought.',
      });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(401).json({
        code: 'not_configured',
        error: 'AI is not connected yet. Please ensure GEMINI_API_KEY is configured on the server.',
      });
      return;
    }

    const safeCategory = (category && typeof category === 'string' ? category.trim() : 'Personal Growth').slice(0, 50);
    const safeTone = (tone && typeof tone === 'string' ? tone.trim() : 'Calm, grounded, and inspiring').slice(0, 50);
    const safePov = pov === 'Second person' ? 'Second person (You are / You have)' : 'First person (I am / I choose)';
    const safeLength = length === 'Deep' ? 'Deep and comprehensive' : length === 'Short' ? 'Concise and focused' : 'Balanced medium length';

    const systemInstruction = `You are Manifest, a revered, poetic, and grounded guide for personal growth, psychological intention-setting, and practical manifestation.
Manifestation in this application is strictly defined as cultivating focused intention, positive self-concept, clear visualization, emotional alignment, and disciplined, realistic daily action.

NON-NEGOTIABLE SAFETY & RESPONSIBILITY RULES:
1. NEVER promise supernatural, magical, or guaranteed outcomes.
2. NEVER guarantee financial windfalls, lottery results, specific third-party romantic coercion, or medical cures.
3. Blend inspiring manifestation phrasing with concrete, psychologically sound, and realistic daily action steps.
4. Adhere strictly to the requested tone: "${safeTone}", perspective: "${safePov}", and depth: "${safeLength}".
5. Ensure the content is deeply personalized to the user's explicit wish, not generic filler.

You must return valid JSON matching the exact schema specified.`;

    const prompt = `Create a complete, personalized manifestation kit based on the following user intention:
- User Wish: "${trimmedWish}"
- Category: ${safeCategory}
- Tone: ${safeTone}
- Perspective: ${safePov}
- Depth: ${safeLength}

Return JSON with these exact fields:
1. "intent": A clean, resonant summary of the core intention.
2. "title": A poetic yet grounded title for this manifestation (e.g. "Abundance Through Authentic Creation").
3. "affirmations": An array of 5 distinct, empowering affirmations crafted according to the chosen POV ("${safePov}") and tone.
4. "manifestation_script": A vivid 1-2 paragraph present-tense script capturing the feeling of living this reality.
5. "visualization": A sensory-rich visualization journey (sights, sounds, emotions, physical sensations) to practice with closed eyes.
6. "future_self": A brief monologue or note from the future self who has integrated this growth.
7. "ideal_life": A descriptive scene of a peaceful, fulfilling day living this reality.
8. "gratitude": An array of 3 sincere gratitude prompts related to this journey.
9. "self_concept": An array of 3 identity statements reshaping self-belief (e.g., "I am worthy of peaceful success").
10. "morning_practice": An array of 2-3 specific morning mindful steps (e.g., 3 deep breaths, reciting 1 affirmation before looking at phone).
11. "night_practice": An array of 2-3 specific evening unwinding steps (e.g., noting 1 win, letting go of resistance).
12. "recommended_technique": The single best manifestation practice for this specific goal (e.g., "Scripting in present tense", "369 Method", "SATS before sleep", or "Mental Rehearsal") with a 1-sentence reason why.
13. "vision_board_ideas": An array of 4 evocative visual prompts or image concepts to place on a vision board.
14. "action_steps": An array of 3 realistic, immediate, grounded actions the user can take in the physical world within 24-48 hours.
15. "reflection_prompt": A thoughtful, non-judgmental journaling question for self-inquiry.`;

    const response = await generateWithModelFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: { type: Type.STRING },
            title: { type: Type.STRING },
            affirmations: { type: Type.ARRAY, items: { type: Type.STRING } },
            manifestation_script: { type: Type.STRING },
            visualization: { type: Type.STRING },
            future_self: { type: Type.STRING },
            ideal_life: { type: Type.STRING },
            gratitude: { type: Type.ARRAY, items: { type: Type.STRING } },
            self_concept: { type: Type.ARRAY, items: { type: Type.STRING } },
            morning_practice: { type: Type.ARRAY, items: { type: Type.STRING } },
            night_practice: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommended_technique: { type: Type.STRING },
            vision_board_ideas: { type: Type.ARRAY, items: { type: Type.STRING } },
            action_steps: { type: Type.ARRAY, items: { type: Type.STRING } },
            reflection_prompt: { type: Type.STRING },
          },
          required: [
            'intent',
            'title',
            'affirmations',
            'manifestation_script',
            'visualization',
            'future_self',
            'ideal_life',
            'gratitude',
            'self_concept',
            'morning_practice',
            'night_practice',
            'recommended_technique',
            'vision_board_ideas',
            'action_steps',
            'reflection_prompt',
          ],
        },
      },
    });

    const rawText = response.text?.trim() || '';
    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch (parseErr) {
      // Clean possible markdown code fences if any
      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      parsed = JSON.parse(cleaned);
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Received non-object JSON from AI model');
    }

    // Rigorous validation and normalization of all required keys
    const kit = {
      intent: String(parsed.intent || trimmedWish).trim(),
      title: String(parsed.title || 'My Manifestation Journey').trim(),
      affirmations: sanitizeStringArray(parsed.affirmations, 5, 'I am aligned with my authentic path'),
      manifestation_script: String(parsed.manifestation_script || '').trim() || 'I step forward into my desired reality with clarity and steady determination.',
      visualization: String(parsed.visualization || '').trim() || 'Close your eyes. Take three slow breaths. Envision yourself standing peacefully in your completed goal.',
      future_self: String(parsed.future_self || '').trim() || 'From this place in your future, thank you for choosing to take that first brave step.',
      ideal_life: String(parsed.ideal_life || '').trim() || 'A day of purposeful calm, meaningful connection, and deep fulfillment.',
      gratitude: sanitizeStringArray(parsed.gratitude, 3, 'I am grateful for my continuous growth and resilience'),
      self_concept: sanitizeStringArray(parsed.self_concept, 3, 'I believe in my capacity to create positive change'),
      morning_practice: sanitizeStringArray(parsed.morning_practice, 2, 'Begin with 3 mindful breaths and speak 1 affirmation aloud'),
      night_practice: sanitizeStringArray(parsed.night_practice, 2, 'Reflect on 1 positive win from today before resting peacefully'),
      recommended_technique: String(parsed.recommended_technique || 'Daily Visualization with Aligned Action').trim(),
      vision_board_ideas: sanitizeStringArray(parsed.vision_board_ideas, 4, 'Visual inspiration reflecting calm clarity and achievement'),
      action_steps: sanitizeStringArray(parsed.action_steps, 3, 'Dedicate 15 uninterrupted minutes today to take one clear practical step'),
      reflection_prompt: String(parsed.reflection_prompt || 'What is one limiting story I am ready to gently release today?').trim(),
    };

    stats.generationsCount++;
    res.json({
      status: 'success',
      data: kit,
    });
  } catch (err: any) {
    stats.errorsCount++;
    console.error('Error generating manifestation:', err);

    if (isQuotaOrTransientError(err) || !getGeminiClient()) {
      console.warn('Utilizing sanctuary intelligence fallback for manifestation kit due to quota/transient limit.');
      const fallbackKit = generateGracefulManifestationKit(
        String(req.body?.wish || '').trim(),
        String(req.body?.category || 'Personal Growth'),
        String(req.body?.tone || 'Grounded'),
        String(req.body?.pov || 'First person')
      );
      stats.generationsCount++;
      res.json({
        status: 'success',
        data: fallbackKit,
      });
      return;
    }

    res.status(500).json({
      code: 'api_error',
      error: 'We encountered an issue turning your wish into words. Please try again.',
      details: isProd ? undefined : err.message,
    });
  }
});

// 3. Regenerate single section
app.post('/api/regenerate-section', rateLimiter, async (req: Request, res: Response) => {
  try {
    const { intent, sectionKey, sectionName, tone } = req.body || {};
    if (!intent || !sectionKey) {
      res.status(400).json({ code: 'bad_request', error: 'Intent and sectionKey are required' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(401).json({ code: 'not_configured', error: 'AI key not configured' });
      return;
    }

    const prompt = `Rewrite only the "${sectionName || sectionKey}" section for this manifestation intention:
"${String(intent).slice(0, 500)}".
Tone: ${tone || 'Inspiring, poetic yet grounded'}.
Avoid supernatural or deceptive promises. Provide realistic, inspiring content.
If this section is a list, provide 3 to 5 clear items separated by newlines. If a single text, provide 1-2 rich paragraphs.
Return ONLY plain text for this section, without markdown headers or explanations.`;

    const response = await generateWithModelFallback(ai, {
      contents: prompt,
    });

    const result = response.text?.trim() || '';
    res.json({ status: 'success', text: result });
  } catch (err: any) {
    console.error('Section regen error:', err);
    if (isQuotaOrTransientError(err) || !getGeminiClient()) {
      const fallback = generateGracefulSectionRegen(
        String(req.body?.intent || ''),
        String(req.body?.sectionKey || ''),
        String(req.body?.sectionName || ''),
        String(req.body?.tone || 'grounded')
      );
      res.json({ status: 'success', text: fallback });
      return;
    }
    res.status(500).json({ code: 'api_error', error: 'Could not regenerate this section. Please try again.' });
  }
});

// 4. Affirmation Rewriter
app.post('/api/rewrite-affirmation', rateLimiter, async (req: Request, res: Response) => {
  try {
    const { text, tone } = req.body || {};
    if (!text || typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ code: 'empty_input', error: 'Please enter a thought or sentence to rewrite.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      const fallback = generateGracefulAffirmationRewrite(text, tone);
      stats.rewritesCount++;
      res.json({
        status: 'success',
        options: fallback.options,
        insight: fallback.insight,
      });
      return;
    }

    const selectedTone = ['gentle', 'confident', 'powerful', 'spiritual', 'practical'].includes(tone)
      ? tone
      : 'gentle';

    const prompt = `You are a psychologist and compassionate affirmations coach.
The user provided this raw thought, worry, or unpolished affirmation:
"${text.trim().slice(0, 500)}"

Transform it into 3 distinct, empowering, healthy, and psychologically grounded affirmation options.
Tone: ${selectedTone.toUpperCase()}.
Rules:
- Do not make deceptive guarantees or supernatural claims.
- Affirmations should acknowledge inner strength, growth, choice, or presence.
- Keep them believable and emotionally resonant.

Return JSON with format:
{
  "options": [
    "Affirmation 1",
    "Affirmation 2",
    "Affirmation 3"
  ],
  "insight": "Brief 1-sentence supportive reflection on why this shift helps your nervous system."
}`;

    const response = await generateWithModelFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    stats.rewritesCount++;
    res.json({
      status: 'success',
      options: Array.isArray(parsed.options) ? parsed.options : [text],
      insight: parsed.insight || 'Affirmations anchor your subconscious in safety and possibility.',
    });
  } catch (err: any) {
    console.error('Affirmation rewrite error:', err);
    if (isQuotaOrTransientError(err) || !getGeminiClient()) {
      const fallback = generateGracefulAffirmationRewrite(String(req.body?.text || ''), String(req.body?.tone || 'gentle'));
      stats.rewritesCount++;
      res.json({
        status: 'success',
        options: fallback.options,
        insight: fallback.insight,
      });
      return;
    }
    res.status(500).json({ code: 'api_error', error: 'Could not rewrite affirmation. Please try again.', details: err.message });
  }
});

// 5. Journal AI Actions
app.post('/api/journal-ai', rateLimiter, async (req: Request, res: Response) => {
  try {
    const { text, action, entryType } = req.body || {};
    if (!text || typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ code: 'empty_input', error: 'Journal text is required.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(401).json({ code: 'not_configured', error: 'AI key not configured' });
      return;
    }

    const actionDescriptions: Record<string, string> = {
      reflect: 'Provide a warm, supportive 1-2 paragraph reflection on what this entry reveals about the user’s values, resilience, and inner journey.',
      affirmations: 'Extract 3 to 4 personalized affirmations directly derived from the emotional themes in this entry.',
      limiting_beliefs: 'Identify 1-2 subtle self-limiting beliefs or fears hidden between the lines in a gentle, non-judgmental way, followed by a compassionate reframe for each.',
      reframe: 'Provide an empowering psychological cognitive reframe that honors the struggle while highlighting agency and growth.',
      extract_goals: 'Distill 2-3 clear, heart-centered goals that emerge from this journaling.',
      action_plan: 'Provide 3 simple, gentle, concrete micro-steps to take within the next 48 hours to honor the insights in this entry.',
    };

    const taskDesc = actionDescriptions[action] || actionDescriptions.reflect;

    const systemInstruction = `You are a supportive, reflective personal-growth mentor.
CRITICAL BOUNDARIES:
- You are NOT a doctor or therapist. Do not diagnose mental health conditions.
- Do not make medical claims or prescribe treatments.
- Be warm, perceptive, grounded, and concise.`;

    const prompt = `Journal entry (${entryType || 'Reflection'}):
"${text.trim().slice(0, 1500)}"

Task:
${taskDesc}

Format clearly with nice spacing and bullet points where applicable. Plain readable text.`;

    const response = await generateWithModelFallback(ai, {
      contents: prompt,
      config: { systemInstruction },
    });

    stats.journalAiCount++;
    res.json({
      status: 'success',
      result: response.text?.trim() || '',
    });
  } catch (err: any) {
    console.error('Journal AI error:', err);
    if (isQuotaOrTransientError(err) || !getGeminiClient()) {
      const fallback = generateGracefulJournalAi(String(req.body?.text || ''), String(req.body?.action || 'reflect'), String(req.body?.entryType || 'Reflection'));
      stats.journalAiCount++;
      res.json({
        status: 'success',
        result: fallback,
      });
      return;
    }
    res.status(500).json({ code: 'api_error', error: 'Unable to analyze journal entry at this moment.' });
  }
});

// 6. Build My Practice Generator
app.post('/api/practice-routine', rateLimiter, async (req: Request, res: Response) => {
  try {
    const { goal, availableTime, preferences, intensity } = req.body || {};
    const ai = getGeminiClient();
    if (!ai) {
      const routine = generateGracefulPracticeRoutine(goal, availableTime, preferences, intensity);
      res.json({ status: 'success', routine });
      return;
    }

    const prompt = `Design a balanced, sustainable daily manifestation & personal growth routine:
- Core Goal: "${String(goal || 'Personal peace and steady achievement').slice(0, 200)}"
- Available Daily Time: ${availableTime || '15 minutes total'}
- Preferred Techniques: ${preferences || 'Visualization, Affirmations, Reflection'}
- Intensity Level: ${intensity || 'Gentle & Sustainable'}

Return JSON matching:
{
  "routineName": "string",
  "morning": {
    "duration": "e.g. 5 minutes",
    "practice": "string",
    "details": "string"
  },
  "afternoon": {
    "duration": "e.g. 2 minutes",
    "practice": "string",
    "details": "string"
  },
  "evening": {
    "duration": "e.g. 5-8 minutes",
    "practice": "string",
    "details": "string"
  },
  "dailyAction": "1 concrete micro-step to take each day",
  "mantra": "A grounding phrase for the day"
}`;

    const response = await generateWithModelFallback(ai, {
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json({ status: 'success', routine: parsed });
  } catch (err: any) {
    if (isQuotaOrTransientError(err) || !getGeminiClient()) {
      const routine = generateGracefulPracticeRoutine(req.body?.goal, req.body?.availableTime, req.body?.preferences, req.body?.intensity);
      res.json({ status: 'success', routine });
      return;
    }
    res.status(500).json({ code: 'api_error', error: 'Failed to create practice routine.' });
  }
});

// 7. Manifestation Architect Guided Step Analysis
app.post('/api/architect', rateLimiter, async (req: Request, res: Response) => {
  try {
    const { stepIndex, stepName, userInput, previousSteps } = req.body || {};
    const ai = getGeminiClient();
    if (!ai) {
      const guidance = generateGracefulArchitectGuidance(Number(stepIndex || 0), stepName, userInput);
      res.json({ status: 'success', guidance });
      return;
    }

    const prompt = `You are the Manifestation Architect guide.
The user is working through a 10-step deep transformation framework.
Current Step: Step ${Number(stepIndex) + 1} - ${stepName}
User's input for this step: "${String(userInput || '').slice(0, 600)}"
Context from previous steps: ${JSON.stringify(previousSteps || {}).slice(0, 800)}

Provide:
1. "feedback": A 2-sentence perceptive reflection validating their clarity or helping them go deeper.
2. "enhancement": An expanded or refined version of their input that makes it more visceral, emotionally resonant, and grounded.
3. "promptForNext": A gentle guiding question to prime them for the next step.

Return JSON with keys: feedback, enhancement, promptForNext.`;

    const response = await generateWithModelFallback(ai, {
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json({ status: 'success', guidance: parsed });
  } catch (err: any) {
    if (isQuotaOrTransientError(err) || !getGeminiClient()) {
      const guidance = generateGracefulArchitectGuidance(Number(req.body?.stepIndex || 0), req.body?.stepName, req.body?.userInput);
      res.json({ status: 'success', guidance });
      return;
    }
    res.status(500).json({ code: 'api_error', error: 'Architect guidance unavailable.' });
  }
});

// Multi-turn Gemini chatbot with role-specific system instructions
app.post('/api/chat', rateLimiter, async (req: Request, res: Response) => {
  try {
    const { messages, rolePreset } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ code: 'empty_input', error: 'Conversation messages are required.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      const reply = generateGracefulChatReply(messages, rolePreset);
      res.json({ status: 'success', reply });
      return;
    }

    const roleInstructions: Record<string, string> = {
      mentor: 'You are the Sanctuary Guide, a grounded, compassionate mentor for personal growth, daily intention, and calm motivation. Blend psychological insight with poetic warmth.',
      sculptor: 'You are the Affirmation Sculptor. Your role is to help the user articulate, refine, and polish empowering affirmations that feel believable, resonant, and present-tense.',
      reframe: 'You are the Resistance & Shadow Reframe Guide. Help the user gently examine doubts, fears, and self-limiting beliefs with curiosity and non-judgmental acceptance.',
      evening: 'You are the Evening Reflection Companion. Guide the user in celebrating small wins, releasing attachments, and winding down their mind for peaceful rest.',
    };

    const baseInstruction = `You are Manifest's Sanctuary Guide.
CRITICAL RULES:
- Manifestation is an intention, reflection, mindset, and action practice.
- Never promise supernatural outcomes, guaranteed windfalls, or medical cures.
- Keep responses warm, succinct, grounding, and emotionally supportive.`;

    const systemInstruction = `${baseInstruction}\n\nROLE FOCUS: ${roleInstructions[rolePreset] || roleInstructions.mentor}`;

    const recentMessages = messages.slice(-10);
    let contents = recentMessages.map((m: any) => ({
      role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || m.text || '').slice(0, 1200) }],
    }));

    const firstUserIndex = contents.findIndex((c: any) => c.role === 'user');
    if (firstUserIndex !== -1) {
      contents = contents.slice(firstUserIndex);
    }

    const response = await generateWithModelFallback(ai, {
      contents,
      config: {
        systemInstruction,
        temperature: 0.75,
      },
    });

    const reply = response.text?.trim() || '';
    res.json({
      status: 'success',
      reply,
    });
  } catch (err: any) {
    console.error('Chat API error:', err);
    if (isQuotaOrTransientError(err) || !getGeminiClient()) {
      const reply = generateGracefulChatReply(req.body?.messages || [], req.body?.rolePreset);
      res.json({ status: 'success', reply });
      return;
    }
    res.status(500).json({
      code: 'api_error',
      error: 'The Sanctuary Guide is momentarily resting. Please try your message again.',
      details: isProd ? undefined : err.message,
    });
  }
});

// 8. User feedback
app.post('/api/feedback', (req: Request, res: Response) => {
  const { type, message } = req.body || {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'Feedback message cannot be empty' });
    return;
  }

  const item = {
    id: `fb_${Date.now()}`,
    type: String(type || 'general').slice(0, 30),
    message: String(message).trim().slice(0, 1000),
    date: new Date().toISOString(),
  };

  stats.feedbacks.unshift(item);
  if (stats.feedbacks.length > 100) stats.feedbacks.pop();

  res.json({ status: 'success', message: 'Thank you for your thoughts. Your feedback helps Manifest blossom.' });
});

// 9. Admin Stats
app.get('/api/admin/stats', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    stats: {
      startedAt: stats.startedAt,
      generationsCount: stats.generationsCount,
      rewritesCount: stats.rewritesCount,
      journalAiCount: stats.journalAiCount,
      errorsCount: stats.errorsCount,
      feedbackCount: stats.feedbacks.length,
    },
    latestFeedback: stats.feedbacks.slice(0, 10),
  });
});

// Serve frontend: Vite middleware in development, static files in production
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ Manifest server running on http://0.0.0.0:${PORT} [${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
