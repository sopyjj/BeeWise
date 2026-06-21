// Distinct warm hues for 8 bees — all in amber/orange/yellow range
export const BEE_HUES = [32, 50, 18, 60, 42, 26, 54, 38] as const;

export const THEME = {
  background: '#0d0a1a',
  surface: '#1a1530',
  surfaceLight: '#241e42',
  border: '#3d3560',
  accent: '#f59e0b',
  accentGlow: '#fbbf24',
  danger: '#ef4444',
  dangerGlow: '#f87171',
  success: '#22c55e',
  successGlow: '#4ade80',
  text: '#f1f0ff',
  textMuted: '#9b91c8',
  honeycomb: '#2a2050',
} as const;

export const BEE_STRIPE_COLORS = {
  bodyBase: (hue: number) => `hsl(${hue}, 85%, 58%)`,
  bodyDark: (hue: number) => `hsl(${hue}, 70%, 38%)`,
  stripeLight: (hue: number) => `hsl(${hue}, 90%, 72%)`,
  stripeDark: '#1a1008',
  wing: 'rgba(200, 230, 255, 0.55)',
  wingStroke: 'rgba(150, 200, 255, 0.4)',
  eye: '#0a0520',
  eyeHighlight: '#ffffff',
  antennae: '#1a1008',
} as const;
