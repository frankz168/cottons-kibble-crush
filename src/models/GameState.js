export const SCREENS = {
    HOME: 'screen-home',
    LEVELS: 'screen-levels',
    GAME: 'screen-game',
    LEADERBOARD: 'screen-leaderboard',
    SHOP: 'screen-shop',
    SETTINGS: 'screen-settings'
};

export class GameState {
    constructor() {
        // 1. Screen Routing State
        this.currentScreen = SCREENS.HOME;

        // 2. Level Data (Static level configuration)
        this.levelData = {
            currentLevel: 28,
            targetScore: 15000,
            maxMoves: 18,
            objectives: {
                '🦴': 30, // Need 30 bones
                '🍪': 20  // Need 20 biscuits
            }
        };

        // 3. Current Session (Reactive during gameplay)
        this.session = {
            currentScore: 0,
            movesLeft: 18,
            collectedItems: {
                '🦴': 0,
                '🍪': 0
            }
        };
        
        // 4. Boosters State
        this.activeBooster = null;
        this.boosters = {
            hammer: 2,
            bomb: 5,
            shuffle: 1
        };
        
        // Optional callback if UI needs to react when state changes
        this.onScreenChange = null;
    }

    /**
     * Function to change active screen by manipulating DOM display
     * @param {string} screenName - Use SCREENS enumerator
     */
    switchScreen(screenName) {
        if (!Object.values(SCREENS).includes(screenName)) {
            console.error(`[Router] Screen ${screenName} is invalid!`);
            return;
        }
        
        this.currentScreen = screenName;
        
        // Manipulate DOM to hide/show containers
        const allScreens = document.querySelectorAll('.game-screen');
        allScreens.forEach(screen => {
            if (screen.id === this.currentScreen) {
                // Show active screen
                screen.style.display = 'flex'; 
            } else {
                // Hide other screens
                screen.style.display = 'none';
            }
        });

        // Trigger callback if other Controllers need to know about screen changes
        if (this.onScreenChange) this.onScreenChange(this.currentScreen);

        if (window.audioManager) {
            window.audioManager.play('click');
            window.audioManager.play('bgm');
        }
    }
    
    // --- Helper Methods for State Modification ---

    startLevel(levelNumber, config) {
        this.levelData.currentLevel = levelNumber;
        this.levelData = { ...this.levelData, ...config };
        
        // Reset session to start
        this.session.currentScore = 0;
        this.session.movesLeft = this.levelData.maxMoves;
        this.session.timeRemaining = this.levelData.timeLimit || 0;
        
        // Dynamically initialize collected items based on objectives
        this.session.collectedItems = {};
        if (config && config.objectives) {
            for (let type in config.objectives) {
                this.session.collectedItems[type] = 0;
            }
        }
        
        this.activeBooster = null;
        
        this.switchScreen(SCREENS.GAME);
    }

    consumeMove() {
        if (this.levelData && this.levelData.gameMode === 'time') {
            return; // don't consume moves in time mode
        }
        if (this.session.movesLeft > 0) {
            this.session.movesLeft -= 1;
        }
    }

    toggleBooster(type) {
        // If already active, turn it off. If different, switch the active one.
        if (this.activeBooster === type) {
            this.activeBooster = null;
        } else if (this.boosters[type] > 0) {
            this.activeBooster = type;
        }
        
        // Notify UI to update if needed
        if (this.onScreenChange) this.onScreenChange('booster-toggled');
    }

    consumeBooster(type) {
        if (this.boosters[type] > 0) {
            this.boosters[type] -= 1;
        }
        this.activeBooster = null;
        if (this.onScreenChange) this.onScreenChange('booster-toggled');
    }
}
