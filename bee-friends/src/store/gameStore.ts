'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  GameState, GamePhase, BeeState, BeeStatus, BeeAnimState, InfectionTell, RoundState,
} from '@/types/game';
import { BEE_PROFILES } from '@/data/beeProfiles';
import { getRoundTemplate } from '@/data/rounds';
import { GAME_CONFIG, DIE_TO_INFECTION, DIE_TO_TEMPERATURE } from '@/constants/gameConfig';
import {
  assignInfections, assignTells, evaluateAccusations,
  applyRevealResults, checkAllInfectedQuarantined, checkColonyCollapsed, calculateGrade,
} from '@/lib/gameEngine';
import { selectQuestionsForRound, generateAnswers } from '@/lib/questionEngine';
import { rollDie } from '@/lib/utils';

function buildInitialBees(): BeeState[] {
  return BEE_PROFILES.map(profile => ({
    profile,
    status: BeeStatus.HEALTHY,
    animState: BeeAnimState.IDLE,
    currentAnswer: null,
    currentQuestion: null,
    isAccused: false,
    revealComplete: false,
    tell: InfectionTell.NONE,
  }));
}

function buildInitialState(): GameState {
  return {
    phase: GamePhase.START_SCREEN,
    round: 0,
    bees: buildInitialBees(),
    currentRound: null,
    timerSeconds: GAME_CONFIG.GAME_DURATION_SECONDS,
    isTimerRunning: false,
    score: {
      roundsCompleted: 0,
      totalCorrectAccusations: 0,
      totalFalseAccusations: 0,
      totalMissedInfected: 0,
      timeRemaining: 0,
      finalGrade: 'F',
    },
    soundEnabled: true,
    hasSeenInstructions: false,
    usedQuestionIds: [],
    allInfectedEverQuarantined: false,
  };
}

interface GameStore extends GameState {
  // Phase transitions
  startGame: () => void;
  beginRound: () => boolean;
  advanceToInvestigation: () => void;
  advanceToAccusation: () => void;
  submitAccusations: () => void;
  acknowledgeReveal: () => void;
  startNextRound: () => void;
  triggerWin: () => void;
  triggerLose: () => void;
  resetGame: () => void;

  // Timer
  tickTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;

  // Investigation
  setBeeAnswer: (beeId: string, question: string, answer: string) => void;

  // Accusation
  toggleAccusation: (beeId: string) => void;
  clearAccusations: () => void;

  // Settings
  toggleSound: () => void;
  markInstructionsSeen: () => void;
}

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    ...buildInitialState(),

    startGame() {
      // Set round first so beginRound() reads it correctly, then change phase
      // so RoundInitScreen mounts with currentRound already populated.
      set({ round: 1, isTimerRunning: true });
      if (get().beginRound()) {
        set({ phase: GamePhase.ROUND_INIT });
      }
    },

    beginRound() {
      const { round, bees, usedQuestionIds } = get();
      const template = getRoundTemplate(round);
      const dieRoll = rollDie();
      const infectedCount = DIE_TO_INFECTION[dieRoll];
      const temperature = DIE_TO_TEMPERATURE[dieRoll];

      // Silently drop bees already in the clinic — a new round only happens
      // when the previous round had missed infected bees, and revealing which
      // specific bees were quarantined would leak who was infected.
      const activeBees = bees.filter(b => b.status !== BeeStatus.QUARANTINED);

      // Carry over previously infected bees + add new ones
      const newInfectedIds = assignInfections(activeBees, infectedCount);
      const allInfectedIds = [
        ...activeBees.filter(b => b.status === BeeStatus.INFECTED).map(b => b.profile.id),
        ...newInfectedIds,
      ];
      // Remove duplicates
      const uniqueInfectedIds = [...new Set(allInfectedIds)];

      const questions = selectQuestionsForRound(usedQuestionIds, 8);
      const answers = generateAnswers(activeBees, questions, uniqueInfectedIds);
      const tells = assignTells(activeBees.map(b => b.profile.id), uniqueInfectedIds);

      const updatedBees: BeeState[] = activeBees.map(b => {
        const isNowInfected = uniqueInfectedIds.includes(b.profile.id);
        return {
          ...b,
          status: isNowInfected ? BeeStatus.INFECTED : BeeStatus.HEALTHY,
          animState: BeeAnimState.IDLE,
          currentAnswer: null,
          currentQuestion: null,
          isAccused: false,
          revealComplete: false,
          tell: tells[b.profile.id] ?? InfectionTell.NONE,
        };
      });

      // If every remaining bee is now infected, the beekeeper has lost the
      // colony — end the game before the doomed round's investigation phase.
      if (checkColonyCollapsed(updatedBees)) {
        set({ bees: updatedBees });
        get().triggerLose();
        return false;
      }

      const roundState: RoundState = {
        config: {
          roundNumber: round,
          infectedCount: uniqueInfectedIds.length,
          questionsPerBee: template.questionsPerBee,
          temperature,
          dieRoll,
          revealDramaDelay: template.revealDramaDelay,
        },
        infectedBeeIds: uniqueInfectedIds,
        answers,
        accusedBeeIds: [],
        correctAccusations: 0,
        falseAccusations: 0,
        missedInfected: 0,
      };

      set({
        bees: updatedBees,
        currentRound: roundState,
        usedQuestionIds: [...usedQuestionIds, ...questions.map(q => q.id)],
      });
      return true;
    },

    advanceToInvestigation() {
      set({ phase: GamePhase.INVESTIGATION });
    },

    setBeeAnswer(beeId, question, answer) {
      set(state => ({
        bees: state.bees.map(b =>
          b.profile.id === beeId
            ? { ...b, currentAnswer: answer, currentQuestion: question, animState: BeeAnimState.SPEAKING }
            : b
        ),
      }));
    },

    advanceToAccusation() {
      set({ phase: GamePhase.ACCUSATION });
    },

    toggleAccusation(beeId) {
      set(state => {
        const bee = state.bees.find(b => b.profile.id === beeId);
        if (!bee || bee.status === BeeStatus.QUARANTINED) return state;
        const cap = state.currentRound?.config.infectedCount ?? Infinity;
        // Adding a new accusation is blocked once we've hit the round's
        // infected-bee count. Deselecting an existing accusation is always OK.
        if (!bee.isAccused && (state.currentRound?.accusedBeeIds.length ?? 0) >= cap) {
          return state;
        }
        return {
          bees: state.bees.map(b =>
            b.profile.id === beeId
              ? { ...b, isAccused: !b.isAccused, animState: b.isAccused ? BeeAnimState.IDLE : BeeAnimState.ACCUSED }
              : b
          ),
          currentRound: state.currentRound ? {
            ...state.currentRound,
            accusedBeeIds: bee.isAccused
              ? state.currentRound.accusedBeeIds.filter(id => id !== beeId)
              : [...state.currentRound.accusedBeeIds, beeId],
          } : state.currentRound,
        };
      });
    },

    clearAccusations() {
      set(state => ({
        bees: state.bees.map(b => ({ ...b, isAccused: false, animState: b.animState === BeeAnimState.ACCUSED ? BeeAnimState.IDLE : b.animState })),
        currentRound: state.currentRound ? { ...state.currentRound, accusedBeeIds: [] } : null,
      }));
    },

    submitAccusations() {
      const { bees, currentRound } = get();
      if (!currentRound) return;

      const accused = currentRound.accusedBeeIds;
      const infected = currentRound.infectedBeeIds;
      const { correct, false: falsely, missed } = evaluateAccusations(accused, infected);

      set(state => ({
        phase: GamePhase.REVEAL,
        currentRound: state.currentRound ? {
          ...state.currentRound,
          correctAccusations: correct.length,
          falseAccusations: falsely.length,
          missedInfected: missed.length,
        } : null,
        bees: state.bees.map(b => ({
          ...b,
          animState: b.isAccused ? BeeAnimState.REVEALED : b.animState,
        })),
      }));
    },

    acknowledgeReveal() {
      const { bees, currentRound, score } = get();
      if (!currentRound) return;

      const accused = currentRound.accusedBeeIds;
      const infected = currentRound.infectedBeeIds;
      const { correct, false: falsely } = evaluateAccusations(accused, infected);

      const updatedBees = applyRevealResults(bees, correct, falsely);

      const newScore = {
        ...score,
        roundsCompleted: score.roundsCompleted + 1,
        totalCorrectAccusations: score.totalCorrectAccusations + correct.length,
        totalFalseAccusations:  score.totalFalseAccusations + falsely.length,
        totalMissedInfected:    score.totalMissedInfected + currentRound.missedInfected,
      };

      const allQuarantined = checkAllInfectedQuarantined(updatedBees);
      const collapsed = checkColonyCollapsed(updatedBees);

      set({ bees: updatedBees, score: newScore });

      if (allQuarantined) {
        get().triggerWin();
      } else if (collapsed) {
        get().triggerLose();
      } else {
        set({ phase: GamePhase.ROUND_SUMMARY });
      }
    },

    startNextRound() {
      set(state => ({ round: state.round + 1 }));
      if (get().beginRound()) {
        set({ phase: GamePhase.ROUND_INIT });
      }
    },

    triggerWin() {
      const { timerSeconds, score } = get();
      const finalScore = { ...score, timeRemaining: timerSeconds };
      finalScore.finalGrade = calculateGrade(finalScore);
      set({ phase: GamePhase.WIN, isTimerRunning: false, score: finalScore });
    },

    triggerLose() {
      set({ phase: GamePhase.LOSE, isTimerRunning: false });
    },

    resetGame() {
      set(buildInitialState());
    },

    tickTimer() {
      const { timerSeconds, phase } = get();
      if (timerSeconds <= 0) {
        get().triggerLose();
        return;
      }
      // Don't tick during non-gameplay phases
      if (phase === GamePhase.WIN || phase === GamePhase.LOSE || phase === GamePhase.START_SCREEN) return;
      set(state => ({ timerSeconds: state.timerSeconds - 1 }));
    },

    pauseTimer() { set({ isTimerRunning: false }); },
    resumeTimer() { set({ isTimerRunning: true }); },

    toggleSound() {
      set(state => ({ soundEnabled: !state.soundEnabled }));
    },

    markInstructionsSeen() { set({ hasSeenInstructions: true }); },
  }))
);
