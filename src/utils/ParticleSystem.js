import { DIRECTION } from '../constants.js';

const MAX_PARTICLES = 120;
const MAX_TEXTS = 15;
const MAX_LASERS = 6;

export class Particle {
    constructor() {
        this.reset(0, 0, '#ffeb3b');
    }

    reset(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 260;
        this.vy = (Math.random() - 0.5) * 260;
        this.life = 0.45;
        this.maxLife = 0.45;
        this.color = color;
        this.size = Math.random() * 5 + 3;
        this.active = true;
    }

    update(dt) {
        if (!this.active) return;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active || this.life <= 0) return;
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

export class FloatingText {
    constructor() {
        this.reset(0, 0, '');
    }

    reset(x, y, text) {
        this.x = x;
        this.y = y;
        this.vy = -80;
        this.life = 0.8;
        this.maxLife = 0.8;
        this.text = text;
        this.active = true;
    }

    update(dt) {
        if (!this.active) return;
        this.y += this.vy * dt;
        this.life -= dt;
        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active || this.life <= 0) return;
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.7})`;
        ctx.lineWidth = 3;
        ctx.font = 'bold 22px Fredoka One, sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeText(this.text, this.x, this.y);
        ctx.fillText(this.text, this.x, this.y);
    }
}

export class Laser {
    constructor() {
        this.reset(0, 0, DIRECTION.HORIZONTAL, '#ffeb3b', 800, 800);
    }

    reset(x, y, orientation, color, canvasW, canvasH) {
        this.x = x;
        this.y = y;
        this.orientation = orientation;
        this.color = color;
        this.canvasW = canvasW;
        this.canvasH = canvasH;
        this.life = 0.35;
        this.maxLife = 0.35;
        this.width = 45;
        this.active = true;
    }

    update(dt) {
        if (!this.active) return;
        this.life -= dt;
        this.width -= 130 * dt;
        if (this.life <= 0 || this.width <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active || this.life <= 0 || this.width <= 0) return;
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = alpha;
        
        ctx.beginPath();
        if (this.orientation === DIRECTION.HORIZONTAL) {
            ctx.rect(0, this.y - this.width / 2, this.canvasW, this.width);
        } else {
            ctx.rect(this.x - this.width / 2, 0, this.width, this.canvasH);
        }
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

export class ParticleSystem {
    constructor(canvasId) {
        this.canvas = (typeof document !== 'undefined' && canvasId) ? document.getElementById(canvasId) : null;
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        
        // Active entities
        this.particles = [];
        this.texts = [];
        this.lasers = [];
        
        // Object pools for flat memory usage
        this.particlePool = [];
        this.textPool = [];
        this.laserPool = [];
    }

    getParticle(x, y, color) {
        let p = this.particlePool.pop();
        if (!p) {
            p = new Particle();
        }
        p.reset(x, y, color);
        return p;
    }

    recycleParticle(p) {
        p.active = false;
        if (this.particlePool.length < MAX_PARTICLES) {
            this.particlePool.push(p);
        }
    }

    getText(x, y, text) {
        let t = this.textPool.pop();
        if (!t) {
            t = new FloatingText();
        }
        t.reset(x, y, text);
        return t;
    }

    recycleText(t) {
        t.active = false;
        if (this.textPool.length < MAX_TEXTS) {
            this.textPool.push(t);
        }
    }

    getLaser(x, y, orientation, color) {
        let l = this.laserPool.pop();
        if (!l) {
            l = new Laser();
        }
        l.reset(x, y, orientation, color, this.canvas ? this.canvas.width : 800, this.canvas ? this.canvas.height : 800);
        return l;
    }

    recycleLaser(l) {
        l.active = false;
        if (this.laserPool.length < MAX_LASERS) {
            this.laserPool.push(l);
        }
    }

    spawnExplosion(x, y, color = '#ffeb3b', count = 6) {
        const remainingCapacity = MAX_PARTICLES - this.particles.length;
        const toSpawn = Math.min(count, Math.max(0, remainingCapacity));
        for (let i = 0; i < toSpawn; i++) {
            this.particles.push(this.getParticle(x, y, color));
        }
    }

    spawnText(x, y, text) {
        if (this.texts.length >= MAX_TEXTS) {
            const old = this.texts.shift();
            this.recycleText(old);
        }
        this.texts.push(this.getText(x, y, text));
    }

    spawnLaser(x, y, orientation, color) {
        if (this.lasers.length >= MAX_LASERS) {
            const old = this.lasers.shift();
            this.recycleLaser(old);
        }
        this.lasers.push(this.getLaser(x, y, orientation, color));
    }

    update(dt) {
        // Update particles and recycle dead ones
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update(dt);
            if (!p.active) {
                this.particles.splice(i, 1);
                this.recycleParticle(p);
            }
        }

        // Update texts and recycle dead ones
        for (let i = this.texts.length - 1; i >= 0; i--) {
            const t = this.texts[i];
            t.update(dt);
            if (!t.active) {
                this.texts.splice(i, 1);
                this.recycleText(t);
            }
        }

        // Update lasers and recycle dead ones
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const l = this.lasers[i];
            l.update(dt);
            if (!l.active) {
                this.lasers.splice(i, 1);
                this.recycleLaser(l);
            }
        }
    }

    draw() {
        if (!this.ctx || !this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let i = 0; i < this.lasers.length; i++) {
            this.lasers[i].draw(this.ctx);
        }
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].draw(this.ctx);
        }
        for (let i = 0; i < this.texts.length; i++) {
            this.texts[i].draw(this.ctx);
        }
    }

    clear() {
        while (this.particles.length > 0) {
            this.recycleParticle(this.particles.pop());
        }
        while (this.texts.length > 0) {
            this.recycleText(this.texts.pop());
        }
        while (this.lasers.length > 0) {
            this.recycleLaser(this.lasers.pop());
        }
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}
