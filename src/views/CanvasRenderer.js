import { ROWS, COLS } from '../constants.js';

export class CanvasRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.tileSize = this.canvas.width / COLS;
    }

    drawGame(grid, selectedTile) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let c = 0; c < COLS; c++) {
            for (let r = 0; r < ROWS; r++) {
                if (grid[c][r]) {
                    this.drawTile(grid[c][r], selectedTile);
                }
            }
        }
    }

    drawTile(tile, selectedTile) {
        if (tile.scale <= 0) return;
        
        this.ctx.save();
        this.ctx.translate(tile.pixelX + this.tileSize / 2, tile.pixelY + this.tileSize / 2);
        
        if (tile === selectedTile) {
            this.ctx.scale(tile.scale * 1.1, tile.scale * 1.1);
        } else {
            this.ctx.scale(tile.scale, tile.scale);
        }
        
        // Draw background tile box
        this.ctx.fillStyle = (tile.c + tile.r) % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)';
        this.ctx.beginPath();
        this.ctx.roundRect(-this.tileSize/2 + 3, -this.tileSize/2 + 3, this.tileSize - 6, this.tileSize - 6, 16);
        this.ctx.fill();

        // Draw shadow inner
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        this.ctx.stroke();

        // Draw special background effects
        if (tile.special === 'striped-v') {
            this.ctx.fillStyle = 'rgba(255, 235, 59, 0.5)';
            this.ctx.fillRect(-this.tileSize/6, -this.tileSize/2 + 3, this.tileSize/3, this.tileSize - 6);
        } else if (tile.special === 'striped-h') {
            this.ctx.fillStyle = 'rgba(255, 235, 59, 0.5)';
            this.ctx.fillRect(-this.tileSize/2 + 3, -this.tileSize/6, this.tileSize - 6, this.tileSize/3);
        } else if (tile.special === 'bomb') {
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.tileSize/2 - 5, 0, Math.PI * 2);
            this.ctx.strokeStyle = '#ff4500';
            this.ctx.lineWidth = 4;
            this.ctx.stroke();
        } else if (tile.special === 'rainbow' || tile.type === '🌈') {
            // Rainbow glow
            let grad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, this.tileSize/2);
            grad.addColorStop(0, 'rgba(255,0,0,0.4)');
            grad.addColorStop(0.33, 'rgba(0,255,0,0.4)');
            grad.addColorStop(0.66, 'rgba(0,0,255,0.4)');
            grad.addColorStop(1, 'transparent');
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(-this.tileSize/2, -this.tileSize/2, this.tileSize, this.tileSize);
        }

        // Draw emoji
        this.ctx.font = `${this.tileSize * 0.6}px sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        this.ctx.shadowColor = 'rgba(0,0,0,0.15)';
        this.ctx.shadowBlur = 5;
        this.ctx.shadowOffsetY = 3;
        
        this.ctx.fillText(tile.type, 0, 4); 
        
        // Draw ice block overlay if frozen
        if (tile.isFrozen) {
            this.ctx.fillStyle = 'rgba(173, 216, 230, 0.7)'; // Light blue
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; // Frost edges
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.roundRect(-this.tileSize/2 + 2, -this.tileSize/2 + 2, this.tileSize - 4, this.tileSize - 4, 10);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Draw frost details
            this.ctx.beginPath();
            this.ctx.moveTo(-this.tileSize/4, -this.tileSize/4);
            this.ctx.lineTo(-this.tileSize/4 + 10, -this.tileSize/4 + 10);
            this.ctx.strokeStyle = 'rgba(255,255,255,0.9)';
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
}
