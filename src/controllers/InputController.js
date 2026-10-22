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
        this.isTouching = false;
        this.isDragging = false;
        this.hasSwiped = false;
        this.startX = 0;
        this.startY = 0;
        this.startC = -1;
        this.startR = -1;

        this.bindEvents();
    }

    bindEvents() {
        // Mouse Events
        this.canvas.addEventListener('mousedown', this.handleStart.bind(this));
        window.addEventListener('mousemove', this.handleMove.bind(this));
        window.addEventListener('mouseup', this.handleEnd.bind(this));

        // Touch Events - explicitly passive: false to allow preventDefault()
        this.canvas.addEventListener('touchstart', this.handleStart.bind(this), { passive: false });
        window.addEventListener('touchmove', this.handleMove.bind(this), { passive: false });
        window.addEventListener('touchend', this.handleEnd.bind(this), { passive: false });
        window.addEventListener('touchcancel', this.handleEnd.bind(this), { passive: false });
    }

    getGridPos(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
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
        const isTouch = Boolean(evt.touches);
        if (isTouch && evt.cancelable) {
            evt.preventDefault();
        }
        
        const clientX = isTouch ? evt.touches[0].clientX : evt.clientX;
        const clientY = isTouch ? evt.touches[0].clientY : evt.clientY;

        const pos = this.getGridPos(clientX, clientY);
        if (pos.c >= 0 && pos.c < COLS && pos.r >= 0 && pos.r < ROWS) {
            this.isTouching = true;
            this.isDragging = true;
            this.hasSwiped = false;
            this.startC = pos.c;
            this.startR = pos.r;
            this.startX = clientX;
            this.startY = clientY;
            
            if (this.onDragStart) this.onDragStart(this.startC, this.startR);
        }
    }

    handleMove(evt) {
        if (!this.isTouching) return;

        // CRITICAL: Always preventDefault on touchmove to avoid triggering browser back/forward gestures
        if (evt.cancelable) {
            evt.preventDefault();
        }
        
        if (!this.isDragging || this.hasSwiped) return;

        const isTouch = Boolean(evt.touches);
        const clientX = isTouch ? evt.touches[0].clientX : evt.clientX;
        const clientY = isTouch ? evt.touches[0].clientY : evt.clientY;

        const dx = clientX - this.startX;
        const dy = clientY - this.startY;
        
        const threshold = 25; // Drag threshold in px

        if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
            this.hasSwiped = true;
            this.isDragging = false;
            
            let dC = 0;
            let dR = 0;

            if (Math.abs(dx) > Math.abs(dy)) {
                dC = dx > 0 ? 1 : -1;
            } else {
                dR = dy > 0 ? 1 : -1;
            }
            
            if (this.onSwipe) {
                this.onSwipe(this.startC, this.startR, dC, dR);
            }
        }
    }

    handleEnd(evt) {
        if (!this.isTouching) return;

        if (evt.cancelable && evt.type.startsWith('touch')) {
            evt.preventDefault();
        }

        if (this.isDragging && !this.hasSwiped) {
            // It was a tap/click without swipe
            if (this.onTileClick) {
                this.onTileClick(this.startC, this.startR);
            }
        }

        this.isTouching = false;
        this.isDragging = false;
        this.hasSwiped = false;

        if (this.onDragEnd) {
            this.onDragEnd();
        }
    }
}
