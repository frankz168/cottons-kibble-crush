import { SOUND_EFFECT, BGM_TRACK } from '../constants.js';

export class AudioManager {
    constructor() {
        this.isBgmMuted = false;
        this.isSfxMuted = false;
        
        // SFX Audio Buffers (Web Audio API for zero-latency, zero-jank on iOS Safari)
        this.audioBuffers = {};
        this.ctx = null;
        this.sfxGainNode = null;
        
        // BGM Tracks (HTML5 Audio is standard for continuous background streaming)
        this.bgmTracks = {};
        this.currentBgm = null;

        this.initWebAudio();
        this.initBGM();
    }

    initWebAudio() {
        if (typeof window === 'undefined') return;

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            try {
                this.ctx = new AudioContextClass();
                this.sfxGainNode = this.ctx.createGain();
                this.sfxGainNode.gain.value = 1.0;
                this.sfxGainNode.connect(this.ctx.destination);

                // Auto-resume audio context on first user interaction (required by iOS Safari)
                const unlock = () => {
                    if (this.ctx && this.ctx.state === 'suspended') {
                        this.ctx.resume().catch(() => {});
                    }
                    window.removeEventListener('touchstart', unlock);
                    window.removeEventListener('touchend', unlock);
                    window.removeEventListener('mousedown', unlock);
                    window.removeEventListener('pointerdown', unlock);
                };
                window.addEventListener('touchstart', unlock, { passive: true });
                window.addEventListener('touchend', unlock, { passive: true });
                window.addEventListener('mousedown', unlock, { passive: true });
                window.addEventListener('pointerdown', unlock, { passive: true });

                this.preloadSFX();
            } catch (e) {
                console.warn('Web Audio API initialization failed:', e);
            }
        }
    }

    async preloadSFX() {
        if (!this.ctx) return;

        const sfxSources = {
            [SOUND_EFFECT.MATCH]: 'assets/audio/sfx_pop.wav',
            [SOUND_EFFECT.SWAP]: 'assets/audio/sfx_whoosh.wav',
            [SOUND_EFFECT.BARK]: 'assets/audio/sfx_bark.wav',
            [SOUND_EFFECT.CLICK]: 'assets/audio/sfx_bloop.wav',
            [SOUND_EFFECT.BOMB]: 'assets/audio/sfx_pop.wav'
        };

        for (const [key, path] of Object.entries(sfxSources)) {
            try {
                const response = await fetch(path);
                const arrayBuffer = await response.arrayBuffer();
                this.ctx.decodeAudioData(arrayBuffer, (decodedBuffer) => {
                    this.audioBuffers[key] = decodedBuffer;
                }, () => {});
            } catch (e) {
                // Audio load fail silently
            }
        }
    }

    initBGM() {
        if (typeof Audio === 'undefined') return;

        this.bgmTracks = {
            [BGM_TRACK.HOME]: new Audio('assets/audio/bgm_home.wav'),
            [BGM_TRACK.GAME1]: new Audio('assets/audio/bgm_game1.wav'),
            [BGM_TRACK.GAME2]: new Audio('assets/audio/bgm_game2.wav')
        };
        
        this.currentBgm = this.bgmTracks[BGM_TRACK.HOME];
        
        Object.values(this.bgmTracks).forEach(track => {
            if (track) {
                track.loop = true;
                track.volume = 0.35;
            }
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

        // 1. High-performance Web Audio API playback (Zero UI thread blocking)
        if (this.ctx && this.audioBuffers[soundName]) {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
            try {
                const source = this.ctx.createBufferSource();
                source.buffer = this.audioBuffers[soundName];
                source.connect(this.sfxGainNode || this.ctx.destination);
                source.start(0);
                return;
            } catch (e) {}
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
        if (this.sfxGainNode && this.ctx) {
            this.sfxGainNode.gain.setValueAtTime(this.isSfxMuted ? 0 : 1, this.ctx.currentTime);
        }
    }
    
    toggleMute() {
        this.setBgmEnabled(this.isBgmMuted);
        this.setSfxEnabled(this.isSfxMuted);
        return this.isBgmMuted;
    }
}
