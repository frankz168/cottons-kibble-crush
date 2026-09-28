# Data Access

Data access is entirely local. The application does not rely on external backend APIs or databases.

## Persistence Layer
The application uses the `IGameRepository` interface, implemented by `LocalScoreRepository`.

- **Storage Engine**: `window.localStorage`
- **Data Format**: Plain strings and JSON-stringified objects.
- **Keys in use**:
  - `cottons_kibble_crush_highscore`: Integer
  - `cottons_kibble_crush_unlocked_level`: Integer
  - `cottons_kibble_crush_coins`: Integer
  - `cottons_kibble_crush_boosters`: JSON Object (`{ hammer: 2, bomb: 2, shuffle: 2 }`)
  - `cottons_kibble_crush_last_login`: String (Date)
