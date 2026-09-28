# Runtime Flow

## The Game Loop
The application runs on a continuous `requestAnimationFrame` loop initiated by `GameLoop`.
1. **Input Phase**: `InputController` captures clicks/drags and fires events (`onSwipe`, `onDragStart`) to the `GameController`.
2. **Update Phase (`GameController.update`)**: 
   - Computes physics and animation progress based on `dt`.
   - Evaluates the current state machine.
3. **Render Phase (`GameController.render`)**: 
   - Clears canvas.
   - Calls `CanvasRenderer.drawGame()` to draw the grid.
   - Draws particles.

## State Machine (`GameController.update`)
- **`IDLE`**: Waits for user input. If a swipe occurs, swaps tiles and moves to `SWAPPING`.
- **`SWAPPING`**: Animates tiles exchanging places. If a match is found, moves to `MATCHING`. If no match, moves to `REVERTING`.
- **`REVERTING`**: Swaps tiles back to original positions. Moves to `IDLE`.
- **`MATCHING`**: Removes matched tiles from the model, triggers audio/particles, updates score. Moves to `FALLING`.
- **`FALLING`**: Applies gravity to remaining tiles, spawns new ones at the top. Re-evaluates matches. If matches exist -> `MATCHING`. If not -> `IDLE`.
