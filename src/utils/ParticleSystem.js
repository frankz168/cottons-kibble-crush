export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 300;
        this.vy = (Math.random() - 0.5) * 300;
        this.life = 0.5; // seconds
        this.maxLife = 0.5;
        this.color = color;
        this.size = Math.random() * 6 + 4;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

export class FloatingText {
    constructor(x, y, text) {
        this.x = x;
        this.y = y;
        this.vy = -100;
        this.life = 1.0;
        this.maxLife = 1.0;
        this.text = text;
    }

    update(dt) {
        this.y += this.vy * dt;
        this.life -= dt;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.font = 'bold 24px Fredoka One, sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeText(this.text, this.x, this.y);
        ctx.fillText(this.text, this.x, this.y);
    }
}

export class Laser {
    constructor(x, y, orientation, color, canvasW, canvasH) {
        this.x = x;
        this.y = y;
        this.orientation = orientation;
        this.color = color;
        this.canvasW = canvasW;
        this.canvasH = canvasH;
        this.life = 0.4;
        this.maxLife = 0.4;
        this.width = 60;
    }

    update(dt) {
        this.life -= dt;
        this.width -= 150 * dt;
    }

    draw(ctx) {
        if (this.life <= 0 || this.width <= 0) return;
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = alpha;
        
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;

        ctx.beginPath();
        if (this.orientation === 'horizontal') {
            ctx.rect(0, this.y - this.width/2, this.canvasW, this.width);
        } else {
            ctx.rect(this.x - this.width/2, 0, this.width, this.canvasH);
        }
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
    }
}

export class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.texts = [];
        this.lasers = [];
    }

    spawnExplosion(x, y, color = '#ffeb3b', count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    spawnText(x, y, text) {
        this.texts.push(new FloatingText(x, y, text));
    }

    spawnLaser(x, y, orientation, color) {
        this.lasers.push(new Laser(x, y, orientation, color, this.canvas.width, this.canvas.height));
    }

    update(dt) {
        this.particles.forEach(p => p.update(dt));
        this.particles = this.particles.filter(p => p.life > 0);

        this.texts.forEach(t => t.update(dt));
        this.texts = this.texts.filter(t => t.life > 0);

        this.lasers.forEach(l => l.update(dt));
        this.lasers = this.lasers.filter(l => l.life > 0);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.lasers.forEach(l => l.draw(this.ctx));
        this.particles.forEach(p => p.draw(this.ctx));
        this.texts.forEach(t => t.draw(this.ctx));
    }
}
