'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { selectQuarantinedBees, selectInfectedBees } from '@/store/selectors';
import { useShallow } from 'zustand/react/shallow';
import { GlowButton } from '../ui/GlowButton';
import { HoneycombBg } from '../svg/HoneycombBg';
import { formatTime } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';

export function RoundSummaryScreen() {
  const round = useGameStore(s => s.round);
  const timerSeconds = useGameStore(s => s.timerSeconds);
  const currentRound = useGameStore(s => s.currentRound);
  const score = useGameStore(s => s.score);
  const startNextRound = useGameStore(s => s.startNextRound);
  const quarantined = useGameStore(useShallow(selectQuarantinedBees));
  const stillInfected = useGameStore(useShallow(selectInfectedBees));
  const { buttonClick } = useSound();

  const correct = currentRound?.correctAccusations ?? 0;
  const falsely = currentRound?.falseAccusations ?? 0;
  const missed = currentRound?.missedInfected ?? 0;

  return (
    <div className="relative flex flex-col min-h-screen">
      <HoneycombBg />

      <div className="relative z-10 flex flex-col items-center gap-6 py-10 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 250 }}
          className="text-center"
        >
          <div className="text-5xl mb-2">
            {correct > 0 ? '🎯' : '😬'}
          </div>
          <h2 className="text-3xl font-black" style={{ color: '#fbbf24' }}>
            Round {round} Complete
          </h2>
        </motion.div>

        {/* Round stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4 w-full max-w-sm"
        >
          {[
            { label: 'Correct', value: correct, color: '#4ade80', icon: '✓' },
            { label: 'False', value: falsely, color: '#f87171', icon: '✗' },
            { label: 'Escaped', value: missed, color: '#fbbf24', icon: '?' },
          ].map(stat => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="flex flex-col items-center py-4 rounded-xl"
              style={{
                background: `${stat.color}15`,
                border: `1.5px solid ${stat.color}35`,
              }}
            >
              <span className="text-2xl font-black" style={{ color: stat.color }}>
                {stat.icon} {stat.value}
              </span>
              <span className="text-xs mt-1" style={{ color: stat.color + 'aa' }}>
                {stat.label}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Colony status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-sm space-y-3"
        >
          <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <span className="text-sm font-bold" style={{ color: '#4ade80' }}>🏥 Quarantined</span>
            <span className="text-lg font-black" style={{ color: '#4ade80' }}>{quarantined.length}</span>
          </div>
          {stillInfected.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <span className="text-sm font-bold" style={{ color: '#f87171' }}>⚠ Still Infected</span>
              <span className="text-lg font-black" style={{ color: '#f87171' }}>{stillInfected.length}</span>
            </div>
          )}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="text-sm font-bold" style={{ color: '#9b91c8' }}>⏱ Time Left</span>
            <span className="text-lg font-black font-mono" style={{ color: timerSeconds > 60 ? '#4ade80' : '#ef4444' }}>
              {formatTime(timerSeconds)}
            </span>
          </div>
        </motion.div>

        {/* Warning */}
        {stillInfected.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.7, 1] }}
            transition={{ delay: 0.5 }}
            className="px-5 py-3 rounded-xl text-sm text-center"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171',
              maxWidth: 320,
            }}
          >
            ⚠ {stillInfected.length} infected bee{stillInfected.length > 1 ? 's' : ''} still roam the hive.
            They carry infection into the next round!
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <GlowButton
            size="lg"
            onClick={() => { buttonClick(); startNextRound(); }}
          >
            🎲 Start Round {round + 1}
          </GlowButton>
        </motion.div>
      </div>
    </div>
  );
}
