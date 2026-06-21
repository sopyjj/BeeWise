import { GameState, BeeStatus, GamePhase } from '@/types/game';

export const selectActiveBees = (s: GameState) =>
  s.bees.filter(b => b.status !== BeeStatus.QUARANTINED);

export const selectQuarantinedBees = (s: GameState) =>
  s.bees.filter(b => b.status === BeeStatus.QUARANTINED);

export const selectInfectedBees = (s: GameState) =>
  s.bees.filter(b => b.status === BeeStatus.INFECTED);

export const selectAccusedBees = (s: GameState) =>
  s.bees.filter(b => b.isAccused);

export const selectIsHudVisible = (s: GameState) =>
  [GamePhase.INVESTIGATION, GamePhase.ACCUSATION, GamePhase.REVEAL, GamePhase.ROUND_SUMMARY].includes(s.phase);

export const selectTimerUrgency = (s: GameState) =>
  1 - s.timerSeconds / 300;
