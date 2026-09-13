/**
 * Waves Module - Система волн и спавна врагов
 * Отвечает за управление волнами, спавн врагов и боссов
 */

import { DIFFICULTIES, BOSSES, ENEMY_TYPES, SAFE_RADIUS } from './robots.js';
import { showBanner } from './ui.js';

/**
 * Проверяет статус волны и запускает следующую если все враги убиты
 * @param {Array} enemies - Массив врагов
 * @param {Function} startNextWaveCallback - Функция запуска следующей волны
 */
export function checkWaveStatus(enemies, startNextWaveCallback) {
    const activeEnemies = enemies.filter(e => e.alive).length;

    if (activeEnemies === 0 && currentWave > 0) {
        setTimeout(startNextWaveCallback, 1000);
    }
}

let currentWave = 0;

/**
 * Запускает следующую волну
 * @param {Function} incrementWaveCallback - Функция увеличения счётчика волн
 * @param {Function} buildArenaCallback - Функция построения арены
 * @param {Function} spawnEnemiesCallback - Функция спавна врагов
 * @param {Function} showRewardPanelCallback - Функция показа панели наград
 */
export function startNextWave(
    incrementWaveCallback,
    buildArenaCallback,
    spawnEnemiesCallback,
    showRewardPanelCallback
) {
    currentWave++;
    showBanner(`ВОЛНА ${currentWave}`, 2000);

    if (buildArenaCallback) {
        buildArenaCallback(currentWave);
    }

    if (spawnEnemiesCallback) {
        spawnEnemiesCallback(currentWave);
    }

    if (currentWave > 1 && showRewardPanelCallback) {
        showRewardPanelCallback(currentWave);
    }
}

/**
 * Получает текущий номер волны
 * @returns {number} Номер текущей волны
 */
export function getCurrentWave() {
    return currentWave;
}

/**
 * Сбрасывает счётчик волн
 */
export function resetWaveCounter() {
    currentWave = 0;
}

/**
 * Спавнит врагов для текущей волны
 * @param {Object} scene - Three.js сцена
 * @param {Object} world - Cannon.js мир
 * @param {string} difficultyKey - Ключ сложности
 * @param {Function} createRobotCallback - Функция создания робота
 * @param {Array} enemiesArray - Массив для добавления врагов
 * @param {Array} robotsArray - Массив всех роботов
 */
export function spawnEnemies(
    scene,
    world,
    difficultyKey,
    createRobotCallback,
    enemiesArray,
    robotsArray
) {
    enemiesArray.length = 0; // Очистка массива

    const diff = DIFFICULTIES[difficultyKey];
    const baseCount = Math.floor(3 + currentWave * 1.5 * diff.enemyCountMul);
    const count = Math.min(baseCount, 20);

    // Проверка на босс-волну
    const bossWave = BOSSES[currentWave];
    if (bossWave) {
        spawnBoss(scene, world, bossWave, createRobotCallback, enemiesArray, robotsArray);
    }

    // Спавн обычных врагов
    for (let i = 0; i < count; i++) {
        spawnEnemy(scene, world, difficultyKey, createRobotCallback, enemiesArray, robotsArray);
    }
}

/**
 * Спавнит одного врага
 * @param {Object} scene - Three.js сцена
 * @param {Object} world - Cannon.js мир
 * @param {string} difficultyKey - Ключ сложности
 * @param {Function} createRobotCallback - Функция создания робота
 * @param {Array} enemiesArray - Массив для добавления врагов
 * @param {Array} robotsArray - Массив всех роботов
 */
function spawnEnemy(scene, world, difficultyKey, createRobotCallback, enemiesArray, robotsArray) {
    const diff = DIFFICULTIES[difficultyKey];
    const angle = Math.random() * Math.PI * 2;
    const radius = SAFE_RADIUS + 5 + Math.random() * 20;
    const pos = [Math.cos(angle) * radius, 2, Math.sin(angle) * radius];

    const enemyType = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
    const hp = Math.floor(enemyType.hp * diff.enemyHPMul * (1 + currentWave * 0.1));

    const enemy = createRobotCallback(scene, world, {
        position: pos,
        color: enemyType.color,
        eyeColor: 0xff0000,
        isEnemy: true,
        maxTorsoHP: hp,
        scale: 1.0,
        speedMultiplier: enemyType.speed / 2.2
    });

    enemy.enemyType = enemyType;
    enemy.savedWeapon = 'sword';
    enemy.weapon = 'sword';
    enemy.damage = enemyType.damage;

    robotsArray.push(enemy);
    enemiesArray.push(enemy);
}

/**
 * Спавнит босса
 * @param {Object} scene - Three.js сцена
 * @param {Object} world - Cannon.js мир
 * @param {Object} bossType - Тип босса
 * @param {Function} createRobotCallback - Функция создания робота
 * @param {Array} enemiesArray - Массив для добавления врагов
 * @param {Array} robotsArray - Массив всех роботов
 */
function spawnBoss(scene, world, bossType, createRobotCallback, enemiesArray, robotsArray) {
    const angle = Math.random() * Math.PI * 2;
    const radius = SAFE_RADIUS + 10;
    const pos = [Math.cos(angle) * radius, 2, Math.sin(angle) * radius];

    const boss = createRobotCallback(scene, world, {
        position: pos,
        color: bossType.color,
        eyeColor: 0xff0000,
        isEnemy: true,
        isBoss: true,
        bossType: bossType,
        maxTorsoHP: bossType.hp,
        scale: bossType.scale,
        speedMultiplier: bossType.speed / 2.2
    });

    boss.savedWeapon = 'sword';
    boss.weapon = 'sword';
    boss.damage = bossType.damage;

    robotsArray.push(boss);
    enemiesArray.push(boss);

    showBanner(`${bossType.name}`, 2000);
}

/**
 * Конфигурация волн с предустановленными паттернами
 */
export const WAVE_PATTERNS = {
    // Легкие волны
    easy: {
        1: { enemies: 3, types: ['basic'] },
        2: { enemies: 4, types: ['basic', 'fast'] },
        3: { enemies: 5, types: ['basic', 'tank'] }
    },
    // Нормальные волны
    normal: {
        1: { enemies: 4, types: ['basic'] },
        2: { enemies: 6, types: ['basic', 'fast'] },
        3: { enemies: 8, types: ['basic', 'tank', 'ranged'] }
    },
    // Сложные волны
    hard: {
        1: { enemies: 5, types: ['basic', 'fast'] },
        2: { enemies: 8, types: ['basic', 'fast', 'tank'] },
        3: { enemies: 10, types: ['basic', 'fast', 'tank', 'ranged'] }
    }
};

/**
 * Получает конфигурацию волны
 * @param {string} difficultyKey - Ключ сложности
 * @param {number} waveNumber - Номер волны
 * @returns {Object} Конфигурация волны
 */
export function getWavePattern(difficultyKey, waveNumber) {
    const patterns = WAVE_PATTERNS[difficultyKey];
    if (!patterns) return null;

    // Если есть точное совпадение
    if (patterns[waveNumber]) {
        return patterns[waveNumber];
    }

    // Прогрессивная сложность для высоких волн
    const basePattern = patterns[Math.min(waveNumber, 3)] || patterns[1];
    if (!basePattern) return null;

    return {
        enemies: Math.floor(basePattern.enemies * (1 + (waveNumber - 1) * 0.3)),
        types: basePattern.types,
        boss: waveNumber % 5 === 0 // Босс каждые 5 волн
    };
}

/**
 * Создаёт пул врагов для предварительной загрузки
 * @param {Object} scene - Three.js сцена
 * @param {Object} world - Cannon.js мир
 * @param {Function} createRobotCallback - Функция создания робота
 * @param {number} poolSize - Размер пула
 * @returns {Array} Пул неактивных врагов
 */
export function createEnemyPool(scene, world, createRobotCallback, poolSize = 10) {
    const pool = [];

    for (let i = 0; i < poolSize; i++) {
        const enemy = createRobotCallback(scene, world, {
            position: [-100, -100, -100], // Спрятать за пределами арены
            color: 0x888888,
            eyeColor: 0xff0000,
            isEnemy: true,
            maxTorsoHP: 1,
            scale: 1.0
        });

        enemy.alive = false;
        enemy.coreBody.sleep();
        pool.push(enemy);
    }

    return pool;
}

/**
 * Активирует врага из пула
 * @param {Object} enemy - Враг из пула
 * @param {Array} position - Позиция спавна
 * @param {Object} enemyType - Тип врага
 * @param {number} hp - Здоровье
 */
export function activateEnemyFromPool(enemy, position, enemyType, hp) {
    enemy.coreBody.position.set(position[0], position[1], position[2]);
    enemy.coreBody.wakeUp();
    enemy.alive = true;
    enemy.torsoHP = hp;
    enemy.maxTorsoHP = hp;
    enemy.enemyType = enemyType;
    enemy.weapon = 'sword';
    enemy.damage = enemyType.damage;
}
