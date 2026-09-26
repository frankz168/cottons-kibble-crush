export class Tile {
    constructor(c, r, type, tileSize) {
        this.c = c;
        this.r = r;
        this.type = type;
        this.tileSize = tileSize;
        this.pixelX = c * tileSize;
        this.pixelY = r * tileSize;
        this.targetX = this.pixelX;
        this.targetY = this.pixelY;
        this.scale = 1;
        this.matched = false;
        this.isFrozen = false;
        this.special = null; // can be 'striped-h', 'striped-v', 'rainbow'
    }

    update(dt) {
        let dx = this.targetX - this.pixelX;
        let dy = this.targetY - this.pixelY;
        
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 0.5) {
            // Framerate independent lerp (easing out)
            const lerpFactor = 1 - Math.pow(0.005, dt / 1000); 
            this.pixelX += dx * lerpFactor;
            this.pixelY += dy * lerpFactor;
            
            // Add a slight bounciness/overshoot simulation if needed, but smooth easing is often enough.
        } else {
            this.pixelX = this.targetX;
            this.pixelY = this.targetY;
        }

        if (this.matched) {
            this.scale -= 3 * (dt / 1000); // shrinking animation
            if (this.scale < 0) this.scale = 0;
        } else if (this.scale < 1) {
            this.scale += 3 * (dt / 1000); // popping animation for new tiles
            if (this.scale > 1) this.scale = 1;
        }
    }
}
