'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BeeProfile } from '@/types/game';
import { BEE_STRIPE_COLORS } from '@/constants/colors';

interface BeeBodyProps {
  profile: BeeProfile;
  size?: number;
  isNervous?: boolean;
  isSpeaking?: boolean;
  isQuarantined?: boolean;
  isAccused?: boolean;
}

export function BeeBody({ profile, size = 80, isNervous, isSpeaking, isQuarantined, isAccused }: BeeBodyProps) {
  const { colorHue, stripePattern, eyeShape } = profile;
  const c = BEE_STRIPE_COLORS;
  const s = size;
  const cx = s / 2;
  const cy = s / 2;

  // Body dimensions
  const bodyW = s * 0.42;
  const bodyH = s * 0.32;

  // Stripe offsets based on pattern
  const stripeOffsets = {
    classic: [-0.08, 0.05, 0.18],
    bold:    [-0.1, 0.04, 0.18],
    thin:    [-0.06, 0.08, 0.2],
    reverse: [0.18, 0.05, -0.08],
  }[stripePattern];

  // Eye dimensions
  const eyeProps = {
    round:  { rx: s * 0.055, ry: s * 0.055 },
    almond: { rx: s * 0.07,  ry: s * 0.045 },
    wide:   { rx: s * 0.065, ry: s * 0.06 },
  }[eyeShape];

  const filter = isQuarantined ? 'grayscale(85%) brightness(0.6)' : undefined;

  return (
    <motion.svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      style={{ filter, overflow: 'visible', display: 'block' }}
      animate={isAccused ? {
        filter: ['drop-shadow(0 0 4px #ef4444)', 'drop-shadow(0 0 12px #ef4444)', 'drop-shadow(0 0 4px #ef4444)'],
      } : isSpeaking ? {
        filter: [`drop-shadow(0 0 4px hsl(${colorHue},85%,65%))`, `drop-shadow(0 0 10px hsl(${colorHue},90%,70%))`, `drop-shadow(0 0 4px hsl(${colorHue},85%,65%))`],
      } : {
        filter: `drop-shadow(0 0 3px hsl(${colorHue},70%,40%))`,
      }}
      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <clipPath id={`body-clip-${profile.id}`}>
          <ellipse cx={cx} cy={cy + s * 0.05} rx={bodyW} ry={bodyH} />
        </clipPath>
      </defs>

      {/* Wings */}
      <motion.g
        animate={isSpeaking || isNervous ? {
          rotate: isNervous ? [0, -3, 3, -2, 2, 0] : [0, -4, 4, 0],
          opacity: [0.5, 0.9, 0.5],
        } : { opacity: [0.4, 0.65, 0.4] }}
        transition={{ duration: isNervous ? 0.4 : 1.8, repeat: Infinity }}
        style={{ transformOrigin: `${cx}px ${cy - s * 0.1}px` }}
      >
        {/* Left wing */}
        <ellipse
          cx={cx - s * 0.25}
          cy={cy - s * 0.18}
          rx={s * 0.22}
          ry={s * 0.12}
          fill={c.wing}
          stroke={c.wingStroke}
          strokeWidth={1}
          transform={`rotate(-20, ${cx - s * 0.25}, ${cy - s * 0.18})`}
        />
        {/* Right wing */}
        <ellipse
          cx={cx + s * 0.25}
          cy={cy - s * 0.18}
          rx={s * 0.22}
          ry={s * 0.12}
          fill={c.wing}
          stroke={c.wingStroke}
          strokeWidth={1}
          transform={`rotate(20, ${cx + s * 0.25}, ${cy - s * 0.18})`}
        />
      </motion.g>

      {/* Body base */}
      <ellipse
        cx={cx}
        cy={cy + s * 0.05}
        rx={bodyW}
        ry={bodyH}
        fill={c.bodyBase(colorHue)}
      />

      {/* Stripes clipped to body */}
      <g clipPath={`url(#body-clip-${profile.id})`}>
        {stripeOffsets.map((offset, i) => (
          <rect
            key={i}
            x={cx - bodyW}
            y={cy + s * 0.05 + s * offset - s * 0.045}
            width={bodyW * 2}
            height={s * 0.075}
            fill={c.stripeDark}
          />
        ))}
      </g>

      {/* Body highlight */}
      <ellipse
        cx={cx - s * 0.06}
        cy={cy - s * 0.04}
        rx={bodyW * 0.35}
        ry={bodyH * 0.3}
        fill={c.stripeLight(colorHue)}
        opacity={0.4}
      />

      {/* Stinger */}
      <polygon
        points={`${cx},${cy + bodyH + s * 0.12} ${cx - s * 0.04},${cy + bodyH + s * 0.02} ${cx + s * 0.04},${cy + bodyH + s * 0.02}`}
        fill={c.bodyDark(colorHue)}
      />

      {/* Antennae */}
      <motion.g
        animate={isNervous ? {
          rotate: [0, -8, 8, -5, 5, -2, 2, 0],
        } : {}}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2.5 }}
        style={{ transformOrigin: `${cx}px ${cy - s * 0.2}px` }}
      >
        {/* Left antenna */}
        <path
          d={`M ${cx - s * 0.06} ${cy - s * 0.22} Q ${cx - s * 0.2} ${cy - s * 0.42} ${cx - s * 0.28} ${cy - s * 0.46}`}
          stroke={c.antennae}
          strokeWidth={s * 0.025}
          fill="none"
          strokeLinecap="round"
        />
        <circle cx={cx - s * 0.28} cy={cy - s * 0.46} r={s * 0.035} fill={c.antennae} />
        {/* Right antenna */}
        <path
          d={`M ${cx + s * 0.06} ${cy - s * 0.22} Q ${cx + s * 0.2} ${cy - s * 0.42} ${cx + s * 0.28} ${cy - s * 0.46}`}
          stroke={c.antennae}
          strokeWidth={s * 0.025}
          fill="none"
          strokeLinecap="round"
        />
        <circle cx={cx + s * 0.28} cy={cy - s * 0.46} r={s * 0.035} fill={c.antennae} />
      </motion.g>

      {/* Head */}
      <circle
        cx={cx}
        cy={cy - s * 0.14}
        r={s * 0.2}
        fill={c.bodyBase(colorHue)}
      />
      <circle
        cx={cx}
        cy={cy - s * 0.14}
        r={s * 0.2}
        fill={c.stripeLight(colorHue)}
        opacity={0.15}
      />

      {/* Eyes */}
      <motion.g
        animate={isNervous ? {
          x: [0, -2, 2, -1, 1, 0],
        } : {}}
        transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 3 }}
      >
        {/* Left eye */}
        <ellipse
          cx={cx - s * 0.085}
          cy={cy - s * 0.17}
          rx={eyeProps.rx}
          ry={eyeProps.ry}
          fill={c.eye}
        />
        <circle cx={cx - s * 0.075} cy={cy - s * 0.18} r={s * 0.016} fill={c.eyeHighlight} />
        {/* Right eye */}
        <ellipse
          cx={cx + s * 0.085}
          cy={cy - s * 0.17}
          rx={eyeProps.rx}
          ry={eyeProps.ry}
          fill={c.eye}
        />
        <circle cx={cx + s * 0.095} cy={cy - s * 0.18} r={s * 0.016} fill={c.eyeHighlight} />
      </motion.g>

      {/* Mouth */}
      {isNervous ? (
        // Straight/worried mouth
        <path
          d={`M ${cx - s * 0.07} ${cy - s * 0.06} L ${cx + s * 0.07} ${cy - s * 0.06}`}
          stroke={c.eye}
          strokeWidth={s * 0.025}
          strokeLinecap="round"
        />
      ) : (
        // Smile
        <path
          d={`M ${cx - s * 0.07} ${cy - s * 0.07} Q ${cx} ${cy + s * 0.0} ${cx + s * 0.07} ${cy - s * 0.07}`}
          stroke={c.eye}
          strokeWidth={s * 0.025}
          fill="none"
          strokeLinecap="round"
        />
      )}
    </motion.svg>
  );
}
