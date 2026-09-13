/**
 * Combat Module - Система боя и урона
 * Отвечает за атаки, получение урона, критические удары и смерть персонажей
 */

import * as THREE from 'three';
import { WEAPONS, CORPSE_LIFETIME } from './robots.js';
import { audio } from './audio.js';
import { showBanner } from './ui.js';

/**
 * Выполняет атаку для указанного персонажа
 * @param {Object} attacker - Атакующий робот
 * @param {Array} robots - Массив всех роботов на арене
 */
export function performAttack(attacker, robots) {
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
            if (
                !target.alive ||
                target === attacker ||
                target.isEnemy === attacker.isEnemy ||
                attacker.hitThisSwing.has(target)
            )
                continue;

            const dist = attacker.coreBody.position.distanceTo(target.coreBody.position);
            if (dist > range) continue;

            const dirToTarget = new THREE.Vector3()
                .subVectors(target.coreBody.position, attacker.coreBody.position)
                .normalize();
            const attackDir = new THREE.Vector3(
                -Math.sin(attacker.facing),
                0,
                -Math.cos(attacker.facing)
            );

            if (Math.acos(dirToTarget.dot(attackDir)) > Math.PI / 6) continue;

            attacker.hitThisSwing.add(target);
            damageRobot(target, weapon.damage + (attacker.bonusDamage || 0), attacker);

            if (attacker.isPlayer) {
                audio.hit(300 + Math.random() * 200, 0.15, 0.5);
            }
        }
    }, weapon.swingDuration * 700);
}

/**
 * Наносит урон цели с учётом брони и критических ударов
 * @param {Object} target - Цель атаки
 * @param {number} damage - Базовый урон
 * @param {Object} attacker - Атакующий
 */
export function damageRobot(target, damage, attacker) {
    if (!target.alive) return;

    // Учёт брони
    if (target.armor > 0) {
        damage = Math.max(1, damage - target.armor);
    }

    // Критический удар
    if (attacker?.critChance > 0 && Math.random() < attacker.critChance) {
        damage = Math.floor(damage * 1.5);
    }

    target.torsoHP -= damage;

    if (target.torsoHP <= 0) {
        killRobot(target, attacker);
    } else {
        audio.thud(100, 0.2, 0.4);
        if (target.isPlayer) {
            showBanner('УРОН!', 500);
        }
    }
}

/**
 * Обрабатывает смерть робота
 * @param {Object} victim - Погибший робот
 * @param {Object} killer - Убийца
 * @param {Object} gameState - Состояние игры (kills, xp и т.д.)
 * @param {Function} addXPCallback - Функция добавления опыта
 * @param {Function} gameOverCallback - Функция конца игры
 */
export function killRobot(victim, killer, gameState, addXPCallback, gameOverCallback) {
    victim.alive = false;
    victim.deathTimer = CORPSE_LIFETIME;
    victim.coreBody.mass = 1;
    victim.coreBody.updateMassProperties();
    victim.coreBody.allowSleep = true;

    if (victim.isEnemy) {
        gameState.kills++;
        const xpGain = victim.isBoss ? 50 : 10 + (victim.xpBonus || 0);
        addXPCallback(xpGain);
        audio.thud(80, 0.4, 0.6);

        // Вампиризм
        if (killer?.isPlayer && killer.lifesteal > 0) {
            const heal = Math.floor(killer.lifesteal);
            killer.torsoHP = Math.min(killer.maxTorsoHP, killer.torsoHP + heal);
            showBanner(`+${heal} HP`, 800);
        }
    } else if (victim.isPlayer) {
        gameOverCallback();
    }
}

/**
 * Обновляет снаряды (стрелы) и проверяет попадания
 * @param {Array} arrows - Массив стрел
 * @param {Array} robots - Массив роботов
 * @param {Object} scene - Three.js сцена
 * @param {Object} world - Cannon.js мир
 */
export function updateProjectiles(arrows, robots, scene, world, dt) {
    for (let i = arrows.length - 1; i >= 0; i--) {
        const arrow = arrows[i];
        arrow.life -= dt;

        if (arrow.life <= 0) {
            scene.remove(arrow.mesh);
            world.removeBody(arrow.body);
            arrows.splice(i, 1);
            continue;
        }

        // Обновление позиции снаряда
        arrow.body.position.vadd(arrow.body.velocity.scale(dt), arrow.body.position);

        // Проверка попаданий
        for (const robot of robots) {
            if (!robot.alive || robot === arrow.owner || robot.isEnemy === arrow.owner.isEnemy)
                continue;

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

/**
 * Создаёт стрелу для лука
 * @param {Object} shooter - Стрелок
 * @param {Object} scene - Three.js сцена
 * @param {Object} world - Cannon.js мир
 * @returns {Object|null} Объект стрелы или null если оружие не лук
 */
export function createArrow(shooter, scene, world) {
    const weapon = WEAPONS.find(w => w.id === shooter.weapon);
    if (!weapon || weapon.id !== 'bow') return null;

    const arrowGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 4);
    const arrowMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);

    const arrowShape = new CANNON.Cylinder(0.05, 0.05, 0.8, 8);
    const arrowBody = new CANNON.Body({ mass: 0.1 });
    arrowBody.addShape(arrowShape);
    arrowBody.position.copy(shooter.coreBody.position);
    arrowBody.position.y += 1.5;

    const direction = new THREE.Vector3(
        -Math.sin(shooter.facing),
        0.1,
        -Math.cos(shooter.facing)
    ).normalize();

    const speed = 25;
    arrowBody.velocity.set(direction.x * speed, direction.y * speed, direction.z * speed);

    scene.add(arrowMesh);
    world.addBody(arrowBody);

    return {
        mesh: arrowMesh,
        body: arrowBody,
        life: 3,
        damage: weapon.damage,
        owner: shooter
    };
}
