import { SPECIAL_TYPE } from '../constants.js';

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
        this.special = SPECIAL_TYPE.NONE;
    }

    update(dt) {
        const dx = this.targetX - this.pixelX;
        const dy = this.targetY - this.pixelY;
        const dist = Math.hypot(dx, dy);

        if (dist > 1) {
            // Natural, satisfying glide (~180ms - 200ms) like classic Match-3 games
            const speed = Math.max(dist * 12, 320);
            const step = speed * (dt / 1000);
            if (step >= dist) {
                this.pixelX = this.targetX;
                this.pixelY = this.targetY;
            } else {
                this.pixelX += (dx / dist) * step;
                this.pixelY += (dy / dist) * step;
            }
        } else {
            this.pixelX = this.targetX;
            this.pixelY = this.targetY;
        }

        if (this.matched) {
            this.scale -= 4.5 * (dt / 1000); // Smooth ~220ms crunch shrink
            if (this.scale < 0) this.scale = 0;
        } else if (this.scale < 1) {
            this.scale += 4.5 * (dt / 1000); // Smooth ~220ms pop-in
            if (this.scale > 1) this.scale = 1;
        }
    }
}
