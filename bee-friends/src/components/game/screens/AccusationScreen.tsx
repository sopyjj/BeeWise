'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { selectActiveBees } from '@/store/selectors';
import { useShallow } from 'zustand/react/shallow';
import { BeeGrid } from '../bees/BeeGrid';
import { GlowButton } from '../ui/GlowButton';
import { HoneycombBg } from '../svg/HoneycombBg';
import { useSound } from '@/hooks/useSound';

export function AccusationScreen() {
  const bees = useGameStore(useShallow(selectActiveBees));
  const currentRound = useGameStore(s => s.currentRound);
  const toggleAccusation = useGameStore(s => s.toggleAccusation);
  const clearAccusations = useGameStore(s => s.clearAccusations);
  const submitAccusations = useGameStore(s => s.submitAccusations);
  const [showConfirm, setShowConfirm] = useState(false);
  const { accuse, buttonClick } = useSound();

  const accused = currentRound?.accusedBeeIds ?? [];
  const accusationCap = currentRound?.config.infectedCount ?? 1;
  const atCap = accused.length >= accusationCap;
  const beeSize = 72;

  const handleBeeClick = (beeId: string) => {
    const isDeselect = accused.includes(beeId);
    // Block adding new accusations past the round's infected-bee cap.
    if (!isDeselect && atCap) return;
    accuse();
    toggleAccusation(beeId);
  };

  const handleConfirm = () => {
    if (accused.length === 0) return;
    buttonClick();
    setShowConfirm(true);
  };

  return (
    <div className="relative flex flex-col min-h-screen">
      <HoneycombBg />

      <div className="relative z-10 flex flex-col items-center gap-6 py-6 px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-2xl font-black" style={{ color: '#f1f0ff' }}>
            ⚡ Accusation Phase
          </h2>
          <p className="text-sm mt-1" style={{ color: '#9b91c8' }}>
            Click the bees you suspect are infected. Trust your instincts.
          </p>
        </motion.div>

        {/* Accusation counter */}
        <motion.div
          key={accused.length}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-3 px-5 py-2.5 rounded-xl"
          style={{
            background: accused.length > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1.5px solid ${accused.length > 0 ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
          }}
        >
          <span style={{ color: accused.length > 0 ? '#f87171' : '#4b4570', fontSize: '1.1rem' }}>
            ⚡
          </span>
          <span className="font-bold" style={{ color: accused.length > 0 ? '#f87171' : '#4b4570' }}>
            {accused.length} bee{accused.length !== 1 ? 's' : ''} accused
          </span>
          {accused.length > 0 && (
            <button
              onClick={() => { buttonClick(); clearAccusations(); }}
              className="ml-2 text-xs px-2 py-0.5 rounded cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#9b91c8' }}
            >
              Clear
            </button>
          )}
        </motion.div>

        {/* Tip */}
        <div className="text-xs text-center max-w-sm" style={{ color: '#4b4570' }}>
          Tip: Infected bees often give vague answers, wrong facts, or shaky alibis.
          You can accuse up to {accusationCap} bee{accusationCap !== 1 ? 's' : ''} this round.
        </div>

        {/* Bee grid — interactive */}
        <div className="overflow-x-auto w-full flex justify-center pb-4">
          <BeeGrid
            bees={bees}
            beeSize={beeSize}
            onBeeClick={handleBeeClick}
            interactive
            showAnswers
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 flex-wrap justify-center">
          <GlowButton
            variant="ghost"
            onClick={() => { buttonClick(); clearAccusations(); }}
            disabled={accused.length === 0}
          >
            Clear All
          </GlowButton>
          <GlowButton
            variant="danger"
            size="lg"
            onClick={handleConfirm}
            disabled={accused.length === 0}
          >
            🔬 Confirm Accusations ({accused.length})
          </GlowButton>
        </div>

        {accused.length === 0 && (
          <p className="text-xs" style={{ color: '#4b4570' }}>
            Select at least one bee to proceed.
          </p>
        )}
      </div>

      {/* Confirmation dialog */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="rounded-2xl p-6 text-center max-w-sm w-full"
              style={{
                background: 'linear-gradient(135deg, #1a1530, #130f28)',
                border: '1.5px solid rgba(239,68,68,0.4)',
                boxShadow: '0 8px 40px rgba(239,68,68,0.2)',
              }}
            >
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#f87171' }}>
                Confirm Accusation?
              </h3>
              <p className="text-sm mb-4" style={{ color: '#9b91c8' }}>
                You are accusing <strong style={{ color: '#fbbf24' }}>{accused.length} bee{accused.length > 1 ? 's' : ''}</strong>.
                Wrongly accusing a healthy bee will leave them active.
              </p>
              <div className="flex gap-3 justify-center">
                <GlowButton variant="ghost" onClick={() => setShowConfirm(false)}>
                  Cancel
                </GlowButton>
                <GlowButton
                  variant="danger"
                  onClick={() => { setShowConfirm(false); submitAccusations(); }}
                >
                  Accuse Them!
                </GlowButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
