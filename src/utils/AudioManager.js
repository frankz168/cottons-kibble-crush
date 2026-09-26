export class AudioManager {
    constructor() {
        this.sounds = {
            match: new Audio('assets/audio/sfx_pop.wav'),
            swap: new Audio('assets/audio/sfx_whoosh.wav'),
            bark: new Audio('assets/audio/sfx_bark.wav'),
            click: new Audio('assets/audio/sfx_bloop.wav')
        };
        
        this.bgmTracks = {
            home: new Audio('assets/audio/bgm_home.wav'),
            game1: new Audio('assets/audio/bgm_game1.wav'),
            game2: new Audio('assets/audio/bgm_game2.wav')
        };
        
        this.currentBgm = this.bgmTracks.home;
        
        this.isBgmMuted = false;
        this.isSfxMuted = false;
        
        // BGM Configuration
        Object.values(this.bgmTracks).forEach(track => {
            track.loop = true;
            track.volume = 0.4;
        });
    }
    
    playBGM(trackName) {
        if (this.currentBgm) {
            this.currentBgm.pause();
            this.currentBgm.currentTime = 0;
        }
        
        if (this.bgmTracks[trackName]) {
            this.currentBgm = this.bgmTracks[trackName];
            if (!this.isBgmMuted) {
                this.currentBgm.play().catch(e => console.warn('BGM prevented by browser.'));
            }
        }
    }
    
    play(soundName) {
        if (this.isSfxMuted) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.warn(`Audio ${soundName} prevented by browser.`));
        }
    }
    
    setBgmEnabled(enabled) {
        this.isBgmMuted = !enabled;
        if (this.isBgmMuted) {
            if (this.currentBgm) this.currentBgm.pause();
        } else {
            if (this.currentBgm) this.currentBgm.play().catch(e => console.warn('BGM prevented by browser.'));
        }
    }
    
    setSfxEnabled(enabled) {
        this.isSfxMuted = !enabled;
    }
    
    // For the global toggle button (legacy)
    toggleMute() {
        this.setBgmEnabled(this.isBgmMuted); // Toggle it ON if it was OFF
        return this.isBgmMuted;
    }
}
