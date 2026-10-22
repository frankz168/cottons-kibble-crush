import { Tile } from './Tile.js';
import { ROWS, COLS, TYPES, STATE, TILE_TYPE, SPECIAL_TYPE, DIRECTION, SOUND_EFFECT } from '../constants.js';

export class GameModel {
    constructor(tileSize) {
        this.tileSize = tileSize;
        this.grid = [];
        this.score = 0;
        this.currentState = STATE.IDLE;
        this.initGrid();
    }

    initGrid(availableTypes = TYPES, frozenCount = 0, catCount = 0) {
        this.availableTypes = availableTypes && availableTypes.length >= 3 ? availableTypes : TYPES;
        this.grid = Array.from({ length: COLS }, () => new Array(ROWS).fill(null));
        let allTiles = [];
        
        for (let c = 0; c < COLS; c++) {
            for (let r = 0; r < ROWS; r++) {
                let type;
                let attempts = 0;
                do {
                    type = this.availableTypes[Math.floor(Math.random() * this.availableTypes.length)];
                    attempts++;
                } while (
                    attempts < 60 &&
                    ((c >= 2 && this.grid[c - 1][r].type === type && this.grid[c - 2][r].type === type) ||
                    (r >= 2 && this.grid[c][r - 1].type === type && this.grid[c][r - 2].type === type))
                );
                this.grid[c][r] = new Tile(c, r, type, this.tileSize);
                allTiles.push(this.grid[c][r]);
            }
        }
        
        allTiles.sort(() => Math.random() - 0.5);
        
        // Spawn cats
        for (let i = 0; i < Math.min(catCount, allTiles.length); i++) {
            allTiles[i].type = TILE_TYPE.CAT;
            allTiles[i].isCat = true;
        }
        
        // Randomly freeze tiles (excluding cats)
        if (frozenCount > 0) {
            let freezable = allTiles.filter(t => !t.isCat);
            for (let i = 0; i < Math.min(frozenCount, freezable.length); i++) {
                freezable[i].isFrozen = true;
            }
        }
    }

    serializeGrid() {
        let serialized = [];
        for (let c = 0; c < COLS; c++) {
            for (let r = 0; r < ROWS; r++) {
                const t = this.grid[c][r];
                if (t) {
                    serialized.push({
                        c: t.c,
                        r: t.r,
                        type: t.type,
                        isFrozen: Boolean(t.isFrozen),
                        isCat: Boolean(t.isCat),
                        special: t.special || null,
                        moveCount: t.moveCount || 0
                    });
                }
            }
        }
        return serialized;
    }

    deserializeGrid(savedGrid) {
        if (!Array.isArray(savedGrid) || savedGrid.length === 0) return false;
        this.grid = Array.from({ length: COLS }, () => new Array(ROWS).fill(null));
        savedGrid.forEach(data => {
            if (data.c >= 0 && data.c < COLS && data.r >= 0 && data.r < ROWS) {
                const tile = new Tile(data.c, data.r, data.type, this.tileSize);
                tile.isFrozen = data.isFrozen;
                tile.isCat = data.isCat;
                tile.special = data.special;
                tile.moveCount = data.moveCount || 0;
                this.grid[data.c][data.r] = tile;
            }
        });
        return true;
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
                    shape: isLine5 ? SPECIAL_TYPE.RAINBOW : SPECIAL_TYPE.BOMB,
                    centerTile: intersectionTile
                });
            } else {
                if (hLine.length >= 5) {
                    allMatches.push({ tiles: hLine, shape: SPECIAL_TYPE.RAINBOW, centerTile: hLine[2] });
                } else if (hLine.length === 4) {
                    allMatches.push({ tiles: hLine, shape: SPECIAL_TYPE.STRIPED_V, centerTile: hLine[1] });
                } else {
                    allMatches.push({ tiles: hLine, shape: SPECIAL_TYPE.NORMAL, centerTile: null });
                }
            }
        }
        
        for (let vLine of vLines) {
            if (!processedLines.has(vLine)) {
                if (vLine.length >= 5) {
                    allMatches.push({ tiles: vLine, shape: SPECIAL_TYPE.RAINBOW, centerTile: vLine[2] });
                } else if (vLine.length === 4) {
                    allMatches.push({ tiles: vLine, shape: SPECIAL_TYPE.STRIPED_H, centerTile: vLine[1] });
                } else {
                    allMatches.push({ tiles: vLine, shape: SPECIAL_TYPE.NORMAL, centerTile: null });
                }
            }
        }

        return allMatches;
    }

    removeMatches(matchGroups, gameState, comboMultiplier = 1) {
        let transformSet = new Map();
        
        matchGroups.forEach(group => {
            if (group.shape !== SPECIAL_TYPE.NORMAL && group.centerTile) {
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
            if (window.audioManager) window.audioManager.play(SOUND_EFFECT.MATCH);
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
                    if (neighbor) {
                        if (neighbor.isFrozen) {
                            neighbor.isFrozen = false;
                            if (window.audioManager) window.audioManager.play(SOUND_EFFECT.MATCH);
                            if (window.particleSystem) window.particleSystem.spawnExplosion(neighbor.pixelX + this.tileSize/2, neighbor.pixelY + this.tileSize/2, '❄️', 4);
                        }
                        if (neighbor.isCat && !neighbor.matched) {
                            neighbor.matched = true;
                            toDestroyQueue.push(neighbor); // Kill the cat!
                            
                            // Give +50 coins
                            if (window.repository) {
                                window.repository.addCoins(50);
                            }
                            
                            // Extra score
                            scoreGained += 1000;
                            
                            if (window.particleSystem) {
                                window.particleSystem.spawnExplosion(neighbor.pixelX + this.tileSize/2, neighbor.pixelY + this.tileSize/2, '🎉', 10);
                                window.particleSystem.spawnText(neighbor.pixelX + this.tileSize/2, neighbor.pixelY + this.tileSize/2, 'CAUGHT!');
                            }
                        }
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
                const typeColors = {
                    [TILE_TYPE.BONE]: '#f5f5dc',
                    [TILE_TYPE.COOKIE]: '#d2691e',
                    [TILE_TYPE.PAW]: '#8b4513',
                    [TILE_TYPE.MEAT]: '#ff4500'
                };
                window.particleSystem.spawnExplosion(centerX, centerY, typeColors[t.type] || '#fff', 4);
                window.particleSystem.spawnText(centerX, centerY, `+${10 * comboMultiplier}`);
            }
            
            if (t.special === SPECIAL_TYPE.STRIPED_V) {
                for (let r = 0; r < ROWS; r++) {
                    let st = this.grid[t.c][r];
                    if (st && !st.matched && !transformSet.has(st)) {
                        st.matched = true;
                        toDestroyQueue.push(st);
                    }
                }
                if (window.particleSystem) window.particleSystem.spawnLaser(t.pixelX + t.tileSize/2, t.pixelY + t.tileSize/2, DIRECTION.VERTICAL, '#ffeb3b');
            } else if (t.special === SPECIAL_TYPE.STRIPED_H) {
                for (let c = 0; c < COLS; c++) {
                    let st = this.grid[c][t.r];
                    if (st && !st.matched && !transformSet.has(st)) {
                        st.matched = true;
                        toDestroyQueue.push(st);
                    }
                }
                if (window.particleSystem) window.particleSystem.spawnLaser(t.pixelX + t.tileSize/2, t.pixelY + t.tileSize/2, DIRECTION.HORIZONTAL, '#ffeb3b');
            } else if (t.special === SPECIAL_TYPE.BOMB) {
                for (let c = Math.max(0, t.c - 1); c <= Math.min(COLS-1, t.c + 1); c++) {
                    for (let r = Math.max(0, t.r - 1); r <= Math.min(ROWS-1, t.r + 1); r++) {
                        let st = this.grid[c][r];
                        if (st && !st.matched && !transformSet.has(st)) {
                            st.matched = true;
                            toDestroyQueue.push(st);
                        }
                    }
                }
                if (window.particleSystem) window.particleSystem.spawnExplosion(t.pixelX + t.tileSize/2, t.pixelY + t.tileSize/2, '#ff4500', 12);
            } else if (t.special === SPECIAL_TYPE.RAINBOW_BLAST || t.special === SPECIAL_TYPE.RAINBOW || t.type === TILE_TYPE.RAINBOW) {
                let targetType = t.targetType || [TILE_TYPE.BONE, TILE_TYPE.COOKIE, TILE_TYPE.PAW, TILE_TYPE.MEAT][Math.floor(Math.random() * 4)];
                for (let c = 0; c < COLS; c++) {
                    for (let r = 0; r < ROWS; r++) {
                        let st = this.grid[c][r];
                        if (st && st.type === targetType && !st.matched && !transformSet.has(st)) {
                            st.matched = true;
                            toDestroyQueue.push(st);
                        }
                    }
                }
                if (window.particleSystem) window.particleSystem.spawnExplosion(t.pixelX + t.tileSize/2, t.pixelY + t.tileSize/2, '#ffffff', 16);
            }
        }
        
        for (let [t, special] of transformSet.entries()) {
            t.special = special;
            if (special === SPECIAL_TYPE.RAINBOW) t.type = TILE_TYPE.RAINBOW;
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
                        for (let k = 1; k <= emptySpots; k++) {
                            let fillR = r + k;
                            let type = this.availableTypes[Math.floor(Math.random() * this.availableTypes.length)];
                            let newTile = new Tile(c, fillR, type, this.tileSize);
                            newTile.pixelY = (fillR - emptySpots - 1) * this.tileSize; 
                            newTile.scale = 0.5;
                            this.grid[c][fillR] = newTile;
                        }
                        emptySpots = 0;
                    } else if (emptySpots > 0) {
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
                newTile.scale = 0.5;
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
            this.removeMatches([{ tiles: [this.grid[c][r]], shape: SPECIAL_TYPE.NORMAL }], gameState);
            if (window.audioManager) window.audioManager.play(SOUND_EFFECT.MATCH);
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
            this.removeMatches([{ tiles: targets, shape: SPECIAL_TYPE.NORMAL }], gameState);
            if (window.audioManager) window.audioManager.play(SOUND_EFFECT.MATCH);
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
        if (window.audioManager) window.audioManager.play(SOUND_EFFECT.SWAP);
    }

    moveCats() {
        let cats = [];
        for (let c = 0; c < COLS; c++) {
            for (let r = 0; r < ROWS; r++) {
                if (this.grid[c][r] && this.grid[c][r].isCat) {
                    cats.push(this.grid[c][r]);
                }
            }
        }
        
        cats.forEach(cat => {
            if (cat.matched) return;
            let neighbors = [
                {c: cat.c - 1, r: cat.r},
                {c: cat.c + 1, r: cat.r},
                {c: cat.c, r: cat.r - 1},
                {c: cat.c, r: cat.r + 1}
            ];
            let validNeighbors = neighbors.filter(n => n.c >= 0 && n.c < COLS && n.r >= 0 && n.r < ROWS);
            let freeNeighbors = validNeighbors.map(n => this.grid[n.c][n.r]).filter(t => t && !t.isCat && !t.isFrozen);
            
            if (freeNeighbors.length > 0) {
                let target = freeNeighbors[Math.floor(Math.random() * freeNeighbors.length)];
                
                let currentMoves = cat.moveCount || 0;
                
                let tempType = cat.type;
                let tempCat = cat.isCat;
                
                cat.type = target.type;
                cat.isCat = target.isCat;
                cat.moveCount = 0;
                
                target.type = tempType;
                target.isCat = tempCat;
                target.moveCount = currentMoves + 1;
                
                if (target.moveCount >= 3) {
                    target.moveCount = 0;
                    if (window.repository) {
                        let coins = window.repository.getCoins();
                        if (coins >= 10) {
                            window.repository.spendCoins(10);
                            if (window.particleSystem) {
                                window.particleSystem.spawnText(target.pixelX + this.tileSize/2, target.pixelY + this.tileSize/2, '-10 💰');
                            }
                            if (window.renderShop) window.renderShop();
                        }
                    }
                }
            }
        });
    }
}
