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
    }

    updateHUD(gameState) {
        if (this.scoreEl) this.scoreEl.innerText = gameState.session.currentScore.toLocaleString();
        if (this.levelEl) this.levelEl.innerText = gameState.levelData.currentLevel;
        
        const movesLabel = document.getElementById('moves-label');
        if (gameState.levelData.gameMode === 'time') {
            if (movesLabel) movesLabel.innerText = "Time ⏳";
            const timeVal = Math.ceil(gameState.session.timeRemaining);
            if (this.movesEl) {
                this.movesEl.innerText = timeVal;
                if (timeVal <= 10) {
                    this.movesEl.style.color = 'red';
                    this.movesEl.style.animation = 'shake 0.5s infinite';
                } else {
                    this.movesEl.style.color = '';
                    this.movesEl.style.animation = '';
                }
            }
        } else {
            if (movesLabel) movesLabel.innerText = "Moves 👟";
            if (this.movesEl) {
                this.movesEl.innerText = gameState.session.movesLeft;
                this.movesEl.style.color = '';
                this.movesEl.style.animation = '';
            }
        }
        
        // Dynamically render objectives
        if (this.collectPanelEl) {
            let html = '<div class="collect-title">Collect</div>';
            for (let type in gameState.levelData.objectives) {
                const target = gameState.levelData.objectives[type];
                const collected = gameState.session.collectedItems[type] || 0;
                let textClass = 'collect-progress';
                if (`${collected}/${target}`.length > 5) {
                    textClass += ' small-text';
                }
                html += `
                    <div class="collect-item">
                        <div class="collect-icon">${type}</div>
                        <div class="${textClass}">${collected}/${target}</div>
                    </div>
                `;
            }
            this.collectPanelEl.innerHTML = html;
        }
        
        if (this.scoreEl) {
            this.scoreEl.style.transform = 'scale(1.3)';
            setTimeout(() => {
                this.scoreEl.style.transform = 'scale(1)';
                this.scoreEl.style.transition = 'transform 0.2s';
            }, 100);
        }

        // Update Booster UI
        if (gameState.boosters) {
            if (this.badgeHammer) this.badgeHammer.innerText = gameState.boosters.hammer || 0;
            if (this.badgeBomb) this.badgeBomb.innerText = gameState.boosters.bomb || 0;
            if (this.badgeShuffle) this.badgeShuffle.innerText = gameState.boosters.shuffle || 0;
        }

        // Highlight active booster
        if (this.btnHammer) this.btnHammer.style.border = gameState.activeBooster === 'hammer' ? '3px solid #ffeb3b' : '2px solid rgba(255,255,255,0.3)';
        if (this.btnBomb) this.btnBomb.style.border = gameState.activeBooster === 'bomb' ? '3px solid #ffeb3b' : '2px solid rgba(255,255,255,0.3)';
    }
}
