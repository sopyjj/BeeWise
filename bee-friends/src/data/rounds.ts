import { RoundConfig } from '@/types/game';

// Base round templates — actual infected count is determined by die roll each round
export const ROUND_TEMPLATES: Omit<RoundConfig, 'infectedCount' | 'temperature' | 'dieRoll'>[] = [
  { roundNumber: 1, questionsPerBee: 2, revealDramaDelay: 700 },
  { roundNumber: 2, questionsPerBee: 3, revealDramaDelay: 900 },
  { roundNumber: 3, questionsPerBee: 3, revealDramaDelay: 1100 },
  { roundNumber: 4, questionsPerBee: 4, revealDramaDelay: 1200 },
];

export function getRoundTemplate(roundNumber: number) {
  const idx = Math.min(roundNumber - 1, ROUND_TEMPLATES.length - 1);
  return ROUND_TEMPLATES[idx];
}
