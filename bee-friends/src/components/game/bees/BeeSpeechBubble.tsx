'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { speechBubbleVariants } from '@/constants/animations';

interface BeeSpeechBubbleProps {
  question: string;
  answer: string;
  visible: boolean;
  beeColorHue: number;
}

export function BeeSpeechBubble({ question, answer, visible, beeColorHue }: BeeSpeechBubbleProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          variants={speechBubbleVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="absolute bottom-full left-1/2 mb-2 z-20"
          style={{
            transformOrigin: 'bottom center',
            transform: 'translateX(-50%)',
            width: 'clamp(180px, 22vw, 260px)',
          }}
        >
          <div
            className="rounded-2xl px-3 py-2 text-xs shadow-lg relative"
            style={{
              background: `linear-gradient(135deg, hsl(${beeColorHue},40%,18%), hsl(${beeColorHue},35%,12%))`,
              border: `1.5px solid hsl(${beeColorHue},60%,40%)`,
              boxShadow: `0 4px 20px hsl(${beeColorHue},60%,20%)`,
            }}
          >
            {/* Question */}
            <p className="text-[10px] font-semibold mb-1" style={{ color: `hsl(${beeColorHue},80%,75%)` }}>
              {question}
            </p>
            {/* Answer */}
            <p className="leading-snug" style={{ color: '#f1f0ff', fontSize: '0.7rem' }}>
              "{answer}"
            </p>
            {/* Bubble tail */}
            <div
              className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-full w-0 h-0"
              style={{
                borderLeft: '7px solid transparent',
                borderRight: '7px solid transparent',
                borderTop: `8px solid hsl(${beeColorHue},60%,40%)`,
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
