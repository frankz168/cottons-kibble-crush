import { IGameRepository } from '../interfaces/IGameRepository.js';
import { STORAGE_KEY, BOOSTER_TYPE } from '../constants.js';

export class LocalScoreRepository extends IGameRepository {
    saveScore(score) {
        localStorage.setItem(STORAGE_KEY.HIGH_SCORE, score);
    }

    loadScore() {
        return parseInt(localStorage.getItem(STORAGE_KEY.HIGH_SCORE) || '0');
    }

    getUnlockedLevel() {
        return parseInt(localStorage.getItem(STORAGE_KEY.UNLOCKED_LEVEL) || '1');
    }

    unlockLevel(level) {
        let current = this.getUnlockedLevel();
        if (level > current) {
            localStorage.setItem(STORAGE_KEY.UNLOCKED_LEVEL, level);
        }
    }

    getLeaderboard() {
        const playerScore = this.loadScore();
        let bots = [
            { name: "CottonMaster", score: 99999 },
            { name: "BoneCrusher", score: 85200 },
            { name: "FluffyBoi", score: 74150 },
            { name: "Doggo99", score: 62000 },
            { name: "PawPatrol", score: 58900 },
            { name: "BarkingMad", score: 45000 },
            { name: "GoodBoy12", score: 32000 }
        ];
        
        let allPlayers = [...bots];
        if (playerScore > 0) {
            allPlayers.push({ name: "YOU", score: playerScore, isPlayer: true });
        }
        
        allPlayers.sort((a, b) => b.score - a.score);
        return allPlayers;
    }

    // --- Currencies & Shop ---
    getCoins() {
        return parseInt(localStorage.getItem(STORAGE_KEY.COINS) || '500');
    }

    addCoins(amount) {
        let current = this.getCoins();
        localStorage.setItem(STORAGE_KEY.COINS, current + amount);
    }

    spendCoins(amount) {
        let current = this.getCoins();
        if (current >= amount) {
            localStorage.setItem(STORAGE_KEY.COINS, current - amount);
            return true;
        }
        return false;
    }

    getBoosters() {
        let defaultBoosters = {
            [BOOSTER_TYPE.HAMMER]: 2,
            [BOOSTER_TYPE.BOMB]: 2,
            [BOOSTER_TYPE.SHUFFLE]: 2
        };
        try {
            let saved = localStorage.getItem(STORAGE_KEY.BOOSTERS);
            if (saved) return JSON.parse(saved);
        } catch(e) {}
        return defaultBoosters;
    }

    saveBoosters(boosters) {
        localStorage.setItem(STORAGE_KEY.BOOSTERS, JSON.stringify(boosters));
    }

    // --- Daily Rewards ---
    checkDailyReward() {
        const lastLogin = localStorage.getItem(STORAGE_KEY.LAST_LOGIN);
        const today = new Date().toDateString();
        return lastLogin !== today;
    }

    claimDailyReward() {
        const today = new Date().toDateString();
        localStorage.setItem(STORAGE_KEY.LAST_LOGIN, today);
        
        this.addCoins(100);
        let boosters = this.getBoosters();
        boosters[BOOSTER_TYPE.HAMMER] = (boosters[BOOSTER_TYPE.HAMMER] || 0) + 1;
        this.saveBoosters(boosters);
    }

    // --- Mid-Level Session Persistence ---
    saveActiveSession(sessionData) {
        try {
            localStorage.setItem(STORAGE_KEY.ACTIVE_SESSION, JSON.stringify(sessionData));
        } catch (e) {
            console.warn('Failed to save active session', e);
        }
    }

    loadActiveSession() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY.ACTIVE_SESSION);
            if (raw) return JSON.parse(raw);
        } catch (e) {
            console.warn('Failed to parse active session', e);
        }
        return null;
    }

    clearActiveSession() {
        localStorage.removeItem(STORAGE_KEY.ACTIVE_SESSION);
    }
}
