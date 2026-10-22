import { TILE_TYPE, BOOSTER_TYPE, GAME_MODE } from '../constants.js';

export class HUDView {
    constructor() {
        // HUD Elements
        this.scoreEl = document.getElementById('score');
        this.levelEl = document.getElementById('level-display');
        this.movesEl = document.getElementById('moves-display');
        this.collectPanelEl = document.getElementById('collect-panel');
        
        // Boosters UI
        this.btnHammer = document.getElementById('btn-hammer');
        this.btnBomb = document.getElementById('btn-bomb');
        this.btnShuffle = document.getElementById('btn-shuffle');
        this.badgeHammer = document.getElementById('badge-hammer');
        this.badgeBomb = document.getElementById('badge-bomb');
        this.badgeShuffle = document.getElementById('badge-shuffle');

        // State cache to prevent redundant DOM manipulation
        this.cachedScore = -1;
        this.cachedLevel = -1;
        this.cachedMoves = -1;
        this.cachedObjectivesKey = '';
        this.cachedBoosterState = '';
    }

    updateHUD(gameState) {
        if (!gameState) return;

        // 1. Update score only when changed
        const currentScore = gameState.session.currentScore;
        if (this.scoreEl && currentScore !== this.cachedScore) {
            this.cachedScore = currentScore;
            this.scoreEl.innerText = currentScore.toLocaleString();
        }

        // 2. Update level display only when changed
        const currentLevel = gameState.levelData.currentLevel;
        if (this.levelEl && currentLevel !== this.cachedLevel) {
            this.cachedLevel = currentLevel;
            this.levelEl.innerText = currentLevel;
        }
        
        // 3. Update moves/time display only when changed
        const movesLabel = document.getElementById('moves-label');
        if (gameState.levelData.gameMode === GAME_MODE.TIME) {
            if (movesLabel && movesLabel.innerText !== "Time ⏳") movesLabel.innerText = "Time ⏳";
            const timeVal = Math.ceil(gameState.session.timeRemaining);
            if (this.movesEl && timeVal !== this.cachedMoves) {
                this.cachedMoves = timeVal;
                this.movesEl.innerText = timeVal;
                if (timeVal <= 10) {
                    this.movesEl.style.color = 'red';
                } else {
                    this.movesEl.style.color = '';
                }
            }
        } else {
            if (movesLabel && movesLabel.innerText !== "Moves 👟") movesLabel.innerText = "Moves 👟";
            const movesVal = gameState.session.movesLeft;
            if (this.movesEl && movesVal !== this.cachedMoves) {
                this.cachedMoves = movesVal;
                this.movesEl.innerText = movesVal;
                this.movesEl.style.color = '';
            }
        }
        
        // 4. Update objectives only when values actually change
        if (this.collectPanelEl && gameState.levelData.objectives) {
            const objKey = Object.entries(gameState.levelData.objectives)
                .map(([type, target]) => `${type}:${gameState.session.collectedItems[type] || 0}/${target}`)
                .join('|');
            
            if (objKey !== this.cachedObjectivesKey) {
                this.cachedObjectivesKey = objKey;
                
                const iconMap = {
                    [TILE_TYPE.TENNIS]: 'tennis',
                    [TILE_TYPE.MEAT]: 'meat',
                    [TILE_TYPE.BONE]: 'bone',
                    [TILE_TYPE.PAW]: 'paw',
                    [TILE_TYPE.DRUMSTICK]: 'drumstick',
                    [TILE_TYPE.CHEESE]: 'cheese',
                    [TILE_TYPE.SHOE]: 'shoe',
                    [TILE_TYPE.YARN]: 'yarn',
                    [TILE_TYPE.COOKIE]: 'cookie'
                };
                
                let html = '';
                for (let type in gameState.levelData.objectives) {
                    const target = gameState.levelData.objectives[type];
                    const collected = gameState.session.collectedItems[type] || 0;
                    let textClass = 'collect-progress';
                    if (`${collected}/${target}`.length > 5) {
                        textClass += ' small-text';
                    }
                    
                    let iconHtml = `<div class="collect-icon-horiz">${type}</div>`;
                    if (iconMap[type]) {
                        iconHtml = `<div class="collect-icon-horiz"><img src="assets/images/icons/icon_${iconMap[type]}.png" alt="${iconMap[type]}" style="width: 100%; height: 100%; object-fit: contain;"></div>`;
                    }

                    html += `
                        <div class="collect-item-horiz">
                            ${iconHtml}
                            <div class="${textClass}" style="color: #5a3a29; font-size: 1.1rem; font-weight: 900; margin-left: -2px;">${collected}/${target}</div>
                        </div>
                    `;
                }
                this.collectPanelEl.innerHTML = html;
            }
        }

        // 5. Update Booster UI only when changed
        const boosterKey = `${gameState.activeBooster}_${gameState.boosters[BOOSTER_TYPE.HAMMER]}_${gameState.boosters[BOOSTER_TYPE.BOMB]}_${gameState.boosters[BOOSTER_TYPE.SHUFFLE]}`;
        if (boosterKey !== this.cachedBoosterState) {
            this.cachedBoosterState = boosterKey;

            if (this.badgeHammer) this.badgeHammer.innerText = gameState.boosters[BOOSTER_TYPE.HAMMER] || 0;
            if (this.badgeBomb) this.badgeBomb.innerText = gameState.boosters[BOOSTER_TYPE.BOMB] || 0;
            if (this.badgeShuffle) this.badgeShuffle.innerText = gameState.boosters[BOOSTER_TYPE.SHUFFLE] || 0;

            if (this.btnHammer) {
                this.btnHammer.style.border = gameState.activeBooster === BOOSTER_TYPE.HAMMER ? '3px solid #ffeb3b' : '2px solid rgba(255,255,255,0.3)';
            }
            if (this.btnBomb) {
                this.btnBomb.style.border = gameState.activeBooster === BOOSTER_TYPE.BOMB ? '3px solid #ffeb3b' : '2px solid rgba(255,255,255,0.3)';
            }
        }
    }
}
