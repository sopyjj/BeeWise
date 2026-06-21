'use client';

import React from 'react';
import { Modal } from './Modal';

interface InstructionsModalProps {
  open: boolean;
  onClose: () => void;
}

export function InstructionsModal({ open, onClose }: InstructionsModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="🐝 How to Play">
      <div className="space-y-4 text-sm" style={{ color: '#c9c0e8' }}>
        <section>
          <h3 className="font-bold mb-1" style={{ color: '#fbbf24' }}>Your Mission</h3>
          <p>You are the <span style={{ color: '#f59e0b', fontWeight: 700 }}>Beekeeper</span>. Your colony is under threat from Varroa mites.
             Identify infected bees and quarantine them before the hive collapses.</p>
        </section>

        <section>
          <h3 className="font-bold mb-1" style={{ color: '#fbbf24' }}>The Round</h3>
          <ol className="space-y-1 list-none">
            <li>🎲 <strong>Roll</strong> — A die determines how many bees get infected and the temperature.</li>
            <li>💬 <strong>Observe</strong> — Watch each bee answer a question. Healthy bees answer correctly. Infected bees often slip up.</li>
            <li>🔍 <strong>Deduce</strong> — Look for suspicious answers, vague alibis, or wrong facts.</li>
            <li>⚡ <strong>Accuse</strong> — Click bees you suspect, then confirm your selections.</li>
            <li>🔬 <strong>Reveal</strong> — Find out if you were right!</li>
          </ol>
        </section>

        <section>
          <h3 className="font-bold mb-1" style={{ color: '#fbbf24' }}>Key Rules</h3>
          <ul className="space-y-1 list-disc list-inside">
            <li>Infection <strong>accumulates</strong> — undetected infected bees carry into the next round.</li>
            <li>Wrongly accusing a healthy bee keeps them in the game (but hurts your score).</li>
            <li>If all remaining bees are infected, the colony collapses — you lose!</li>
          </ul>
        </section>

        <section>
          <h3 className="font-bold mb-1" style={{ color: '#ef4444' }}>⏱ Timer</h3>
          <p>You have <strong>5 minutes</strong> total. The clock runs across all rounds. Quarantine all infected bees in time to win!</p>
        </section>

        <section>
          <h3 className="font-bold mb-1" style={{ color: '#22c55e' }}>Win Condition</h3>
          <p>Identify and quarantine <strong>every infected bee</strong> before the timer runs out.</p>
        </section>
      </div>
    </Modal>
  );
}
