import { SCREEN, TILE_TYPE, BOOSTER_TYPE, GAME_MODE, SOUND_EFFECT } from '../constants.js';

export const SCREENS = SCREEN;

export class GameState {
    constructor() {
        // 1. Screen Routing State
        this.currentScreen = SCREEN.HOME;

        // 2. Level Data (Static level configuration)
        this.levelData = {
            currentLevel: 1,
            targetScore: 1000,
            maxMoves: 15,
            gameMode: GAME_MODE.MOVES,
            timeLimit: 0,
            frozenCount: 0,
            catCount: 0,
            objectives: {
                [TILE_TYPE.BONE]: 10,
                [TILE_TYPE.COOKIE]: 10
            }
        };

        // 3. Current Session (Reactive during gameplay)
        this.session = {
            currentScore: 0,
            movesLeft: 15,
            timeRemaining: 0,
            collectedItems: {
                [TILE_TYPE.BONE]: 0,
                [TILE_TYPE.COOKIE]: 0
            }
        };
        
        // 4. Boosters State
        this.activeBooster = null;
        this.boosters = {
            [BOOSTER_TYPE.HAMMER]: 2,
            [BOOSTER_TYPE.BOMB]: 5,
            [BOOSTER_TYPE.SHUFFLE]: 1
        };
        
        // Optional callback if UI needs to react when state changes
        this.onScreenChange = null;
    }

    /**
     * Function to change active screen by manipulating DOM display
     * @param {string} screenName - Use SCREEN enumerator
     */
    switchScreen(screenName) {
        if (!Object.values(SCREEN).includes(screenName)) {
            console.error(`[Router] Screen ${screenName} is invalid!`);
            return;
        }
        
        this.currentScreen = screenName;
        
        // Manipulate DOM to hide/show containers
        if (typeof document !== 'undefined') {
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
        }

        // Trigger callback if other Controllers need to know about screen changes
        if (this.onScreenChange) this.onScreenChange(this.currentScreen);

        if (window.audioManager) {
            window.audioManager.play(SOUND_EFFECT.CLICK);
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
        this.switchScreen(SCREEN.GAME);
    }

    consumeMove() {
        if (this.levelData && this.levelData.gameMode === GAME_MODE.TIME) {
            return; // don't consume moves in time mode
        }
        if (this.session.movesLeft > 0) {
            this.session.movesLeft -= 1;
        }
    }

    toggleBooster(type) {
        if (this.activeBooster === type) {
            this.activeBooster = null;
        } else if (this.boosters[type] > 0) {
            this.activeBooster = type;
        }
        
        if (this.onScreenChange) this.onScreenChange('booster-toggled');
    }

    consumeBooster(type) {
        if (this.boosters[type] > 0) {
            this.boosters[type] -= 1;
        }
        this.activeBooster = null;
        if (this.onScreenChange) this.onScreenChange('booster-toggled');
    }

    serializeSession() {
        return {
            levelData: this.levelData,
            session: this.session,
            boosters: this.boosters,
            currentScreen: this.currentScreen
        };
    }

    restoreSession(saved) {
        if (!saved || !saved.levelData || !saved.session) return false;
        this.levelData = saved.levelData;
        this.session = saved.session;
        if (saved.boosters) this.boosters = saved.boosters;
        return true;
    }
}
