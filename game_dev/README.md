# SillyCon - Cat Runner & Arena Boss

A 2-mode round-based game: **Runner** (Flappy-style) and **Arena** (Boss fight).

## Controls

### Runner Mode (Chrome Dino-style)
- **Jump**: Space, W, or Up Arrow (grounded only, no double jump)

### Arena Mode (Boss Fight)
- **Move Left/Right**: A/D or Left/Right Arrow
- **Attack**: J or Space
- **Block** (hold): K (reduces damage by 70%)
- **Dodge**: W or Up Arrow (i-frames, cooldown)

## How to Run

```bash
npm install
npm run dev
```

Then open the URL shown in the terminal (typically `http://localhost:5173`).

## Build

```bash
npm run build
```

Output is in `dist/`.

## Project Structure

- `src/main.ts` - Entry point, Phaser config
- `src/game/config.ts` - **Tuning constants** (balance here)
- `src/game/state/Progression.ts` - Round tracking, difficulty scaling
- `src/input/InputProvider.ts` - Input abstraction (replaceable with vision)
- `src/input/KeyboardInput.ts` - Keyboard implementation

### Scenes
- **Boot** → **MainMenu** → **Runner** (Level 1–5) → **Arena** (Boss 1–5) → **Runner** (next) or **Victory** (after Boss 5) or **GameOver**

### Entities
- `CatRunner` - Dino-style runner (jump over ground obstacles)
- `ObstacleManager` - Block pairs, scoring
- `CatArena` - Arena player (move, attack, block, dodge)
- `Boss` - State machine, 3 attacks, Phase 2 at 50% HP
- `Projectile` - Boss projectiles
