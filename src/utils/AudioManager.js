import { SOUND_EFFECT, BGM_TRACK } from '../constants.js';

export class AudioManager {
    constructor() {
        this.sounds = {
            [SOUND_EFFECT.MATCH]: new Audio('assets/audio/sfx_pop.wav'),
            [SOUND_EFFECT.SWAP]: new Audio('assets/audio/sfx_whoosh.wav'),
            [SOUND_EFFECT.BARK]: new Audio('assets/audio/sfx_bark.wav'),
            [SOUND_EFFECT.CLICK]: new Audio('assets/audio/sfx_bloop.wav'),
            [SOUND_EFFECT.BOMB]: new Audio('assets/audio/sfx_pop.wav')
        };
        
        this.bgmTracks = {
            [BGM_TRACK.HOME]: new Audio('assets/audio/bgm_home.wav'),
            [BGM_TRACK.GAME1]: new Audio('assets/audio/bgm_game1.wav'),
            [BGM_TRACK.GAME2]: new Audio('assets/audio/bgm_game2.wav')
        };
        
        this.currentBgm = this.bgmTracks[BGM_TRACK.HOME];
        
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
                this.currentBgm.play().catch(() => {});
            }
        }
    }
    
    play(soundName) {
        if (this.isSfxMuted) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    }
    
    setBgmEnabled(enabled) {
        this.isBgmMuted = !enabled;
        if (this.isBgmMuted) {
            if (this.currentBgm) this.currentBgm.pause();
        } else {
            if (this.currentBgm) this.currentBgm.play().catch(() => {});
        }
    }
    
    setSfxEnabled(enabled) {
        this.isSfxMuted = !enabled;
    }
    
    toggleMute() {
        this.setBgmEnabled(this.isBgmMuted);
        return this.isBgmMuted;
    }
}
