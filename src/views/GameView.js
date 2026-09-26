import { CanvasRenderer } from './CanvasRenderer.js';
import { HUDView } from './HUDView.js';

export class GameView {
    constructor(canvasId) {
        this.renderer = new CanvasRenderer(canvasId);
        this.hud = new HUDView();
        
        // Expose tileSize and canvas for backward compatibility with GameController
        this.tileSize = this.renderer.tileSize;
        this.canvas = this.renderer.canvas;
    }

    drawGame(grid, selectedTile) {
        this.renderer.drawGame(grid, selectedTile);
    }

    updateHUD(gameState) {
        this.hud.updateHUD(gameState);
    }
}
