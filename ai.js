/**
 * AI Module - Искусственный интеллект врагов и союзников
 * Отвечает за поведение ботов, навигацию и принятие решений
 */

import * as THREE from 'three';
import { performAttack } from './combat.js';

/**
 * Обновляет ИИ врага
 * @param {Object} enemy - Враг
 * @param {Object} player - Игрок
 * @param {number} dt - Дельта времени
 */
export function updateEnemyAI(enemy, player, dt) {
    if (!enemy.alive || !player?.alive) return;

    const dist = enemy.coreBody.position.distanceTo(player.coreBody.position);
    const speed = (enemy.enemyType?.speed || 2) * enemy.scale;

    // Если игрок далеко - преследовать
    if (dist > 2.5) {
        chaseTarget(enemy, player.coreBody.position, speed);
    }
    // Если игрок близко - атаковать
    else if (enemy.attackCooldown <= 0) {
        performAttack(enemy, [player]);
    }
}

/**
 * Обновляет ИИ союзника
 * @param {Object} ally - Союзник
 * @param {Object} player - Игрок
 * @param {Array} enemies - Массив врагов
 * @param {number} dt - Дельта времени
 */
export function updateAllyAI(ally, player, enemies, dt) {
    if (!ally.alive || !player?.alive) return;

    // Найти ближайшего живого врага
    const nearestEnemy = findNearestEnemy(ally, enemies);

    if (nearestEnemy && nearestEnemy.alive) {
        // Атаковать врага
        const dist = ally.coreBody.position.distanceTo(nearestEnemy.coreBody.position);
        const speed = (ally.speed || 2) * ally.scale;

        if (dist > 2.5) {
            chaseTarget(ally, nearestEnemy.coreBody.position, speed);
        } else if (ally.attackCooldown <= 0) {
            performAttack(ally, enemies);
        }
    } else {
        // Если врагов нет, следовать за игроком
        const distToPlayer = ally.coreBody.position.distanceTo(player.coreBody.position);
        if (distToPlayer > 5) {
            chaseTarget(ally, player.coreBody.position, 1.5);
        }
    }
}

/**
 * Преследует цель
 * @param {Object} robot - Робот
 * @param {THREE.Vector3} targetPos - Позиция цели
 * @param {number} speed - Скорость движения
 */
function chaseTarget(robot, targetPos, speed) {
    const dir = new THREE.Vector3().subVectors(targetPos, robot.coreBody.position).normalize();

    robot.coreBody.velocity.x = dir.x * speed;
    robot.coreBody.velocity.z = dir.z * speed;
    robot.facing = Math.atan2(dir.x, dir.z);
}

/**
 * Находит ближайшего врага
 * @param {Object} robot - Робот
 * @param {Array} enemies - Массив врагов
 * @returns {Object|null} Ближайший враг или null
 */
function findNearestEnemy(robot, enemies) {
    let nearest = null;
    let minDist = Infinity;

    for (const enemy of enemies) {
        if (!enemy.alive) continue;

        const dist = robot.coreBody.position.distanceTo(enemy.coreBody.position);
        if (dist < minDist) {
            minDist = dist;
            nearest = enemy;
        }
    }

    return nearest;
}

/**
 * Простое поведение патрулирования для спокойных состояний
 * @param {Object} robot - Робот
 * @param {Object} centerPoint - Центр патрулирования
 * @param {number} radius - Радиус патрулирования
 * @param {number} speed - Скорость движения
 * @param {number} dt - Дельта времени
 */
export function patrolBehavior(robot, centerPoint, radius, speed, dt) {
    if (!robot.alive) return;

    const currentPos = robot.coreBody.position;
    const distFromCenter = currentPos.distanceTo(centerPoint);

    // Если вышли за радиус - возвращаться
    if (distFromCenter > radius) {
        const dir = new THREE.Vector3().subVectors(centerPoint, currentPos).normalize();

        robot.coreBody.velocity.x = dir.x * speed;
        robot.coreBody.velocity.z = dir.z * speed;
        robot.facing = Math.atan2(dir.x, dir.z);
    } else {
        // Случайное блуждание в пределах радиуса
        if (!robot.patrolTimer || robot.patrolTimer <= 0) {
            robot.patrolTimer = 2 + Math.random() * 3;
            robot.patrolDirection = new THREE.Vector3(
                Math.random() - 0.5,
                0,
                Math.random() - 0.5
            ).normalize();
        }

        robot.patrolTimer -= dt;

        const velocity = robot.patrolDirection.clone().multiplyScalar(speed * 0.3);
        robot.coreBody.velocity.x = velocity.x;
        robot.coreBody.velocity.z = velocity.z;
        robot.facing = Math.atan2(velocity.x, velocity.z);
    }
}

/**
 * Поведение отступления при низком здоровье
 * @param {Object} robot - Робот
 * @param {Object} threatSource - Источник угрозы
 * @param {number} retreatSpeed - Скорость отступления
 */
export function retreatBehavior(robot, threatSource, retreatSpeed) {
    if (!robot.alive) return;

    const dir = new THREE.Vector3()
        .subVectors(robot.coreBody.position, threatSource.coreBody.position)
        .normalize();

    robot.coreBody.velocity.x = dir.x * retreatSpeed;
    robot.coreBody.velocity.z = dir.z * retreatSpeed;
    robot.facing = Math.atan2(dir.x, dir.z);
}

/**
 * Проверка состояния робота для выбора поведения
 * @param {Object} robot - Робот
 * @returns {string} Текущее состояние ('attack', 'chase', 'retreat', 'patrol')
 */
export function getRobotState(robot) {
    if (!robot.alive) return 'dead';

    const hpPercent = robot.torsoHP / robot.maxTorsoHP;

    // Отступление при критическом здоровье
    if (hpPercent < 0.2) {
        return 'retreat';
    }

    // Атака если есть цель в радиусе
    if (robot.currentTarget && robot.currentTarget.alive) {
        const dist = robot.coreBody.position.distanceTo(robot.currentTarget.coreBody.position);
        if (dist <= 2.5) {
            return 'attack';
        }
        return 'chase';
    }

    return 'patrol';
}
