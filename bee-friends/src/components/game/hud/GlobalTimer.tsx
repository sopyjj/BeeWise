'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { formatTime } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';

const RADIUS = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function GlobalTimer() {
  const timerSeconds = useGameStore(s => s.timerSeconds);
  const { timerWarning } = useSound();

  const fraction = timerSeconds / 300;
  const dashOffset = CIRCUMFERENCE * (1 - fraction);

  const color = timerSeconds > 120
    ? '#22c55e'
    : timerSeconds > 60
    ? '#fbbf24'
    : timerSeconds > 30
    ? '#f97316'
    : '#ef4444';

  const isCritical = timerSeconds <= 30;
  const isUrgent = timerSeconds <= 60;

  useEffect(() => {
    if (timerSeconds > 0 && timerSeconds <= 30 && timerSeconds % 5 === 0) {
      timerWarning(1 - timerSeconds / 30);
    } else if (timerSeconds > 30 && timerSeconds <= 60 && timerSeconds % 15 === 0) {
      timerWarning(0.3);
    }
  }, [timerSeconds, timerWarning]);

  return (
    <motion.div
      className="flex items-center gap-2"
      animate={isCritical ? { scale: [1, 1.06, 1] } : {}}
      transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
    >
      <div className="relative w-14 h-14">
        <svg width="56" height="56" viewBox="0 0 56 56">
          {/* Track */}
          <circle
            cx="28" cy="28" r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="4"
          />
          {/* Progress arc */}
          <motion.circle
            cx="28" cy="28" r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 28 28)"
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
            animate={{ stroke: color }}
            transition={{ duration: 0.5 }}
          />
        </svg>
        {/* Time text */}
        <div
          className="absolute inset-0 flex items-center justify-center font-mono font-bold"
          style={{ fontSize: '0.68rem', color, letterSpacing: '-0.02em' }}
        >
          {formatTime(timerSeconds)}
        </div>
      </div>

      {isUrgent && (
        <motion.span
          className="text-xs font-bold"
          style={{ color }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          {isCritical ? '⚠ CRITICAL' : '! HURRY'}
        </motion.span>
      )}
    </motion.div>
  );
}
