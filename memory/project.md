# Cotton's Kibble Crush

## Overview
Cotton's Kibble Crush is a client-side HTML5 Match-3 puzzle game. Players swap adjacent items (kibble, bones, paws, etc.) to form lines of 3 or more, scoring points and completing level objectives.

## Core Mechanics
- **Match-3 Grid**: Swapping adjacent tiles to match 3 or more.
- **Specials**: Striped tiles (match 4, clears row or column with clipped energetic stripes), Bomb tiles (T/L shape, clears 3x3), Rainbow tiles (match 5, clears all of chosen type).
- **Obstacles/Features**: Frozen tiles (ice blocks), Cat tiles (must match adjacent or steal coins).
- **Boosters**: Hammer, Bomb, Shuffle.
- **Progression**: Levels, coins, unlockable levels, and a shop.
- **Session Persistence**: Mid-level state automatically saved and restored on reload or tab switch.

## Technology Stack
- **Language**: Vanilla JavaScript (ES6 Modules)
- **Domain Modeling**: Frozen Enums (`src/constants.js`)
- **Rendering**: HTML5 `<canvas>` API via `CanvasRenderer` with GPU hardware layer promotion (`translateZ(0)`)
- **Audio Engine**: Web Audio API (`AudioContext` / `AudioBufferSourceNode`) for zero-latency, non-blocking SFX + HTML5 Audio for streaming BGM
- **Styling**: CSS with strict gesture isolation (`touch-action: none; overscroll-behavior: none;`)
- **Persistence**: Browser `localStorage` with debounced write operations via `LocalScoreRepository`
