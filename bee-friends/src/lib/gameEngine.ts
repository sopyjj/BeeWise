import { BeeState, BeeStatus, BeeAnimState, InfectionTell, GameScore } from '@/types/game';
import { shuffle, pickN } from './utils';

/** Assign infected status to `count` bees from the active pool */
export function assignInfections(
  bees: BeeState[],
  count: number
): string[] {
  const eligible = bees.filter(b => b.status !== BeeStatus.QUARANTINED && b.status !== BeeStatus.INFECTED);
  const selected = pickN(eligible, Math.min(count, eligible.length));
  return selected.map(b => b.profile.id);
}

/** Pick a tell for infected bees (varies each round) */
export function assignTells(
  beeIds: string[],
  infectedIds: string[]
): Record<string, InfectionTell> {
  const tellPool = [
    InfectionTell.ANTENNAE_TWITCH,
    InfectionTell.EYE_DART,
    InfectionTell.WING_FLUTTER,
    InfectionTell.FREQUENT_BLINK,
    InfectionTell.STUTTER_SPEAK,
  ];
  const shuffledTells = shuffle(tellPool);
  const result: Record<string, InfectionTell> = {};
  beeIds.forEach(id => {
    result[id] = InfectionTell.NONE;
  });
  infectedIds.forEach((id, i) => {
    result[id] = shuffledTells[i % shuffledTells.length];
  });
  return result;
}

/** Evaluate which accusations were correct, false, or missed */
export function evaluateAccusations(
  accused: string[],
  infected: string[]
): { correct: string[]; false: string[]; missed: string[] } {
  const infectedSet = new Set(infected);
  const accusedSet = new Set(accused);
  return {
    correct: accused.filter(id => infectedSet.has(id)),
    false:   accused.filter(id => !infectedSet.has(id)),
    missed:  infected.filter(id => !accusedSet.has(id)),
  };
}

/** Apply accusation results to bees — quarantine correct, keep false */
export function applyRevealResults(
  bees: BeeState[],
  correct: string[],
  falsely: string[]
): BeeState[] {
  const correctSet = new Set(correct);
  const falseSet = new Set(falsely);
  return bees.map(bee => {
    if (correctSet.has(bee.profile.id)) {
      return {
        ...bee,
        status: BeeStatus.QUARANTINED,
        animState: BeeAnimState.QUARANTINED,
        isAccused: false,
        revealComplete: true,
      };
    }
    if (falseSet.has(bee.profile.id)) {
      return {
        ...bee,
        isAccused: false,
        animState: BeeAnimState.IDLE,
        revealComplete: true,
      };
    }
    return { ...bee, isAccused: false, revealComplete: false };
  });
}

/** Check win: all infected bees quarantined */
export function checkAllInfectedQuarantined(bees: BeeState[]): boolean {
  return bees.every(
    b => b.status !== BeeStatus.INFECTED
  );
}

/** Check lose: all non-quarantined bees are infected */
export function checkColonyCollapsed(bees: BeeState[]): boolean {
  const active = bees.filter(b => b.status !== BeeStatus.QUARANTINED);
  if (active.length === 0) return false;
  return active.every(b => b.status === BeeStatus.INFECTED);
}

export function calculateGrade(score: GameScore): 'S' | 'A' | 'B' | 'C' | 'F' {
  const accuracy = score.totalCorrectAccusations /
    Math.max(1, score.totalCorrectAccusations + score.totalFalseAccusations + score.totalMissedInfected);
  const timeBonus = score.timeRemaining / 300;
  const combined = accuracy * 0.7 + timeBonus * 0.3;
  if (combined >= 0.9) return 'S';
  if (combined >= 0.75) return 'A';
  if (combined >= 0.6) return 'B';
  if (combined >= 0.45) return 'C';
  return 'F';
}
