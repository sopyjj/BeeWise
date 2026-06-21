'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';

export function useGameTimer() {
  const isRunning = useGameStore(s => s.isTimerRunning);
  const tickTimer = useGameStore(s => s.tickTimer);
  const lastTickRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    lastTickRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTickRef.current;
      // Tick for each full second elapsed (handles drift)
      if (elapsed >= 1000) {
        const ticks = Math.floor(elapsed / 1000);
        for (let i = 0; i < ticks; i++) tickTimer();
        lastTickRef.current = now - (elapsed % 1000);
      }
    }, 250); // check 4× per second for accuracy

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, tickTimer]);
}
