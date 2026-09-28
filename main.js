import { GameModel } from './src/models/GameModel.js';
import { GameView } from './src/views/GameView.js';
import { GameController } from './src/controllers/GameController.js';
import { LocalScoreRepository } from './src/repositories/LocalScoreRepository.js';
import { GameState } from './src/models/GameState.js';
import { AudioManager } from './src/utils/AudioManager.js';
import { ParticleSystem } from './src/utils/ParticleSystem.js';

// Setup audio manager
const audioManager = new AudioManager();
window.audioManager = audioManager;

window.toggleMute = function() {
    const isMuted = audioManager.toggleMute();
    document.getElementById('mute-btn').innerText = isMuted ? '🔇' : '🔊';
};

// Setup router state and expose to window for inline HTML onclick events
const gameState = new GameState();
window.gameState = gameState;

// Preload Custom Icon Images
window.iconImages = {
    tennis: new Image(),
    meat: new Image(),
    bone: new Image(),
    paw: new Image(),
    drumstick: new Image(),
    cheese: new Image(),
    shoe: new Image(),
    yarn: new Image(),
    cookie: new Image()
};
window.iconImages.tennis.src = 'assets/images/icon_tennis.png';
window.iconImages.meat.src = 'assets/images/icon_meat.png';
window.iconImages.bone.src = 'assets/images/icon_bone.png';
window.iconImages.paw.src = 'assets/images/icon_paw.png';
window.iconImages.drumstick.src = 'assets/images/icon_drumstick.png';
window.iconImages.cheese.src = 'assets/images/icon_cheese.png';
window.iconImages.shoe.src = 'assets/images/icon_shoe.png';
window.iconImages.yarn.src = 'assets/images/icon_yarn.png';
window.iconImages.cookie.src = 'assets/images/icon_cookie.png';

document.addEventListener('DOMContentLoaded', () => {
    const view = new GameView('gameCanvas', 'score');
    const model = new GameModel(view.tileSize);
    const repository = new LocalScoreRepository();
    window.repository = repository;
    const controller = new GameController(model, view, repository);

    // Provide game state to controller so it can interact with scores and objectives
    controller.gameState = gameState;
    
    const fx = new ParticleSystem('fxCanvas');
    window.particleSystem = fx;
    controller.particleSystem = fx;
    
    window.toggleBooster = function(type) {
        controller.activateBooster(type);
    };

    // Handle Daily Reward on boot
    if (repository.checkDailyReward()) {
        const rewardOverlay = document.getElementById('daily-reward-overlay');
        if (rewardOverlay) rewardOverlay.style.display = 'flex';
    }
    
    window.claimDailyReward = function() {
        repository.claimDailyReward();
        document.getElementById('daily-reward-overlay').style.display = 'none';
        if (window.audioManager) window.audioManager.play('click');
        if (window.particleSystem) {
            window.particleSystem.spawnExplosion(window.innerWidth / 2, window.innerHeight / 2, '🎉');
        }
    };

    window.startLevel = function(levelNumber, config) {
        gameState.startLevel(levelNumber, config);
        
        // Pass the types to the GameModel so it spawns the correct ones
        // Usually Match-3 games have 5-6 types on board, so we use objectives + fillers
        let availableTypes = Object.keys(config.objectives);
        let allTypes = ['🦴', '🍪', '🥩', '🎾', '🍗', '🧀', '👟', '🧶'];
        let fillerIdx = 0;
        // Target 5 types for Level 1-4, 6 types for Level 5-14, 7 types for Level 15+
        let targetBoardTypes = 5;
        if (levelNumber >= 5) targetBoardTypes = 6;
        if (levelNumber >= 15) targetBoardTypes = 7;
        
        while (availableTypes.length < targetBoardTypes && fillerIdx < allTypes.length) {
            if (!availableTypes.includes(allTypes[fillerIdx])) {
                availableTypes.push(allTypes[fillerIdx]);
            }
            fillerIdx++;
        }
        
        controller.model.initGrid(availableTypes, config.frozenCount || 0, config.catCount || 0);
        controller.view.updateHUD(gameState);
        
        // Randomly pick a game BGM
        const bgmName = Math.random() > 0.5 ? 'game1' : 'game2';
        audioManager.playBGM(bgmName);
    };

    window.renderLevels = function() {
        const grid = document.querySelector('.level-grid') || document.querySelector('.level-path');
        if (!grid) return;
        
        grid.className = 'level-path'; // ensure it's a path
        
        const unlocked = repository.getUnlockedLevel();
        const maxLevels = 50;
        const levelHeight = 100;
        
        grid.style.position = 'relative';
        grid.style.height = `${maxLevels * levelHeight + 100}px`;
        grid.style.width = '100%';
        grid.style.display = 'block'; // override flex
        grid.style.flexShrink = '0';
        
        // Zone 1: Grass (Level 1-20), Zone 2: Snow (Level 21-40), Zone 3: Volcano/Space (Level 41-50)
        let zone1Height = 20 * levelHeight + 100;
        let zone2Height = 40 * levelHeight + 100;
        grid.style.background = `linear-gradient(to top, 
            rgba(101, 193, 73, 0.8) 0px, 
            rgba(101, 193, 73, 0.8) ${zone1Height}px, 
            rgba(174, 226, 255, 0.9) ${zone1Height}px, 
            rgba(174, 226, 255, 0.9) ${zone2Height}px, 
            rgba(156, 63, 31, 0.9) ${zone2Height}px, 
            rgba(156, 63, 31, 0.9) 100%
        )`;
        grid.style.borderRadius = '20px';
        grid.style.boxShadow = 'inset 0 0 20px rgba(0,0,0,0.2)';
        
        let html = '';
        let latestX = 0;
        let latestY = 0;
        
        for (let i = 1; i <= maxLevels; i++) {
            // S-curve offset
            let offsetX = Math.sin(i * 0.8) * 100; 
            let bottomY = (i * levelHeight) + 50;
            
            let posStyle = `position: absolute; bottom: ${bottomY}px; left: calc(50% + ${offsetX}px); transform: translateX(-50%);`;
            
            let zoneClass = 'zone-green';
            if (i > 5 && i <= 10) zoneClass = 'zone-blue';
            else if (i > 10 && i <= 15) zoneClass = 'zone-purple';
            else if (i > 15 && i <= 20) zoneClass = 'zone-pink';
            else if (i > 20) zoneClass = 'zone-brown';
            
            if (i === unlocked) {
                latestX = offsetX;
                latestY = bottomY;
                let config = window.generateLevelConfig(i);
                html += `<button class="level-btn unlocked current ${zoneClass}" style="${posStyle}" onclick="window.startLevel(${i}, ${config})">${i}</button>`;
            } else if (i < unlocked) {
                let config = window.generateLevelConfig(i);
                html += `<button class="level-btn unlocked ${zoneClass}" style="${posStyle}" onclick="window.startLevel(${i}, ${config})">${i}</button>`;
            } else {
                html += `<button class="level-btn locked" style="${posStyle}">🔒</button>`;
            }
        }
        
        // Add Cotton Avatar at unlocked level
        if (unlocked <= maxLevels) {
            html += `<div id="map-avatar" style="position: absolute; bottom: ${latestY + 45}px; left: calc(50% + ${latestX}px); transform: translateX(-50%); width: 60px; height: 60px; background-image: url('assets/images/dog_new.jpg'); background-position: center; background-size: cover; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.5); z-index: 10; animation: bounce 1s infinite alternate;"></div>`;
        }
        
        grid.innerHTML = html;
        
        // Scroll to the latest unlocked level automatically
        setTimeout(() => {
            const avatar = document.getElementById('map-avatar');
            if (avatar) {
                avatar.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };
    
    window.generateLevelConfig = function(level) {
        // Base values
        let baseMoves = 15;
        let baseTargetPerObj = 10;
        
        // Pseudo-random generator for consistent level objectives
        let seed = level * 12345;
        let random = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
        
        let allItems = ['🦴', '🍪', '🥩', '🎾', '🍗', '🧀', '👟', '🧶'];
        let shuffledItems = [...allItems].sort(() => random() - 0.5);
        
        // Increase difficulty based on level
        let moves = baseMoves + Math.floor(level * 0.8); // +4 moves every 5 levels
        let targetScore = 1000 + (level * 300);
        
        let objectives = {};
        let objCount = baseTargetPerObj + Math.floor(level * 1.5);
        
        let numObjectives = 2;
        if (level >= 5) {
            numObjectives = 3;
            moves += 2; // Bonus moves for 3rd objective
        }
        if (level >= 15) {
            numObjectives = 4;
            moves += 3; // Bonus moves for 4th objective
        }
        
        for (let i = 0; i < numObjectives; i++) {
            let targetCount = objCount;
            if (i === 2) targetCount = objCount - 5;
            if (i === 3) targetCount = objCount - 10;
            objectives[shuffledItems[i]] = targetCount;
        }
        
        let frozenCount = 0;
        let catCount = 0;
        let gameMode = 'moves';
        let timeLimit = 0;
        
        if (level % 5 === 0) {
            gameMode = 'time';
            timeLimit = 290 + Math.floor(level * 2); // Base 290s (Level 5 will be exactly 300s)
        } else {
            if (level >= 20) {
                frozenCount = 3 + Math.floor((level - 20) / 2); // Scales up every 2 levels
                if (level >= 22) catCount = 1;
                if (level >= 35) catCount = 2;
            }
        }
        
        // Ensure valid string representation for inline HTML
        return `{targetScore: ${targetScore}, maxMoves: ${moves}, objectives: ${JSON.stringify(objectives).replace(/"/g, "'")}, frozenCount: ${frozenCount}, gameMode: '${gameMode}', timeLimit: ${timeLimit}, catCount: ${catCount}}`;
    };
    
    window.playHighestLevel = function() {
        const unlocked = repository.getUnlockedLevel();
        const configStr = window.generateLevelConfig(unlocked);
        // We need to parse it back from the stringified format used in HTML
        const configObj = eval('(' + configStr + ')');
        window.startLevel(unlocked, configObj);
    };

    window.renderLeaderboard = function() {
        const lbContainer = document.getElementById('leaderboard-list');
        if (!lbContainer) return;
        
        const lbData = repository.getLeaderboard();
        let html = '';
        
        lbData.forEach((player, index) => {
            let rankStr = (index + 1).toString();
            if (index === 0) rankStr = '🥇';
            if (index === 1) rankStr = '🥈';
            if (index === 2) rankStr = '🥉';
            
            const nameColor = player.isPlayer ? '#e91e63' : '#555';
            const bgHighlight = player.isPlayer ? 'background: rgba(255, 235, 59, 0.3); border: 2px solid #ffeb3b; border-radius: 12px; padding: 5px; box-shadow: inset 0 0 10px rgba(0,0,0,0.05);' : '';
            
            html += `
                <div class="lb-row" style="${bgHighlight}">
                    <div class="lb-rank">${rankStr}</div>
                    <div class="lb-name" style="color: ${nameColor}; ${player.isPlayer ? 'text-shadow: 1px 1px 0 #fff;' : ''}">${player.name}</div>
                    <div class="lb-score">${player.score.toLocaleString()}</div>
                </div>
            `;
        });
        
        lbContainer.innerHTML = html;
    };

    // --- SHOP LOGIC ---
    window.renderShop = function() {
        const coinsEl = document.getElementById('shop-coins');
        if (coinsEl) coinsEl.innerText = repository.getCoins();
        
        const boosters = repository.getBoosters();
        const hammerEl = document.getElementById('shop-owned-hammer');
        const bombEl = document.getElementById('shop-owned-bomb');
        const shuffleEl = document.getElementById('shop-owned-shuffle');
        
        if (hammerEl) hammerEl.innerText = boosters.hammer;
        if (bombEl) bombEl.innerText = boosters.bomb;
        if (shuffleEl) shuffleEl.innerText = boosters.shuffle;
    };
    
    window.buyBooster = function(type, price) {
        if (repository.spendCoins(price)) {
            let boosters = repository.getBoosters();
            if (!boosters[type]) boosters[type] = 0;
            boosters[type]++;
            repository.saveBoosters(boosters);
            window.renderShop();
            if (audioManager) audioManager.play('click');
            
            // Also update live GameState if active
            gameState.boosters = boosters;
            if (controller && controller.view) controller.view.updateHUD(gameState);
        } else {
            // Not enough coins
            window.showCustomAlert("Oops!", "Not enough coins! 😢");
        }
    };

    window.showCustomAlert = function(title, msg) {
        document.getElementById('custom-alert-title').innerText = title;
        document.getElementById('custom-alert-msg').innerText = msg;
        document.getElementById('custom-alert-overlay').style.display = 'flex';
        if (window.audioManager) window.audioManager.play('click');
    };

    // When screen changes, trigger updates
    gameState.onScreenChange = (screen) => {
        if (screen === 'screen-leaderboard') {
            window.renderLeaderboard();
        }
        
        if (screen === 'screen-levels') {
            window.renderLevels();
        }
        
        if (screen === 'screen-shop') {
            window.renderShop();
        }
        
        if (screen === 'screen-home' || screen === 'screen-levels' || screen === 'screen-shop') {
            audioManager.playBGM('home');
        }
    };

    // --- SETTINGS & LOCALIZATION ---
    const dict = {
        en: {
            settings_title: "SETTINGS",
            language: "Language",
            credits_btn: "Credits",
            reset_btn: "Reset Progress"
        },
        id: {
            settings_title: "PENGATURAN",
            language: "Bahasa",
            credits_btn: "Kredit",
            reset_btn: "Hapus Data"
        }
    };
    
    window.setLanguage = function(lang) {
        localStorage.setItem('cotton_lang', lang);
        
        // Update styling
        document.getElementById('lang-en').style.background = lang === 'en' ? '#5ef54c' : 'white';
        document.getElementById('lang-en').style.color = lang === 'en' ? 'white' : '#555';
        document.getElementById('lang-id').style.background = lang === 'id' ? '#5ef54c' : 'white';
        document.getElementById('lang-id').style.color = lang === 'id' ? 'white' : '#555';
        
        // Update UI text
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[lang][key]) el.innerText = dict[lang][key];
        });
    };
    
    window.toggleSetting = function(type, isEnabled) {
        if (type === 'bgm') {
            audioManager.setBgmEnabled(isEnabled);
            localStorage.setItem('cotton_bgm', isEnabled);
        } else if (type === 'sfx') {
            audioManager.setSfxEnabled(isEnabled);
            localStorage.setItem('cotton_sfx', isEnabled);
        }
    };
    
    window.showCustomConfirm = function(title, msg, onYes) {
        document.getElementById('custom-confirm-title').innerText = title;
        document.getElementById('custom-confirm-msg').innerText = msg;
        document.getElementById('custom-confirm-overlay').style.display = 'flex';
        if (window.audioManager) window.audioManager.play('click');
        
        document.getElementById('custom-confirm-yes').onclick = function() {
            document.getElementById('custom-confirm-overlay').style.display = 'none';
            if (window.audioManager) window.audioManager.play('click');
            onYes();
        };
        
        document.getElementById('custom-confirm-no').onclick = function() {
            document.getElementById('custom-confirm-overlay').style.display = 'none';
            if (window.audioManager) window.audioManager.play('click');
        };
    };

    window.resetProgress = function() {
        window.showCustomConfirm("Warning", "Are you sure you want to erase all your progress?", () => {
            localStorage.removeItem('cottonHighScore');
            localStorage.removeItem('cottonUnlockedLevel');
            window.showCustomAlert("Success", "Progress reset!");
            setTimeout(() => location.reload(), 1500);
        });
    };
    
    window.showCredits = function() {
        window.showCustomAlert("Credits", "Created by Franky & Cotton 🐶");
    };
    
    // Init settings
    const savedLang = localStorage.getItem('cotton_lang') || 'en';
    window.setLanguage(savedLang);
    
    const bgmEnabled = localStorage.getItem('cotton_bgm') !== 'false'; // default true
    const sfxEnabled = localStorage.getItem('cotton_sfx') !== 'false';
    
    document.getElementById('toggle-bgm').checked = bgmEnabled;
    document.getElementById('toggle-sfx').checked = sfxEnabled;
    audioManager.setBgmEnabled(bgmEnabled);
    audioManager.setSfxEnabled(sfxEnabled);

    // ---------------------------------
    
    controller.start();
    window.renderLevels();
    
    // Boot up into home screen by default
    gameState.switchScreen('screen-home');
});
