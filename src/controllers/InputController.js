import { COLS, ROWS } from '../constants.js';

export class InputController {
    constructor(canvas, tileSize) {
        this.canvas = canvas;
        this.tileSize = tileSize;
        
        // Callbacks
        this.onTileClick = null; // (c, r) => void
        this.onSwipe = null;     // (c, r, dC, dR) => void
        this.onDragStart = null; // (c, r) => void
        this.onDragEnd = null;   // () => void
        
        // Internal state
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.startC = -1;
        this.startR = -1;

        this.bindEvents();
    }

    bindEvents() {
        // Mouse Events
        this.canvas.addEventListener('mousedown', this.handleStart.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMove.bind(this));
        window.addEventListener('mouseup', this.handleEnd.bind(this));

        // Touch Events
        this.canvas.addEventListener('touchstart', this.handleStart.bind(this), {passive: false});
        this.canvas.addEventListener('touchmove', this.handleMove.bind(this), {passive: false});
        window.addEventListener('touchend', this.handleEnd.bind(this));
        window.addEventListener('touchcancel', this.handleEnd.bind(this));
    }

    getGridPos(evt) {
        const rect = this.canvas.getBoundingClientRect();
        let clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
        let clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;

        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        return {
            c: Math.floor(x / this.tileSize),
            r: Math.floor(y / this.tileSize)
        };
    }

    handleStart(evt) {
        if (evt.type === 'touchstart') evt.preventDefault(); // Prevent scroll
        
        const pos = this.getGridPos(evt);
        if (pos.c >= 0 && pos.c < COLS && pos.r >= 0 && pos.r < ROWS) {
            this.startC = pos.c;
            this.startR = pos.r;
            this.startX = evt.touches ? evt.touches[0].clientX : evt.clientX;
            this.startY = evt.touches ? evt.touches[0].clientY : evt.clientY;
            this.isDragging = true;
            
            if (this.onDragStart) this.onDragStart(this.startC, this.startR);
        }
    }

    handleMove(evt) {
        if (!this.isDragging) return;
        if (evt.type === 'touchmove') evt.preventDefault(); 
        
        let clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
        let clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;

        let dx = clientX - this.startX;
        let dy = clientY - this.startY;
        
        const threshold = 30; // Drag threshold

        if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
            this.isDragging = false;
            
            let dC = 0;
            let dR = 0;

            if (Math.abs(dx) > Math.abs(dy)) {
                dC = dx > 0 ? 1 : -1;
            } else {
                dR = dy > 0 ? 1 : -1;
            }
            
            if (this.onSwipe) this.onSwipe(this.startC, this.startR, dC, dR);
        }
    }

    handleEnd(evt) {
        if (this.isDragging) {
            // It was a tap/click!
            if (this.onTileClick) this.onTileClick(this.startC, this.startR);
        }
        this.isDragging = false;
        if (this.onDragEnd) this.onDragEnd();
    }
}
