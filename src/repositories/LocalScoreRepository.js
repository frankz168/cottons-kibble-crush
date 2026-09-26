import { IGameRepository } from '../interfaces/IGameRepository.js';

export class LocalScoreRepository extends IGameRepository {
    saveScore(score) {
        localStorage.setItem('cottons_kibble_crush_highscore', score);
    }

    loadScore() {
        return parseInt(localStorage.getItem('cottons_kibble_crush_highscore') || '0');
    }

    getUnlockedLevel() {
        return parseInt(localStorage.getItem('cottons_kibble_crush_unlocked_level') || '1');
    }

    unlockLevel(level) {
        let current = this.getUnlockedLevel();
        if (level > current) {
            localStorage.setItem('cottons_kibble_crush_unlocked_level', level);
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
        
        // Sort descending
        allPlayers.sort((a, b) => b.score - a.score);
        
        return allPlayers;
    }

    // --- Currencies & Shop ---
    getCoins() {
        return parseInt(localStorage.getItem('cottons_kibble_crush_coins') || '500'); // Start with 500 coins!
    }

    addCoins(amount) {
        let current = this.getCoins();
        localStorage.setItem('cottons_kibble_crush_coins', current + amount);
    }

    spendCoins(amount) {
        let current = this.getCoins();
        if (current >= amount) {
            localStorage.setItem('cottons_kibble_crush_coins', current - amount);
            return true;
        }
        return false;
    }

    getBoosters() {
        let defaultBoosters = { hammer: 2, bomb: 2, shuffle: 2 };
        try {
            let saved = localStorage.getItem('cottons_kibble_crush_boosters');
            if (saved) return JSON.parse(saved);
        } catch(e) {}
        return defaultBoosters;
    }

    saveBoosters(boosters) {
        localStorage.setItem('cottons_kibble_crush_boosters', JSON.stringify(boosters));
    }

    // --- Daily Rewards ---
    checkDailyReward() {
        const lastLogin = localStorage.getItem('cottons_kibble_crush_last_login');
        const today = new Date().toDateString();
        return lastLogin !== today;
    }

    claimDailyReward() {
        const today = new Date().toDateString();
        localStorage.setItem('cottons_kibble_crush_last_login', today);
        
        // Give 100 coins and 1 Hammer
        this.addCoins(100);
        let boosters = this.getBoosters();
        boosters.hammer = (boosters.hammer || 0) + 1;
        this.saveBoosters(boosters);
    }
}
