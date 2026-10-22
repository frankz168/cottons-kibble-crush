import { ROWS, COLS, TILE_TYPE, SPECIAL_TYPE } from '../constants.js';

export class CanvasRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.tileSize = this.canvas ? (this.canvas.width / COLS) : 100;
        window._canvasRenderer = this; // expose for icon onload redraws
    }

    drawGame(grid, selectedTile) {
        if (!this.ctx || !this.canvas) return;
        window._lastGrid = grid; // cache for icon onload redraws
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let c = 0; c < COLS; c++) {
            for (let r = 0; r < ROWS; r++) {
                if (grid[c] && grid[c][r]) {
                    this.drawTile(grid[c][r], selectedTile);
                }
            }
        }
    }

    drawTile(tile, selectedTile) {
        if (!this.ctx || tile.scale <= 0) return;
        
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
        this.ctx.roundRect(-this.tileSize / 2 + 3, -this.tileSize / 2 + 3, this.tileSize - 6, this.tileSize - 6, 16);
        this.ctx.fill();

        // Draw shadow inner
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        this.ctx.stroke();

        // Draw special background effects clipped to rounded tile box to prevent artifact rectangles
        if (tile.special === SPECIAL_TYPE.STRIPED_V || tile.special === SPECIAL_TYPE.STRIPED_H) {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.roundRect(-this.tileSize / 2 + 3, -this.tileSize / 2 + 3, this.tileSize - 6, this.tileSize - 6, 16);
            this.ctx.clip();
            
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
            if (tile.special === SPECIAL_TYPE.STRIPED_V) {
                const stripeW = this.tileSize / 5;
                for (let sx = -this.tileSize / 2; sx < this.tileSize / 2; sx += stripeW * 2) {
                    this.ctx.fillRect(sx, -this.tileSize / 2, stripeW, this.tileSize);
                }
            } else {
                const stripeH = this.tileSize / 5;
                for (let sy = -this.tileSize / 2; sy < this.tileSize / 2; sy += stripeH * 2) {
                    this.ctx.fillRect(-this.tileSize / 2, sy, this.tileSize, stripeH);
                }
            }
            this.ctx.restore();
        } else if (tile.special === SPECIAL_TYPE.BOMB) {
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.tileSize / 2 - 5, 0, Math.PI * 2);
            this.ctx.strokeStyle = '#ff4500';
            this.ctx.lineWidth = 4;
            this.ctx.stroke();
        } else if (tile.special === SPECIAL_TYPE.RAINBOW || tile.type === TILE_TYPE.RAINBOW) {
            // Rainbow glow
            const grad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, this.tileSize / 2);
            grad.addColorStop(0, 'rgba(255,0,0,0.4)');
            grad.addColorStop(0.33, 'rgba(0,255,0,0.4)');
            grad.addColorStop(0.66, 'rgba(0,0,255,0.4)');
            grad.addColorStop(1, 'transparent');
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(-this.tileSize / 2, -this.tileSize / 2, this.tileSize, this.tileSize);
        }

        // Draw emoji
        this.ctx.font = `${this.tileSize * 0.6}px sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Draw the custom images or fallback to emoji
        const size = this.tileSize * 0.9;
        const offset = -size / 2;
        
        if (tile.type === TILE_TYPE.TENNIS && window.iconImages && window.iconImages.tennis && window.iconImages.tennis.complete) {
            this.ctx.drawImage(window.iconImages.tennis, offset, offset + 4, size, size);
        } else if (tile.type === TILE_TYPE.MEAT && window.iconImages && window.iconImages.meat && window.iconImages.meat.complete) {
            this.ctx.drawImage(window.iconImages.meat, offset, offset + 4, size, size);
        } else if (tile.type === TILE_TYPE.BONE && window.iconImages && window.iconImages.bone && window.iconImages.bone.complete) {
            this.ctx.drawImage(window.iconImages.bone, offset, offset + 4, size, size);
        } else if (tile.type === TILE_TYPE.PAW && window.iconImages && window.iconImages.paw && window.iconImages.paw.complete) {
            this.ctx.drawImage(window.iconImages.paw, offset, offset + 4, size, size);
        } else if (tile.type === TILE_TYPE.DRUMSTICK && window.iconImages && window.iconImages.drumstick && window.iconImages.drumstick.complete) {
            this.ctx.drawImage(window.iconImages.drumstick, offset, offset + 4, size, size);
        } else if (tile.type === TILE_TYPE.CHEESE && window.iconImages && window.iconImages.cheese && window.iconImages.cheese.complete) {
            this.ctx.drawImage(window.iconImages.cheese, offset, offset + 4, size, size);
        } else if (tile.type === TILE_TYPE.SHOE && window.iconImages && window.iconImages.shoe && window.iconImages.shoe.complete) {
            this.ctx.drawImage(window.iconImages.shoe, offset, offset + 4, size, size);
        } else if (tile.type === TILE_TYPE.YARN && window.iconImages && window.iconImages.yarn && window.iconImages.yarn.complete) {
            this.ctx.drawImage(window.iconImages.yarn, offset, offset + 4, size, size);
        } else if (tile.type === TILE_TYPE.COOKIE && window.iconImages && window.iconImages.cookie && window.iconImages.cookie.complete) {
            this.ctx.drawImage(window.iconImages.cookie, offset, offset + 4, size, size);
        } else {
            this.ctx.fillText(tile.type, 0, 4); 
        }
        
        // Draw ice block overlay if frozen
        if (tile.isFrozen) {
            this.ctx.fillStyle = 'rgba(173, 216, 230, 0.7)'; // Light blue
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; // Frost edges
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.roundRect(-this.tileSize / 2 + 2, -this.tileSize / 2 + 2, this.tileSize - 4, this.tileSize - 4, 10);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Draw frost details
            this.ctx.beginPath();
            this.ctx.moveTo(-this.tileSize / 4, -this.tileSize / 4);
            this.ctx.lineTo(-this.tileSize / 4 + 10, -this.tileSize / 4 + 10);
            this.ctx.strokeStyle = 'rgba(255,255,255,0.9)';
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
}
