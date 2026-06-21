'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { GlowButton } from '../ui/GlowButton';
import { HoneySplat } from '../../effects/HoneySplat';
import { formatTime } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';

const GRADE_COLORS = {
  S: '#fbbf24', A: '#4ade80', B: '#60a5fa', C: '#a78bfa', F: '#f87171',
};

export function WinScreen() {
  const score = useGameStore(s => s.score);
  const resetGame = useGameStore(s => s.resetGame);
  const { win, buttonClick } = useSound();

  useEffect(() => {
    const t = setTimeout(win, 400);
    return () => clearTimeout(t);
  }, [win]);

  const gradeColor = GRADE_COLORS[score.finalGrade];

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden">
      <HoneySplat />

      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(34,197,94,0.15), transparent 70%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 px-4 text-center">
        {/* Trophy */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.3 }}
          className="text-8xl"
        >
          🏆
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h1 className="text-4xl font-black mb-2" style={{ color: '#22c55e' }}>
            Colony Saved!
          </h1>
          <p style={{ color: '#9b91c8' }}>
            You identified all infected bees. The hive thrives!
          </p>
        </motion.div>

        {/* Grade */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.7 }}
          className="w-24 h-24 rounded-2xl flex items-center justify-center"
          style={{
            background: `${gradeColor}25`,
            border: `3px solid ${gradeColor}`,
            boxShadow: `0 0 30px ${gradeColor}50`,
          }}
        >
          <span className="text-5xl font-black" style={{ color: gradeColor }}>
            {score.finalGrade}
          </span>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="grid grid-cols-2 gap-3 w-full max-w-xs"
        >
          {[
            { label: 'Rounds', value: score.roundsCompleted, icon: '🎲' },
            { label: 'Time Left', value: formatTime(score.timeRemaining), icon: '⏱' },
            { label: 'Correct', value: score.totalCorrectAccusations, icon: '✓' },
            { label: 'False Acc.', value: score.totalFalseAccusations, icon: '✗' },
          ].map(s => (
            <div
              key={s.label}
              className="px-4 py-3 rounded-xl text-center"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="text-lg font-black" style={{ color: '#f1f0ff' }}>
                {s.icon} {s.value}
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#4b4570' }}>{s.label}</div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <GlowButton
            variant="success"
            size="lg"
            onClick={() => { buttonClick(); resetGame(); }}
          >
            🔄 Play Again
          </GlowButton>
        </motion.div>
      </div>
    </div>
  );
}
