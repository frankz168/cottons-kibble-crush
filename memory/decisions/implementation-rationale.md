# Implementation Rationale

## 1. Custom Canvas Engine vs Game Engine (e.g., Phaser, PixiJS)
- **Decision**: Built a custom rendering pipeline using vanilla HTML5 Canvas 2D API (`CanvasRenderer`).
- **Rationale**: Keeps the project lightweight, dependency-free, and ensures the developer has absolute control over the render loop and performance tuning for simple 2D primitives.

## 2. Strict MVC Pattern
- **Decision**: Separated `GameModel` (logic), `CanvasRenderer` (view), and `GameController` (orchestrator).
- **Rationale**: Match-3 logic is notoriously complex (cascades, L/T shapes, gravity). Mixing DOM/Canvas calls into the logic would make it impossible to debug or write unit tests. 

## 3. LocalStorage for Persistence
- **Decision**: Used `LocalScoreRepository` to abstract `localStorage`.
- **Rationale**: Easiest way to provide immediate persistence without requiring backend infrastructure, accounts, or auth. The interface `IGameRepository` is defined so it can be swapped for a REST API repository in the future without modifying game logic.
