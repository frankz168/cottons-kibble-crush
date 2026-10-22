export const ROWS = 8;
export const COLS = 8;

export const STATE = Object.freeze({
    IDLE: 0,
    SWAPPING: 1,
    REVERTING: 2,
    MATCHING: 3,
    FALLING: 4,
    WIN_ANIMATION: 5
});

export const TILE_TYPE = Object.freeze({
    BONE: '🦴',
    MEAT: '🥩',
    TENNIS: '🎾',
    PAW: '🐾',
    DRUMSTICK: '🍗',
    CHEESE: '🧀',
    SHOE: '👟',
    YARN: '🧶',
    COOKIE: '🍪',
    CAT: '🐈',
    RAINBOW: '🌈'
});

export const TYPES = Object.freeze([
    TILE_TYPE.BONE,
    TILE_TYPE.MEAT,
    TILE_TYPE.TENNIS,
    TILE_TYPE.PAW,
    TILE_TYPE.DRUMSTICK,
    TILE_TYPE.CHEESE,
    TILE_TYPE.SHOE,
    TILE_TYPE.YARN,
    TILE_TYPE.COOKIE
]);

export const SPECIAL_TYPE = Object.freeze({
    NONE: null,
    NORMAL: 'normal',
    STRIPED_V: 'striped-v',
    STRIPED_H: 'striped-h',
    BOMB: 'bomb',
    RAINBOW: 'rainbow',
    RAINBOW_BLAST: 'rainbow-blast'
});

export const BOOSTER_TYPE = Object.freeze({
    HAMMER: 'hammer',
    BOMB: 'bomb',
    SHUFFLE: 'shuffle'
});

export const GAME_MODE = Object.freeze({
    MOVES: 'moves',
    TIME: 'time'
});

export const DIRECTION = Object.freeze({
    HORIZONTAL: 'horizontal',
    VERTICAL: 'vertical'
});

export const SCREEN = Object.freeze({
    HOME: 'screen-home',
    LEVELS: 'screen-levels',
    GAME: 'screen-game',
    LEADERBOARD: 'screen-leaderboard',
    SHOP: 'screen-shop',
    SETTINGS: 'screen-settings'
});

export const SOUND_EFFECT = Object.freeze({
    MATCH: 'match',
    SWAP: 'swap',
    BARK: 'bark',
    CLICK: 'click',
    BOMB: 'bomb'
});

export const BGM_TRACK = Object.freeze({
    HOME: 'home',
    GAME1: 'game1',
    GAME2: 'game2'
});

export const COMBO_TEXT = Object.freeze({
    PAW_SOME: 'PAW-SOME!',
    GOOD_BOY: 'GOOD BOY!',
    WOW: 'WOW!',
    FANTASTIC: 'FANTASTIC!'
});

export const STORAGE_KEY = Object.freeze({
    HIGH_SCORE: 'cottons_kibble_crush_highscore',
    UNLOCKED_LEVEL: 'cottons_kibble_crush_unlocked_level',
    COINS: 'cottons_kibble_crush_coins',
    BOOSTERS: 'cottons_kibble_crush_boosters',
    LAST_LOGIN: 'cottons_kibble_crush_last_login',
    ACTIVE_SESSION: 'cottons_kibble_crush_active_session',
    BGM: 'cotton_bgm',
    SFX: 'cotton_sfx',
    LANG: 'cotton_lang'
});
