'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BeeState } from '@/types/game';
import { BeeCharacter } from './BeeCharacter';
import { beeGridContainer, beeGridItem, beeFlyIn } from '@/constants/animations';

interface BeeGridProps {
  bees: BeeState[];
  beeSize?: number;
  onBeeClick?: (beeId: string) => void;
  interactive?: boolean;
  showAnswers?: boolean;
  /**
   * When provided, each bee flies in at its index in this array (others fly in
   * at delay 0). Used by the investigation phase to chronologize entries with
   * answer reveals so the user can focus on each bee individually.
   */
  flyInOrder?: string[];
  /** Seconds between consecutive bee entries. Default 1.5. */
  flyInInterval?: number;
}

export function BeeGrid({
  bees,
  beeSize = 80,
  onBeeClick,
  interactive,
  showAnswers,
  flyInOrder,
  flyInInterval = 1.5,
}: BeeGridProps) {
  // Card width = bee size + horizontal padding; min 210px so question/answer
  // text has room to breathe at the larger font sizes.
  const cardWidth = Math.max(210, beeSize + 130);
  const useFlyIn = !!flyInOrder && flyInOrder.length > 0;
  // Always lay the hive out as (close to) two even rows. Column count =
  // ceil(N/2) so 8→4+4, 7→4+3, 6→3+3, 5→3+2, etc. The shorter second row
  // is rendered as its own centered flex row so it isn't left-aligned under
  // the longer first row.
  const columns = Math.max(1, Math.ceil(bees.length / 2));
  const rows = [bees.slice(0, columns), bees.slice(columns)].filter(r => r.length > 0);

  const renderBee = (bee: BeeState, globalIndex: number) => {
    const orderIdx = useFlyIn ? flyInOrder!.indexOf(bee.profile.id) : -1;
    const delay = orderIdx >= 0 ? orderIdx * flyInInterval : 0;
    // Use the golden angle for variety; each bee always enters from the
    // same direction so it feels intentional rather than random.
    const angle = ((globalIndex * 137.5) % 360 + 360) % 360;

    return (
      <motion.div
        key={bee.profile.id}
        variants={useFlyIn ? beeFlyIn : beeGridItem}
        custom={useFlyIn ? { angle, delay } : undefined}
        // In fly-in mode each bee animates independently; otherwise inherit
        // hidden/visible from the parent container's stagger.
        initial={useFlyIn ? 'hidden' : undefined}
        animate={useFlyIn ? 'visible' : undefined}
        className="flex justify-center"
        style={{ width: cardWidth }}
      >
        <div
          className="flex flex-col items-center rounded-xl px-3 py-2"
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.03)',
            border: bee.isAccused
              ? '1px solid rgba(239,68,68,0.35)'
              : `1px solid hsla(${bee.profile.colorHue},40%,25%,0.4)`,
            transition: 'border-color 0.2s',
          }}
        >
          <BeeCharacter
            beeState={bee}
            size={beeSize}
            onClick={onBeeClick}
            interactive={interactive}
            showAnswers={showAnswers}
          />
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      variants={useFlyIn ? undefined : beeGridContainer}
      initial={useFlyIn ? false : 'hidden'}
      animate={useFlyIn ? undefined : 'visible'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '32px',
      }}
    >
      {rows.map((row, rowIdx) => (
        <div
          key={rowIdx}
          style={{ display: 'flex', gap: '22px', justifyContent: 'center' }}
        >
          {row.map((bee, colIdx) => renderBee(bee, rowIdx * columns + colIdx))}
        </div>
      ))}
    </motion.div>
  );
}
