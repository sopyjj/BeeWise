import { Question, BeeState, BeeStatus, BeeAnswer } from '@/types/game';
import { QUESTIONS } from '@/data/questions';
import { shuffle, pickN } from './utils';
import { GAME_CONFIG } from '@/constants/gameConfig';

/** Select questions for a round, preferring unused ones */
export function selectQuestionsForRound(
  usedIds: string[],
  count: number
): Question[] {
  const usedSet = new Set(usedIds);
  const unused = QUESTIONS.filter(q => !usedSet.has(q.id));
  const pool = unused.length >= count ? unused : QUESTIONS;
  return pickN(pool, count);
}

/** Generate one answer per bee — each bee gets a unique question */
export function generateAnswers(
  bees: BeeState[],
  questions: Question[],
  infectedBeeIds: string[]
): BeeAnswer[] {
  const activeBees = bees.filter(b => b.status !== BeeStatus.QUARANTINED);
  const infectedSet = new Set(infectedBeeIds);
  const shuffledQuestions = shuffle(questions);
  const answers: BeeAnswer[] = [];

  activeBees.forEach((bee, idx) => {
    const question = shuffledQuestions[idx % shuffledQuestions.length];
    const isInfected = infectedSet.has(bee.profile.id);
    const givesWrongAnswer = isInfected && Math.random() < GAME_CONFIG.INFECTED_ANSWER_CHANCE;
    const answer = givesWrongAnswer ? question.infectedAnswer : question.correctAnswer;
    answers.push({
      beeId: bee.profile.id,
      questionId: question.id,
      questionText: question.text,
      answer,
    });
  });

  return answers;
}
