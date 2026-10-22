# Architecture Overview

The game strictly follows a Model-View-Controller (MVC) architectural pattern to decouple game logic from rendering and input handling, supported by centralized enums and a non-blocking audio engine.

## Components

1. **Constants & Enums (`src/constants.js`)**
   - Centralized, frozen enums eliminating hardcoded strings across the system: `STATE`, `TILE_TYPE`, `SPECIAL_TYPE`, `BOOSTER_TYPE`, `GAME_MODE`, `DIRECTION`, `SCREEN`, `SOUND_EFFECT`, `BGM_TRACK`, `COMBO_TEXT`, and `STORAGE_KEY`.

2. **Models (`src/models/`)**
   - `GameModel`: Core state of the match-3 grid. Handles logic for finding matches, gravity, spawning specials, and tile swaps. Implements `serializeGrid()` and `deserializeGrid()` for mid-level session recovery.
   - `GameState`: Reactive data layer tracking the current screen, level objectives, score, remaining moves, and booster inventory. Implements `serializeSession()` and `restoreSession()`.
   - `Tile`: Data object representing a single grid cell with calibrated natural ease movement (~180-220ms).

3. **Views (`src/views/`)**
   - `CanvasRenderer`: Draws the grid, tiles, and specials. Stripped of costly `shadowBlur` and clipped within rounded tiles to guarantee 60-120 FPS without graphical artifacts.
   - `HUDView`: Manages DOM HUD with state caching to prevent layout thrashing and redundant innerHTML rebuilds.
   - `GameView`: Facade binding CanvasRenderer and HUDView.

4. **Controllers (`src/controllers/`)**
   - `GameController`: The orchestrator. Implements the state machine (`IDLE`, `SWAPPING`, `REVERTING`, `MATCHING`, `FALLING`, `WIN_ANIMATION`), manages game rules, and debounces session persistence.
   - `GameLoop`: A `requestAnimationFrame` loop providing capped `dt` (max 50ms) to prevent animation spiral-of-death or lag spikes.
   - `InputController`: Translates raw canvas mouse/touch events into grid coordinates with strict `preventDefault()` throughout touch gesture lifecycle to prevent OS edge swipe navigation.

5. **Utilities (`src/utils/`)**
   - `AudioManager`: Hybrid audio engine using **Web Audio API** (`AudioContext` / `AudioBufferSourceNode`) for zero-latency, non-blocking SFX on iOS Safari, and HTML5 `<audio>` for loopable BGM tracks.
   - `ParticleSystem`: High-performance FX engine with object pooling (`MAX_PARTICLES`, `MAX_TEXTS`, `MAX_LASERS`) and smart idle canvas clearing.

6. **Repositories (`src/repositories/`)**
   - `LocalScoreRepository`: Abstraction over `localStorage` implementing `IGameRepository` to persist coins, unlocked levels, high scores, and active mid-level sessions.
