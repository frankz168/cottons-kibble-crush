# In-Memory Cache

## `GameState`
The `GameState` singleton acts as the primary in-memory store for session data that does not need to be persisted immediately.

- **`session`**: Tracks `currentScore`, `movesLeft`, `timeRemaining`, and `collectedItems`. Destroyed and reset on level start.
- **`levelData`**: Read-only cache of the current level's configuration (objectives, target score).
- **`boosters`**: In-memory mirror of the `localStorage` inventory, modified during gameplay and flushed to storage at strategic points.
