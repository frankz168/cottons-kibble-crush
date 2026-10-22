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
On application boot:
1. `controller.restoreActiveSession()` inspects `LocalScoreRepository.loadActiveSession()`.
2. If a valid mid-level session exists, it restores `GameState` and deserializes the exact grid into `GameModel`, resuming the player directly in `screen-game` with matching score, moves, and goals.
3. If no active session exists, it navigates to `screen-home`.
