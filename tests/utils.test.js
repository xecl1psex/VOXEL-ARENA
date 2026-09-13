// ============================================
// Тесты утилитарных функций VOXEL ARENA
// ============================================

import { describe, it, expect } from 'vitest';
import {
    randomRange,
    randomInt,
    randomChoice,
    distance,
    horizontalDistance,
    distanceSquared,
    normalizeAngle,
    lerp,
    easeOut,
    formatNumber,
    formatTime,
    clamp,
    mapRange,
    deepClone,
    sleep
} from '../utils.js';

describe('Utils - Random Functions', () => {
    it('randomRange возвращает число в диапазоне', () => {
        for (let i = 0; i < 100; i++) {
            const result = randomRange(1, 10);
            expect(result).toBeGreaterThanOrEqual(1);
            expect(result).toBeLessThanOrEqual(10);
        }
    });

    it('randomInt возвращает целое число в диапазоне', () => {
        for (let i = 0; i < 100; i++) {
            const result = randomInt(1, 10);
            expect(Number.isInteger(result)).toBe(true);
            expect(result).toBeGreaterThanOrEqual(1);
            expect(result).toBeLessThanOrEqual(10);
        }
    });

    it('randomChoice выбирает элемент из массива', () => {
        const array = [1, 2, 3, 4, 5];
        const result = randomChoice(array);
        expect(array).toContain(result);
    });

    it('randomChoice возвращает null для пустого массива', () => {
        expect(randomChoice([])).toBeNull();
        expect(randomChoice(null)).toBeNull();
    });
});

describe('Utils - Distance Functions', () => {
    it('distance вычисляет правильное расстояние', () => {
        const point1 = { x: 0, y: 0, z: 0 };
        const point2 = { x: 3, y: 4, z: 0 };
        expect(distance(point1, point2)).toBeCloseTo(5, 5);
    });

    it('horizontalDistance игнорирует Y координату', () => {
        const point1 = { x: 0, y: 10, z: 0 };
        const point2 = { x: 3, y: 20, z: 4 };
        expect(horizontalDistance(point1, point2)).toBeCloseTo(5, 5);
    });

    it('distanceSquared возвращает квадрат расстояния', () => {
        const point1 = { x: 0, y: 0, z: 0 };
        const point2 = { x: 3, y: 4, z: 0 };
        expect(distanceSquared(point1, point2)).toBe(25);
    });
});

describe('Utils - Math Functions', () => {
    it('normalizeAngle нормализует угол до [0, 2π)', () => {
        expect(normalizeAngle(0)).toBe(0);
        expect(normalizeAngle(Math.PI * 2)).toBe(0);
        expect(normalizeAngle(-Math.PI)).toBeCloseTo(Math.PI, 5);
        expect(normalizeAngle(Math.PI * 3)).toBeCloseTo(Math.PI, 5);
    });

    it('lerp интерполирует между значениями', () => {
        expect(lerp(0, 10, 0)).toBe(0);
        expect(lerp(0, 10, 1)).toBe(10);
        expect(lerp(0, 10, 0.5)).toBe(5);
    });

    it('easeOut интерполирует с замедлением', () => {
        expect(easeOut(0, 10, 0)).toBe(0);
        expect(easeOut(0, 10, 1)).toBe(10);
        expect(easeOut(0, 10, 0.5)).toBeGreaterThan(lerp(0, 10, 0.5));
    });

    it('clamp ограничивает значение диапазоном', () => {
        expect(clamp(5, 0, 10)).toBe(5);
        expect(clamp(-5, 0, 10)).toBe(0);
        expect(clamp(15, 0, 10)).toBe(10);
    });

    it('mapRange маппит значение между диапазонами', () => {
        expect(mapRange(5, 0, 10, 0, 100)).toBe(50);
        expect(mapRange(0, 0, 10, 0, 100)).toBe(0);
        expect(mapRange(10, 0, 10, 0, 100)).toBe(100);
    });
});

describe('Utils - Format Functions', () => {
    it('formatNumber форматирует числа с разделителями', () => {
        expect(formatNumber(1000)).toBe('1 000');
        expect(formatNumber(1000000)).toBe('1 000 000');
        expect(formatNumber(123)).toBe('123');
    });

    it('formatTime форматирует время в MM:SS', () => {
        expect(formatTime(0)).toBe('00:00');
        expect(formatTime(65)).toBe('01:05');
        expect(formatTime(3661)).toBe('61:01');
    });
});

describe('Utils - Object Functions', () => {
    it('deepClone создаёт глубокую копию объекта', () => {
        const original = { a: 1, b: { c: 2, d: [3, 4] } };
        const clone = deepClone(original);

        expect(clone).toEqual(original);
        expect(clone).not.toBe(original);
        expect(clone.b).not.toBe(original.b);
        expect(clone.b.d).not.toBe(original.b.d);

        clone.b.c = 999;
        expect(original.b.c).toBe(2);
    });
});

describe('Utils - Async Functions', () => {
    it('sleep задерживает выполнение', async () => {
        const start = Date.now();
        await sleep(100);
        const end = Date.now();
        expect(end - start).toBeGreaterThanOrEqual(95);
    });
});
