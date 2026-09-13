// Главный игровой модуль VOXEL ARENA

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { RS, m3, GROUP_GROUND, GROUP_PLAYER, GROUP_LIMB, DIFFICULTIES, customization, loadCustomization, saveCustomization, WEAPONS, ENEMY_TYPES, BOSSES, PASSIVES, REWARDS, CORPSE_LIFETIME, updateHpBarSprite } from './robots.js';
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

// Глобальные переменные для ввода
const keys = {};
let cameraAngle = Math.PI / 4;
let cameraHeight = 8;
let cameraDistance = 12;

// Обновление игровой логики
function updateGame(dt) {
    if (!player || !player.alive) return;
    
    handleInput(dt);
    updateCamera();
    updateRobots(dt);
    updateProjectiles(dt);
    checkWaveStatus();
    updateHUD();
}

function handleInput(dt) {
    if (!player || !player.alive || paused) return;
    
    const moveSpeed = 5 * (1 + (player.speedBonus || 0));
    const direction = new THREE.Vector3();
    const forward = new THREE.Vector3(-Math.sin(cameraAngle), 0, -Math.cos(cameraAngle));
    const right = new THREE.Vector3(Math.cos(cameraAngle), 0, -Math.sin(cameraAngle));
    
    if (keys['KeyW'] || keys['ArrowUp']) direction.add(forward);
    if (keys['KeyS'] || keys['ArrowDown']) direction.sub(forward);
    if (keys['KeyA'] || keys['ArrowLeft']) direction.sub(right);
    if (keys['KeyD'] || keys['ArrowRight']) direction.add(right);
    
    if (direction.length() > 0) {
        direction.normalize();
        player.coreBody.velocity.x = direction.x * moveSpeed;
        player.coreBody.velocity.z = direction.z * moveSpeed;
        player.facing = Math.atan2(direction.x, direction.z);
        player.stepTimer += dt;
        if (player.stepTimer > 0.4) {
            player.stepTimer = 0;
            audio.step();
        }
    } else {
        player.coreBody.velocity.x = 0;
        player.coreBody.velocity.z = 0;
    }
    
    if ((keys['Space'] || keys['KeyE']) && Math.abs(player.coreBody.velocity.y) < 0.1) {
        player.coreBody.velocity.y = 6 + (player.jumpBonus || 0);
        audio.thud(200, 0.1, 0.3);
    }
    
    if (keys['MouseLeft'] && player.attackCooldown <= 0) {
        performAttack(player);
    }
    
    if (keys['Digit1']) equipWeapon(player, 'sword');
    if (keys['Digit2']) equipWeapon(player, 'axe');
    if (keys['Digit3']) equipWeapon(player, 'bow');
    if (keys['Digit4']) equipWeapon(player, 'spear');
    
    if (player.attackCooldown > 0) player.attackCooldown -= dt;
}

function updateCamera() {
    if (!player) return;
    const targetX = player.coreBody.position.x + Math.cos(cameraAngle) * cameraDistance;
    const targetZ = player.coreBody.position.z + Math.sin(cameraAngle) * cameraDistance;
    const targetY = player.coreBody.position.y + cameraHeight;
    camera.position.x += (targetX - camera.position.x) * 0.1;
    camera.position.z += (targetZ - camera.position.z) * 0.1;
    camera.position.y += (targetY - camera.position.y) * 0.1;
    camera.lookAt(player.coreBody.position.x, player.coreBody.position.y + 1, player.coreBody.position.z);
}

function updateRobots(dt) {
    for (const robot of robots) {
        if (!robot.alive) continue;
        robot.group.position.copy(robot.coreBody.position);
        robot.group.quaternion.copy(robot.coreBody.quaternion);
        if (robot.hpBar) {
            robot.hpBar.position.set(robot.coreBody.position.x, robot.coreBody.position.y + 2.5, robot.coreBody.position.z);
            robot.hpBar.lookAt(camera.position);
            updateHpBarSprite(robot.hpBar, robot.torsoHP, robot.maxTorsoHP);
        }
        if (robot.attackCooldown > 0) robot.attackCooldown -= dt;
        if (robot.isEnemy && robot.alive) updateEnemyAI(robot, dt);
    }
    for (let i = robots.length - 1; i >= 0; i--) {
        const r = robots[i];
        if (!r.alive && r.deathTimer > 0) {
            r.deathTimer -= dt;
            if (r.deathTimer <= 0) {
                disposeRobot(r);
                robots.splice(i, 1);
            }
        }
    }
}

function updateEnemyAI(enemy, dt) {
    if (!enemy.alive || !player.alive) return;
    const dist = enemy.coreBody.position.distanceTo(player.coreBody.position);
    const speed = (enemy.enemyType?.speed || 2) * enemy.scale;
    if (dist > 2.5) {
        const dir = new THREE.Vector3().subVectors(player.coreBody.position, enemy.coreBody.position).normalize();
        enemy.coreBody.velocity.x = dir.x * speed;
        enemy.coreBody.velocity.z = dir.z * speed;
        enemy.facing = Math.atan2(dir.x, dir.z);
    } else if (enemy.attackCooldown <= 0) {
        performAttack(enemy);
    }
}

function updateProjectiles(dt) {
    for (let i = arrows.length - 1; i >= 0; i--) {
        const arrow = arrows[i];
        arrow.life -= dt;
        if (arrow.life <= 0) {
            scene.remove(arrow.mesh);
            world.removeBody(arrow.body);
            arrows.splice(i, 1);
            continue;
        }
        arrow.body.position.vadd(arrow.body.velocity.scale(dt), arrow.body.position);
        for (const robot of robots) {
            if (!robot.alive || robot === arrow.owner || robot.isEnemy === arrow.owner.isEnemy) continue;
            if (arrow.body.position.distanceTo(robot.coreBody.position) < 1.5) {
                damageRobot(robot, arrow.damage + (arrow.owner?.bonusDamage || 0), arrow.owner);
                audio.hit(800, 0.15, 0.4);
                scene.remove(arrow.mesh);
                world.removeBody(arrow.body);
                arrows.splice(i, 1);
                break;
            }
        }
    }
}

function performAttack(attacker) {
    const weapon = WEAPONS.find(w => w.id === attacker.weapon);
    if (!weapon) return;
    attacker.attackCooldown = weapon.cooldown;
    attacker.swinging = true;
    attacker.hitThisSwing = new Set();
    const armGroup = attacker.parts['arm_R'];
    if (armGroup) armGroup.mesh.rotation.x = -Math.PI / 2;
    if (attacker.isPlayer) audio.hit(400, 0.1, 0.3);
    else audio.growl();
    setTimeout(() => {
        if (!attacker.alive) return;
        if (armGroup) armGroup.mesh.rotation.x = 0;
        attacker.swinging = false;
        const range = 3 + (attacker.rangeBonus || 0);
        for (const target of robots) {
            if (!target.alive || target === attacker || target.isEnemy === attacker.isEnemy || attacker.hitThisSwing.has(target)) continue;
            const dist = attacker.coreBody.position.distanceTo(target.coreBody.position);
            if (dist > range) continue;
            const dirToTarget = new THREE.Vector3().subVectors(target.coreBody.position, attacker.coreBody.position).normalize();
            const attackDir = new THREE.Vector3(-Math.sin(attacker.facing), 0, -Math.cos(attacker.facing));
            if (Math.acos(dirToTarget.dot(attackDir)) > Math.PI / 6) continue;
            attacker.hitThisSwing.add(target);
            damageRobot(target, weapon.damage + (attacker.bonusDamage || 0), attacker);
            if (attacker.isPlayer) audio.hit(300 + Math.random() * 200, 0.15, 0.5);
        }
    }, weapon.swingDuration * 700);
}

function damageRobot(target, damage, attacker) {
    if (!target.alive) return;
    if (target.armor > 0) damage = Math.max(1, damage - target.armor);
    if (attacker?.critChance > 0 && Math.random() < attacker.critChance) damage = Math.floor(damage * 1.5);
    target.torsoHP -= damage;
    if (target.torsoHP <= 0) killRobot(target, attacker);
    else {
        audio.thud(100, 0.2, 0.4);
        if (target.isPlayer) showBanner('УРОН!', 500);
    }
}

function killRobot(victim, killer) {
    victim.alive = false;
    victim.deathTimer = CORPSE_LIFETIME;
    victim.coreBody.mass = 1;
    victim.coreBody.updateMassProperties();
    victim.coreBody.allowSleep = true;
    if (victim.isEnemy) {
        kills++;
        const xpGain = victim.isBoss ? 50 : 10 + (victim.xpBonus || 0);
        addXP(xpGain);
        audio.thud(80, 0.4, 0.6);
        if (killer?.isPlayer && killer.lifesteal > 0) {
            const heal = Math.floor(killer.lifesteal);
            killer.torsoHP = Math.min(killer.maxTorsoHP, killer.torsoHP + heal);
            showBanner(`+${heal} HP`, 800);
        }
    } else if (victim.isPlayer) {
        gameOver();
    }
}

function addXP(amount) {
    xp += amount;
    if (xp >= xpToNextLevel) levelUp();
}

function levelUp() {
    level++;
    xp -= xpToNextLevel;
    xpToNextLevel = Math.floor(xpToNextLevel * 1.5);
    player.torsoHP = Math.min(player.maxTorsoHP, player.torsoHP + 1);
    showBanner(`УРОВЕНЬ ${level}!`, 2000);
    audio.levelUp();
    showUpgradePanel();
}

function showUpgradePanel() {
    paused = true;
    const panel = document.getElementById('levelPanel');
    document.getElementById('levelNum').textContent = level;
    const choicesEl = document.getElementById('levelChoices');
    choicesEl.innerHTML = '';
    const availablePassives = [...PASSIVES].sort(() => Math.random() - 0.5).slice(3);
    for (const passive of availablePassives) {
        const btn = document.createElement('button');
        btn.className = 'upgrade-choice';
        btn.innerHTML = `<span class="icon">${passive.icon}</span><div><b>${passive.name}</b><br><small>${passive.desc}</small></div>`;
        btn.onclick = () => {
            passive.apply(player);
            panel.style.display = 'none';
            paused = false;
            lastTime = performance.now();
        };
        choicesEl.appendChild(btn);
    }
    panel.style.display = 'flex';
}

function checkWaveStatus() {
    const activeEnemies = enemies.filter(e => e.alive).length;
    if (activeEnemies === 0 && wave > 0) setTimeout(startNextWave, 1000);
}

function startNextWave() {
    wave++;
    showBanner(`ВОЛНА ${wave}`, 2000);
    buildArena(wave);
    spawnEnemies();
    if (wave > 1) showRewardPanel();
}

function spawnEnemies() {
    enemies = [];
    const diff = DIFFICULTIES[currentDifficultyKey];
    const baseCount = Math.floor(3 + wave * 1.5 * diff.enemyCountMul);
    const count = Math.min(baseCount, 20);
    const bossWave = BOSSES[wave];
    if (bossWave) spawnBoss(bossWave);
    for (let i = 0; i < count; i++) spawnEnemy();
}

function spawnEnemy() {
    const diff = DIFFICULTIES[currentDifficultyKey];
    const angle = Math.random() * Math.PI * 2;
    const radius = SAFE_RADIUS + 5 + Math.random() * 20;
    const pos = [Math.cos(angle) * radius, 2, Math.sin(angle) * radius];
    const enemyType = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
    const hp = Math.floor(enemyType.hp * diff.enemyHPMul * (1 + wave * 0.1));
    const enemy = createRobotFromModule(scene, world, {
        position: pos, color: enemyType.color, eyeColor: 0xff0000,
        isEnemy: true, maxTorsoHP: hp, scale: 1.0, speedMultiplier: enemyType.speed / 2.2
    });
    enemy.enemyType = enemyType;
    enemy.savedWeapon = 'sword';
    enemy.weapon = 'sword';
    enemy.damage = enemyType.damage;
    robots.push(enemy);
    enemies.push(enemy);
}

function spawnBoss(bossType) {
    const angle = Math.random() * Math.PI * 2;
    const radius = SAFE_RADIUS + 10;
    const pos = [Math.cos(angle) * radius, 2, Math.sin(angle) * radius];
    const boss = createRobotFromModule(scene, world, {
        position: pos, color: bossType.color, eyeColor: 0xff0000,
        isEnemy: true, isBoss: true, bossType: bossType,
        maxTorsoHP: bossType.hp, scale: bossType.scale, speedMultiplier: bossType.speed / 2.2
    });
    boss.savedWeapon = 'sword';
    boss.weapon = 'sword';
    boss.damage = bossType.damage;
    robots.push(boss);
    enemies.push(boss);
    showBanner(`${bossType.name}`, 2000);
}

function showRewardPanel() {
    paused = true;
    const panel = document.getElementById('betweenPanel');
    document.getElementById('nextWaveNum').textContent = wave;
    const grid = document.getElementById('rewardGrid');
    grid.innerHTML = '';
    const availableRewards = [...REWARDS].sort(() => Math.random() - 0.5).slice(3);
    for (const reward of availableRewards) {
        const btn = document.createElement('button');
        btn.className = 'reward-choice';
        btn.innerHTML = `<span class="icon">${reward.icon}</span><div><b>${reward.name}</b><br><small>${reward.desc}</small></div>`;
        btn.onclick = () => {
            applyReward(reward);
            panel.style.display = 'none';
            paused = false;
            lastTime = performance.now();
        };
        grid.appendChild(btn);
    }
    panel.style.display = 'flex';
}

function applyReward(reward) {
    switch (reward.type) {
        case 'heal':
            player.torsoHP = Math.min(player.maxTorsoHP, player.torsoHP + 2);
            showBanner('+2 HP', 1000);
            audio.reward();
            break;
        case 'ally':
            window.spawnAlly();
            break;
        case 'xp':
            addXP(50);
            break;
    }
}

window.spawnAlly = function() {
    const angle = Math.random() * Math.PI * 2;
    const radius = 5;
    const pos = [
        player.coreBody.position.x + Math.cos(angle) * radius,
        2,
        player.coreBody.position.z + Math.sin(angle) * radius
    ];
    const ally = createRobotFromModule(scene, world, {
        position: pos, color: 0x44ff88, eyeColor: 0x00ffff,
        isAlly: true, maxTorsoHP: 5 + level * 2, scale: 1.0
    });
    ally.savedWeapon = 'sword';
    ally.weapon = 'sword';
    robots.push(ally);
    allies.push(ally);
    showBanner('СОЮЗНИК!', 1500);
};

function gameOver() {
    gameRunning = false;
    audio.stopMusic();
    const score = kills * 100 + wave * 500;
    document.getElementById('finalStats').textContent = `Волна ${wave} · Убито ${kills} · Счёт ${score}`;
    document.getElementById('gameover').style.display = 'flex';
}

function disposeRobot(robot) {
    if (robot.group) scene.remove(robot.group);
    if (robot.coreBody) world.removeBody(robot.coreBody);
    if (robot.hpBar) {
        scene.remove(robot.hpBar);
        robot.hpBar.material.dispose();
    }
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

// Обработчики ввода
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'KeyP' && gameRunning) togglePause();
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

document.addEventListener('mousedown', (e) => {
    if (e.button === 0) keys['MouseLeft'] = true;
});

document.addEventListener('mouseup', (e) => {
    if (e.button === 0) keys['MouseLeft'] = false;
});

document.addEventListener('wheel', (e) => {
    if (e.deltaY < 0) keys['WheelUp'] = true;
    else keys['WheelDown'] = true;
    setTimeout(() => {
        keys['WheelUp'] = false;
        keys['WheelDown'] = false;
    }, 50);
});

// Экспорт функций
export { WEAPONS, ENEMY_TYPES, BOSSES };
