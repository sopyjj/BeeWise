'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { BEE_PROFILES } from '@/data/beeProfiles';
import { BeeBody } from '../svg/BeeBody';
import { GlowButton } from '../ui/GlowButton';
import { InstructionsModal } from '../ui/InstructionsModal';
import { HoneycombBg } from '../svg/HoneycombBg';
import { ParticleField } from '../svg/ParticleField';
import { BeeStatus, BeeAnimState, InfectionTell } from '@/types/game';
import { useSound } from '@/hooks/useSound';

const DEMO_BEES = BEE_PROFILES.slice(0, 5).map(p => ({
  profile: p,
  status: BeeStatus.HEALTHY,
  animState: BeeAnimState.IDLE,
  currentAnswer: null,
  currentQuestion: null,
  isAccused: false,
  revealComplete: false,
  tell: InfectionTell.NONE,
}));

export function StartScreen() {
  const startGame = useGameStore(s => s.startGame);
  const [showInstructions, setShowInstructions] = useState(false);
  const { buttonClick } = useSound();

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden">
      <HoneycombBg />
      <ParticleField />

      {/* Floating demo bees */}
      <div className="absolute inset-0 pointer-events-none">
        {DEMO_BEES.map((bee, i) => (
          <motion.div
            key={bee.profile.id}
            className="absolute"
            style={{
              left: `${10 + i * 18}%`,
              top: `${15 + (i % 2) * 55}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, i % 2 === 0 ? 5 : -5, 0],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.4,
            }}
          >
            <BeeBody profile={bee.profile} size={60} />
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-4 text-center">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
        >
          <motion.div
            className="text-5xl mb-2"
            animate={{ rotate: [0, 5, -5, 3, -3, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            🐝
          </motion.div>
          <h1
            className="font-black leading-none tracking-tight"
            style={{
              fontSize: 'clamp(2.4rem, 6vw, 4.5rem)',
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 20px rgba(245,158,11,0.5))',
            }}
          >
            Colony Under Threat
          </h1>
          <motion.p
            className="mt-3 text-lg font-medium"
            style={{ color: '#9b91c8' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            A Varroa Mite Deduction Game
          </motion.p>
        </motion.div>

        {/* Flavor text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="max-w-sm px-6 py-4 rounded-2xl text-sm"
          style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.25)',
            color: '#c9c0e8',
            lineHeight: 1.6,
          }}
        >
          The hive is under attack. Varroa mites are hiding among your workers.
          Watch carefully — <span style={{ color: '#fbbf24', fontWeight: 600 }}>infected bees lie</span>.
          You have 5 minutes to protect the colony.
        </motion.div>

        {/* Buttons */}
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <GlowButton
            size="lg"
            onClick={() => { buttonClick(); startGame(); }}
          >
            🚀 Start Game
          </GlowButton>
          <GlowButton
            size="sm"
            variant="ghost"
            onClick={() => { buttonClick(); setShowInstructions(true); }}
          >
            📖 How to Play
          </GlowButton>
        </motion.div>

        {/* Timer preview */}
        <motion.div
          className="flex items-center gap-2 text-sm"
          style={{ color: '#4b4570' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <span>⏱</span>
          <span>5:00 global timer · 8 bees · 1–3 infected per round</span>
        </motion.div>
      </div>

      <InstructionsModal open={showInstructions} onClose={() => setShowInstructions(false)} />
    </div>
  );
}
