'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { GamePhase } from '@/types/game';
import { useGameTimer } from '@/hooks/useGameTimer';
import { screenVariants } from '@/constants/animations';
import { selectIsHudVisible } from '@/store/selectors';

import { StartScreen } from './screens/StartScreen';
import { RoundInitScreen } from './screens/RoundInitScreen';
import { InvestigationScreen } from './screens/InvestigationScreen';
import { AccusationScreen } from './screens/AccusationScreen';
import { RevealScreen } from './screens/RevealScreen';
import { RoundSummaryScreen } from './screens/RoundSummaryScreen';
import { WinScreen } from './screens/WinScreen';
import { LoseScreen } from './screens/LoseScreen';

import { GlobalTimer } from './hud/GlobalTimer';
import { RoundBadge } from './hud/RoundBadge';
import { QuarantinePanel } from './hud/QuarantinePanel';

function ScreenContent({ phase }: { phase: GamePhase }) {
  switch (phase) {
    case GamePhase.START_SCREEN:    return <StartScreen />;
    case GamePhase.ROUND_INIT:      return <RoundInitScreen />;
    case GamePhase.INVESTIGATION:   return <InvestigationScreen />;
    case GamePhase.ACCUSATION:      return <AccusationScreen />;
    case GamePhase.REVEAL:          return <RevealScreen />;
    case GamePhase.ROUND_SUMMARY:   return <RoundSummaryScreen />;
    case GamePhase.WIN:             return <WinScreen />;
    case GamePhase.LOSE:            return <LoseScreen />;
    default:                        return <StartScreen />;
  }
}

export function GameShell() {
  useGameTimer();

  const phase = useGameStore(s => s.phase);
  const soundEnabled = useGameStore(s => s.soundEnabled);
  const toggleSound = useGameStore(s => s.toggleSound);
  const isHudVisible = useGameStore(selectIsHudVisible);

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0d0a1a 0%, #130f28 50%, #0d0a1a 100%)',
        color: '#f1f0ff',
        fontFamily: 'var(--font-geist-sans, sans-serif)',
      }}
    >
      {/* HUD — persistent overlay during gameplay */}
      {isHudVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-2"
          style={{
            background: 'rgba(13,10,26,0.85)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <RoundBadge />
          <GlobalTimer />
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className="w-8 h-8 flex items-center justify-center rounded-full text-sm"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#9b91c8' }}
              title={soundEnabled ? 'Mute' : 'Unmute'}
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Mute toggle on start screen */}
      {phase === GamePhase.START_SCREEN && (
        <div className="fixed top-4 right-4 z-30">
          <button
            onClick={toggleSound}
            className="w-9 h-9 flex items-center justify-center rounded-full text-sm"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#9b91c8' }}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
        </div>
      )}

      {/* Right sidebar: Quarantine panel */}
      {isHudVisible && (
        <div
          className="fixed right-4 z-20 hidden lg:block"
          style={{ top: '70px', bottom: '16px', overflowY: 'auto' }}
        >
          <QuarantinePanel />
        </div>
      )}

      {/* Main screen content */}
      <div className={isHudVisible ? 'pt-14' : ''}>
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <ScreenContent phase={phase} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
