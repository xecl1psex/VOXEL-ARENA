// ============================================
// CONSTANTS — Константы игры VOXEL ARENA
// ============================================

/** @type {Object.<string, number>} */
export const WEAPONS = {
    PISTOL: 0,
    SHOTGUN: 1,
    RIFLE: 2,
    SNIPER: 3,
    PLASMA: 4,
    LASER: 5,
    ROCKET: 6,
    CHAIN_GUN: 7
};

/** @type {Object.<string, number>} */
export const ENEMY_TYPES = {
    BASIC: 0,
    FAST: 1,
    TANK: 2,
    SHOOTER: 3,
    BOSS: 4
};

/** @type {Object.<string, number>} */
export const UPGRADE_TYPES = {
    HEALTH: 0,
    DAMAGE: 1,
    SPEED: 2,
    SHIELD: 3,
    RELOAD: 4,
    SPECIAL: 5
};

/** @type {Object.<string, number>} */
export const PASSIVE_TYPES = {
    REGEN: 0,
    VAMPIRISM: 1,
    THORNS: 2,
    DOUBLE_SHOT: 3,
    EXP_BOOST: 4
};

/** Физические константы */
export const PHYSICS = {
    GRAVITY: -9.82,
    PLAYER_SPEED: 8,
    PLAYER_JUMP: 5,
    ENEMY_BASE_SPEED: 3,
    FRICTION: 0.9
};

/** Баланс игры */
export const GAME_BALANCE = {
    BASE_HP: 3,
    BASE_SHIELD: 0,
    BASE_DAMAGE: 1,
    XP_PER_KILL: 10,
    XP_TO_LEVEL: 100,
    WAVE_DELAY: 3000,
    SPAWN_DISTANCE: 30,
    DESPAWN_DISTANCE: 50
};

/** Настройки оружия */
export const WEAPON_STATS = {
    [WEAPONS.PISTOL]: { damage: 1, fireRate: 500, spread: 0.05, range: 50 },
    [WEAPONS.SHOTGUN]: { damage: 0.5, fireRate: 800, spread: 0.3, pellets: 5, range: 20 },
    [WEAPONS.RIFLE]: { damage: 0.8, fireRate: 150, spread: 0.1, range: 40 },
    [WEAPONS.SNIPER]: { damage: 5, fireRate: 1500, spread: 0.01, range: 100 },
    [WEAPONS.PLASMA]: { damage: 2, fireRate: 600, spread: 0.08, range: 30 },
    [WEAPONS.LASER]: { damage: 3, fireRate: 1000, spread: 0, range: 80 },
    [WEAPONS.ROCKET]: { damage: 10, fireRate: 2000, spread: 0.1, range: 60, explosive: true },
    [WEAPONS.CHAIN_GUN]: { damage: 0.4, fireRate: 80, spread: 0.2, range: 25 }
};

/** Статистика врагов */
export const ENEMY_STATS = {
    [ENEMY_TYPES.BASIC]: { hp: 2, speed: 3, damage: 1, xp: 10 },
    [ENEMY_TYPES.FAST]: { hp: 1, speed: 6, damage: 1, xp: 15 },
    [ENEMY_TYPES.TANK]: { hp: 10, speed: 2, damage: 2, xp: 25 },
    [ENEMY_TYPES.SHOOTER]: { hp: 3, speed: 2.5, damage: 1, xp: 20, range: 20 },
    [ENEMY_TYPES.BOSS]: { hp: 100, speed: 1.5, damage: 5, xp: 500 }
};

/** Цвета для типов врагов */
export const ENEMY_COLORS = {
    [ENEMY_TYPES.BASIC]: 0xff0000,
    [ENEMY_TYPES.FAST]: 0xffaa00,
    [ENEMY_TYPES.TANK]: 0x880000,
    [ENEMY_TYPES.SHOOTER]: 0xff00ff,
    [ENEMY_TYPES.BOSS]: 0x440044
};

/** Уровни сложности волн */
export const WAVE_SCALING = {
    hpMultiplier: 1.2,
    damageMultiplier: 1.1,
    countBase: 5,
    countPerWave: 2,
    bossEvery: 5
};

/** UI константы */
export const UI = {
    FADE_DURATION: 300,
    BANNER_DISPLAY_TIME: 2000,
    PANEL_ANIMATION_DURATION: 200
};

/** Аудио константы */
export const AUDIO = {
    MASTER_VOLUME: 0.5,
    SFX_VOLUME: 0.7,
    MUSIC_VOLUME: 0.3
};

/** Ключи управления */
export const CONTROLS = {
    FORWARD: 'KeyW',
    BACKWARD: 'KeyS',
    LEFT: 'KeyA',
    RIGHT: 'KeyD',
    JUMP: 'Space',
    SHOOT: 'Mouse0',
    SPECIAL: 'Mouse1',
    PAUSE: 'Escape',
    WEAPON_1: 'Digit1',
    WEAPON_2: 'Digit2',
    WEAPON_3: 'Digit3',
    WEAPON_4: 'Digit4'
};

/** Размеры вокселей */
export const VOXEL = {
    SIZE: 1,
    PLAYER_HEIGHT: 2,
    PLAYER_WIDTH: 1
};
