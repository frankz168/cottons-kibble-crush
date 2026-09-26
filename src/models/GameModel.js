import { Tile } from './Tile.js';
import { ROWS, COLS, TYPES, STATE } from '../constants.js';

export class GameModel {
    constructor(tileSize) {
        this.tileSize = tileSize;
        this.grid = [];
        this.score = 0;
        this.currentState = STATE.IDLE;
        this.initGrid();
    }

    initGrid(availableTypes = TYPES, frozenCount = 0) {
        this.availableTypes = availableTypes;
        this.grid = Array.from({ length: COLS }, () => new Array(ROWS).fill(null));
        let allTiles = [];
        
        for (let c = 0; c < COLS; c++) {
            for (let r = 0; r < ROWS; r++) {
                let type;
                do {
                    type = this.availableTypes[Math.floor(Math.random() * this.availableTypes.length)];
                } while (
                    (c >= 2 && this.grid[c-1][r].type === type && this.grid[c-2][r].type === type) ||
                    (r >= 2 && this.grid[c][r-1].type === type && this.grid[c][r-2].type === type)
                );
                this.grid[c][r] = new Tile(c, r, type, this.tileSize);
                allTiles.push(this.grid[c][r]);
            }
        }
        
        // Randomly freeze tiles
        if (frozenCount > 0) {
            allTiles.sort(() => Math.random() - 0.5);
            for (let i = 0; i < Math.min(frozenCount, allTiles.length); i++) {
                allTiles[i].isFrozen = true;
            }
        }
    }

    findMatches() {
        let hLines = [];
        let vLines = [];
        
        // Find all horizontal lines
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS - 2; c++) {
                let t1 = this.grid[c][r];
                if (t1 && !t1.matched) {
                    let matchLen = 1;
                    while (c + matchLen < COLS && this.grid[c + matchLen][r] && this.grid[c + matchLen][r].type === t1.type && !this.grid[c + matchLen][r].matched) {
                        matchLen++;
                    }
                    if (matchLen >= 3) {
                        let line = [];
                        for (let i = 0; i < matchLen; i++) line.push(this.grid[c + i][r]);
                        hLines.push(line);
                        c += matchLen - 1; // skip ahead
                    }
                }
            }
        }

        // Find all vertical lines
        for (let c = 0; c < COLS; c++) {
            for (let r = 0; r < ROWS - 2; r++) {
                let t1 = this.grid[c][r];
                if (t1 && !t1.matched) {
                    let matchLen = 1;
                    while (r + matchLen < ROWS && this.grid[c][r + matchLen] && this.grid[c][r + matchLen].type === t1.type && !this.grid[c][r + matchLen].matched) {
                        matchLen++;
                    }
                    if (matchLen >= 3) {
                        let line = [];
                        for (let i = 0; i < matchLen; i++) line.push(this.grid[c][r + i]);
                        vLines.push(line);
                        r += matchLen - 1; // skip ahead
                    }
                }
            }
        }

        let allMatches = [];
        let processedLines = new Set();
        
        // Group intersecting lines (L/T shapes and Rainbows)
        for (let hLine of hLines) {
            let intersectVLines = vLines.filter(vLine => vLine.some(t => hLine.includes(t)));
            
            if (intersectVLines.length > 0) {
                let groupTiles = new Set([...hLine]);
                let intersectionTile = hLine.find(t => intersectVLines[0].includes(t));
                
                intersectVLines.forEach(v => {
                    v.forEach(t => groupTiles.add(t));
                    processedLines.add(v);
                });
                
                let isLine5 = hLine.length >= 5 || intersectVLines.some(v => v.length >= 5);
                
                allMatches.push({
                    tiles: Array.from(groupTiles),
                    shape: isLine5 ? 'rainbow' : 'bomb',
                    centerTile: intersectionTile
                });
            } else {
                if (hLine.length >= 5) {
                    allMatches.push({ tiles: hLine, shape: 'rainbow', centerTile: hLine[2] });
                } else if (hLine.length === 4) {
                    allMatches.push({ tiles: hLine, shape: 'striped-v', centerTile: hLine[1] });
                } else {
                    allMatches.push({ tiles: hLine, shape: 'normal', centerTile: null });
                }
            }
        }
        
        for (let vLine of vLines) {
            if (!processedLines.has(vLine)) {
                if (vLine.length >= 5) {
                    allMatches.push({ tiles: vLine, shape: 'rainbow', centerTile: vLine[2] });
                } else if (vLine.length === 4) {
                    allMatches.push({ tiles: vLine, shape: 'striped-h', centerTile: vLine[1] });
                } else {
                    allMatches.push({ tiles: vLine, shape: 'normal', centerTile: null });
                }
            }
        }

        return allMatches;
    }

    removeMatches(matchGroups, gameState, comboMultiplier = 1) {
        let transformSet = new Map();
        
        matchGroups.forEach(group => {
            if (group.shape !== 'normal' && group.centerTile) {
                transformSet.set(group.centerTile, group.shape);
            }
        });
        
        let toDestroyQueue = [];
        matchGroups.forEach(group => {
            group.tiles.forEach(t => {
                if (!transformSet.has(t) && !t.matched) {
                    toDestroyQueue.push(t);
                    t.matched = true;
                }
            });
        });
        
        let scoreGained = 0;
        
        if (toDestroyQueue.length > 0) {
            if (window.audioManager) window.audioManager.play('match');
        }
        
        while (toDestroyQueue.length > 0) {
            let t = toDestroyQueue.shift();
            
            // Check neighbors for ice to thaw
            let neighbors = [
                {c: t.c - 1, r: t.r},
                {c: t.c + 1, r: t.r},
                {c: t.c, r: t.r - 1},
                {c: t.c, r: t.r + 1}
            ];
            neighbors.forEach(n => {
                if (n.c >= 0 && n.c < COLS && n.r >= 0 && n.r < ROWS) {
                    let neighbor = this.grid[n.c][n.r];
                    if (neighbor && neighbor.isFrozen) {
                        neighbor.isFrozen = false;
                        if (window.audioManager) window.audioManager.play('match'); // small feedback
                        if (window.particleSystem) window.particleSystem.spawnExplosion(neighbor.pixelX + this.tileSize/2, neighbor.pixelY + this.tileSize/2, '❄️');
                    }
                }
            });
            
            if (gameState && gameState.session.collectedItems[t.type] !== undefined) {
                gameState.session.collectedItems[t.type] += 1;
            }
            scoreGained += 50 * comboMultiplier;
            
            if (window.particleSystem) {
                const centerX = t.pixelX + t.tileSize / 2;
                const centerY = t.pixelY + t.tileSize / 2;
                const typeColors = {'🦴': '#f5f5dc', '🍪': '#d2691e', '🐾': '#8b4513', '🥩': '#ff4500'};
                window.particleSystem.spawnExplosion(centerX, centerY, typeColors[t.type] || '#fff', 5);
                window.particleSystem.spawnText(centerX, centerY, `+${10 * comboMultiplier}`);
            }
            
            if (t.special === 'striped-v') {
                for (let r = 0; r < ROWS; r++) {
                    let st = this.grid[t.c][r];
                    if (st && !st.matched && !transformSet.has(st)) {
                        st.matched = true;
                        toDestroyQueue.push(st);
                    }
                }
                if (window.particleSystem) window.particleSystem.spawnLaser(t.pixelX + t.tileSize/2, t.pixelY + t.tileSize/2, 'vertical', '#ffeb3b');
            } else if (t.special === 'striped-h') {
                for (let c = 0; c < COLS; c++) {
                    let st = this.grid[c][t.r];
                    if (st && !st.matched && !transformSet.has(st)) {
                        st.matched = true;
                        toDestroyQueue.push(st);
                    }
                }
                if (window.particleSystem) window.particleSystem.spawnLaser(t.pixelX + t.tileSize/2, t.pixelY + t.tileSize/2, 'horizontal', '#ffeb3b');
            } else if (t.special === 'bomb') {
                for (let c = Math.max(0, t.c - 1); c <= Math.min(COLS-1, t.c + 1); c++) {
                    for (let r = Math.max(0, t.r - 1); r <= Math.min(ROWS-1, t.r + 1); r++) {
                        let st = this.grid[c][r];
                        if (st && !st.matched && !transformSet.has(st)) {
                            st.matched = true;
                            toDestroyQueue.push(st);
                        }
                    }
                }
                if (window.particleSystem) window.particleSystem.spawnExplosion(t.pixelX + t.tileSize/2, t.pixelY + t.tileSize/2, '#ff4500', 30);
            } else if (t.special === 'rainbow-blast' || t.special === 'rainbow' || t.type === '🌈') {
                let targetType = t.targetType || ['🦴', '🍪', '🐾', '🥩'][Math.floor(Math.random() * 4)];
                for (let c = 0; c < COLS; c++) {
                    for (let r = 0; r < ROWS; r++) {
                        let st = this.grid[c][r];
                        if (st && st.type === targetType && !st.matched && !transformSet.has(st)) {
                            st.matched = true;
                            toDestroyQueue.push(st);
                        }
                    }
                }
                if (window.particleSystem) window.particleSystem.spawnExplosion(t.pixelX + t.tileSize/2, t.pixelY + t.tileSize/2, '#ffffff', 50);
            }
        }
        
        for (let [t, special] of transformSet.entries()) {
            t.special = special;
            if (special === 'rainbow') t.type = '🌈';
            t.matched = false;
        }

        if (gameState) {
            gameState.session.currentScore += scoreGained;
        }
    }

    applyGravity() {
        for (let c = 0; c < COLS; c++) {
            let emptySpots = 0;
            for (let r = ROWS - 1; r >= 0; r--) {
                if (this.grid[c][r] && this.grid[c][r].matched) {
                    emptySpots++;
                    this.grid[c][r] = null;
                } else if (this.grid[c][r]) {
                    if (this.grid[c][r].isFrozen) {
                        // Ice blocker! Doesn't fall.
                        // Instantly spawn tiles to fill the empty spaces BELOW this ice block
                        for (let k = 1; k <= emptySpots; k++) {
                            let fillR = r + k;
                            let type = this.availableTypes[Math.floor(Math.random() * this.availableTypes.length)];
                            let newTile = new Tile(c, fillR, type, this.tileSize);
                            newTile.pixelY = (fillR - emptySpots - 1) * this.tileSize; 
                            newTile.scale = 0.5;
                            this.grid[c][fillR] = newTile;
                        }
                        emptySpots = 0; // Reset empty spots because ice blocks tiles above from falling through
                    } else if (emptySpots > 0) {
                        // Move tile down
                        this.grid[c][r + emptySpots] = this.grid[c][r];
                        this.grid[c][r] = null;
                        this.grid[c][r + emptySpots].r = r + emptySpots;
                        this.grid[c][r + emptySpots].targetY = (r + emptySpots) * this.tileSize;
                    }
                }
            }
            
            // Spawn new tiles at the top
            for (let r = 0; r < emptySpots; r++) {
                let type = this.availableTypes[Math.floor(Math.random() * this.availableTypes.length)];
                let newTile = new Tile(c, r, type, this.tileSize);
                newTile.pixelY = (r - emptySpots - 1) * this.tileSize; 
                newTile.scale = 0.5; // Starts small, pops in
                this.grid[c][r] = newTile;
            }
        }
    }

    swapTiles(t1, t2) {
        this.grid[t1.c][t1.r] = t2;
        this.grid[t2.c][t2.r] = t1;
        
        let tempC = t1.c;
        let tempR = t1.r;
        t1.c = t2.c;
        t1.r = t2.r;
        t2.c = tempC;
        t2.r = tempR;

        t1.targetX = t1.c * this.tileSize;
        t1.targetY = t1.r * this.tileSize;
        t2.targetX = t2.c * this.tileSize;
        t2.targetY = t2.r * this.tileSize;
    }

    useHammer(c, r, gameState) {
        if (this.grid[c][r]) {
            this.removeMatches([{ tiles: [this.grid[c][r]], shape: 'normal' }], gameState);
            if (window.audioManager) window.audioManager.play('match');
        }
    }

    useBomb(centerC, centerR, gameState) {
        let targets = [];
        for (let c = centerC - 1; c <= centerC + 1; c++) {
            for (let r = centerR - 1; r <= centerR + 1; r++) {
                if (c >= 0 && c < COLS && r >= 0 && r < ROWS && this.grid[c][r]) {
                    targets.push(this.grid[c][r]);
                }
            }
        }
        if (targets.length > 0) {
            this.removeMatches([{ tiles: targets, shape: 'normal' }], gameState);
            if (window.audioManager) window.audioManager.play('match');
        }
    }

    useShuffle(gameState) {
        let allTypes = [];
        for (let c = 0; c < COLS; c++) {
            for (let r = 0; r < ROWS; r++) {
                if (this.grid[c][r]) allTypes.push(this.grid[c][r].type);
            }
        }
        
        allTypes.sort(() => Math.random() - 0.5);
        
        let i = 0;
        for (let c = 0; c < COLS; c++) {
            for (let r = 0; r < ROWS; r++) {
                if (this.grid[c][r]) {
                    this.grid[c][r].type = allTypes[i];
                    i++;
                }
            }
        }
        if (window.audioManager) window.audioManager.play('swap');
    }
}
