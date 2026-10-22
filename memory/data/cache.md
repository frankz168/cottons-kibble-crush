# In-Memory Cache

## 1. `GameState`
The `GameState` singleton acts as the primary in-memory store for session data that does not need to be persisted immediately.

- **`session`**: Tracks `currentScore`, `movesLeft`, `timeRemaining`, and `collectedItems`. Destroyed and reset on level start.
- **`levelData`**: Read-only cache of the current level's configuration (objectives, target score, game mode).
- **`boosters`**: In-memory mirror of the `localStorage` inventory, modified during gameplay and flushed to storage at strategic points.

## 2. `HUDView` Cache
`HUDView` maintains an internal cache of rendered values:
- `cachedScore`, `cachedLevel`, `cachedMoves`, `cachedObjectivesKey`, and `cachedBoosterState`.
- DOM mutations, innerHTML replacements, and image icon updates are strictly skipped if values have not changed, preventing layout thrashing and unnecessary image parsing on mobile devices.

## 3. `ParticleSystem` Object Pools
Pre-allocated and reusable object pools (`particlePool`, `textPool`, `laserPool`) maintain flat memory allocation across 20+ matches, strictly capped at `MAX_PARTICLES = 120`, `MAX_TEXTS = 15`, and `MAX_LASERS = 6`.

## 4. `AudioManager` AudioBuffer Cache
Decodes sound effects (`sfx_pop.wav`, `sfx_whoosh.wav`, `sfx_bark.wav`, `sfx_bloop.wav`) into cached `AudioBuffer` objects on startup, providing instant audio playback via Web Audio API without decoding overhead.
