'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function CollapseEffect() {
  return (
    <>
      {/* Screen shake wrapper is applied by the parent */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.6, 0.3, 0.7, 0.4, 0.8] }}
        transition={{ duration: 1.5, ease: 'easeIn' }}
        style={{ background: 'radial-gradient(circle at center, rgba(239,68,68,0.3), rgba(0,0,0,0.8))' }}
      />
      {/* Crack lines */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-41"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.6] }}
        transition={{ duration: 2 }}
        style={{
          background: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 98%,
              rgba(239,68,68,0.3) 98%,
              rgba(239,68,68,0.3) 100%
            )
          `,
          backgroundSize: '40px 40px',
        }}
      />
    </>
  );
}
