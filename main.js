// Главный игровой модуль VOXEL ARENA

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { RS, m3, GROUP_GROUND, GROUP_PLAYER, GROUP_LIMB, DIFFICULTIES, customization, loadCustomization, saveCustomization } from './robots.js';
import { audio } from './audio.js';
import { initArena, buildArena, clearArena } from './arena.js';
import { createRobot as createRobotFromModule } from './robots.js';

// Глобальные переменные игры
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

// Инициализация сцены
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

    // Освещение
    scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x2b2b45, 0.9));
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.6);
    sunLight.position.set(40, 55, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    Object.assign(sunLight.shadow.camera, { left: -160, right: 160, top: 160, bottom: -160, near: 1, far: 400 });
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);
}

// Инициализация физики
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

// Обработка изменения размера окна
function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Игровой цикл
let lastTime = 0;
function animate(time) {
    requestAnimationFrame(animate);

    if (!gameRunning || paused) {
        lastTime = time;
        return;
    }

    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    // Обновление физики
    world.step(1 / 60, dt, 3);

    // Обновление логики игры
    updateGame(dt);

    // Рендеринг
    renderer.render(scene, camera);
}

// Обновление игровой логики
function updateGame(dt) {
    // Здесь будет основная игровая логика
    // Движение игрока, враги, коллизии и т.д.
}

// Старт новой игры
export function startGame(difficulty) {
    currentDifficultyKey = difficulty;
    
    // Очистка предыдущей игры
    robots.forEach(r => {
        if (r.group) scene.remove(r.group);
        if (r.coreBody) world.removeBody(r.coreBody);
    });
    robots = [];
    enemies = [];
    allies = [];
    severedLimbs = [];
    arrows = [];
    corpses = [];

    // Сброс статистики
    wave = 0;
    kills = 0;
    level = 1;
    xp = 0;
    xpToNextLevel = 100;

    // Загрузка кастомизации
    loadCustomization();

    // Создание игрока
    createPlayer();

    // Построение арены
    buildArena(1);

    gameRunning = true;
    paused = false;

    // Скрытие меню
    document.getElementById('startMenu').style.display = 'none';
    document.getElementById('gameover').style.display = 'none';

    // Запуск звука
    audio.init();
    audio.resume();
    audio.startMusic();

    updateHUD();
}

// Создание игрока
function createPlayer() {
    const diff = DIFFICULTIES[currentDifficultyKey];
    const startPos = [0, 2, 0];

    player = createRobotFromModule(scene, world, {
        position: startPos,
        color: customization.bodyColor,
        eyeColor: customization.eyeColor,
        shoulderColor: customization.shoulderColor,
        isPlayer: true,
        maxTorsoHP: diff.playerHP,
        scale: 1.0,
        speedMultiplier: 1.0
    });

    // Начальное оружие
    equipWeapon(player, 'sword');
    robots.push(player);
}

// Заглушка для экипировки оружия
function equipWeapon(robot, weaponType) {
    robot.weapon = weaponType;
    robot.savedWeapon = weaponType;
}

// Обновление HUD
export function updateHUD() {
    if (!player) return;

    document.getElementById('levelHud').textContent = level;
    document.getElementById('waveNum').textContent = wave > 0 ? wave : '—';
    document.getElementById('killCount').textContent = kills;

    const hpEl = document.getElementById('hpVal');
    hpEl.textContent = `${player.torsoHP} / ${player.maxTorsoHP}`;
    hpEl.className = player.torsoHP > player.maxTorsoHP * 0.66 ? 'hp-high' : 
                     player.torsoHP > player.maxTorsoHP * 0.33 ? 'hp-mid' : 'hp-low';

    document.getElementById('weaponName').textContent = player.weapon ? player.weapon.toUpperCase() : '—';

    const xpPercent = (xp / xpToNextLevel) * 100;
    document.getElementById('xpFill').style.width = `${xpPercent}%`;
}

// Показ баннера
export function showBanner(text, duration = 1500) {
    const banner = document.getElementById('banner');
    banner.textContent = text;
    banner.classList.add('show');
    setTimeout(() => banner.classList.remove('show'), duration);
}

// Главная функция инициализации
export function initGame() {
    loadCustomization();
    initScene();
    initPhysics();

    window.addEventListener('resize', onResize);

    // Обработчики UI
    setupUIHandlers();

    // Запуск цикла рендеринга
    requestAnimationFrame(animate);
}

// Настройка обработчиков UI
function setupUIHandlers() {
    // Кнопки сложности
    document.querySelectorAll('.diff-buttons button').forEach(btn => {
        btn.addEventListener('click', () => {
            const diff = btn.dataset.diff;
            startGame(diff);
        });
    });

    // Кнопка звука
    document.getElementById('soundToggle').addEventListener('click', () => {
        audio.setEnabled(!audio.enabled);
    });

    // Кнопка паузы
    document.getElementById('pauseBtn').addEventListener('click', togglePause);

    // ESC для паузы
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && gameRunning) {
            togglePause();
        }
    });

    // Кнопки паузы
    document.getElementById('resumeBtn').addEventListener('click', togglePause);
    document.getElementById('quitBtn').addEventListener('click', () => {
        gameRunning = false;
        document.getElementById('startMenu').style.display = 'flex';
        document.getElementById('pauseOverlay').classList.remove('show');
        audio.stopMusic();
    });

    // Кнопки game over
    document.getElementById('retryBtn').addEventListener('click', () => {
        document.getElementById('gameover').style.display = 'none';
        startGame(currentDifficultyKey);
    });
    document.getElementById('menuBtn').addEventListener('click', () => {
        document.getElementById('gameover').style.display = 'none';
        document.getElementById('startMenu').style.display = 'flex';
    });
}

// Переключение паузы
function togglePause() {
    if (!gameRunning) return;
    paused = !paused;
    
    const pauseOverlay = document.getElementById('pauseOverlay');
    if (paused) {
        pauseOverlay.classList.add('show');
        audio.stopMusic();
    } else {
        pauseOverlay.classList.remove('show');
        audio.resume();
        audio.startMusic();
        lastTime = performance.now();
    }
}

// Экспорт для использования в других модулях
window.repairPlayerLimbs = function() {
    // Заглушка - будет реализована
    return 0;
};

window.spawnAlly = function() {
    // Заглушка - будет реализована
};

window.showBanner = showBanner;
window.updateHUD = updateHUD;
