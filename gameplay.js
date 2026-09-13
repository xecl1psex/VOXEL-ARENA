// Модуль игровой логики VOXEL ARENA
// Содержит функции управления, атаки, ИИ и боя

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { RS, m3, GROUP_GROUND, GROUP_PLAYER, GROUP_LIMB } from './robots.js';
import { audio } from './audio.js';

/**
 * Глобальные переменные управления
 * @type {Object}
 */
export const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    MouseLeft: false,
    WheelUp: false,
    WheelDown: false
};

/**
 * Константы движения игрока
 */
export const MOVE_SPEED = 11;
export const AIR_CONTROL = 0.75;
export const JUMP_SPEED = 12;
export const GROUND_LERP = 0.85;

/**
 * Константы поведения врагов
 */
export const ENEMY_SPEED = 6.5;
export const ENEMY_ATTACK_RANGE = 4.2;
export const ENEMY_ATTACK_COOLDOWN = 1.3;
export const ENEMY_STOP_DIST = 2.8;

// Оружие - полная версия
export const WEAPONS = {
    sword: {
        name: 'МЕЧ',
        damage: 2,
        swingSpeed: 0.95,
        range: 5.0 * RS,
        hitDetection: 'swing',
        swingType: 'slash',
        hitWidth: 0.45,
        color: 0xd8e6ff,
        emissive: 0x2233aa,
        glow: 0x88aaff,
        handleSize: m3(0.1, 0.2, 0.1),
        guardSize: m3(0.34, 0.06, 0.1),
        bladeSize: m3(0.13, 0.75, 0.06),
        tipSize: m3(0.07, 0.1, 0.07),
        yOffset: -0.45 * RS,
        sensorBase: m3(0, 0.15, 0),
        sensorTip: m3(0, -0.95, 0),
        swingTiming: { windup: 0.1, strike: 0.07, recovery: 0.14 },
        special: { name: 'ВИХРЬ', duration: 0.7, radius: 5.5 * RS, damage: 3, cooldown: 4.0 }
    },
    spear: {
        name: 'КОПЬЁ',
        damage: 2,
        swingSpeed: 1.15,
        range: 6.5 * RS,
        hitDetection: 'swing',
        swingType: 'thrust',
        hitWidth: 0.35,
        color: 0xbbddaa,
        emissive: 0x336622,
        glow: 0x88ffaa,
        handleSize: m3(0.07, 0.2, 0.07),
        guardSize: m3(0.14, 0.04, 0.07),
        bladeSize: m3(0.06, 1.3, 0.04),
        tipSize: m3(0.11, 0.24, 0.07),
        yOffset: -0.55 * RS,
        sensorBase: m3(0, 0.15, 0),
        sensorTip: m3(0, -1.75, 0),
        swingTiming: { windup: 0.08, strike: 0.06, recovery: 0.12 },
        special: { name: 'ПРОБИВ', duration: 0.55, range: 9.0 * RS, damage: 3, cooldown: 3.5 }
    },
    axe: {
        name: 'ТОПОР',
        damage: 3,
        swingSpeed: 0.5,
        range: 5.2 * RS,
        hitDetection: 'swing',
        swingType: 'chop',
        hitWidth: 0.7,
        color: 0xccaa77,
        emissive: 0x553311,
        glow: 0xffaa44,
        handleSize: m3(0.09, 0.72, 0.09),
        guardSize: m3(0.1, 0.05, 0.1),
        bladeSize: m3(0.5, 0.34, 0.08),
        tipSize: m3(0.1, 0.1, 0.1),
        yOffset: -0.74 * RS,
        sensorBase: m3(0, -0.25, 0),
        sensorTip: m3(0.25, -0.58, 0),
        swingTiming: { windup: 0.2, strike: 0.12, recovery: 0.24 },
        special: {
            name: 'ОБРУШЕНИЕ',
            duration: 0.9,
            radius: 4.5 * RS,
            damage: 4,
            stunTime: 2.2,
            cooldown: 5.0
        }
    },
    bow: {
        name: 'ЛУК',
        damage: 2,
        swingSpeed: 0.9,
        range: 30,
        hitDetection: 'projectile',
        swingType: 'bow',
        projectileSpeed: 30,
        projectileGravity: 5,
        color: 0xaa7744,
        emissive: 0x442200,
        glow: 0xffcc77,
        yOffset: -0.4 * RS,
        chargeTime: 0.9,
        minChargeToFire: 0.25,
        minDamage: 1,
        maxDamage: 3,
        minSpeed: 18,
        maxSpeed: 38
    }
};

export const WEAPON_ORDER = ['sword', 'spear', 'axe', 'bow'];
export const WEAPON_KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4'];

// Проверка заземления
export function isGrounded(robot, world) {
    const pos = robot.coreBody.position;
    const rayFrom = new CANNON.Vec3(pos.x, pos.y - 0.1 * RS * robot.scale, pos.z);
    const rayTo = new CANNON.Vec3(pos.x, pos.y - 0.5 * RS * robot.scale, pos.z);
    const result = new CANNON.RaycastResult();
    world.raycastClosest(rayFrom, rayTo, {}, result);
    return result.hasHit;
}

// Получение количества ног
export function getLegCount(robot) {
    let count = 0;
    if (robot.parts.leg_L && robot.parts.leg_L.alive) count++;
    if (robot.parts.leg_R && robot.parts.leg_R.alive) count++;
    return count;
}

// Получение конфигурации оружия
export function getWeaponCfg(robot) {
    return WEAPONS[robot.weapon] || null;
}

// Эффективный урон
export function effectiveDamage(robot, base) {
    let d = base + (robot.isPlayer ? robot.bonusDamage : robot.isAlly ? robot.bonusDamage : 0);
    if (robot.isPlayer && robot.berserk && robot.torsoHP / robot.maxTorsoHP < 0.5) {
        d *= 1 + robot.berserk;
    }
    return Math.round(d * 10) / 10;
}

// Эффективная скорость замаха
export function effectiveSwingSpeed(robot, base) {
    return base * (1 + (robot.swingSpeedBonus || 0));
}

// Эффективная дальность
export function effectiveRange(robot, base) {
    return base * (1 + (robot.rangeBonus || 0));
}

// Проверка наличия рук
export function robotHasArms(robot) {
    return (
        (robot.parts.arm_R && robot.parts.arm_R.alive) ||
        (robot.parts.arm_L && robot.parts.arm_L.alive)
    );
}

// Проверка наличия ног
export function robotHasLegs(robot) {
    return (
        (robot.parts.leg_L && robot.parts.leg_L.alive) ||
        (robot.parts.leg_R && robot.parts.leg_R.alive)
    );
}

// Проверка на полную потерю конечностей
export function robotIsDecommissioned(robot) {
    return !robotHasArms(robot) && !robotHasLegs(robot);
}

// Расстояние от точки до отрезка
export function pointSegDistSq(px, py, pz, ax, ay, az, bx, by, bz) {
    const abx = bx - ax,
        aby = by - ay,
        abz = bz - az;
    const apx = px - ax,
        apy = py - ay,
        apz = pz - az;
    const L = abx * abx + aby * aby + abz * abz;
    let t;
    if (L < 1e-6) t = 0;
    else t = Math.max(0, Math.min(1, (apx * abx + apy * aby + apz * abz) / L));
    const cx = ax + abx * t,
        cy = ay + aby * t,
        cz = az + abz * t;
    const dx = px - cx,
        dy = py - cy,
        dz = pz - cz;
    return dx * dx + dy * dy + dz * dz;
}

// Тайминги замаха
export function getSwingTiming(cfg, phase) {
    const t = cfg.swingTiming;
    const total = t.windup + t.strike + t.recovery;
    const norm = phase / total;
    if (norm < t.windup / total) return 'windup';
    if (norm < (t.windup + t.strike) / total) return 'strike';
    return 'recovery';
}

// Обновление анимации спецприёма
export function updateSpecialAnimation(robot, dt, cfg) {
    if (!cfg || !cfg.special) {
        robot.specialT = 0;
        return;
    }
    const arm = robot.parts.arm_R.mesh;
    const total = cfg.special.duration;
    robot.specialT = Math.max(0, robot.specialT - dt);
    const phase = 1 - robot.specialT / total;

    if (robot.specialType === 'spin') {
        arm.rotation.x = -Math.PI / 2;
        arm.rotation.y = phase * Math.PI * 2;
        arm.rotation.z = 0;
    } else if (robot.specialType === 'pierce') {
        arm.rotation.x = -Math.PI / 2;
        arm.rotation.y = 0;
        arm.rotation.z = 0;
        if (robot.weaponMesh) {
            robot.weaponMesh.position.z = 1.4 * RS * Math.sin(phase * Math.PI);
        }
    } else {
        let rx;
        if (phase < 0.3) {
            rx = -(phase / 0.3) * Math.PI * 0.9;
        } else if (phase < 0.55) {
            const t = (phase - 0.3) / 0.25;
            rx = -Math.PI * 0.9 + t * (Math.PI * 0.9 + Math.PI * 0.5);
        } else {
            const t = (phase - 0.55) / 0.45;
            rx = Math.PI * 0.5 * (1 - t);
        }
        arm.rotation.x = rx;
        arm.rotation.y = 0;
        arm.rotation.z = 0;
    }
}

// Применение урона спецприёма
export function applySpecialDamage(attacker, cfg, targets) {
    const sp = cfg.special;
    if (!sp) return;

    const ax = attacker.coreBody.position.x;
    const az = attacker.coreBody.position.z;
    const facing = attacker.facing;
    const dmg = effectiveDamage(attacker, sp.damage);

    for (const tgt of targets) {
        if (!tgt.alive) continue;

        const ex = tgt.coreBody.position.x;
        const ez = tgt.coreBody.position.z;
        const dx = ex - ax,
            dz = ez - az;
        const dist = Math.sqrt(dx * dx + dz * dz);

        let inR = false;
        if (attacker.specialType === 'spin') {
            inR = dist < sp.radius;
        } else if (attacker.specialType === 'pierce') {
            if (dist < sp.range && dist > 0.01) {
                inR = (Math.sin(facing) * dx) / dist + (Math.cos(facing) * dz) / dist > 0.9;
            }
        } else {
            if (dist < sp.radius) {
                inR = (Math.sin(facing) * dx) / dist + (Math.cos(facing) * dz) / dist > 0.5;
            }
        }

        if (!inR) continue;

        // damageTorso будет импортирована из основного модуля
        if (window.damageTorso) {
            window.damageTorso(
                tgt,
                new THREE.Vector3(ex, tgt.coreBody.position.y, ez),
                dmg,
                attacker
            );
        }

        if (attacker.specialType === 'smash' && sp.stunTime && tgt.alive) {
            tgt.stunT = Math.max(tgt.stunT, sp.stunTime);
            if (window.spawnSparks) {
                window.spawnSparks(
                    new THREE.Vector3(ex, tgt.coreBody.position.y + 0.6 * RS, ez),
                    14,
                    0xffeeaa
                );
            }
        }
    }
}
