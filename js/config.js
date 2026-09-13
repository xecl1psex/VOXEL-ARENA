// Конфигурация и константы игры VOXEL ARENA

export const RS = 1.5;
export const m3 = (x, y, z) => [x * RS, y * RS, z * RS];

// Группы коллизий
export const GROUP_GROUND = 1;
export const GROUP_PLAYER = 2;
export const GROUP_LIMB = 4;

// Размеры арены
export const ARENA_SIZE = 140;
export const SAFE_RADIUS = 18;

// Время жизни объектов
export const CORPSE_LIFETIME = 8.0;
export const SEVERED_LIFETIME = 20.0;

// Сложности
export const DIFFICULTIES = {
    easy: { name: 'ЛЕГКО', playerHP: 5, enemyCountMul: 0.7, enemyHPMul: 0.8, regen: 2, scoreMul: 0.6 },
    normal: { name: 'НОРМАЛЬНО', playerHP: 3, enemyCountMul: 1.0, enemyHPMul: 1.0, regen: 1, scoreMul: 1.0 },
    hard: { name: 'СЛОЖНО', playerHP: 2, enemyCountMul: 1.4, enemyHPMul: 1.3, regen: 0, scoreMul: 1.6 },
};

// Кастомизация
export const CUSTOM_KEY = 'voxelArenaCustom_v2';
export const BODY_COLORS = [0x8899aa, 0x3a8ecc, 0x44cc88, 0xcc4444, 0x9955cc, 0xccaa44, 0x333333];
export const VISOR_COLORS = [0xff2244, 0xff0000, 0xff6600, 0xffdd44, 0x00ffff, 0x88ffbb, 0xff00ff];
export const SHOULDER_COLORS = [0x556677, 0x2a6a9c, 0x2a7a55, 0x7a2a55, 0x552a7a, 0x8a7a2a, 0x222222];

export const customization = {
    bodyColor: BODY_COLORS[0],
    eyeColor: VISOR_COLORS[0],
    shoulderColor: SHOULDER_COLORS[0]
};

export function loadCustomization() {
    try {
        const s = JSON.parse(localStorage.getItem(CUSTOM_KEY));
        if (s) {
            if (s.bodyColor != null) customization.bodyColor = s.bodyColor;
            if (s.eyeColor != null) customization.eyeColor = s.eyeColor;
            if (s.shoulderColor != null) customization.shoulderColor = s.shoulderColor;
        }
    } catch (e) {}
}

export function saveCustomization() {
    try {
        localStorage.setItem(CUSTOM_KEY, JSON.stringify(customization));
    } catch (e) {}
}

// Пассивки
export const PASSIVES = [
    { id: 'maxHP', name: 'УСИЛЕННЫЙ КОРПУС', desc: '+2 к максимуму HP (и текущему)', icon: '❤', apply: (p) => { p.maxTorsoHP += 2; p.torsoHP = Math.min(p.maxTorsoHP, p.torsoHP + 2); } },
    { id: 'damage', name: 'БОЕВОЙ ЧИП', desc: '+1 ко всему урону', icon: '⚔', apply: (p) => { p.bonusDamage += 1; } },
    { id: 'speed', name: 'УСКОРЕННЫЙ ПРИВОД', desc: '+15% к скорости передвижения', icon: '⚡', apply: (p) => { p.speedBonus = (p.speedBonus || 0) + 0.15; } },
    { id: 'swingSpeed', name: 'ГИРОСКОП', desc: '+15% к скорости замаха', icon: '🌀', apply: (p) => { p.swingSpeedBonus = (p.swingSpeedBonus || 0) + 0.15; } },
    { id: 'regenWave', name: 'НЕЙРОРЕГЕНЕРАЦИЯ', desc: '+1 HP между волнами', icon: '✚', apply: (p) => { p.regenBonus = (p.regenBonus || 0) + 1; } },
    { id: 'lifesteal', name: 'ВАМПИРИЗМ', desc: '+25% шанс восстановить 1 HP за удар', icon: '🩸', apply: (p) => { p.lifesteal = Math.min(0.75, (p.lifesteal || 0) + 0.25); } },
    { id: 'armor', name: 'БРОНЕПЛАСТИНА', desc: '−10% получаемого урона', icon: '🛡', apply: (p) => { p.armor = Math.min(0.6, (p.armor || 0) + 0.10); } },
    { id: 'thorns', name: 'ШИПЫ', desc: 'Атакующие теряют 1 HP', icon: '🌵', apply: (p) => { p.thorns = (p.thorns || 0) + 1; } },
    { id: 'crit', name: 'КРИТИЧЕСКИЙ МОДУЛЬ', desc: '+12% шанс двойного урона', icon: '💀', apply: (p) => { p.critChance = Math.min(0.5, (p.critChance || 0) + 0.12); } },
    { id: 'range', name: 'ДЛИННЫЙ ХВАТ', desc: '+20% к дальности оружия', icon: '🏹', apply: (p) => { p.rangeBonus = (p.rangeBonus || 0) + 0.20; } },
    { id: 'wisdom', name: 'МУДРОСТЬ', desc: '+25% к получаемому опыту', icon: '📖', apply: (p) => { p.xpBonus = (p.xpBonus || 0) + 0.25; } },
    { id: 'jump', name: 'ГИДРАВЛИКА НОГ', desc: '+15% к прыжку, +5% к скорости', icon: '↑', apply: (p) => { p.jumpBonus = (p.jumpBonus || 0) + 0.15; p.speedBonus = (p.speedBonus || 0) + 0.05; } },
    { id: 'berserk', name: 'ЯРОСТЬ', desc: '+30% урона при HP ниже 50%', icon: '🔥', apply: (p) => { p.berserk = (p.berserk || 0) + 0.30; } },
    { id: 'execute', name: 'КАЗНЬ', desc: '+25% урона по врагу с HP ниже 30%', icon: '☠', apply: (p) => { p.execute = (p.execute || 0) + 0.25; } },
];

export const selectedPassives = {};

export function pickRandomPassives(n) {
    return [...PASSIVES].sort(() => Math.random() - 0.5).slice(0, n);
}

// Награды
export const REWARDS = [
    {
        id: 'repair', name: 'РЕМОНТ', icon: '🔧', desc: 'Восстановить конечности + ПОЛНОЕ восстановление HP.', canShow: () => true,
        apply: () => {
            const r = window.repairPlayerLimbs();
            window.player.torsoHP = window.player.maxTorsoHP;
            if (r > 0) window.showBanner(`ВОССТАНОВЛЕНО ${r} · HP ПОЛОН`, 1400);
            else window.showBanner('ПОЛНОЕ ВОССТАНОВЛЕНИЕ', 1000);
            window.updateHUD();
        }
    },
    { id: 'ally', name: 'СОЮЗНИК', icon: '🤖', desc: 'Призвать робота-помощника. Максимум 2.', canShow: () => window.allies.filter(a => a.alive).length < 2, apply: () => { window.spawnAlly(); } },
    { id: 'shield', name: 'ЭНЕРГОЩИТ', icon: '🛡', desc: '+3 заряда защиты от отрубания.', canShow: () => true, apply: () => { window.player.energyShield = (window.player.energyShield || 0) + 3; window.updateHUD(); } },
    { id: 'ammo', name: 'БОЕПРИПАСЫ', icon: '⚔', desc: '+1 к урону навсегда.', canShow: () => true, apply: () => { window.player.bonusDamage += 1; window.updateHUD(); } },
    { id: 'medic', name: 'МЕДИЦИНА', icon: '❤', desc: '+2 к максимуму HP и полное восстановление.', canShow: () => true, apply: () => { window.player.maxTorsoHP += 2; window.player.torsoHP = window.player.maxTorsoHP; window.updateHUD(); } },
    { id: 'speedUp', name: 'УСКОРЕНИЕ', icon: '⚡', desc: '+10% к скорости и прыжку.', canShow: () => true, apply: () => { window.player.speedBonus = (window.player.speedBonus || 0) + 0.10; window.player.jumpBonus = (window.player.jumpBonus || 0) + 0.10; window.updateHUD(); } },
];

export function pickRandomRewards(n) {
    const pool = REWARDS.filter(r => r.canShow());
    return [...pool].sort(() => Math.random() - 0.5).slice(0, n);
}

// Воксели игрока
export const PLAYER_HALF = { x: 0.45 * RS, y: 0.9 * RS, z: 0.3 * RS };

export const ARM_R_VOXELS = [
    { size: [0.22 * RS, 0.22 * RS, 0.22 * RS], pos: [0.55 * RS, -0.15 * RS, 0], mat: null },
    { size: [0.22 * RS, 0.35 * RS, 0.22 * RS], pos: [0.75 * RS, -0.45 * RS, 0], mat: null },
];

export const ARM_L_VOXELS = ARM_R_VOXELS.map(v => ({ size: v.size, pos: [-v.pos[0], v.pos[1], v.pos[2]], mat: v.mat }));

export const LEG_R_VOXELS = [
    { size: [0.28 * RS, 0.28 * RS, 0.35 * RS], pos: [0.25 * RS, -0.85 * RS, 0], mat: null },
    { size: [0.28 * RS, 0.45 * RS, 0.35 * RS], pos: [0.25 * RS, -1.35 * RS, 0], mat: null },
];

export const LEG_L_VOXELS = LEG_R_VOXELS.map(v => ({ size: v.size, pos: [-v.pos[0], v.pos[1], v.pos[2]], mat: v.mat }));

export const TORSO_VOXELS = [
    { size: [0.9 * RS, 0.7 * RS, 0.6 * RS], pos: [0, 0, 0], mat: null },
    { size: [0.5 * RS, 0.25 * RS, 0.45 * RS], pos: [0, 0.45 * RS, 0], mat: null },
];

export const HEAD_VOXELS = [
    { size: [0.55 * RS, 0.5 * RS, 0.55 * RS], pos: [0, 0.95 * RS, 0], mat: null },
];

export const SHOULDER_R_VOXELS = [
    { size: [0.35 * RS, 0.25 * RS, 0.25 * RS], pos: [0.65 * RS, 0.35 * RS, 0], mat: null },
];

export const SHOULDER_L_VOXELS = SHOULDER_R_VOXELS.map(v => ({ size: v.size, pos: [-v.pos[0], v.pos[1], v.pos[2]], mat: v.mat }));

// Оружие
export const WEAPONS = [
    { id: 'sword', name: 'МЕЧ', damage: 2, range: 2.8, swingTime: 0.45, color: 0xaaccff, icon: '🗡' },
    { id: 'axe', name: 'ТОПОР', damage: 3, range: 3.0, swingTime: 0.65, color: 0xff8866, icon: '🪓' },
    { id: 'hammer', name: 'МОЛОТ', damage: 4, range: 3.2, swingTime: 0.85, color: 0xaa8866, icon: '🔨' },
    { id: 'bow', name: 'ЛУК', damage: 2, range: 18, swingTime: 0.55, color: 0x88dd66, projectile: true, icon: '🏹' },
];

export function getWeaponById(id) {
    return WEAPONS.find(w => w.id === id);
}

// Враги
export const ENEMY_TYPES = [
    { id: 'drone', name: 'ДРОН', hp: 2, damage: 1, speed: 3.5, color: 0xff4444, scale: 0.8, score: 10 },
    { id: 'brute', name: 'БРЮТ', hp: 5, damage: 2, speed: 2.2, color: 0x8844ff, scale: 1.3, score: 25 },
    { id: 'swift', name: 'СВИФТ', hp: 2, damage: 1, speed: 5.5, color: 0x44ff88, scale: 0.7, score: 15 },
    { id: 'tank', name: 'ТАНК', hp: 10, damage: 3, speed: 1.5, color: 0x4488ff, scale: 1.6, score: 40 },
];

export function getEnemyType(id) {
    return ENEMY_TYPES.find(t => t.id === id);
}

// Боссы
export const BOSSES = [
    { id: 'boss1', name: 'МЕГА-ДРОН', hp: 40, damage: 3, speed: 2.5, color: 0xff2222, scale: 2.5, score: 200, wave: 5 },
    { id: 'boss2', name: 'ТИТАН', hp: 80, damage: 5, speed: 1.8, color: 0x8822ff, scale: 3.2, score: 400, wave: 10 },
    { id: 'boss3', name: 'УБИЙЦА', hp: 120, damage: 6, speed: 3.2, color: 0x22ff88, scale: 2.8, score: 600, wave: 15 },
];

export function getBossByWave(wave) {
    return BOSSES.find(b => b.wave === wave);
}
