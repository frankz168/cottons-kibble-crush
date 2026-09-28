# Architecture Overview

The game strictly follows a Model-View-Controller (MVC) architectural pattern to decouple game logic from rendering and input handling.

## Components

1. **Models (`src/models/`)**
   - `GameModel`: Core state of the match-3 grid. Handles logic for finding matches, gravity, spawning specials, and tile swaps.
   - `GameState`: Reactive data layer tracking the current screen, level objectives, score, remaining moves, and booster inventory.
   - `Tile`: Data object representing a single grid cell.

2. **Views (`src/views/`)**
   - `CanvasRenderer`: Responsible for drawing the grid, tiles, specials, and ice blocks on the HTML5 canvas.
   - `HUDView` / `GameView`: Handle DOM manipulation for UI screens, buttons, and score displays.

3. **Controllers (`src/controllers/`)**
   - `GameController`: The orchestrator. Implements the core state machine (`IDLE`, `SWAPPING`, `MATCHING`, `FALLING`), processes matches from the model, and commands the view to render.
   - `GameLoop`: A `requestAnimationFrame` wrapper providing a steady `dt` (delta time) for animations.
   - `InputController`: Translates raw canvas mouse/touch events into logical `c` (column) and `r` (row) coordinates for dragging and swiping.

4. **Repositories (`src/repositories/`)**
   - `LocalScoreRepository`: Abstraction over `localStorage` to persist coins, unlocked levels, and high scores.
