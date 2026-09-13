// Главный игровой модуль VOXEL ARENA (рабочая версия)

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {
    RS, DIFFICULTIES, customization, loadCustomization, saveCustomization,
    PASSIVES, REWARDS, WEAPONS, ENEMY_TYPES,
    createRobot as createRobotFromModule,
    createHpBarSprite, updateHpBarSprite
} from './robots.js';
import { audio } from './audio.js';
import { initArena, buildArena, clearArena } from './arena.js';

// ===== Глобальные =====
export let scene, camera, renderer, world;
export let player = null;
export let robots = [], enemies = [], allies = [], severedLimbs = [], arrows = [];
export let corpses = [];
export let currentDifficultyKey = 'normal';
export let gameRunning = false;
export let paused = false;
export let wave = 0;
export let kills = 0;
export let level = 1;
export let xp = 0;
export let xpToNextLevel = 100;

// ===== Ввод =====
const keys = Object.create(null);
const mouse = { x: 0, y: 0, down: false, downTime: 0, doubleClickTimer: 0 };
let aimAngle = 0;
const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _ndc = new THREE.Vector2();
const _mouseWorld = new THREE.Vector3();

function initInput() {
    window.addEventListener('keydown', (e) => {
        if (['KeyW','KeyA','KeyS','KeyD','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
        keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => { keys[e.code] = false; });
    window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

    const cursor = document.getElementById('aimCursor');
    const chargeBar = document.getElementById('chargeBar');
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX; mouse.y = e.clientY;
        if (cursor) { cursor.style.left = e.clientX + 'px'; cursor.style.top = e.clientY + 'px'; }
        if (chargeBar) { chargeBar.style.left = e.clientX + 'px'; chargeBar.style.top = e.clientY + 'px'; }
    });
    window.addEventListener('mousedown', (e) => {
        if (e.button === 0 && gameRunning && !paused) {
            const now = performance.now();
            if (now - mouse.doubleClickTimer < 300) {
                triggerSpecial();
                mouse.doubleClickTimer = 0;
            } else {
                mouse.doubleClickTimer = now;
            }
            mouse.down = true;
        }
    });
    window.addEventListener('mouseup', (e) => { if (e.button === 0) mouse.down = false; });
    window.addEventListener('contextmenu', (e) => e.preventDefault());
}

function screenToWorld(cx, cy, out) {
    _ndc.x = (cx / window.innerWidth) * 2 - 1;
    _ndc.y = -(cy / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(_ndc, camera);
    raycaster.ray.intersectPlane(groundPlane, out);
    return out;
}

// ===== Сцена / физика =====
function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    scene.fog = new THREE.Fog(0x0a0a1a, 120, 260);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 800);
    camera.position.set(28, 30, 28);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x2b2b45, 0.9));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(40, 55, 25);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -160, right: 160, top: 160, bottom: -160, near: 1, far: 400 });
    sun.shadow.bias = -0.0005;
    scene.add(sun);
}

function initPhysics() {
    world = new CANNON.World({ gravity: new CANNON.Vec3(0, -24, 0) });
    world.broadphase = new CANNON.SAPBroadphase(world);
    world.allowSleep = true;

    window.groundMat = new CANNON.Material('ground');
    window.bodyMat = new CANNON.Material('body');
    window.limbMat = new CANNON.Material('limb');

    world.addContactMaterial(new CANNON.ContactMaterial(window.groundMat, window.bodyMat, { friction: 0, restitution: 0 }));
    world.addContactMaterial(new CANNON.ContactMaterial(window.groundMat, window.limbMat, { friction: 0.6, restitution: 0.25 }));
    world.addContactMaterial(new CANNON.ContactMaterial(window.bodyMat, window.limbMat, { friction: 0.4, restitution: 0.1 }));
    world.addContactMaterial(new CANNON.ContactMaterial(window.limbMat, window.limbMat, { friction: 0.4, restitution: 0.1 }));
    world.defaultContactMaterial.friction = 0.4;

    initArena(scene, world);
}

function onResize() {
    if (!camera) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ===== Игровой цикл =====
let lastTime = 0;
function animate(time) {
    requestAnimationFrame(animate);
    if (!gameRunning || paused) { lastTime = time; return; }
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    world.step(1 / 60, dt, 3);
    updateGame(dt);
    renderer.render(scene, camera);
}

// ===== Обновление игры =====
function updateGame(dt) {
    updatePlayer(dt);
    updateEnemies(dt);
    updateCamera(dt);
    updateHpBars();
    if (player && player.swinging) checkSwordHits();
    if (enemies.length === 0 && player && player.alive) {
        // Все враги мертвы — между волнами
        showWaveRewards();
    }
}

function updatePlayer(dt) {
    if (!player || !player.alive) return;
    const body = player.coreBody;

    const baseSpeed = 9;
    const speed = baseSpeed * (1 + (player.speedBonus || 0)) * (player.speedMultiplier || 1);

    let mx = 0, mz = 0;
    if (keys['KeyW'] || keys['ArrowUp'])    mz -= 1;
    if (keys['KeyS'] || keys['ArrowDown'])  mz += 1;
    if (keys['KeyA'] || keys['ArrowLeft'])  mx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) mx += 1;
    const len = Math.hypot(mx, mz);
    if (len > 0) { mx /= len; mz /= len; }

    body.velocity.x = mx * speed;
    body.velocity.z = mz * speed;

    if (keys['Space'] && Math.abs(body.velocity.y) < 0.6) {
        body.velocity.y = 11 * (1 + (player.jumpBonus || 0));
    }

    // Прицел
    screenToWorld(mouse.x, mouse.y, _mouseWorld);
    const dx = _mouseWorld.x - body.position.x;
    const dz = _mouseWorld.z - body.position.z;
    if (dx * dx + dz * dz > 0.01) aimAngle = Math.atan2(dx, dz);

    // Синхронизация меша
    player.group.position.set(body.position.x, body.position.y - 0.9 * RS, body.position.z);
    player.group.rotation.y = aimAngle;

    // Замах / атака
    if (player.attackCooldown > 0) player.attackCooldown -= dt;
    if (mouse.down && player.attackCooldown <= 0 && !player.swinging) {
        player.attackCooldown = 0.5;
        player.swinging = true;
        player.swingElapsed = 0;
        player.hitThisSwing.clear();
        audio.hit(1400, 0.08, 0.35);
    }
    if (player.swinging) {
        player.swingElapsed += dt;
        const dur = 0.35;
        const t = player.swingElapsed / dur;
        if (t >= 1) {
            player.swinging = false;
            player.parts.arm_R.mesh.rotation.x = 0;
        } else {
            player.parts.arm_R.mesh.rotation.x = -Math.sin(t * Math.PI) * Math.PI * 1.2;
        }
    }
}

function checkSwordHits() {
    if (!player) return;
    const RANGE = 3.2;
    const DMG = (player.weapon === 'axe' ? 3 : 2) + (player.bonusDamage || 0);
    const px = player.coreBody.position.x;
    const pz = player.coreBody.position.z;

    for (const e of enemies) {
        if (!e.alive || player.hitThisSwing.has(e.id)) continue;
        const dx = e.coreBody.position.x - px;
        const dz = e.coreBody.position.z - pz;
        const d = Math.hypot(dx, dz);
        if (d > RANGE) continue;

        let da = Math.atan2(dx, dz) - aimAngle;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        if (Math.abs(da) > Math.PI / 2.5) continue;

        player.hitThisSwing.add(e.id);
        e.torsoHP -= DMG;
        audio.hit(2200, 0.12, 0.55);
        if (e.hpBar) updateHpBarSprite(e.hpBar, Math.max(0, e.torsoHP), e.maxTorsoHP);

        if (e.torsoHP <= 0) killEnemy(e);
    }
}

function killEnemy(e) {
    e.alive = false;
    kills++;
    xp += 25;
    scene.remove(e.group);
    if (e.hpBar) scene.remove(e.hpBar);
    world.removeBody(e.coreBody);
    enemies = enemies.filter(x => x !== e);
    robots = robots.filter(x => x !== e);
    updateHUD();
    checkLevelUp();
}

function updateEnemies(dt) {
    if (!player || !player.alive) return;
    const diff = DIFFICULTIES[currentDifficultyKey];

    for (const e of enemies) {
        if (!e.alive) continue;
        const dx = player.coreBody.position.x - e.coreBody.position.x;
        const dz = player.coreBody.position.z - e.coreBody.position.z;
        const d = Math.hypot(dx, dz) || 1;
        const speed = 3.4 * (e.speedMultiplier || 1);

        e.coreBody.velocity.x = (dx / d) * speed;
        e.coreBody.velocity.z = (dz / d) * speed;

        e.group.position.set(e.coreBody.position.x, e.coreBody.position.y - 0.9 * RS, e.coreBody.position.z);
        e.group.rotation.y = Math.atan2(dx, dz);

        // Урон игроку
        if (e.attackCooldown > 0) e.attackCooldown -= dt;
        if (d < 1.6 && e.attackCooldown <= 0) {
            e.attackCooldown = 1.0;
            damagePlayer(1);
        }
    }
}

function damagePlayer(amount) {
    if (!player || !player.alive) return;
    player.torsoHP -= amount;
    audio.thud(120, 0.25, 0.8);
    if (player.torsoHP <= 0) {
        player.torsoHP = 0;
        player.alive = false;
        endGame();
    }
    updateHUD();
}

function endGame() {
    gameRunning = false;
    audio.stopMusic();
    document.getElementById('finalStats').textContent =
        `Волна ${wave} · Убито ${kills} · Счёт ${kills * 100 + wave * 50}`;
    document.getElementById('gameover').style.display = 'flex';
}

function updateCamera(dt) {
    if (!player) return;
    const p = player.coreBody.position;
    const desired = new THREE.Vector3(p.x + 28, p.y + 30, p.z + 28);
    camera.position.lerp(desired, 1 - Math.pow(0.001, dt));
    camera.lookAt(p.x, p.y - 1, p.z);
}

function updateHpBars() {
    for (const e of enemies) {
        if (e.hpBar && e.alive) {
            e.hpBar.position.set(e.coreBody.position.x, e.coreBody.position.y + 2.2, e.coreBody.position.z);
        }
    }
}

// ===== Волны =====
function spawnWave() {
    wave++;
    buildArena(wave);
    const diff = DIFFICULTIES[currentDifficultyKey];
    const count = Math.max(3, Math.floor((3 + wave) * diff.enemyCountMul));
    for (let i = 0; i < count; i++) spawnEnemy(i, count);
    updateHUD();
    showBanner(`ВОЛНА ${wave}`, 1500);
}

function spawnEnemy(index, total) {
    const diff = DIFFICULTIES[currentDifficultyKey];
    const angle = (index / total) * Math.PI * 2 + Math.random() * 0.4;
    const r = 60 + Math.random() * 10;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;

    const tpl = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
    const hp = Math.max(1, Math.round(tpl.hp * diff.enemyHPMul));

    const enemy = createRobotFromModule(scene, world, {
        position: [x, 2, z],
        color: tpl.color,
        eyeColor: 0xff2200,
        isPlayer: false,
        maxTorsoHP: hp,
        scale: 1.0,
        speedMultiplier: tpl.speed / 3.4
    });
    enemy.hpBar = createHpBarSprite();
    scene.add(enemy.hpBar);
    updateHpBarSprite(enemy.hpBar, hp, hp);

    enemies.push(enemy);
    robots.push(enemy);
}

// ===== Апгрейды / уровни =====
function checkLevelUp() {
    while (xp >= xpToNextLevel) {
        xp -= xpToNextLevel;
        level++;
        xpToNextLevel = Math.floor(xpToNextLevel * 1.35);
        audio.levelUp();
        openLevelPanel();
    }
    updateHUD();
}

function openLevelPanel() {
    const container = document.getElementById('levelChoices');
    document.getElementById('levelNum').textContent = level;
    container.innerHTML = '';
    const pool = [...PASSIVES].sort(() => Math.random() - 0.5).slice(0, 3);
    for (const p of pool) {
        const btn = document.createElement('button');
        btn.className = 'level-card';
        btn.innerHTML = `<div class="icon">${p.icon}</div>
            <div class="info"><div class="name">${p.name}</div><div class="desc">${p.desc}</div></div>`;
        btn.addEventListener('click', () => {
            p.apply(player);
            document.getElementById('levelPanel').classList.remove('show');
            paused = false;
            lastTime = performance.now();
            updateHUD();
        });
        container.appendChild(btn);
    }
    document.getElementById('levelPanel').classList.add('show');
    paused = true;
}

// ===== Награды между волнами =====
let betweenWaveTimer = null;
function showWaveRewards() {
    if (betweenWaveTimer) return;
    betweenWaveTimer = setTimeout(() => {
        betweenWaveTimer = null;
        if (!gameRunning || paused) return;

        paused = true;
        const grid = document.getElementById('rewardGrid');
        document.getElementById('nextWaveNum').textContent = wave + 1;
        grid.innerHTML = '';
        for (const r of REWARDS) {
            const btn = document.createElement('button');
            btn.className = 'reward-card';
            btn.innerHTML = `<div class="r-icon">${r.icon}</div>
                <div class="r-name">${r.name}</div><div class="r-desc">${r.desc}</div>`;
            btn.addEventListener('click', () => {
                applyReward(r.type);
                closeBetweenPanel();
            });
            grid.appendChild(btn);
        }
        document.getElementById('skipBtn').onclick = closeBetweenPanel;
        document.getElementById('betweenPanel').classList.add('show');
    }, 800);
}

function applyReward(type) {
    if (type === 'heal') {
        player.torsoHP = Math.min(player.maxTorsoHP, player.torsoHP + 2);
        audio.reward();
    } else if (type === 'ally') {
        window.spawnAlly();
        audio.reward();
    } else if (type === 'xp') {
        xp += xpToNextLevel;
        checkLevelUp();
    }
    updateHUD();
}

function closeBetweenPanel() {
    document.getElementById('betweenPanel').classList.remove('show');
    paused = false;
    lastTime = performance.now();
    spawnWave();
}

// ===== Спец / союзники / ремонт =====
function triggerSpecial() {
    if (!player || player.specialCooldown > 0) { audio.cooldownBlocked(); return; }
    player.specialCooldown = 6;
    audio.special();
    showBanner('СПЕЦ!', 800);

    const px = player.coreBody.position.x;
    const pz = player.coreBody.position.z;
    for (const e of enemies) {
        const dx = e.coreBody.position.x - px;
        const dz = e.coreBody.position.z - pz;
        if (dx * dx + dz * dz < 64) {
            e.torsoHP -= 4;
            if (e.hpBar) updateHpBarSprite(e.hpBar, Math.max(0, e.torsoHP), e.maxTorsoHP);
            if (e.torsoHP <= 0) killEnemy(e);
        }
    }
}

// ===== Старт / game over =====
export function startGame(difficulty) {
    currentDifficultyKey = difficulty;

    for (const r of robots) {
        if (r.group) scene.remove(r.group);
        if (r.coreBody) world.removeBody(r.coreBody);
        if (r.hpBar) scene.remove(r.hpBar);
    }
    robots = []; enemies = []; allies = []; severedLimbs = []; arrows = []; corpses = [];

    wave = 0; kills = 0; level = 1; xp = 0; xpToNextLevel = 100;

    loadCustomization();
    createPlayer();

    gameRunning = true;
    paused = false;

    document.getElementById('startMenu').style.display = 'none';
    document.getElementById('gameover').style.display = 'none';
    document.getElementById('betweenPanel').classList.remove('show');
    document.getElementById('levelPanel').classList.remove('show');

    audio.init();
    audio.resume();
    audio.startMusic();

    spawnWave();
    updateHUD();
    lastTime = performance.now();
}

function createPlayer() {
    const diff = DIFFICULTIES[currentDifficultyKey];
    player = createRobotFromModule(scene, world, {
        position: [0, 2, 0],
        color: customization.bodyColor,
        eyeColor: customization.eyeColor,
        shoulderColor: customization.shoulderColor,
        isPlayer: true,
        maxTorsoHP: diff.playerHP,
        scale: 1.0,
        speedMultiplier: 1.0
    });
    player.weapon = 'sword';
    player.savedWeapon = 'sword';
    player.specialCooldown = 0;
    robots.push(player);
}

// ===== HUD =====
export function updateHUD() {
    if (!player) return;
    document.getElementById('levelHud').textContent = level;
    document.getElementById('waveNum').textContent = wave > 0 ? wave : '—';
    document.getElementById('killCount').textContent = kills;
    document.getElementById('enemyCount').textContent = enemies.length;

    const hpEl = document.getElementById('hpVal');
    hpEl.textContent = `${Math.max(0, player.torsoHP)} / ${player.maxTorsoHP}`;
    hpEl.className = player.torsoHP > player.maxTorsoHP * 0.66 ? 'hp-high'
                    : player.torsoHP > player.maxTorsoHP * 0.33 ? 'hp-mid' : 'hp-low';

    document.getElementById('weaponName').textContent = player.weapon ? player.weapon.toUpperCase() : '—';
    document.getElementById('xpFill').style.width = `${(xp / xpToNextLevel) * 100}%`;
}

export function showBanner(text, duration = 1500) {
    const b = document.getElementById('banner');
    b.textContent = text;
    b.classList.add('show');
    setTimeout(() => b.classList.remove('show'), duration);
}

// ===== Инициализация =====
export function initGame() {
    loadCustomization();
    initScene();
    initPhysics();
    initInput();

    window.addEventListener('resize', onResize);
    setupUIHandlers();
    requestAnimationFrame(animate);
}

function setupUIHandlers() {
    document.querySelectorAll('.diff-buttons button').forEach(btn => {
        btn.addEventListener('click', () => startGame(btn.dataset.diff));
    });

    document.getElementById('soundToggle').addEventListener('click', () => {
        audio.setEnabled(!audio.enabled);
    });
    document.getElementById('pauseBtn').addEventListener('click', togglePause);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && gameRunning) togglePause();
    });

    document.getElementById('resumeBtn').addEventListener('click', togglePause);
    document.getElementById('quitBtn').addEventListener('click', () => {
        gameRunning = false;
        paused = false;
        document.getElementById('startMenu').style.display = 'flex';
        document.getElementById('pauseOverlay').classList.remove('show');
        audio.stopMusic();
    });

    document.getElementById('retryBtn').addEventListener('click', () => {
        document.getElementById('gameover').style.display = 'none';
        startGame(currentDifficultyKey);
    });
    document.getElementById('menuBtn').addEventListener('click', () => {
        document.getElementById('gameover').style.display = 'none';
        document.getElementById('startMenu').style.display = 'flex';
    });
}

function togglePause() {
    if (!gameRunning) return;
    paused = !paused;
    const ov = document.getElementById('pauseOverlay');
    if (paused) { ov.classList.add('show'); audio.stopMusic(); }
    else { ov.classList.remove('show'); audio.resume(); audio.startMusic(); lastTime = performance.now(); }
}

// ===== Мосты в window для UI/наград =====
window.repairPlayerLimbs = function () {
    if (!player) return 0;
    const before = player.torsoHP;
    player.torsoHP = Math.min(player.maxTorsoHP, player.torsoHP + 2);
    updateHUD();
    return player.torsoHP - before;
};

window.spawnAlly = function () {
    if (!player) return;
    const p = player.coreBody.position;
    const ally = createRobotFromModule(scene, world, {
        position: [p.x + 3, 2, p.z + 3],
        color: 0x44cc88,
        eyeColor: 0x66ffff,
        isPlayer: false,
        maxTorsoHP: 3,
        scale: 0.9,
        speedMultiplier: 1.0
    });
    ally.isAlly = true;
    allies.push(ally);
    robots.push(ally);
};

window.showBanner = showBanner;
window.updateHUD = updateHUD;
