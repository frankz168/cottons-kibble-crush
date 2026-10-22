# Runtime Flow

## The Game Loop
The application runs on a continuous `requestAnimationFrame` loop initiated by `GameLoop`.
1. **Input Phase**: `InputController` captures clicks/drags with `{ passive: false }` and calls `evt.preventDefault()` throughout the gesture lifecycle to prevent browser back/home edge-gesture hijacking.
2. **Update Phase (`GameController.update`)**: 
   - Computes physics and animation progress based on bounded `dt` (capped at 50ms).
   - Evaluates the current state machine.
   - Schedules debounced session persistence to `localStorage` when mutations stabilize.
3. **Render Phase (`GameController.render`)**: 
   - `CanvasRenderer.drawGame()` renders the 8x8 grid.
   - `ParticleSystem.draw()` renders active particles, lasers, and text (skips clearing when idle).

## State Machine (`GameController.update`)
- **`IDLE`**: Waits for user input. If a swipe occurs, swaps tiles and transitions to `SWAPPING`. Flushes debounced session persistence.
- **`SWAPPING`**: Animates tiles exchanging places (~180ms). If a match is found, transitions to `MATCHING`. If no match, transitions to `REVERTING`.
- **`REVERTING`**: Swaps tiles back to original positions. Transitions to `IDLE`.
- **`MATCHING`**: Removes matched tiles from the model, triggers Web Audio SFX / pooled particles, increments combo multiplier and score. Transitions to `FALLING`.
- **`FALLING`**: Applies gravity to remaining tiles, spawns new ones at the top. Re-evaluates matches. If matches exist -> `MATCHING`. If not -> `IDLE`.
- **`WIN_ANIMATION`**: When all level objectives are met and moves/time remain, triggers sugar crush bonus lasers before showing the Game Over overlay.

## State Recovery Flow
On application boot / browser refresh:
1. The application always boots into `screen-home` (`SCREEN.HOME`), welcoming the player with the Title Screen and "PLAY" / "OPTIONS" buttons.
2. Active mid-level session recovery occurs when the player selects and begins a level via `window.startLevel(levelNumber, config)`.
3. If an active session matching `levelNumber` exists in `LocalScoreRepository`, `controller.restoreActiveSession()` restores `GameState` and deserializes the grid into `GameModel`, resuming the player seamlessly with their saved score, remaining moves, and objectives.
4. If no active session exists (or a different level is selected), a fresh grid is initialized.
