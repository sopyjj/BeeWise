'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { HoneycombBg } from '../svg/HoneycombBg';
import { TEMPERATURE_COLORS, TEMPERATURE_LABELS } from '@/constants/gameConfig';
import { soundEngine } from '@/lib/soundEngine';

const DIE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export function RoundInitScreen() {
  const round = useGameStore(s => s.round);
  const currentRound = useGameStore(s => s.currentRound);
  const advanceToInvestigation = useGameStore(s => s.advanceToInvestigation);
  const soundEnabled = useGameStore(s => s.soundEnabled);
  const buttonClick = () => { soundEngine.setEnabled(soundEnabled); soundEngine.playButtonClick(); };
  const [rolling, setRolling] = useState(true);
  const [displayFace, setDisplayFace] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const temperature = currentRound?.config.temperature ?? 'MILD';
  const infectedCount = currentRound?.config.infectedCount ?? 1;
  const tempColor = TEMPERATURE_COLORS[temperature];

  // Run once on mount. Read die value directly from store state (not subscribed)
  // to avoid re-triggering the effect when currentRound is populated after mount.
  useEffect(() => {
    const dieValue = useGameStore.getState().currentRound?.config.dieRoll ?? 1;
    soundEngine.setEnabled(useGameStore.getState().soundEnabled);
    soundEngine.playDieRoll();

    let ticks = 0;
    const interval = setInterval(() => {
      setDisplayFace(Math.floor(Math.random() * 6));
      ticks++;
      if (ticks >= 14) {
        clearInterval(interval);
        setDisplayFace(dieValue - 1);
        setRolling(false);
        setTimeout(() => setRevealed(true), 400);
      }
    }, 80);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount-only: die value won't change during this screen's lifetime

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen gap-8 px-4">
      <HoneycombBg />

      {/* Round header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-4xl font-black" style={{ color: '#fbbf24' }}>
          Round {round}
        </h2>
        <p className="text-sm mt-1" style={{ color: '#9b91c8' }}>The Beekeeper rolls the temperature die…</p>
      </motion.div>

      {/* Die */}
      <motion.div
        animate={rolling ? {
          rotate: [0, 20, -20, 15, -15, 10, -10, 0],
          scale: [1, 1.1, 0.9, 1.08, 0.92, 1],
        } : {
          rotate: 0,
          scale: [1, 1.25, 1],
        }}
        transition={{ duration: rolling ? 1.2 : 0.4, ease: 'easeOut' }}
        className="flex items-center justify-center rounded-3xl"
        style={{
          width: 120,
          height: 120,
          background: 'linear-gradient(135deg, #241e42, #1a1530)',
          border: `3px solid ${rolling ? '#4b4570' : tempColor}`,
          boxShadow: rolling
            ? '0 0 20px rgba(75,69,112,0.5)'
            : `0 0 40px ${tempColor}80, 0 0 20px ${tempColor}40`,
          fontSize: 64,
          lineHeight: 1,
          transition: 'border-color 0.4s, box-shadow 0.4s',
        }}
      >
        {DIE_FACES[displayFace]}
      </motion.div>

      {/* Temperature reveal */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="text-center space-y-3"
          >
            <div
              className="text-2xl font-black tracking-wide"
              style={{ color: tempColor, textShadow: `0 0 20px ${tempColor}` }}
            >
              {TEMPERATURE_LABELS[temperature]}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-3"
            >
              <div
                className="px-5 py-2 rounded-xl font-bold text-lg"
                style={{
                  background: `${tempColor}20`,
                  border: `1.5px solid ${tempColor}60`,
                  color: tempColor,
                }}
              >
                {infectedCount} bee{infectedCount > 1 ? 's' : ''} infected this round
              </div>
            </motion.div>

            {infectedCount === 3 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.7, 1] }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-sm font-bold"
                style={{ color: '#ef4444' }}
              >
                ⚠ Maximum mite activity detected!
              </motion.p>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <button
                onClick={() => { buttonClick(); advanceToInvestigation(); }}
                className="mt-4 px-8 py-3 rounded-xl font-bold text-lg cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                  color: '#0d0a1a',
                  border: '1.5px solid #fbbf24',
                  boxShadow: '0 0 20px rgba(245,158,11,0.5)',
                }}
              >
                🔍 Begin Investigation
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
