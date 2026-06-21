'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GlowButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'danger' | 'ghost' | 'success';
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const VARIANTS = {
  primary: {
    bg: 'linear-gradient(135deg, #d97706, #f59e0b)',
    glow: 'rgba(245,158,11,0.5)',
    border: '#fbbf24',
    text: '#0d0a1a',
  },
  danger: {
    bg: 'linear-gradient(135deg, #b91c1c, #ef4444)',
    glow: 'rgba(239,68,68,0.5)',
    border: '#f87171',
    text: '#ffffff',
  },
  success: {
    bg: 'linear-gradient(135deg, #15803d, #22c55e)',
    glow: 'rgba(34,197,94,0.5)',
    border: '#4ade80',
    text: '#ffffff',
  },
  ghost: {
    bg: 'rgba(255,255,255,0.06)',
    glow: 'rgba(255,255,255,0.15)',
    border: 'rgba(255,255,255,0.2)',
    text: '#f1f0ff',
  },
};

const SIZES = {
  sm: 'px-4 py-1.5 text-sm',
  md: 'px-6 py-2.5 text-base',
  lg: 'px-8 py-3.5 text-lg',
};

export function GlowButton({ children, onClick, variant = 'primary', disabled, size = 'md', className = '' }: GlowButtonProps) {
  const v = VARIANTS[variant];
  const s = SIZES[size];

  return (
    <motion.button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`relative rounded-xl font-bold tracking-wide cursor-pointer select-none ${s} ${className}`}
      style={{
        background: disabled ? 'rgba(255,255,255,0.06)' : v.bg,
        border: `1.5px solid ${disabled ? 'rgba(255,255,255,0.1)' : v.border}`,
        color: disabled ? 'rgba(255,255,255,0.3)' : v.text,
        boxShadow: disabled ? 'none' : `0 0 16px ${v.glow}, 0 2px 8px rgba(0,0,0,0.4)`,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      whileHover={disabled ? {} : {
        scale: 1.04,
        boxShadow: `0 0 28px ${v.glow}, 0 4px 16px rgba(0,0,0,0.5)`,
      }}
      whileTap={disabled ? {} : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {children}
    </motion.button>
  );
}
