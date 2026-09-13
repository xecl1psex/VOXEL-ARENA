// ============================================
// UTILS — Утилитарные функции VOXEL ARENA
// ============================================

/**
 * Генерация случайного числа в диапазоне
 * @param {number} min - Минимальное значение
 * @param {number} max - Максимальное значение
 * @returns {number} Случайное число
 */
export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Генерация случайного целого числа в диапазоне
 * @param {number} min - Минимальное значение (включительно)
 * @param {number} max - Максимальное значение (включительно)
 * @returns {number} Случайное целое число
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Выбор случайного элемента из массива
 * @template T
 * @param {T[]} array - Массив элементов
 * @returns {T|null} Случайный элемент или null если массив пуст
 */
export function randomChoice(array) {
    if (!array || array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Проверка расстояния между двумя точками
 * @param {Object} point1 - Первая точка с координатами x, y, z
 * @param {Object} point2 - Вторая точка с координатами x, y, z
 * @returns {number} Расстояние между точками
 */
export function distance(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const dz = point1.z - point2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Проверка расстояния по горизонтали (без учёта Y)
 * @param {Object} point1 - Первая точка
 * @param {Object} point2 - Вторая точка
 * @returns {number} Горизонтальное расстояние
 */
export function horizontalDistance(point1, point2) {
    const dx = point1.x - point2.x;
    const dz = point1.z - point2.z;
    return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Квадрат расстояния (быстрее для сравнений)
 * @param {Object} point1 - Первая точка
 * @param {Object} point2 - Вторая точка
 * @returns {number} Квадрат расстояния
 */
export function distanceSquared(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const dz = point1.z - point2.z;
    return dx * dx + dy * dy + dz * dz;
}

/**
 * Нормализация угла до диапазона [0, 2π)
 * @param {number} angle - Угол в радианах
 * @returns {number} Нормализованный угол
 */
export function normalizeAngle(angle) {
    angle = angle % (Math.PI * 2);
    if (angle < 0) angle += Math.PI * 2;
    return angle;
}

/**
 * Плавная интерполяция между значениями
 * @param {number} start - Начальное значение
 * @param {number} end - Конечное значение
 * @param {number} t - Коэффициент интерполяции (0-1)
 * @returns {number} Интерполированное значение
 */
export function lerp(start, end, t) {
    return start + (end - start) * Math.max(0, Math.min(1, t));
}

/**
 * Плавная интерполяция с замедлением (ease out)
 * @param {number} start - Начальное значение
 * @param {number} end - Конечное значение
 * @param {number} t - Коэффициент интерполяции (0-1)
 * @returns {number} Интерполированное значение
 */
export function easeOut(start, end, t) {
    t = 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
    return start + (end - start) * t;
}

/**
 * Форматирование числа с разделителями тысяч
 * @param {number} num - Число для форматирования
 * @returns {string} Отформатированная строка
 */
export function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Форматирование времени в формате MM:SS
 * @param {number} seconds - Время в секундах
 * @returns {string} Отформатированная строка времени
 */
export function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Проверка попадания точки в прямоугольник
 * @param {Object} point - Точка с координатами x, y
 * @param {Object} rect - Прямоугольник с x, y, width, height
 * @returns {boolean} true если точка внутри прямоугольника
 */
export function pointInRect(point, rect) {
    return (
        point.x >= rect.x &&
        point.x <= rect.x + rect.width &&
        point.y >= rect.y &&
        point.y <= rect.y + rect.height
    );
}

/**
 * Клонирование объекта (глубокое)
 * @template T
 * @param {T} obj - Объект для клонирования
 * @returns {T} Клон объекта
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Задержка выполнения (Promise-based sleep)
 * @param {number} ms - Время задержки в миллисекундах
 * @returns {Promise<void>} Промис, который разрешится через указанное время
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Ограничение значения диапазоном
 * @param {number} value - Значение для ограничения
 * @param {number} min - Минимальное значение
 * @param {number} max - Максимальное значение
 * @returns {number} Ограниченное значение
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Маппинг значения из одного диапазона в другой
 * @param {number} value - Значение для маппинга
 * @param {number} inMin - Минимум входного диапазона
 * @param {number} inMax - Максимум входного диапазона
 * @param {number} outMin - Минимум выходного диапазона
 * @param {number} outMax - Максимум выходного диапазона
 * @returns {number} Значение в новом диапазоне
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Проверка видимости объекта камерой
 * @param {Object} object - Проверяемый объект
 * @param {THREE.Camera} camera - Камера
 * @param {THREE.Vector3} frustumCorners - Углы фрустума камеры
 * @returns {boolean} true если объект виден камере
 */
export function isVisibleByCamera(object, camera, frustumCorners) {
    // Упрощённая проверка по bounding sphere
    if (!object.geometry?.boundingSphere) return true;

    const sphere = object.geometry.boundingSphere.clone();
    sphere.applyMatrix4(object.matrixWorld);

    // Проверка расстояния до камеры
    const distToCamera = sphere.center.distanceTo(camera.position);
    const farPlane = camera.far || 1000;

    return distToCamera < farPlane;
}

/**
 * Генерация уникального ID
 * @returns {string} Уникальный идентификатор
 */
export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * Дебаунс функции
 * @template {Function} T
 * @param {T} func - Функция для дебаунса
 * @param {number} wait - Время ожидания в мс
 * @returns {T} Дебаунсиная функция
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Троттлинг функции
 * @template {Function} T
 * @param {T} func - Функция для троттлинга
 * @param {number} limit - Минимальный интервал между вызовами в мс
 * @returns {T} Троттлиная функция
 */
export function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

/**
 * Логирование с префиксом и временем
 * @param {string} prefix - Префикс сообщения
 * @param {...any} args - Аргументы для логирования
 */
export function log(prefix, ...args) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${prefix}:`, ...args);
}

/**
 * Логирование ошибок с префиксом и временем
 * @param {string} prefix - Префикс сообщения
 * @param {...any} args - Аргументы для логирования
 */
export function logError(prefix, ...args) {
    const timestamp = new Date().toLocaleTimeString();
    console.error(`[${timestamp}] ${prefix}:`, ...args);
}

/**
 * Измерение производительности функции
 * @param {string} label - Метка для измерения
 * @param {Function} fn - Функция для измерения
 * @returns {any} Результат выполнения функции
 */
export function measurePerformance(label, fn) {
    console.time(label);
    const result = fn();
    console.timeEnd(label);
    return result;
}

/**
 * Проверка поддержки WebGL
 * @returns {boolean} true если WebGL поддерживается
 */
export function isWebGLSupported() {
    try {
        const canvas = document.createElement('canvas');
        return !!(
            window.WebGLRenderingContext &&
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        );
    } catch (e) {
        return false;
    }
}

/**
 * Получение параметра из URL
 * @param {string} name - Имя параметра
 * @returns {string|null} Значение параметра или null
 */
export function getUrlParameter(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

/**
 * Сохранение данных в localStorage с обработкой ошибок
 * @param {string} key - Ключ для хранения
 * @param {any} data - Данные для сохранения
 * @returns {boolean} true если сохранение успешно
 */
export function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        logError('LocalStorage', 'Failed to save:', e);
        return false;
    }
}

/**
 * Загрузка данных из localStorage с обработкой ошибок
 * @param {string} key - Ключ для загрузки
 * @param {any} defaultValue - Значение по умолчанию
 * @returns {any} Загруженные данные или значение по умолчанию
 */
export function loadFromLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        logError('LocalStorage', 'Failed to load:', e);
        return defaultValue;
    }
}
