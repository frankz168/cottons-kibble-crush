import { STATE, COLS, ROWS, BOOSTER_TYPE, SOUND_EFFECT, TILE_TYPE, SPECIAL_TYPE, COMBO_TEXT, GAME_MODE, SCREEN, DIRECTION } from '../constants.js';
import { InputController } from './InputController.js';
import { GameLoop } from './GameLoop.js';

export class GameController {
    constructor(model, view, repository) {
        this.model = model;
        this.view = view;
        this.repository = repository;
        
        this.tile1 = null;
        this.tile2 = null;
        this.comboMultiplier = 1;
        this.isGameOverChecked = false;

        // Setup Controllers
        this.input = new InputController(this.view.canvas || document.getElementById('gameCanvas'), this.view.tileSize);
        this.input.onTileClick = this.onTileClick.bind(this);
        this.input.onSwipe = this.onSwipe.bind(this);
        this.input.onDragStart = this.onDragStart.bind(this);
        this.input.onDragEnd = this.onDragEnd.bind(this);

        this.gameLoop = new GameLoop(this.update.bind(this), this.render.bind(this));

        // State persistence on page unload / hide / tab switch
        this.bindLifecycleEvents();
    }

    bindLifecycleEvents() {
        if (typeof window === 'undefined') return;
        
        const saveHandler = () => {
            this.persistCurrentSession();
        };

        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                saveHandler();
            }
        });
        window.addEventListener('pagehide', saveHandler);
        window.addEventListener('beforeunload', saveHandler);
    }

    persistCurrentSession() {
        if (!this.gameState || this.gameState.currentScreen !== SCREEN.GAME || this.isGameOverChecked) return;
        if (this.repository && typeof this.repository.saveActiveSession === 'function') {
            const data = {
                ...this.gameState.serializeSession(),
                grid: this.model.serializeGrid()
            };
            this.repository.saveActiveSession(data);
        }
    }

    restoreActiveSession() {
        if (!this.repository || typeof this.repository.loadActiveSession !== 'function') return false;
        const saved = this.repository.loadActiveSession();
        if (!saved || !saved.levelData || !saved.session || !saved.grid) return false;

        const restoredState = this.gameState.restoreSession(saved);
        const restoredGrid = this.model.deserializeGrid(saved.grid);

        if (restoredState && restoredGrid) {
            this.isGameOverChecked = false;
            this.model.currentState = STATE.IDLE;
            this.gameState.switchScreen(SCREEN.GAME);
            this.view.updateHUD(this.gameState);
            return true;
        }
        return false;
    }
    
    activateBooster(type) {
        if (!this.gameState || this.model.currentState !== STATE.IDLE) return;
        if (window.audioManager) window.audioManager.play(SOUND_EFFECT.CLICK);
        
        if (type === BOOSTER_TYPE.SHUFFLE && this.gameState.boosters[BOOSTER_TYPE.SHUFFLE] > 0) {
            this.model.useShuffle(this.gameState);
            this.gameState.consumeBooster(BOOSTER_TYPE.SHUFFLE);
            this.model.currentState = STATE.MATCHING;
            this.view.updateHUD(this.gameState);
            this.persistCurrentSession();
            return;
        }

        this.gameState.toggleBooster(type);
        this.view.updateHUD(this.gameState);
    }

    onDragStart(c, r) {
        if (this.model.currentState !== STATE.IDLE) return;
        
        // Check if booster is active
        if (this.gameState && this.gameState.activeBooster) {
            if (this.gameState.activeBooster === BOOSTER_TYPE.HAMMER) {
                this.model.useHammer(c, r, this.gameState);
                this.gameState.consumeBooster(BOOSTER_TYPE.HAMMER);
                this.model.currentState = STATE.MATCHING;
            } else if (this.gameState.activeBooster === BOOSTER_TYPE.BOMB) {
                this.model.useBomb(c, r, this.gameState);
                this.gameState.consumeBooster(BOOSTER_TYPE.BOMB);
                this.model.currentState = STATE.MATCHING;
            }
            this.view.updateHUD(this.gameState);
            this.persistCurrentSession();
            
            // Abort drag
            this.input.isDragging = false;
            return;
        }

        this.input.selectedTile = this.model.grid[c] ? this.model.grid[c][r] : null;
    }

    onSwipe(c, r, dC, dR) {
        if (this.model.currentState !== STATE.IDLE) return;
        
        // Reset combo multiplier when a new player move starts
        this.comboMultiplier = 1;

        let targetC = c + dC;
        let targetR = r + dR;

        if (targetC >= 0 && targetC < COLS && targetR >= 0 && targetR < ROWS) {
            this.tile1 = this.model.grid[c][r];
            this.tile2 = this.model.grid[targetC][targetR];
            
            if (this.tile1 && this.tile2 && !this.tile1.isFrozen && !this.tile2.isFrozen) {
                this.model.swapTiles(this.tile1, this.tile2);
                this.model.currentState = STATE.SWAPPING;
                
                if (this.gameState) {
                    if (window.audioManager) window.audioManager.play(SOUND_EFFECT.SWAP);
                    this.gameState.consumeMove();
                    this.view.updateHUD(this.gameState);
                    this.persistCurrentSession();
                }
            } else {
                if (window.audioManager) window.audioManager.play(SOUND_EFFECT.CLICK);
            }
        }
        this.input.selectedTile = null;
    }

    onTileClick(c, r) {
        // Optional: Handle pure tap without drag
    }

    onDragEnd() {
        this.input.selectedTile = null;
    }

    update(dt) {
        if (this.particleSystem) {
            this.particleSystem.update(dt / 1000);
        }

        let isMoving = false;
        for (let c = 0; c < COLS; c++) {
            for (let r = 0; r < ROWS; r++) {
                let t = this.model.grid[c] ? this.model.grid[c][r] : null;
                if (t) {
                    t.update(dt);
                    let dist = Math.hypot(t.targetX - t.pixelX, t.targetY - t.pixelY);
                    if (dist > 1 || (t.scale < 1 && !t.matched)) isMoving = true;
                    if (t.matched && t.scale > 0) isMoving = true;
                }
            }
        }

        if (this.gameState && this.gameState.currentScreen === SCREEN.GAME && this.gameState.levelData.gameMode === GAME_MODE.TIME && this.model.currentState !== STATE.WIN_ANIMATION && this.gameState.session.timeRemaining > 0) {
            this.gameState.session.timeRemaining -= (dt / 1000);
            this.view.updateHUD(this.gameState);
            if (this.gameState.session.timeRemaining <= 0) {
                this.gameState.session.timeRemaining = 0;
                this.checkGameOver();
            }
        }

        if (!isMoving) {
            if (this.model.currentState === STATE.SWAPPING) {
                let isRainbowSwap = false;
                let rainbowTile = null;
                let targetType = null;
                
                if (this.tile1 && this.tile1.type === TILE_TYPE.RAINBOW && this.tile2 && this.tile2.type !== TILE_TYPE.RAINBOW) {
                    isRainbowSwap = true;
                    rainbowTile = this.tile1;
                    targetType = this.tile2.type;
                } else if (this.tile2 && this.tile2.type === TILE_TYPE.RAINBOW && this.tile1 && this.tile1.type !== TILE_TYPE.RAINBOW) {
                    isRainbowSwap = true;
                    rainbowTile = this.tile2;
                    targetType = this.tile1.type;
                }
                
                let matches = this.model.findMatches();
                
                if (isRainbowSwap) {
                    rainbowTile.targetType = targetType;
                    rainbowTile.special = SPECIAL_TYPE.RAINBOW_BLAST;
                    matches.push({
                        tiles: [rainbowTile],
                        shape: SPECIAL_TYPE.NORMAL,
                        centerTile: null
                    });
                }
                
                if (matches.length > 0) {
                    this.model.removeMatches(matches, this.gameState, this.comboMultiplier);
                    this.triggerComboAnimation(matches);
                    this.comboMultiplier++;
                    this.model.currentState = STATE.MATCHING;
                    if (this.gameState) {
                        if (window.audioManager) window.audioManager.play(SOUND_EFFECT.BOMB);
                        this.view.updateHUD(this.gameState);
                    }
                    this.checkHighScore();
                    this.persistCurrentSession();
                } else {
                    this.model.swapTiles(this.tile1, this.tile2);
                    this.model.currentState = STATE.REVERTING;
                }
            } else if (this.model.currentState === STATE.REVERTING) {
                this.model.currentState = STATE.IDLE;
                this.persistCurrentSession();
            } else if (this.model.currentState === STATE.MATCHING) {
                this.model.applyGravity();
                this.model.currentState = STATE.FALLING;
            } else if (this.model.currentState === STATE.FALLING) {
                let matches = this.model.findMatches();
                if (matches.length > 0) {
                    this.model.removeMatches(matches, this.gameState, this.comboMultiplier);
                    this.triggerComboAnimation(matches);
                    this.comboMultiplier++;
                    this.model.currentState = STATE.MATCHING;
                    if (this.gameState) {
                        if (window.audioManager) window.audioManager.play(SOUND_EFFECT.BARK);
                        this.view.updateHUD(this.gameState);
                    }
                    this.checkHighScore();
                    this.persistCurrentSession();
                } else {
                    this.model.moveCats();
                    let postCatMatches = this.model.findMatches();
                    if (postCatMatches.length > 0) {
                        this.model.removeMatches(postCatMatches, this.gameState, this.comboMultiplier);
                        this.model.currentState = STATE.MATCHING;
                        if (this.gameState) this.view.updateHUD(this.gameState);
                    } else {
                        this.model.currentState = STATE.IDLE;
                        this.persistCurrentSession();
                    }
                }
            } else if (this.model.currentState === STATE.IDLE) {
                if (this.gameState && this.gameState.currentScreen === SCREEN.GAME) {
                    if (this.isWinConditionMet()) {
                        let bonusCount = 0;
                        if (this.gameState.levelData.gameMode === GAME_MODE.TIME) {
                            bonusCount = Math.floor(this.gameState.session.timeRemaining);
                            this.gameState.session.timeRemaining = 0;
                        } else {
                            bonusCount = this.gameState.session.movesLeft;
                            this.gameState.session.movesLeft = 0;
                        }
                        
                        if (bonusCount > 0) {
                            this.model.currentState = STATE.WIN_ANIMATION;
                            
                            let targets = [];
                            for (let i = 0; i < bonusCount; i++) {
                                let rC = Math.floor(Math.random() * COLS);
                                let rR = Math.floor(Math.random() * ROWS);
                                if (this.model.grid[rC] && this.model.grid[rC][rR]) {
                                    targets.push(this.model.grid[rC][rR]);
                                }
                            }
                            
                            if (targets.length > 0) {
                                this.gameState.session.currentScore += bonusCount * 1000;
                                
                                targets.forEach(t => {
                                    const orientation = Math.random() > 0.5 ? DIRECTION.HORIZONTAL : DIRECTION.VERTICAL;
                                    const colors = ['#ffeb3b', '#ff7eb3', '#52e3ff', '#a4ff52'];
                                    const color = colors[Math.floor(Math.random() * colors.length)];
                                    
                                    if (window.particleSystem) {
                                        const centerX = t.c * this.model.tileSize + this.model.tileSize / 2;
                                        const centerY = t.r * this.model.tileSize + this.model.tileSize / 2;
                                        window.particleSystem.spawnLaser(centerX, centerY, orientation, color);
                                        window.particleSystem.spawnExplosion(centerX, centerY, color, 6);
                                        window.particleSystem.spawnText(centerX, centerY, 'SUGAR CRUSH!');
                                    }
                                    
                                    if (orientation === DIRECTION.HORIZONTAL) {
                                        for (let c = 0; c < COLS; c++) {
                                            if (this.model.grid[c] && this.model.grid[c][t.r]) this.model.grid[c][t.r].matched = true;
                                        }
                                    } else {
                                        for (let r = 0; r < ROWS; r++) {
                                            if (this.model.grid[t.c] && this.model.grid[t.c][r]) this.model.grid[t.c][r].matched = true;
                                        }
                                    }
                                });
                                
                                if (window.audioManager) {
                                    window.audioManager.play(SOUND_EFFECT.BOMB);
                                    window.audioManager.play(SOUND_EFFECT.BARK);
                                }
                                
                                this.model.currentState = STATE.MATCHING;
                                this.view.updateHUD(this.gameState);
                            } else {
                                this.checkGameOver();
                            }
                        } else {
                            this.checkGameOver();
                        }
                    } else if (this.gameState.session.movesLeft <= 0) {
                        this.checkGameOver();
                    }
                }
            }
        }
    }

    triggerComboAnimation(matches) {
        let textToShow = "";
        
        if (matches && matches.length > 0) {
            let maxLen = Math.max(...matches.map(m => m.tiles.length));
            if (maxLen >= 5) {
                textToShow = COMBO_TEXT.PAW_SOME;
            } else if (maxLen === 4) {
                textToShow = COMBO_TEXT.GOOD_BOY;
            }
        }
        
        if (this.comboMultiplier === 2 && !textToShow) textToShow = COMBO_TEXT.WOW;
        if (this.comboMultiplier >= 3 && !textToShow) textToShow = COMBO_TEXT.FANTASTIC;
        
        if (textToShow || this.comboMultiplier > 1) {
            const charArea = document.querySelector('.character-area');
            if (charArea) {
                charArea.classList.remove('combo-shake');
                void charArea.offsetWidth; 
                charArea.classList.add('combo-shake');
                
                const banner = document.querySelector('.combo-banner');
                if (banner) {
                    banner.innerText = textToShow || `COMBO X${this.comboMultiplier}!`;
                    banner.style.display = 'block';
                    banner.classList.remove('combo-fade');
                    void banner.offsetWidth;
                    banner.classList.add('combo-fade');
                }
                
                if (textToShow && window.audioManager) {
                    window.audioManager.play(SOUND_EFFECT.BARK);
                }
            }
        }
    }

    checkHighScore() {
        if (!this.gameState) return;
        let highScore = this.repository.loadScore();
        if (this.gameState.session.currentScore > highScore) {
            this.repository.saveScore(this.gameState.session.currentScore);
        }
    }

    isWinConditionMet() {
        if (!this.gameState || !this.gameState.levelData || !this.gameState.levelData.objectives) return false;
        
        for (let type in this.gameState.levelData.objectives) {
            const target = this.gameState.levelData.objectives[type];
            const collected = this.gameState.session.collectedItems[type] || 0;
            if (collected < target) {
                return false;
            }
        }
        return true;
    }

    checkGameOver() {
        if (this.isGameOverChecked) return;
        this.isGameOverChecked = true;

        // Clear active mid-level session since level is completed
        if (this.repository && typeof this.repository.clearActiveSession === 'function') {
            this.repository.clearActiveSession();
        }

        const isWin = this.isWinConditionMet();
        const title = isWin ? "Level Complete!" : "Game Over!";
        
        let msg = "Out of moves!";
        if (this.gameState.levelData.gameMode === GAME_MODE.TIME) {
            msg = isWin ? "Awesome! You completed the level!" : "Time's up!";
        } else {
            msg = isWin ? "Awesome! You completed the level!" : "Out of moves!";
        }
        
        let coinReward = 0;
        const rewardEl = document.getElementById('game-over-reward');
        const coinsEl = document.getElementById('game-over-coins');

        if (isWin) {
            let bonusAmount = this.gameState.levelData.gameMode === GAME_MODE.TIME ? 
                              Math.floor(this.gameState.session.timeRemaining) : 
                              this.gameState.session.movesLeft;
                              
            coinReward = 50 + (bonusAmount * 10);
            this.repository.addCoins(coinReward);
            
            this.repository.unlockLevel(this.gameState.levelData.currentLevel + 1);
            
            if (rewardEl) rewardEl.style.display = 'block';
            if (coinsEl) coinsEl.innerText = `+${coinReward}`;
        } else {
            if (rewardEl) rewardEl.style.display = 'none';
        }

        document.getElementById('game-over-title').innerText = title;
        document.getElementById('game-over-msg').innerText = msg;
        document.getElementById('game-over-overlay').style.display = 'flex';
        
        if (isWin && window.particleSystem) {
            window.particleSystem.spawnExplosion(window.innerWidth / 2, window.innerHeight / 2, '🎉', 15);
        }
        
        if (window.audioManager) window.audioManager.play(SOUND_EFFECT.CLICK);
        
        window.closeGameOver = () => {
            if (window.audioManager) window.audioManager.play(SOUND_EFFECT.CLICK);
            document.getElementById('game-over-overlay').style.display = 'none';
            if (rewardEl) rewardEl.style.display = 'none';
            
            this.isGameOverChecked = false;
            
            if (this.particleSystem) this.particleSystem.clear();

            this.gameState.switchScreen(SCREEN.LEVELS);
            
            if (window.renderLevels) window.renderLevels();
            
            this.model.initGrid();
            this.view.updateHUD(this.gameState);
        };
    }

    render() {
        this.view.drawGame(this.model.grid, this.input.selectedTile);
        
        if (this.particleSystem) {
            this.particleSystem.draw();
        }
    }

    start() {
        if (this.gameState) {
            this.view.updateHUD(this.gameState);
        }
        this.gameLoop.start();
    }
}
