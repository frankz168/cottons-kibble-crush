# Data Access

Data access is entirely local. The application does not rely on external backend APIs or databases.

## Persistence Layer
The application uses the `IGameRepository` interface, implemented by `LocalScoreRepository`.

- **Storage Engine**: `window.localStorage`
- **Data Format**: Plain strings and JSON-stringified objects.
- **Keys in use** (defined in `STORAGE_KEY` enum):
  - `cottons_kibble_crush_highscore`: Integer
  - `cottons_kibble_crush_unlocked_level`: Integer
  - `cottons_kibble_crush_coins`: Integer
  - `cottons_kibble_crush_boosters`: JSON Object (`{ hammer: 2, bomb: 2, shuffle: 2 }`)
  - `cottons_kibble_crush_last_login`: String (Date)
  - `cottons_kibble_crush_active_session`: JSON Object containing active level configuration, reactive session (score, moves, objectives), and serialized grid state.
  - `cotton_bgm`: Boolean string
  - `cotton_sfx`: Boolean string
  - `cotton_lang`: String (`'en'` or `'id'`)

## WebKit Write Optimization
In WebKit (iOS / iPadOS Safari), `localStorage.setItem` executes synchronous disk I/O on the main JavaScript thread. To prevent frame drops during combos:
- Session writes during gameplay are **debounced (200ms)** in `GameController.persistCurrentSession()`.
- Session writes on page unload (`visibilitychange`, `pagehide`, `beforeunload`) are executed **immediately** to ensure zero data loss.
