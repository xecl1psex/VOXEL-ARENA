// Модуль роботов и создания персонажей VOXEL ARENA

import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// Константы
export const RS = 1.5;
export const m3 = (x, y, z) => [x * RS, y * RS, z * RS];
export const GROUP_GROUND = 1, GROUP_PLAYER = 2, GROUP_LIMB = 4;
export const ARENA_SIZE = 160;
export const SAFE_RADIUS = 18;
export const CORPSE_LIFETIME = 8;
export const SEVERED_LIFETIME = 6;

// Сложности
export const DIFFICULTIES = {
    easy: { name: 'ЛЕГКО', playerHP: 5, enemyCountMul: 0.7, enemyHPMul: 0.8, regen: 2, scoreMul: 0.6 },
    normal: { name: 'НОРМАЛЬНО', playerHP: 3, enemyCountMul: 1.0, enemyHPMul: 1.0, regen: 1, scoreMul: 1.0 },
    hard: { name: 'СЛОЖНО', playerHP: 2, enemyCountMul: 1.4, enemyHPMul: 1.3, regen: 0, scoreMul: 1.6 },
};

// Кастомизация
const CUSTOM_KEY = 'voxelArenaCustom_v2';
const BODY_COLORS = [0x8899aa, 0x3a8ecc, 0x44cc88, 0xcc4444, 0x9955cc, 0xccaa44, 0x333333];
const VISOR_COLORS = [0xff2244, 0xff0000, 0xff6600, 0xffdd44, 0x00ffff, 0x88ffbb, 0xff00ff];
const SHOULDER_COLORS = [0x556677, 0x2a6a9c, 0x2a7a55, 0x7a2a55, 0x552a7a, 0x8a7a2a, 0x222222];
export const customization = { bodyColor: BODY_COLORS[0], eyeColor: VISOR_COLORS[0], shoulderColor: SHOULDER_COLORS[0] };

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

loadCustomization();

// Пассивки
export const PASSIVES = [
    { id: 'maxHP', name: 'УСИЛЕННЫЙ КОРПУС', desc: '+2 к максимуму HP (и текущему)', icon: '❤', apply: (p) => { p.maxTorsoHP += 2; p.torsoHP = Math.min(p.maxTorsoHP, p.torsoHP + 2); } },
    { id: 'damage', name: 'БОЕВОЙ ЧИП', desc: '+1 ко всему урону', icon: '⚔', apply: (p) => { p.bonusDamage += 1; } },
    { id: 'speed', name: 'УСКОРЕННЫЙ ПРИВОД', desc: '+15% к скорости передвижения', icon: '⚡', apply: (p) => { p.speedBonus = (p.speedBonus || 0) + 0.15; } },
    { id: 'swingSpeed', name: 'ГИРОСКОП', desc: '+15% к скорости замаха', icon: '🌀', apply: (p) => { p.swingSpeedBonus = (p.swingSpeedBonus || 0) + 0.15; } },
];

// Награды
export const REWARDS = [
    { type: 'heal', name: 'РЕМОНТ', desc: 'Восстановить 2 HP', icon: '🔧' },
    { type: 'ally', name: 'СОЮЗНИК', desc: 'Призвать боевого робота', icon: '🤖' },
    { type: 'xp', name: 'ОПЫТ', desc: '+1 уровень', icon: '✨' },
];

// Оружие
export const WEAPONS = [
    { id: 'sword', name: 'МЕЧ', icon: '🗡', hitDetection: 'swing', minChargeToFire: 0, damage: 2, swingDuration: 0.35, cooldown: 0.5, color: 0xffdd77 },
    { id: 'axe', name: 'ТОПОР', icon: '🪓', hitDetection: 'swing', minChargeToFire: 0, damage: 3, swingDuration: 0.5, cooldown: 0.8, color: 0xff8844 },
    { id: 'bow', name: 'ЛУК', icon: '🏹', hitDetection: 'projectile', minChargeToFire: 0.2, minSpeed: 18, maxSpeed: 32, minDamage: 1, maxDamage: 3, chargeTime: 0.8, cooldown: 0.4, color: 0x88ff66 },
    { id: 'spear', name: 'КОПЬЁ', icon: '🔱', hitDetection: 'swing', minChargeToFire: 0, damage: 2, swingDuration: 0.4, cooldown: 0.6, color: 0x66ccff },
];

// Враги
export const ENEMY_TYPES = [
    { name: 'БАЗОВЫЙ', hp: 2, speed: 2.2, damage: 1, color: 0xcc4444 },
    { name: 'БЫСТРЫЙ', hp: 1, speed: 3.4, damage: 1, color: 0xcc7744 },
    { name: 'СИЛЬНЫЙ', hp: 4, speed: 1.6, damage: 2, color: 0x9955cc },
    { name: 'ТАНК', hp: 6, speed: 1.2, damage: 2, color: 0xccaa44 },
];

// Боссы
export const BOSSES = {
    5: { name: 'БОСС-5', hp: 18, speed: 1.4, damage: 3, scale: 1.6, color: 0xff2244 },
    10: { name: 'БОСС-10', hp: 35, speed: 1.2, damage: 4, scale: 2.0, color: 0xaa22ff },
    15: { name: 'БОСС-15', hp: 60, speed: 1.0, damage: 5, scale: 2.4, color: 0xff6600 },
};

// Создание материалов для робота
export function makeMaterials(baseColor, eyeColor) {
    const c = new THREE.Color(baseColor);
    const shoulder = new THREE.Color(baseColor).multiplyScalar(0.7);
    
    return {
        body: new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: 0.55 }),
        limb: new THREE.MeshStandardMaterial({ color: c.clone().multiplyScalar(0.5), roughness: 0.55, metalness: 0.6 }),
        dark: new THREE.MeshStandardMaterial({ color: c.clone().multiplyScalar(0.25), roughness: 0.65, metalness: 0.5 }),
        head: new THREE.MeshStandardMaterial({ color: c.clone().lerp(new THREE.Color(0xffffff), 0.5), roughness: 0.45, metalness: 0.6 }),
        eye: new THREE.MeshStandardMaterial({ color: eyeColor, emissive: eyeColor, emissiveIntensity: 2.2, roughness: 0.3, metalness: 0.3 }),
        shoulder: new THREE.MeshStandardMaterial({ color: shoulder, roughness: 0.5, metalness: 0.65 }),
        metal: new THREE.MeshStandardMaterial({ color: 0xb8b8c0, roughness: 0.4, metalness: 0.7 }),
        pipe: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6, metalness: 0.7 }),
    };
}

// Отражение вокселей по X
export function mirrorX(voxels) {
    return voxels.map(v => ({
        size: v.size,
        pos: [-v.pos[0], v.pos[1], v.pos[2]],
        mat: v.mat
    }));
}

// Создание HP бара
export function createHpBarSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 24;
    const ctx = canvas.getContext('2d');
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.9, 0.36, 1);
    sprite.userData = { canvas, ctx, tex, lastHp: -1, lastMax: -1 };
    return sprite;
}

// Обновление HP бара
export function updateHpBarSprite(sprite, hp, maxHp) {
    if (sprite.userData.lastHp === hp && sprite.userData.lastMax === maxHp) return;
    
    sprite.userData.lastHp = hp;
    sprite.userData.lastMax = maxHp;
    
    const ctx = sprite.userData.ctx;
    const W = 128, H = 24;
    ctx.clearRect(0, 0, W, H);
    
    // Фон
    ctx.fillStyle = 'rgba(15,5,5,0.85)';
    ctx.fillRect(0, 4, W, H - 8);
    
    // Рамка
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 5, W - 2, H - 10);
    
    // HP заполнение
    const ratio = Math.max(0, hp / maxHp);
    const w = (W - 6) * ratio;
    
    let col = '#ff4444';
    if (ratio > 0.66) col = '#44dd66';
    else if (ratio > 0.33) col = '#ffcc44';
    
    ctx.fillStyle = col;
    ctx.fillRect(3, 7, w, H - 14);
    
    sprite.userData.tex.needsUpdate = true;
}

// Создание робота
export function createRobot(scene, world, config) {
    const mats = makeMaterials(config.color || 0x8899aa, config.eyeColor || 0xff2244);
    
    if (config.shoulderColor != null) {
        mats.shoulder.color.setHex(config.shoulderColor);
    }
    
    const group = new THREE.Group();
    group.scale.setScalar(config.scale || 1.0);
    scene.add(group);
    
    const parts = {};
    
    // Определение частей тела (упрощённое)
    const partDefs = {
        torso: { offset: [0, 0, 0], voxels: [] },
        head: { offset: [0, 0.7, 0], voxels: [] },
        arm_R: { offset: [0.45, 0.15, 0], voxels: [] },
        arm_L: { offset: [-0.45, 0.15, 0], voxels: [] },
        leg_R: { offset: [0.2, -0.6, 0], voxels: [] },
        leg_L: { offset: [-0.2, -0.6, 0], voxels: [] }
    };
    
    for (const [name, def] of Object.entries(partDefs)) {
        const pg = new THREE.Group();
        pg.position.set(def.offset[0], def.offset[1], def.offset[2]);
        pg.name = name;
        
        // Добавляем основную коробку для части
        if (name === 'torso') {
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.9 * RS, 0.7 * RS, 0.6 * RS),
                mats.body
            );
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData.part = name;
            pg.add(mesh);
        } else if (name === 'head') {
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.55 * RS, 0.5 * RS, 0.55 * RS),
                mats.head
            );
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData.part = name;
            pg.add(mesh);
            
            // Глаза
            const eyeGeo = new THREE.BoxGeometry(0.12 * RS, 0.08 * RS, 0.05 * RS);
            const eyeL = new THREE.Mesh(eyeGeo, mats.eye);
            eyeL.position.set(-0.12 * RS, 0.05 * RS, 0.28 * RS);
            pg.add(eyeL);
            const eyeR = new THREE.Mesh(eyeGeo, mats.eye);
            eyeR.position.set(0.12 * RS, 0.05 * RS, 0.28 * RS);
            pg.add(eyeR);
        } else if (name.startsWith('arm')) {
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.22 * RS, 0.7 * RS, 0.22 * RS),
                mats.limb
            );
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData.part = name;
            pg.add(mesh);
            pg.rotation.order = 'YXZ';
        } else if (name.startsWith('leg')) {
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.28 * RS, 0.6 * RS, 0.28 * RS),
                mats.dark
            );
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData.part = name;
            pg.add(mesh);
        }
        
        group.add(pg);
        parts[name] = { mesh: pg, alive: true };
    }
    
    // Физическое тело
    const scale = config.scale || 1.0;
    const hw = 0.45 * RS * scale;
    const hh = 0.9 * RS * scale;
    const hd = 0.3 * RS * scale;
    
    const coreBody = new CANNON.Body({
        mass: config.isPlayer ? 5 * scale * scale * scale : 3 * scale * scale * scale,
        shape: new CANNON.Box(new CANNON.Vec3(hw, hh, hd)),
        material: window.bodyMat
    });
    
    coreBody.fixedRotation = true;
    coreBody.updateMassProperties();
    coreBody.collisionFilterGroup = GROUP_PLAYER;
    coreBody.collisionFilterMask = GROUP_GROUND | GROUP_LIMB;
    coreBody.position.set(config.position[0], config.position[1], config.position[2]);
    coreBody.allowSleep = false;
    world.addBody(coreBody);
    
    const robot = {
        id: Date.now(),
        group,
        parts,
        coreBody,
        materials: mats,
        isPlayer: config.isPlayer || false,
        isBoss: config.isBoss || false,
        isAlly: config.isAlly || false,
        bossType: config.bossType || null,
        scale,
        speedMultiplier: config.speedMultiplier || 1.0,
        alive: true,
        facing: 0,
        tilt: 0,
        attackCooldown: 0,
        specialCooldown: 0,
        torsoHP: config.maxTorsoHP || 3,
        maxTorsoHP: config.maxTorsoHP || 3,
        baseMaxTorsoHP: config.maxTorsoHP || 3,
        bonusDamage: 0,
        swingSpeedBonus: 0,
        speedBonus: 0,
        jumpBonus: 0,
        regenBonus: 0,
        lifesteal: 0,
        armor: 0,
        thorns: 0,
        critChance: 0,
        rangeBonus: 0,
        xpBonus: 0,
        berserk: 0,
        execute: 0,
        energyShield: 0,
        specialCooldownT: 0,
        swingT: 0,
        swinging: false,
        swingElapsed: 0,
        weapon: null,
        weaponMesh: null,
        savedWeapon: null,
        stepTimer: 0,
        hitThisSwing: new Set(),
        stunT: 0,
        bowCharge: 0,
        specialT: 0,
        specialType: null,
        aimPhase: 0,
        aimOffset: 0,
        firedThisCycle: false,
        retreatT: 0,
        retreatAfterSwing: false,
        lastClickTime: 0,
        trail: null,
        deathTimer: 0,
        hpDamageStages: [false, false, false],
        _disposed: false
    };
    
    // Добавляем ссылку на робота во все меши
    group.traverse(o => {
        if (o.isMesh) o.userData.robot = robot;
    });
    
    // Trail для игрока и боссов
    if (config.isPlayer || config.isBoss) {
        robot.trail = new SwingTrail(scene);
    }
    
    // HP бар для не-игроков
    if (!config.isPlayer && !config.isBoss) {
        robot.hpBar = createHpBarSprite();
        scene.add(robot.hpBar);
    }
    
    return robot;
}

// Класс для трейла оружия
class SwingTrail {
    constructor(scene, maxPoints = 18) {
        this.scene = scene;
        this.maxPoints = maxPoints;
        this.points = [];
        this.geometry = new THREE.BufferGeometry();
        this.material = new THREE.MeshBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.frustumCulled = false;
        this.mesh.renderOrder = 5;
        scene.add(this.mesh);
        this.baseColor = new THREE.Color(0xffffff);
        this._positions = new Float32Array(maxPoints * 2 * 3);
        this._colors = new Float32Array(maxPoints * 2 * 3);
    }
    
    setColor(hex) {
        this.baseColor.setHex(hex);
    }
    
    push(base, tip) {
        this.points.push({ base: base.clone(), tip: tip.clone(), life: 1.0 });
        if (this.points.length > this.maxPoints) this.points.shift();
    }
    
    clear() {
        this.points.length = 0;
        this._rebuild();
    }
    
    update(dt) {
        if (!this.points.length) return;
        for (let i = this.points.length - 1; i >= 0; i--) {
            this.points[i].life -= dt * 3.2;
            if (this.points[i].life <= 0) this.points.splice(i, 1);
        }
        this._rebuild();
    }
    
    _rebuild() {
        const pts = this.points;
        const n = pts.length;
        
        if (n < 2) {
            this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));
            this.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(0), 3));
            this.geometry.setIndex([]);
            return;
        }
        
        const pos = this._positions;
        const col = this._colors;
        const bc = this.baseColor;
        
        for (let i = 0; i < n; i++) {
            const p = pts[i];
            const idx = i * 6;
            pos[idx] = p.base.x;
            pos[idx + 1] = p.base.y;
            pos[idx + 2] = p.base.z;
            pos[idx + 3] = p.tip.x;
            pos[idx + 4] = p.tip.y;
            pos[idx + 5] = p.tip.z;
            
            const f = p.life * p.life;
            col[idx] = bc.r * f;
            col[idx + 1] = bc.g * f;
            col[idx + 2] = bc.b * f;
            col[idx + 3] = bc.r * f;
            col[idx + 4] = bc.g * f;
            col[idx + 5] = bc.b * f;
        }
        
        const idxs = [];
        for (let i = 0; i < n - 1; i++) {
            const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
            idxs.push(a, b, c, b, d, c);
        }
        
        this.geometry.setAttribute('position', new THREE.BufferAttribute(pos.slice(0, n * 6), 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(col.slice(0, n * 6), 3));
        this.geometry.setIndex(idxs);
        this.geometry.computeBoundingSphere();
    }
}
export { SwingTrail };
