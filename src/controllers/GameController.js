import { STATE, COLS, ROWS } from '../constants.js';
import { InputController } from './InputController.js';
import { GameLoop } from './GameLoop.js';

export class GameController {
    constructor(model, view, repository) {
        this.model = model;
        this.view = view;
        this.repository = repository;
        
        this.tile1 = null;
        this.tile2 = null;

        // Setup Controllers
        this.input = new InputController(this.view.canvas || document.getElementById('gameCanvas'), this.view.tileSize);
        this.input.onTileClick = this.onTileClick.bind(this);
        this.input.onSwipe = this.onSwipe.bind(this);
        this.input.onDragStart = this.onDragStart.bind(this);
        this.input.onDragEnd = this.onDragEnd.bind(this);

        this.gameLoop = new GameLoop(this.update.bind(this), this.render.bind(this));
    }
    
    activateBooster(type) {
        if (!this.gameState || this.model.currentState !== STATE.IDLE) return;
        if (window.audioManager) window.audioManager.play('click');
        
        if (type === 'shuffle' && this.gameState.boosters.shuffle > 0) {
            this.model.useShuffle(this.gameState);
            this.gameState.consumeBooster('shuffle');
            this.model.currentState = STATE.MATCHING; // Falling or matching to resolve incidental matches
            this.view.updateHUD(this.gameState);
            return;
        }

        this.gameState.toggleBooster(type);
        this.view.updateHUD(this.gameState); // To update UI visuals
    }

    onDragStart(c, r) {
        if (this.model.currentState !== STATE.IDLE) return;
        
        // Check if booster is active
        if (this.gameState && this.gameState.activeBooster) {
            if (this.gameState.activeBooster === 'hammer') {
                this.model.useHammer(c, r, this.gameState);
                this.gameState.consumeBooster('hammer');
                this.model.currentState = STATE.MATCHING;
            } else if (this.gameState.activeBooster === 'bomb') {
                this.model.useBomb(c, r, this.gameState);
                this.gameState.consumeBooster('bomb');
                this.model.currentState = STATE.MATCHING;
            }
            this.view.updateHUD(this.gameState);
            
            // Abort drag
            this.input.isDragging = false;
            return;
        }

        this.input.selectedTile = this.model.grid[c][r];
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
                    if (window.audioManager) window.audioManager.play('swap');
                    this.gameState.consumeMove();
                    this.view.updateHUD(this.gameState);
                }
            } else {
                if (window.audioManager) window.audioManager.play('click');
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
                let t = this.model.grid[c][r];
                if (t) {
                    t.update(dt);
                    let dist = Math.hypot(t.targetX - t.pixelX, t.targetY - t.pixelY);
                    if (dist > 1 || (t.scale < 1 && !t.matched)) isMoving = true;
                    if (t.matched && t.scale > 0) isMoving = true;
                }
            }
        }

        if (this.gameState && this.gameState.currentScreen === 'screen-game' && this.gameState.levelData.gameMode === 'time' && this.model.currentState !== STATE.WIN_ANIMATION && this.gameState.session.timeRemaining > 0) {
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
                
                if (this.tile1.type === '🌈' && this.tile2 && this.tile2.type !== '🌈') {
                    isRainbowSwap = true;
                    rainbowTile = this.tile1;
                    targetType = this.tile2.type;
                } else if (this.tile2 && this.tile2.type === '🌈' && this.tile1.type !== '🌈') {
                    isRainbowSwap = true;
                    rainbowTile = this.tile2;
                    targetType = this.tile1.type;
                }
                
                let matches = this.model.findMatches();
                
                if (isRainbowSwap) {
                    rainbowTile.targetType = targetType;
                    rainbowTile.special = 'rainbow-blast';
                    matches.push({
                        tiles: [rainbowTile],
                        shape: 'normal',
                        centerTile: null
                    });
                }
                
                if (matches.length > 0) {
                    this.model.removeMatches(matches, this.gameState, this.comboMultiplier);
                    this.triggerComboAnimation(matches);
                    this.comboMultiplier++;
                    this.model.currentState = STATE.MATCHING;
                    if (this.gameState) {
                        if (window.audioManager) window.audioManager.play('bomb');
                        this.view.updateHUD(this.gameState);
                    }
                    this.checkHighScore();
                } else {
                    this.model.swapTiles(this.tile1, this.tile2);
                    this.model.currentState = STATE.REVERTING;
                }
            } else if (this.model.currentState === STATE.REVERTING) {
                this.model.currentState = STATE.IDLE;
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
                        if (window.audioManager) window.audioManager.play('bark');
                        this.view.updateHUD(this.gameState);
                    }
                    this.checkHighScore();
                } else {
                    this.model.moveCats();
                    let postCatMatches = this.model.findMatches();
                    if (postCatMatches.length > 0) {
                        this.model.removeMatches(postCatMatches, this.gameState, this.comboMultiplier);
                        this.model.currentState = STATE.MATCHING;
                        if (this.gameState) this.view.updateHUD(this.gameState);
                    } else {
                        this.model.currentState = STATE.IDLE;
                    }
                }
            } else if (this.model.currentState === STATE.IDLE) {
                if (this.gameState && this.gameState.currentScreen === 'screen-game') {
                    if (this.isWinConditionMet()) {
                        let bonusCount = 0;
                        if (this.gameState.levelData.gameMode === 'time') {
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
                                if (this.model.grid[rC][rR]) {
                                    targets.push(this.model.grid[rC][rR]);
                                }
                            }
                            
                            if (targets.length > 0) {
                                // Add big bonus score
                                this.gameState.session.currentScore += bonusCount * 1000;
                                
                                // Spawn laser and destroy rows/cols
                                targets.forEach(t => {
                                    const orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
                                    const colors = ['#ffeb3b', '#ff7eb3', '#52e3ff', '#a4ff52'];
                                    const color = colors[Math.floor(Math.random() * colors.length)];
                                    
                                    if (window.particleSystem) {
                                        const centerX = t.c * this.model.tileSize + this.model.tileSize / 2;
                                        const centerY = t.r * this.model.tileSize + this.model.tileSize / 2;
                                        window.particleSystem.spawnLaser(centerX, centerY, orientation, color);
                                        window.particleSystem.spawnExplosion(centerX, centerY, color, 15);
                                        window.particleSystem.spawnText(centerX, centerY, 'SUGAR CRUSH!');
                                    }
                                    
                                    // Destroy all tiles in that line
                                    if (orientation === 'horizontal') {
                                        for (let c = 0; c < COLS; c++) {
                                            if (this.model.grid[c][t.r]) this.model.grid[c][t.r].matched = true;
                                        }
                                    } else {
                                        for (let r = 0; r < ROWS; r++) {
                                            if (this.model.grid[t.c][r]) this.model.grid[t.c][r].matched = true;
                                        }
                                    }
                                });
                                
                                if (window.audioManager) {
                                    window.audioManager.play('bomb');
                                    window.audioManager.play('bark');
                                }
                                
                                this.model.currentState = STATE.MATCHING; // Let gravity handle the rest
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
            } else if (this.model.currentState === STATE.WIN_ANIMATION) {
                // This state is now bypassed instantly into MATCHING above
            }
        }
    }

    triggerComboAnimation(matches) {
        let textToShow = "";
        
        if (matches && matches.length > 0) {
            let maxLen = Math.max(...matches.map(m => m.tiles.length));
            if (maxLen >= 5) {
                textToShow = "PAW-SOME!";
            } else if (maxLen === 4) {
                textToShow = "GOOD BOY!";
            }
        }
        
        if (this.comboMultiplier === 2 && !textToShow) textToShow = "WOW!";
        if (this.comboMultiplier >= 3 && !textToShow) textToShow = "FANTASTIC!";
        
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
                    window.audioManager.play('bark');
                }
            }
        }
    }

    checkHighScore() {
        if (!this.gameState) return;
        let highScore = this.repository.loadScore();
        if(this.gameState.session.currentScore > highScore) {
            this.repository.saveScore(this.gameState.session.currentScore);
        }
    }

    isWinConditionMet() {
        if (!this.gameState || !this.gameState.levelData || !this.gameState.levelData.objectives) return false;
        
        for (let type in this.gameState.levelData.objectives) {
            const target = this.gameState.levelData.objectives[type];
            const collected = this.gameState.session.collectedItems[type] || 0;
            if (collected < target) {
                return false; // Not all objectives met
            }
        }
        return true;
    }

    checkGameOver() {
        if (this.isGameOverChecked) return;
        this.isGameOverChecked = true;

        const isWin = this.isWinConditionMet();
        const title = isWin ? "Level Complete!" : "Game Over!";
        
        let msg = "Out of moves!";
        if (this.gameState.levelData.gameMode === 'time') {
            msg = isWin ? "Awesome! You completed the level!" : "Time's up!";
        } else {
            msg = isWin ? "Awesome! You completed the level!" : "Out of moves!";
        }
        
        let coinReward = 0;
        const rewardEl = document.getElementById('game-over-reward');
        const coinsEl = document.getElementById('game-over-coins');

        if (isWin) {
            // Reward coins based on remaining moves or time + base reward
            let bonusAmount = this.gameState.levelData.gameMode === 'time' ? 
                              Math.floor(this.gameState.session.timeRemaining) : 
                              this.gameState.session.movesLeft;
                              
            coinReward = 50 + (bonusAmount * 10);
            this.repository.addCoins(coinReward);
            
            // Unlock next level
            this.repository.unlockLevel(this.gameState.levelData.currentLevel + 1);
            
            // Show reward in UI
            if (rewardEl) rewardEl.style.display = 'block';
            if (coinsEl) coinsEl.innerText = `+${coinReward}`;
        } else {
            if (rewardEl) rewardEl.style.display = 'none';
        }

        document.getElementById('game-over-title').innerText = title;
        document.getElementById('game-over-msg').innerText = msg;
        document.getElementById('game-over-overlay').style.display = 'flex';
        
        if (isWin && window.particleSystem) {
            window.particleSystem.spawnExplosion(window.innerWidth / 2, window.innerHeight / 2, '🎉');
        }
        
        if (window.audioManager) window.audioManager.play('click');
        
        // Define what happens when user clicks OK
        window.closeGameOver = () => {
            if (window.audioManager) window.audioManager.play('click');
            document.getElementById('game-over-overlay').style.display = 'none';
            if (rewardEl) rewardEl.style.display = 'none';
            
            this.isGameOverChecked = false;
            
            // Go back to level select screen
            this.gameState.switchScreen('screen-levels');
            
            // Re-render level buttons on home screen
            if (window.renderLevels) window.renderLevels();
            
            // Reset grid so it's fresh for next time
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
