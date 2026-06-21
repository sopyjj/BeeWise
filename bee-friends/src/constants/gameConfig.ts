export const GAME_CONFIG = {
  TOTAL_BEES: 8,
  GAME_DURATION_SECONDS: 300, // 5 minutes
  MIN_INFECTED: 1,
  MAX_INFECTED: 3,
  DIE_FACES: 6,
  ANSWER_REVEAL_DELAY_MS: 1400, // ms between each bee's answer appearing
  ROUND_INIT_DURATION_MS: 3500, // ms to show die roll before advancing
  REVEAL_DRAMA_DELAY_MS: 900,   // ms between each bee reveal
  WIN_ROUNDS: 3,                 // complete this many rounds to trigger win check
  INFECTED_ANSWER_CHANCE: 0.85, // probability infected bee gives wrong answer
  MAX_ACCUSATIONS_PER_ROUND: 4, // can accuse up to 4 bees
} as const;

export const DIE_TO_INFECTION: Record<number, number> = {
  1: 1, 2: 1,
  3: 2, 4: 2,
  5: 3, 6: 3,
};

export const DIE_TO_TEMPERATURE: Record<number, 'COOL' | 'MILD' | 'HOT'> = {
  1: 'COOL', 2: 'COOL',
  3: 'MILD', 4: 'MILD',
  5: 'HOT',  6: 'HOT',
};

export const TEMPERATURE_LABELS: Record<string, string> = {
  COOL: '🌡️ COOL — Mites are sluggish today',
  MILD: '🌡️ MILD — Mites are active',
  HOT:  '🌡️ HOT — Mite activity is extreme!',
};

export const TEMPERATURE_COLORS: Record<string, string> = {
  COOL: '#60a5fa',
  MILD: '#fbbf24',
  HOT:  '#ef4444',
};
