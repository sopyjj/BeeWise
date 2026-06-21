'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BeeState, BeeAnimState } from '@/types/game';
import { BeeBody } from '../svg/BeeBody';

interface BeeCharacterProps {
  beeState: BeeState;
  size?: number;
  onClick?: (beeId: string) => void;
  interactive?: boolean;
  showAnswers?: boolean;
}

export function BeeCharacter({ beeState, size = 80, onClick, interactive, showAnswers }: BeeCharacterProps) {
  const { profile, animState, currentAnswer, currentQuestion, isAccused } = beeState;
  const isNervous = animState === BeeAnimState.NERVOUS || animState === BeeAnimState.ACCUSED;
  const isSpeaking = animState === BeeAnimState.SPEAKING && !!currentAnswer;
  const canClick = interactive;

  return (
    <div
      className="flex flex-col items-center"
      style={{ width: '100%' }}
    >
      {/* Question — fixed height area so all bees align vertically */}
      <div style={{ minHeight: showAnswers ? 72 : 0, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 8 }}>
        <AnimatePresence>
          {showAnswers && currentQuestion && (
            <motion.p
              key="question"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center leading-snug"
              style={{
                fontSize: '0.85rem',
                color: `hsl(${profile.colorHue}, 70%, 70%)`,
                fontStyle: 'italic',
                lineHeight: 1.4,
                maxWidth: '100%',
              }}
            >
              {currentQuestion}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Bee body */}
      <motion.div
        animate={
          isAccused
            ? { y: [0, -4, 0], scale: [1, 1.06, 1] }
            : { y: [0, -7, 0] }
        }
        transition={{ duration: isAccused ? 0.5 : 2.8, repeat: Infinity, ease: 'easeInOut' }}
        onClick={() => canClick && onClick?.(profile.id)}
        className={canClick ? 'cursor-pointer select-none' : ''}
        style={{ position: 'relative', flexShrink: 0 }}
        whileHover={canClick ? { scale: 1.1 } : {}}
        whileTap={canClick ? { scale: 0.94 } : {}}
      >
        {isAccused && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-10"
            animate={{
              boxShadow: ['0 0 0 2px #ef4444', '0 0 0 8px rgba(239,68,68,0.35)', '0 0 0 2px #ef4444'],
            }}
            transition={{ duration: 0.7, repeat: Infinity }}
            style={{ borderRadius: '50%', margin: '-4px', padding: '4px' }}
          />
        )}
        <BeeBody
          profile={profile}
          size={size}
          isNervous={isNervous}
          isSpeaking={isSpeaking}
          isAccused={isAccused}
        />
      </motion.div>

      {/* Name tag */}
      <motion.div
        className="mt-1 px-2 py-0.5 rounded-full text-center"
        style={{
          fontSize: Math.max(9, size * 0.13),
          background: isAccused
            ? 'rgba(239,68,68,0.25)'
            : `hsla(${profile.colorHue},50%,20%,0.7)`,
          border: `1px solid hsl(${profile.colorHue},50%,${isAccused ? '60%' : '30%'})`,
          color: `hsl(${profile.colorHue},80%,80%)`,
          fontWeight: 600,
          letterSpacing: '0.02em',
          flexShrink: 0,
        }}
      >
        {profile.name}
      </motion.div>

      {/* Answer — fixed height area below name tag */}
      <div style={{ minHeight: showAnswers ? 78 : 0, width: '100%', paddingTop: 8 }}>
        <AnimatePresence>
          {showAnswers && currentAnswer && (
            <motion.div
              key="answer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="rounded-lg px-2.5 py-2 text-center"
              style={{
                background: `hsla(${profile.colorHue}, 35%, 12%, 0.85)`,
                border: `1px solid hsla(${profile.colorHue}, 50%, 30%, 0.6)`,
                fontSize: '0.88rem',
                color: '#e8e4ff',
                lineHeight: 1.45,
              }}
            >
              "{currentAnswer}"
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
