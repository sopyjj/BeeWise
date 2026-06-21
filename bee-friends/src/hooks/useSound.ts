'use client';

import { useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { soundEngine } from '@/lib/soundEngine';

export function useSound() {
  const soundEnabled = useGameStore(s => s.soundEnabled);

  const play = useCallback((fn: () => void) => {
    soundEngine.setEnabled(soundEnabled);
    fn();
  }, [soundEnabled]);

  return {
    buttonClick:     () => play(() => soundEngine.playButtonClick()),
    speechPop:       () => play(() => soundEngine.playSpeechPop()),
    accuse:          () => play(() => soundEngine.playAccuse()),
    correctReveal:   () => play(() => soundEngine.playCorrectReveal()),
    wrongReveal:     () => play(() => soundEngine.playWrongReveal()),
    win:             () => play(() => soundEngine.playWin()),
    lose:            () => play(() => soundEngine.playLose()),
    timerWarning:    (u: number) => play(() => soundEngine.playTimerWarning(u)),
    dieRoll:         () => play(() => soundEngine.playDieRoll()),
    revealDrum:      () => play(() => soundEngine.playRevealDrum()),
    quarantine:      () => play(() => soundEngine.playQuarantine()),
  };
}
