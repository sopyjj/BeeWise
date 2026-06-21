'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { BeeBody } from '../svg/BeeBody';
import { GlowButton } from '../ui/GlowButton';
import { HoneycombBg } from '../svg/HoneycombBg';
import { useSound } from '@/hooks/useSound';
import { BeeStatus } from '@/types/game';
import { evaluateAccusations } from '@/lib/gameEngine';

interface RevealResult {
  beeId: string;
  beeName: string;
  colorHue: number;
  profile: import('@/types/game').BeeProfile;
  verdict: 'INFECTED' | 'INNOCENT' | 'ESCAPED';
  revealed: boolean;
}

export function RevealScreen() {
  const bees = useGameStore(s => s.bees);
  const currentRound = useGameStore(s => s.currentRound);
  const acknowledgeReveal = useGameStore(s => s.acknowledgeReveal);
  const [results, setResults] = useState<RevealResult[]>([]);
  const [revealIndex, setRevealIndex] = useState(-1);
  const [allDone, setAllDone] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { correctReveal, wrongReveal, revealDrum, quarantine } = useSound();

  const accused = currentRound?.accusedBeeIds ?? [];
  const infected = currentRound?.infectedBeeIds ?? [];
  const delay = currentRound?.config.revealDramaDelay ?? 900;

  const { correct, false: falsely, missed } = evaluateAccusations(accused, infected);
  // Failure = at least one infected bee escaped accusation. In that case the
  // identity of innocent (falsely accused) bees stays hidden too.
  const userFailed = missed.length > 0;

  useEffect(() => {
    // Build reveal list: accused first, then missed infected
    const revealList: RevealResult[] = [
      ...accused.map(id => {
        const bee = bees.find(b => b.profile.id === id)!;
        return {
          beeId: id,
          beeName: bee.profile.name,
          colorHue: bee.profile.colorHue,
          profile: bee.profile,
          verdict: correct.includes(id) ? 'INFECTED' as const : 'INNOCENT' as const,
          revealed: false,
        };
      }),
      ...missed.map(id => {
        const bee = bees.find(b => b.profile.id === id)!;
        return {
          beeId: id,
          beeName: bee.profile.name,
          colorHue: bee.profile.colorHue,
          profile: bee.profile,
          verdict: 'ESCAPED' as const,
          revealed: false,
        };
      }),
    ];

    setResults(revealList.map(r => ({ ...r, revealed: false })));

    // Reveal one by one
    revealList.forEach((_, i) => {
      const t = setTimeout(() => {
        revealDrum();
        setRevealIndex(i);
        setResults(prev => prev.map((r, idx) => idx === i ? { ...r, revealed: true } : r));

        // Play sound after flip
        setTimeout(() => {
          if (revealList[i].verdict === 'INFECTED') {
            quarantine();
          } else if (revealList[i].verdict === 'INNOCENT') {
            correctReveal();
          } else {
            wrongReveal();
          }
        }, 300);

        if (i === revealList.length - 1) {
          setTimeout(() => setAllDone(true), 1200);
        }
      }, 600 + i * (delay + 400));
      timeoutsRef.current.push(t);
    });

    if (revealList.length === 0) {
      setTimeout(() => setAllDone(true), 800);
    }

    return () => timeoutsRef.current.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative flex flex-col min-h-screen">
      <HoneycombBg />

      <div className="relative z-10 flex flex-col items-center gap-6 py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-3xl font-black" style={{ color: '#f1f0ff' }}>
            🔬 Reveal
          </h2>
          <p className="text-sm mt-1" style={{ color: '#9b91c8' }}>
            The truth comes out…
          </p>
        </motion.div>

        {/* Score summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: allDone ? 1 : 0 }}
          className="flex gap-4 flex-wrap justify-center"
        >
          <div className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
            ✓ {correct.length} Correct
          </div>
          <div className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
            ✗ {falsely.length} False
          </div>
          <div className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>
            ? {missed.length} Escaped
          </div>
        </motion.div>

        {/* Reveal cards */}
        <div className="flex flex-wrap gap-4 justify-center max-w-2xl">
          {results.map((result, i) => (
            <motion.div
              key={result.beeId}
              className="relative"
              style={{ perspective: 600 }}
            >
              <motion.div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  width: 130,
                  height: 170,
                  transformStyle: 'preserve-3d',
                }}
                animate={result.revealed ? {
                  rotateY: [0, 90, 0],
                  transition: { duration: 0.5, ease: 'easeInOut' },
                } : {}}
              >
                {/* Card face */}
                <div
                  className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-2 p-3"
                  style={{
                    background: result.revealed
                      ? result.verdict === 'INFECTED'
                        ? 'linear-gradient(135deg, #7f1d1d, #ef4444)'
                        : result.verdict === 'INNOCENT'
                        ? 'linear-gradient(135deg, #14532d, #22c55e)'
                        : 'linear-gradient(135deg, #78350f, #f59e0b)'
                      : 'linear-gradient(135deg, #1a1530, #241e42)',
                    border: result.revealed
                      ? result.verdict === 'INFECTED'
                        ? '2px solid #ef4444'
                        : result.verdict === 'INNOCENT'
                        ? '2px solid #22c55e'
                        : '2px solid #f59e0b'
                      : '2px solid rgba(255,255,255,0.1)',
                    boxShadow: result.revealed
                      ? result.verdict === 'INFECTED'
                        ? '0 0 30px rgba(239,68,68,0.4)'
                        : result.verdict === 'INNOCENT'
                        ? '0 0 30px rgba(34,197,94,0.4)'
                        : '0 0 30px rgba(245,158,11,0.4)'
                      : '0 4px 16px rgba(0,0,0,0.3)',
                    transition: 'all 0.3s',
                  }}
                >
                  {!result.revealed ? (
                    <>
                      <div style={{ fontSize: 32, filter: 'grayscale(80%)', opacity: 0.5 }}>❓</div>
                      <span className="text-xs font-bold" style={{ color: '#4b4570' }}>Pending…</span>
                    </>
                  ) : (
                    <>
                      {/* Infected and escaped bees never reveal identity.
                          Innocent (false-accusation) bees also stay anonymous
                          when the user failed to catch every infected bee. */}
                      {result.verdict === 'INNOCENT' && !userFailed ? (
                        <>
                          <BeeBody profile={result.profile} size={60} />
                          <span className="font-bold text-sm" style={{ color: 'white' }}>{result.beeName}</span>
                        </>
                      ) : (
                        <>
                          <div
                            style={{
                              fontSize: 40,
                              width: 60,
                              height: 60,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'rgba(255,255,255,0.85)',
                              textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                            }}
                          >
                            ❓
                          </div>
                          <span className="font-bold text-sm" style={{ color: 'rgba(255,255,255,0.85)', letterSpacing: '0.1em' }}>
                            ???
                          </span>
                        </>
                      )}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="px-3 py-0.5 rounded-full text-xs font-black"
                        style={{
                          background:
                            result.verdict === 'INFECTED' ? '#ef4444' :
                            result.verdict === 'INNOCENT' ? '#22c55e' : '#f59e0b',
                          color: 'white',
                        }}
                      >
                        {result.verdict === 'INFECTED' ? '🦠 INFECTED' :
                         result.verdict === 'INNOCENT' ? '✓ INNOCENT' : '⚡ ESCAPED'}
                      </motion.div>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          ))}

          {results.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
              style={{ color: '#9b91c8' }}
            >
              <div className="text-4xl mb-2">🤷</div>
              <p>No accusations were made.</p>
            </motion.div>
          )}
        </div>

        {/* Continue button */}
        <AnimatePresence>
          {allDone && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlowButton size="lg" onClick={acknowledgeReveal}>
                📊 See Results
              </GlowButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
