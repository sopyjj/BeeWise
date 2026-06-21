'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotate: number;
  rotateVel: number;
}

const COLORS = ['#f59e0b', '#fbbf24', '#fde68a', '#22c55e', '#4ade80', '#ffffff', '#fef3c7'];
const SHAPES = ['●', '◆', '★', '🍯', '🐝'];

export function HoneySplat() {
  const particles: Particle[] = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: 50 + (Math.random() - 0.5) * 20,
    y: 50 + (Math.random() - 0.5) * 20,
    vx: (Math.random() - 0.5) * 80,
    vy: -(Math.random() * 60 + 20),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: Math.random() * 18 + 6,
    rotate: Math.random() * 360,
    rotateVel: (Math.random() - 0.5) * 360,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute select-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: p.size,
            color: p.color,
          }}
          initial={{ opacity: 1, scale: 0, rotate: p.rotate }}
          animate={{
            x: [0, p.vx * 3, p.vx * 6],
            y: [0, p.vy * 2, p.vy * 2 + 200],
            opacity: [1, 1, 0],
            scale: [0, 1.2, 0.8],
            rotate: [p.rotate, p.rotate + p.rotateVel * 3],
          }}
          transition={{ duration: 2 + Math.random() * 1, ease: 'easeOut' }}
        >
          {SHAPES[p.id % SHAPES.length]}
        </motion.div>
      ))}
    </div>
  );
}
