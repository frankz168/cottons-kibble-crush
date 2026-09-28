# Cotton's Kibble Crush

## Overview
Cotton's Kibble Crush is a client-side HTML5 Match-3 puzzle game. Players swap adjacent items (kibble, bones, paws, etc.) to form lines of 3 or more, scoring points and completing level objectives.

## Core Mechanics
- **Match-3 Grid**: Swapping adjacent tiles to match 3 or more.
- **Specials**: Striped tiles (match 4), Bomb tiles (T/L shape), Rainbow tiles (match 5).
- **Obstacles/Features**: Frozen tiles (ice blocks), Cat tiles (must drop to bottom or match adjacent).
- **Boosters**: Hammer, Bomb, Shuffle.
- **Progression**: Levels, coins, unlockable levels, and a shop.

## Technology Stack
- **Language**: Vanilla JavaScript (ES6 Modules)
- **Rendering**: HTML5 `<canvas>` API via `CanvasRenderer`
- **Styling**: CSS
- **Persistence**: Browser `localStorage` via `LocalScoreRepository`
