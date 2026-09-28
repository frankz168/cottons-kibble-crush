# System Invariants

## 1. Grid Integrity
- The grid must always be exactly `COLS` wide and `ROWS` high.
- A tile slot can only be `null` momentarily during the `FALLING` state. By the time the state returns to `IDLE`, all grid slots must contain a `Tile` object.

## 2. Match Resolution
- A valid user move must result in a match of at least 3 identical tiles. If not, the state machine must enforce the `REVERTING` state to undo the move.
- `GameModel.findMatches()` must exhaustively identify all contiguous blocks of 3+ identical non-frozen tiles.

## 3. UI Sync
- The UI (HUD) must reflect the exact values stored in `GameState.session`. State mutations must call `view.updateHUD()` to ensure consistency.
