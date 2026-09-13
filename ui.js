/**
 * UI Module - Управление интерфейсом
 * Отвечает за HUD, баннеры, меню и отображение игровых элементов
 */

import { DIFFICULTIES } from './robots.js';

/**
 * Обновляет HUD (интерфейс)
 * @param {Object} player - Игрок
 * @param {Object} gameState - Состояние игры (level, wave, kills, xp и т.д.)
 */
export function updateHUD(player, gameState) {
    if (!player) return;

    const levelEl = document.getElementById('levelHud');
    const waveEl = document.getElementById('waveNum');
    const killsEl = document.getElementById('killCount');
    const hpEl = document.getElementById('hpVal');
    const weaponEl = document.getElementById('weaponName');
    const xpFillEl = document.getElementById('xpFill');

    if (levelEl) levelEl.textContent = gameState.level;
    if (waveEl) waveEl.textContent = gameState.wave > 0 ? gameState.wave : '—';
    if (killsEl) killsEl.textContent = gameState.kills;

    if (hpEl) {
        hpEl.textContent = `${player.torsoHP} / ${player.maxTorsoHP}`;
        hpEl.className =
            player.torsoHP > player.maxTorsoHP * 0.66
                ? 'hp-high'
                : player.torsoHP > player.maxTorsoHP * 0.33
                    ? 'hp-mid'
                    : 'hp-low';
    }

    if (weaponEl) {
        weaponEl.textContent = player.weapon ? player.weapon.toUpperCase() : '—';
    }

    if (xpFillEl) {
        const xpPercent = (gameState.xp / gameState.xpToNextLevel) * 100;
        xpFillEl.style.width = `${xpPercent}%`;
    }
}

/**
 * Показывает баннер с сообщением
 * @param {string} text - Текст сообщения
 * @param {number} duration - Длительность отображения в мс
 */
export function showBanner(text, duration = 1500) {
    const banner = document.getElementById('banner');
    if (!banner) return;

    banner.textContent = text;
    banner.classList.add('show');

    setTimeout(() => {
        banner.classList.remove('show');
    }, duration);
}

/**
 * Показывает панель выбора улучшений при повышении уровня
 * @param {Object} player - Игрок
 * @param {Object} gameState - Состояние игры
 * @param {Function} applyPassiveCallback - Функция применения пассивки
 * @param {Function} unpauseCallback - Функция снятия паузы
 */
export function showUpgradePanel(player, gameState, applyPassiveCallback, unpauseCallback) {
    const panel = document.getElementById('levelPanel');
    const levelNumEl = document.getElementById('levelNum');
    const choicesEl = document.getElementById('levelChoices');

    if (!panel || !choicesEl) return;

    if (levelNumEl) {
        levelNumEl.textContent = gameState.level;
    }

    choicesEl.innerHTML = '';

    // Берём 3 случайных пассивки из доступных
    const availablePassives = [...(window.PASSIVES || [])].sort(() => Math.random() - 0.5).slice(3);

    for (const passive of availablePassives) {
        const btn = document.createElement('button');
        btn.className = 'upgrade-choice';
        btn.innerHTML = `
            <span class="icon">${passive.icon}</span>
            <div>
                <b>${passive.name}</b>
                <br>
                <small>${passive.desc}</small>
            </div>
        `;

        btn.onclick = () => {
            applyPassiveCallback(passive);
            panel.style.display = 'none';
            unpauseCallback();
        };

        choicesEl.appendChild(btn);
    }

    panel.style.display = 'flex';
}

/**
 * Показывает панель выбора награды между волнами
 * @param {number} wave - Номер текущей волны
 * @param {Function} applyRewardCallback - Функция применения награды
 * @param {Function} unpauseCallback - Функция снятия паузы
 */
export function showRewardPanel(wave, applyRewardCallback, unpauseCallback) {
    const panel = document.getElementById('betweenPanel');
    const nextWaveNumEl = document.getElementById('nextWaveNum');
    const gridEl = document.getElementById('rewardGrid');

    if (!panel || !gridEl) return;

    if (nextWaveNumEl) {
        nextWaveNumEl.textContent = wave;
    }

    gridEl.innerHTML = '';

    // Берём 3 случайных награды из доступных
    const availableRewards = [...(window.REWARDS || [])].sort(() => Math.random() - 0.5).slice(3);

    for (const reward of availableRewards) {
        const btn = document.createElement('button');
        btn.className = 'reward-choice';
        btn.innerHTML = `
            <span class="icon">${reward.icon}</span>
            <div>
                <b>${reward.name}</b>
                <br>
                <small>${reward.desc}</small>
            </div>
        `;

        btn.onclick = () => {
            applyRewardCallback(reward);
            panel.style.display = 'none';
            unpauseCallback();
        };

        gridEl.appendChild(btn);
    }

    panel.style.display = 'flex';
}

/**
 * Показывает экран Game Over
 * @param {Object} gameState - Состояние игры
 */
export function showGameOver(gameState) {
    const gameOverEl = document.getElementById('gameover');
    const finalStatsEl = document.getElementById('finalStats');

    if (!gameOverEl) return;

    const score = gameState.kills * 100 + gameState.wave * 500;

    if (finalStatsEl) {
        finalStatsEl.textContent = `Волна ${gameState.wave} · Убито ${gameState.kills} · Счёт ${score}`;
    }

    gameOverEl.style.display = 'flex';
}

/**
 * Показывает/скрывает меню паузы
 * @param {boolean} isPaused - Состояние паузы
 */
export function togglePauseMenu(isPaused) {
    const pauseOverlay = document.getElementById('pauseOverlay');
    if (!pauseOverlay) return;

    if (isPaused) {
        pauseOverlay.classList.add('show');
    } else {
        pauseOverlay.classList.remove('show');
    }
}

/**
 * Настраивает обработчики UI для главного меню
 * @param {Function} startGameCallback - Функция начала игры
 * @param {Object} audioModule - Аудио модуль
 * @param {Function} togglePauseCallback - Функция паузы
 * @param {Function} quitCallback - Функция выхода в меню
 */
export function setupUIHandlers(startGameCallback, audioModule, togglePauseCallback, quitCallback) {
    // Кнопки сложности
    document.querySelectorAll('.diff-buttons button').forEach(btn => {
        btn.addEventListener('click', () => {
            const diff = btn.dataset.diff;
            startGameCallback(diff);
        });
    });

    // Кнопка звука
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle && audioModule) {
        soundToggle.addEventListener('click', () => {
            audioModule.setEnabled(!audioModule.enabled);
        });
    }

    // Кнопка паузы
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', togglePauseCallback);
    }

    // ESC для паузы
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            togglePauseCallback();
        }
    });

    // Кнопки паузы
    const resumeBtn = document.getElementById('resumeBtn');
    if (resumeBtn) {
        resumeBtn.addEventListener('click', togglePauseCallback);
    }

    const quitBtn = document.getElementById('quitBtn');
    if (quitBtn) {
        quitBtn.addEventListener('click', quitCallback);
    }
}

/**
 * Настраивает обработчики для экрана Game Over
 * @param {Function} retryCallback - Функция повторной игры
 * @param {Function} menuCallback - Функция выхода в меню
 */
export function setupGameOverHandlers(retryCallback, menuCallback) {
    const retryBtn = document.getElementById('retryBtn');
    const menuBtn = document.getElementById('menuBtn');

    if (retryBtn) {
        retryBtn.addEventListener('click', retryCallback);
    }

    if (menuBtn) {
        menuBtn.addEventListener('click', menuCallback);
    }
}

/**
 * Обновляет кастомизацию в превью
 * @param {Object} customization - Объект кастомизации
 */
export function updateCustomizationPreview(customization) {
    // Здесь можно добавить логику обновления превью персонажа
    // В текущей версии это обрабатывается в index.html
}
