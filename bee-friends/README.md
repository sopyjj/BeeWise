# 🐝 Colony Under Threat

A polished single-player deduction game inspired by classroom roleplay mechanics and the visual style of Among Us — but bee-themed.

## Premise

You are the **Beekeeper**. Varroa mites have infected your colony. Watch each bee answer a question, then deduce which ones are lying. Quarantine all infected bees before the 5-minute timer runs out.

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **Framer Motion v12** — animations throughout
- **Zustand v5** — game state management
- **Web Audio API** — synthesized sounds, no external files

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build for Production

```bash
npm run build
npm start
```

Deploy to Vercel with zero configuration.

## Gameplay

1. **Roll** — A die determines the temperature and number of infected bees this round
2. **Investigate** — Watch bees answer questions. Healthy bees answer correctly; infected bees often slip up
3. **Accuse** — Click bees you suspect, then confirm your selections
4. **Reveal** — See if you were right!
5. **Repeat** — Undetected infected bees carry into the next round

### Win
Quarantine all infected bees before the 5-minute timer expires.

### Lose
- Timer reaches 0
- All remaining bees become infected (colony collapses)

### Tells to watch for
- **Vague alibis** — "I was around… somewhere in the middle"
- **Wrong facts** — incorrect statistics about bee biology  
- **Evasive social answers** — "I don't really pay attention to other bees"
- **Uncertain temperature reports** — "About 37 degrees? Maybe 38?"

## Architecture

```
src/
├── app/              # Next.js App Router entry
├── types/game.ts     # All TypeScript interfaces
├── constants/        # Game config, colors, animation variants
├── data/             # 40+ questions, 8 bee profiles, round configs
├── lib/              # Pure game logic, sound engine, question engine
├── store/            # Zustand game store + selectors
├── hooks/            # Timer, sound, round orchestration
└── components/
    ├── game/
    │   ├── GameShell.tsx      # Top-level orchestrator
    │   ├── screens/           # 8 game phase screens
    │   ├── hud/               # Timer, round badge, quarantine panel
    │   ├── bees/              # Bee characters and grid
    │   └── svg/               # SVG bee body, honeycomb bg, particles
    └── effects/               # Win/lose visual effects
```

## Sound

All sounds are synthesized via the Web Audio API — no audio files required. Includes button clicks, speech bubble pops, accusation chords, reveal arpeggios, win fanfare, and timer warning beeps. Toggle with the 🔊/🔇 button.
# bee-friends
