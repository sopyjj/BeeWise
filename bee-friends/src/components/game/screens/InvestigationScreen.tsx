'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { selectActiveBees } from '@/store/selectors';
import { useShallow } from 'zustand/react/shallow';
import { BeeGrid } from '../bees/BeeGrid';
import { GlowButton } from '../ui/GlowButton';
import { HoneycombBg } from '../svg/HoneycombBg';
import { useSound } from '@/hooks/useSound';
import { TEMPERATURE_COLORS } from '@/constants/gameConfig';

export function InvestigationScreen() {
  const bees = useGameStore(useShallow(selectActiveBees));
  const currentRound = useGameStore(s => s.currentRound);
  const setBeeAnswer = useGameStore(s => s.setBeeAnswer);
  const advanceToAccusation = useGameStore(s => s.advanceToAccusation);
  const [answersShown, setAnswersShown] = useState(0);
  const [ready, setReady] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { speechPop } = useSound();

  const answers = currentRound?.answers ?? [];
  const temperature = currentRound?.config.temperature ?? 'MILD';
  const tempColor = TEMPERATURE_COLORS[temperature];

  // Chronological fly-in order matches the answer reveal sequence so the user
  // can focus on each bee as it arrives and testifies.
  const flyInOrder = answers.map(a => a.beeId);
  const FLY_IN_INTERVAL_S = 1.5;
  // Let the bee land (~0.85s) before its speech bubble pops.
  const ANSWER_REVEAL_OFFSET_MS = 950;

  useEffect(() => {
    // Reveal bee answers one by one, aligned to the fly-in cadence.
    timeoutsRef.current = [];
    answers.forEach((ans, i) => {
      const t = setTimeout(() => {
        setBeeAnswer(ans.beeId, ans.questionText, ans.answer);
        speechPop();
        setAnswersShown(i + 1);
        if (i === answers.length - 1) {
          setTimeout(() => setReady(true), 600);
        }
      }, ANSWER_REVEAL_OFFSET_MS + i * FLY_IN_INTERVAL_S * 1000);
      timeoutsRef.current.push(t);
    });

    return () => timeoutsRef.current.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const beeSize = 72;

  return (
    <div className="relative flex flex-col min-h-screen">
      <HoneycombBg />

      <div className="relative z-10 flex flex-col items-center gap-6 py-6 px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-2xl font-black" style={{ color: '#f1f0ff' }}>
            🔬 Investigation Phase
          </h2>
          <p className="text-sm mt-1" style={{ color: '#9b91c8' }}>
            Watch the bees answer. Listen for suspicious responses.
          </p>
        </motion.div>

        {/* Temperature banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="px-5 py-2 rounded-xl text-sm font-bold"
          style={{
            background: `${tempColor}15`,
            border: `1px solid ${tempColor}50`,
            color: tempColor,
          }}
        >
          Temperature: {temperature} · {answers.length} testimonies to hear
        </motion.div>

        {/* Progress */}
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-xs mb-1" style={{ color: '#4b4570' }}>
            <span>Testimonies heard</span>
            <span>{answersShown}/{answers.length}</span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: tempColor }}
              animate={{ width: `${(answersShown / Math.max(1, answers.length)) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Bee grid */}
        <div className="overflow-x-auto w-full flex justify-center pb-4">
          <BeeGrid
            bees={bees}
            beeSize={beeSize}
            showAnswers
            flyInOrder={flyInOrder}
            flyInInterval={FLY_IN_INTERVAL_S}
          />
        </div>

        {/* Proceed button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: ready ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        >
          {ready && (
            <GlowButton
              size="lg"
              onClick={advanceToAccusation}
            >
              ⚡ Make Accusations
            </GlowButton>
          )}
        </motion.div>

        {!ready && (
          <p className="text-xs animate-pulse" style={{ color: '#4b4570' }}>
            Waiting for all bees to testify…
          </p>
        )}
      </div>
    </div>
  );
}
