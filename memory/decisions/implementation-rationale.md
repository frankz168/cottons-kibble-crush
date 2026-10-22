# Implementation Rationale

## 1. Custom Canvas Engine vs Game Engine (e.g., Phaser, PixiJS)
- **Decision**: Built a custom rendering pipeline using vanilla HTML5 Canvas 2D API (`CanvasRenderer`) with WebKit layer promotion (`translateZ(0)`).
- **Rationale**: Keeps the project lightweight, dependency-free, and ensures absolute control over the render loop and performance tuning for simple 2D primitives. Expensive effects like canvas `shadowBlur` were removed in favor of baked assets to ensure flat 60-120 FPS on mobile.

## 2. Strict MVC Pattern
- **Decision**: Separated `GameModel` (logic), `CanvasRenderer` (view), and `GameController` (orchestrator).
- **Rationale**: Match-3 logic is notoriously complex (cascades, L/T shapes, gravity). Mixing DOM/Canvas calls into the logic makes it impossible to debug or write unit tests.

## 3. Web Audio API for SFX
- **Decision**: Migrated sound effects from HTML5 `<audio>` elements to Web Audio API (`AudioContext` / `AudioBufferSourceNode`), retaining HTML5 `<audio>` only for streaming BGM.
- **Rationale**: In WebKit (iOS/iPadOS Safari), playing HTML5 audio tags routes through `mediaserverd` IPC, synchronously stalling the main JavaScript UI thread for 20-50ms per sound and causing severe gameplay lag. Web Audio API executes on the DSP audio thread with 0ms latency and zero UI thread interference.

## 4. Debounced LocalStorage for Mid-Level Session Persistence
- **Decision**: Implemented state persistence for active sessions, with debounced writes during gameplay and immediate flush on pagehide/unload.
- **Rationale**: Solves the critical bug of mid-level progress loss on mobile browser navigation/kill, while preventing synchronous SQLite disk writes from stalling cascading animations in Safari.

## 5. Frozen Centralized Enums
- **Decision**: All domain values (states, tile types, specials, boosters, modes, screens, sounds, storage keys) are defined in `src/constants.js` and frozen via `Object.freeze()`.
- **Rationale**: Completely eliminates fragile magic strings and typos across views, controllers, and models.

## 6. Single Global Navigation Architecture
- **Decision**: Consolidated all navigation into a single global bottom navigation component, removing redundant nested navigation elements.
- **Rationale**: Eliminates visual duplication and ensures consistent viewport layout across all game screens.
