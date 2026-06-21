'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { GlowButton } from '../ui/GlowButton';
import { CollapseEffect } from '../../effects/CollapseEffect';
import { useSound } from '@/hooks/useSound';

export function LoseScreen() {
  const score = useGameStore(s => s.score);
  const resetGame = useGameStore(s => s.resetGame);
  const { lose, buttonClick } = useSound();

  useEffect(() => {
    const t = setTimeout(lose, 300);
    return () => clearTimeout(t);
  }, [lose]);

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden"
      animate={{
        x: [0, -8, 8, -6, 6, -4, 4, 0],
      }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      <CollapseEffect />

      {/* Dark radial */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(239,68,68,0.08), rgba(0,0,0,0.5) 60%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 px-4 text-center">
        {/* Skull/collapse icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', delay: 0.4, stiffness: 180 }}
          className="text-7xl"
        >
          💀
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h1 className="text-4xl font-black mb-2" style={{ color: '#ef4444' }}>
            Colony Collapsed
          </h1>
          <p style={{ color: '#9b91c8' }}>
            The Varroa mites overwhelmed the hive.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-2 gap-3 w-full max-w-xs"
        >
          {[
            { label: 'Rounds Survived', value: score.roundsCompleted, icon: '🎲' },
            { label: 'Quarantined', value: score.totalCorrectAccusations, icon: '🏥' },
            { label: 'Correct Acc.', value: score.totalCorrectAccusations, icon: '✓' },
            { label: 'Missed', value: score.totalMissedInfected, icon: '⚠' },
          ].map(s => (
            <div
              key={s.label}
              className="px-4 py-3 rounded-xl text-center"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
            >
              <div className="text-lg font-black" style={{ color: '#f1f0ff' }}>
                {s.icon} {s.value}
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#4b4570' }}>{s.label}</div>
            </div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-sm max-w-xs"
          style={{ color: '#4b4570' }}
        >
          Look for subtle tells — vague alibis, wrong numbers, evasive social answers.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <GlowButton
            variant="danger"
            size="lg"
            onClick={() => { buttonClick(); resetGame(); }}
          >
            🔄 Try Again
          </GlowButton>
        </motion.div>
      </div>
    </motion.div>
  );
}
