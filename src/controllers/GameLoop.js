export class GameLoop {
    constructor(updateCallback, renderCallback) {
        this.lastTime = 0;
        this.updateCallback = updateCallback;
        this.renderCallback = renderCallback;
        this.isRunning = false;
        
        // bind so requestAnimationFrame doesn't lose context
        this.loop = this.loop.bind(this);
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        requestAnimationFrame(this.loop);
    }

    stop() {
        this.isRunning = false;
    }

    loop(time) {
        if (!this.isRunning) return;
        
        if (!this.lastTime) this.lastTime = time;
        const dt = time - this.lastTime;
        this.lastTime = time;

        if (this.updateCallback) this.updateCallback(dt);
        if (this.renderCallback) this.renderCallback();

        requestAnimationFrame(this.loop);
    }
}
