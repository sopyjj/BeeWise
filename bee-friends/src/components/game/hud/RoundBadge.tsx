'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

export function RoundBadge() {
  const round = useGameStore(s => s.round);
  return (
    <motion.div
      key={round}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="px-3 py-1 rounded-full text-sm font-bold"
      style={{
        background: 'rgba(245,158,11,0.15)',
        border: '1.5px solid rgba(245,158,11,0.4)',
        color: '#fbbf24',
        letterSpacing: '0.06em',
      }}
    >
      ROUND {round}
    </motion.div>
  );
}
