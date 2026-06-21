'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

// Shows only a count of safely-quarantined bees. Specific bee identities are
// intentionally never displayed: revealing which bee was moved to the clinic
// would leak which prior accusation was correct. The count is cumulative —
// quarantined bees are dropped from the live bee list each round, so we read
// the running total from the score instead.
export function QuarantinePanel() {
  const totalQuarantined = useGameStore(s => s.score.totalCorrectAccusations);

  return (
    <div
      className="flex flex-col gap-2 items-center"
      style={{
        background: 'rgba(13,10,26,0.85)',
        border: '1.5px solid rgba(34,197,94,0.25)',
        borderRadius: '16px',
        padding: '12px 14px',
        minWidth: 90,
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center gap-1.5">
        <span style={{ fontSize: 14 }}>🏥</span>
        <span className="text-xs font-bold" style={{ color: '#4ade80', letterSpacing: '0.04em' }}>
          CLINIC
        </span>
      </div>

      <motion.div
        key={totalQuarantined}
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="text-center"
      >
        <div className="font-black" style={{ color: '#4ade80', fontSize: '1.4rem', lineHeight: 1 }}>
          {totalQuarantined}
        </div>
        <div style={{ fontSize: '0.6rem', color: '#6b7280', letterSpacing: '0.05em' }}>
          safe
        </div>
      </motion.div>
    </div>
  );
}
