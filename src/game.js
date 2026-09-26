const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');

const ROWS = 8;
const COLS = 8;
const ITEM_TYPES = ['🦴', '🥩', '🎾', '🍪'];
const CELL_SIZE = 60; 

canvas.width = COLS * CELL_SIZE;
canvas.height = ROWS * CELL_SIZE;

let grid = [];
let score = 0;
let isAnimating = false;

let state = "IDLE"; // IDLE, SWAPPING, SWAP_BACK, REMOVING, FALLING
let swapData = null; 

class Cell {
    constructor(r, c, type) {
        this.r = r;
        this.c = c;
        this.type = type;
        this.x = c * CELL_SIZE;
        this.y = r * CELL_SIZE;
        this.targetX = this.x;
        this.targetY = this.y;
        this.isRemoving = false;
        this.alpha = 1;
    }

    update() {
        let animating = false;
        
        let dx = this.targetX - this.x;
        let dy = this.targetY - this.y;
        
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
            this.x += dx * 0.2;
            this.y += dy * 0.2;
            animating = true;
        } else {
            this.x = this.targetX;
            this.y = this.targetY;
        }

        if (this.isRemoving && this.alpha > 0) {
            this.alpha -= 0.1;
            if (this.alpha <= 0) {
                this.alpha = 0;
            }
            animating = true;
        }

        return animating;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        let scale = this.isRemoving ? this.alpha : 1; 
        ctx.translate(this.x + CELL_SIZE/2, this.y + CELL_SIZE/2);
        ctx.scale(scale, scale);
        ctx.font = "40px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.type, 0, 0); 
        ctx.restore();
    }
}

function init() {
    for (let r = 0; r < ROWS; r++) {
        grid[r] = [];
        for (let c = 0; c < COLS; c++) {
            let type;
            do {
                type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
            } while (
                (c >= 2 && grid[r][c-1] && grid[r][c-1].type === type && grid[r][c-2] && grid[r][c-2].type === type) ||
                (r >= 2 && grid[r-1] && grid[r-1][c] && grid[r-1][c].type === type && grid[r-2] && grid[r-2][c] && grid[r-2][c].type === type)
            );
            grid[r][c] = new Cell(r, c, type);
        }
    }
    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let currentlyAnimating = false;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (grid[r][c]) {
                if (grid[r][c].update()) {
                    currentlyAnimating = true;
                }
                grid[r][c].draw(ctx);
            }
        }
    }
    
    if (isAnimating && !currentlyAnimating) {
        isAnimating = false; 
        processGameLogic();
    } else if (currentlyAnimating) {
        isAnimating = true; 
    }

    // Draw selection
    if (selectedCellForClick && state === "IDLE" && !isAnimating) {
        ctx.strokeStyle = "#ffeb3b";
        ctx.lineWidth = 4;
        ctx.strokeRect(selectedCellForClick.c * CELL_SIZE, selectedCellForClick.r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }

    requestAnimationFrame(gameLoop);
}

function processGameLogic() {
    if (state === "SWAPPING") {
        let matches = findMatches();
        if (matches.length > 0) {
            removeMatches(matches);
        } else {
            state = "SWAP_BACK";
            let {r1, c1, r2, c2} = swapData;
            
            grid[r1][c1].targetX = c2 * CELL_SIZE;
            grid[r1][c1].targetY = r2 * CELL_SIZE;
            grid[r2][c2].targetX = c1 * CELL_SIZE;
            grid[r2][c2].targetY = r1 * CELL_SIZE;
            
            let temp = grid[r1][c1];
            grid[r1][c1] = grid[r2][c2];
            grid[r2][c2] = temp;
            
            grid[r1][c1].r = r1; grid[r1][c1].c = c1;
            grid[r2][c2].r = r2; grid[r2][c2].c = c2;
            
            isAnimating = true;
        }
    } else if (state === "SWAP_BACK") {
        state = "IDLE";
    } else if (state === "REMOVING") {
        applyGravity();
        isAnimating = true;
    } else if (state === "FALLING") {
        let matches = findMatches();
        if (matches.length > 0) {
            removeMatches(matches);
            isAnimating = true;
        } else {
            state = "IDLE";
        }
    }
}

function findMatches() {
    let matchedCells = new Set();
    
    // Horizontal
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS - 2; c++) {
            if (!grid[r][c] || !grid[r][c+1] || !grid[r][c+2]) continue;
            let type = grid[r][c].type;
            if (type === grid[r][c+1].type && type === grid[r][c+2].type) {
                matchedCells.add(grid[r][c]);
                matchedCells.add(grid[r][c+1]);
                matchedCells.add(grid[r][c+2]);
                let k = c + 3;
                while (k < COLS && grid[r][k] && grid[r][k].type === type) {
                    matchedCells.add(grid[r][k]);
                    k++;
                }
            }
        }
    }
    
    // Vertical
    for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS - 2; r++) {
            if (!grid[r][c] || !grid[r+1][c] || !grid[r+2][c]) continue;
            let type = grid[r][c].type;
            if (type === grid[r+1][c].type && type === grid[r+2][c].type) {
                matchedCells.add(grid[r][c]);
                matchedCells.add(grid[r+1][c]);
                matchedCells.add(grid[r+2][c]);
                let k = r + 3;
                while (k < ROWS && grid[k][c] && grid[k][c].type === type) {
                    matchedCells.add(grid[k][c]);
                    k++;
                }
            }
        }
    }
    
    return Array.from(matchedCells);
}

function removeMatches(matches) {
    state = "REMOVING";
    score += matches.length * 10;
    scoreEl.innerText = score;
    
    matches.forEach(cell => {
        cell.isRemoving = true;
    });
}

function applyGravity() {
    state = "FALLING";
    
    for (let c = 0; c < COLS; c++) {
        let emptySpots = 0;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (grid[r][c] && grid[r][c].isRemoving) {
                emptySpots++;
            } else if (emptySpots > 0 && grid[r][c]) {
                let targetR = r + emptySpots;
                grid[targetR][c] = grid[r][c];
                grid[targetR][c].r = targetR;
                grid[targetR][c].targetY = targetR * CELL_SIZE;
                grid[r][c] = null;
            }
        }
        
        for (let i = 0; i < emptySpots; i++) {
            let type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
            let newCell = new Cell(emptySpots - 1 - i, c, type);
            newCell.y = -(i + 1) * CELL_SIZE; 
            newCell.targetY = newCell.r * CELL_SIZE;
            grid[newCell.r][c] = newCell;
        }
    }
}

// Input handling
let startX, startY;
let selectedCell = null;
let selectedCellForClick = null;

canvas.addEventListener('mousedown', handleStart);
canvas.addEventListener('touchstart', handleStart, {passive: false});
canvas.addEventListener('mouseup', handleEnd);
canvas.addEventListener('touchend', handleEnd, {passive: false});

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.changedTouches) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

function handleStart(e) {
    if (state !== "IDLE" || isAnimating) return;
    e.preventDefault();
    let pos = getMousePos(e);
    startX = pos.x;
    startY = pos.y;
    
    let c = Math.floor(startX / CELL_SIZE);
    let r = Math.floor(startY / CELL_SIZE);
    
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
        if (selectedCellForClick) {
            let r1 = selectedCellForClick.r;
            let c1 = selectedCellForClick.c;
            let dr = Math.abs(r - r1);
            let dc = Math.abs(c - c1);
            
            if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
                startSwap(r1, c1, r, c);
                selectedCellForClick = null;
                return;
            }
        }
        selectedCellForClick = {r, c};
        selectedCell = {r, c};
    }
}

function handleEnd(e) {
    if (state !== "IDLE" || !selectedCell || isAnimating) return;
    e.preventDefault();
    let pos = getMousePos(e);
    
    let dx = pos.x - startX;
    let dy = pos.y - startY;
    
    if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
        let targetR = selectedCell.r;
        let targetC = selectedCell.c;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) targetC++;
            else targetC--;
        } else {
            if (dy > 0) targetR++;
            else targetR--;
        }
        
        if (targetR >= 0 && targetR < ROWS && targetC >= 0 && targetC < COLS) {
            startSwap(selectedCell.r, selectedCell.c, targetR, targetC);
        }
        selectedCellForClick = null;
    }
    selectedCell = null;
}

function startSwap(r1, c1, r2, c2) {
    state = "SWAPPING";
    swapData = {r1, c1, r2, c2};
    
    grid[r1][c1].targetX = c2 * CELL_SIZE;
    grid[r1][c1].targetY = r2 * CELL_SIZE;
    grid[r2][c2].targetX = c1 * CELL_SIZE;
    grid[r2][c2].targetY = r1 * CELL_SIZE;
    
    let temp = grid[r1][c1];
    grid[r1][c1] = grid[r2][c2];
    grid[r2][c2] = temp;
    
    grid[r1][c1].r = r1; grid[r1][c1].c = c1;
    grid[r2][c2].r = r2; grid[r2][c2].c = c2;
    
    isAnimating = true;
}

init();
