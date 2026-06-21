export enum GamePhase {
  START_SCREEN = 'START_SCREEN',
  ROUND_INIT = 'ROUND_INIT',
  INVESTIGATION = 'INVESTIGATION',
  ACCUSATION = 'ACCUSATION',
  REVEAL = 'REVEAL',
  ROUND_SUMMARY = 'ROUND_SUMMARY',
  WIN = 'WIN',
  LOSE = 'LOSE',
}

export enum BeeStatus {
  HEALTHY = 'HEALTHY',
  INFECTED = 'INFECTED',
  QUARANTINED = 'QUARANTINED',
}

export enum BeeAnimState {
  IDLE = 'IDLE',
  SPEAKING = 'SPEAKING',
  NERVOUS = 'NERVOUS',
  ACCUSED = 'ACCUSED',
  REVEALED = 'REVEALED',
  QUARANTINED = 'QUARANTINED',
}

export enum InfectionTell {
  NONE = 'NONE',
  FREQUENT_BLINK = 'FREQUENT_BLINK',
  ANTENNAE_TWITCH = 'ANTENNAE_TWITCH',
  EYE_DART = 'EYE_DART',
  WING_FLUTTER = 'WING_FLUTTER',
  STUTTER_SPEAK = 'STUTTER_SPEAK',
}

export enum QuestionCategory {
  TEMPERATURE = 'TEMPERATURE',
  BEHAVIOR = 'BEHAVIOR',
  ALIBI = 'ALIBI',
  KNOWLEDGE = 'KNOWLEDGE',
  SOCIAL = 'SOCIAL',
}

export interface BeeProfile {
  id: string;
  name: string;
  colorHue: number;
  stripePattern: 'classic' | 'bold' | 'thin' | 'reverse';
  eyeShape: 'round' | 'almond' | 'wide';
  defaultTell: InfectionTell;
  personalityTrait: string;
}

export interface BeeState {
  profile: BeeProfile;
  status: BeeStatus;
  animState: BeeAnimState;
  currentAnswer: string | null;
  currentQuestion: string | null;
  isAccused: boolean;
  revealComplete: boolean;
  tell: InfectionTell;
}

export interface Question {
  id: string;
  text: string;
  category: QuestionCategory;
  correctAnswer: string;
  infectedAnswer: string;
  suspiciousKeywords: string[];
}

export interface BeeAnswer {
  beeId: string;
  questionId: string;
  questionText: string;
  answer: string;
}

export interface RoundConfig {
  roundNumber: number;
  infectedCount: number;
  questionsPerBee: number;
  temperature: 'COOL' | 'MILD' | 'HOT';
  dieRoll: number;
  revealDramaDelay: number;
}

export interface RoundState {
  config: RoundConfig;
  infectedBeeIds: string[];
  answers: BeeAnswer[];
  accusedBeeIds: string[];
  correctAccusations: number;
  falseAccusations: number;
  missedInfected: number;
}

export interface GameScore {
  roundsCompleted: number;
  totalCorrectAccusations: number;
  totalFalseAccusations: number;
  totalMissedInfected: number;
  timeRemaining: number;
  finalGrade: 'S' | 'A' | 'B' | 'C' | 'F';
}

export interface GameState {
  phase: GamePhase;
  round: number;
  bees: BeeState[];
  currentRound: RoundState | null;
  timerSeconds: number;
  isTimerRunning: boolean;
  score: GameScore;
  soundEnabled: boolean;
  hasSeenInstructions: boolean;
  usedQuestionIds: string[];
  allInfectedEverQuarantined: boolean;
}
