'use client';

import React from 'react';
import { THEME } from '@/constants/colors';

export function HoneycombBg() {
  const hexSize = 28;
  const cols = 20;
  const rows = 12;
  const w = hexSize * 2;
  const h = Math.sqrt(3) * hexSize;

  const hexPoints = (cx: number, cy: number) => {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      pts.push(`${cx + hexSize * Math.cos(angle)},${cy + hexSize * Math.sin(angle)}`);
    }
    return pts.join(' ');
  };

  const hexes: { x: number; y: number; key: string }[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * w * 0.75 + hexSize;
      const y = row * h + (col % 2 === 1 ? h / 2 : 0) + hexSize;
      hexes.push({ x, y, key: `${row}-${col}` });
    }
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity: 0.18 }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${cols * w * 0.75 + hexSize} ${rows * h + hexSize}`}
        preserveAspectRatio="xMidYMid slice"
      >
        {hexes.map(({ x, y, key }) => (
          <polygon
            key={key}
            points={hexPoints(x, y)}
            fill="none"
            stroke={THEME.honeycomb}
            strokeWidth={1.5}
          />
        ))}
      </svg>
    </div>
  );
}
