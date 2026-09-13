# VOXEL ARENA

3D-игра в воксельном стиле на JavaScript с использованием Three.js и Cannon-es. Сражайтесь с волнами врагов, получайте улучшения и выживайте как можно дольше!

## 🎮 Описание

VOXEL ARENA - это динамичный 3D-экшен с видом от третьего лица, где вы управляете роботом и сражаетесь против волн вражеских ботов на арене. Игра включает:

- **Волны врагов** - нарастающая сложность с каждым уровнем
- **Боссы** - уникальные мощные противники каждые несколько волн
- **Система улучшений** - пассивные способности и награды между волнами
- **Разнообразное оружие** - меч, топор, лук, копьё
- **Кастомизация** - настройка внешнего персонажа
- **Физика** - реалистичная физика на основе Cannon-es

## 📁 Структура проекта

```
/workspace/
├── index.html          # Главный HTML-файл с UI
├── main.js             # Основной игровой цикл и логика
├── robots.js           # Создание роботов, кастомизация, данные
├── arena.js            # Генерация арены
├── audio.js            # Звуковые эффекты и музыка
├── gameplay.js         # Игровая механика и управление
├── combat.js           # Система боя и урона
├── ai.js               # Искусственный интеллект врагов
├── ui.js               # Управление интерфейсом
├── waves.js            # Система волн и спавна
├── style.css           # Стили интерфейса
└── README.md           # Документация (этот файл)
```

## 🚀 Быстрый старт

### Вариант 1: Простой запуск

Просто откройте `index.html` в современном браузере:

```bash
# Linux/Mac
xdg-open index.html  # или open index.html на Mac

# Windows
start index.html
```

### Вариант 2: Локальный сервер (рекомендуется)

```bash
# Используя Python 3
python3 -m http.server 8000

# Или используя Node.js с http-server
npx http-server -p 8000
```

Затем откройте `http://localhost:8000` в браузере.

### Вариант 3: Vite (для разработки)

```bash
# Установка зависимостей
npm create vite@latest . -- --template vanilla

# Установка Three.js и Cannon-es
npm install three cannon-es

# Запуск dev-сервера
npm run dev
```

## 🎯 Управление

| Клавиша | Действие |
|---------|----------|
| W / Стрелка вверх | Движение вперёд |
| S / Стрелка вниз | Движение назад |
| A / Стрелка влево | Движение влево |
| D / Стрелка вправо | Движение вправо |
| Space / E | Прыжок |
| ЛКМ | Атака |
| 1 | Меч |
| 2 | Топор |
| 3 | Лук |
| 4 | Копьё |
| P / ESC | Пауза |
| Колесо мыши | Выбор оружия |

## 🏗️ Модульная архитектура

Проект использует модульную структуру ES6:

### Основные модули

- **main.js** - Координация игры, игровой цикл, обработка ввода
- **robots.js** - Создание персонажей, данные об оружии, врагах, боссах
- **arena.js** - Генерация и построение арены
- **audio.js** - Воспроизведение звуков и музыки
- **gameplay.js** - Игровая механика, управление камерой

### Специализированные модули

- **combat.js** - Система боя, расчёт урона, снаряды
- **ai.js** - Поведение врагов и союзников
- **ui.js** - HUD, меню, баннеры, панели
- **waves.js** - Управление волнами, спавн врагов

## 🔧 Настройка сборки

### Vite конфигурация

Создайте `vite.config.js`:

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
```

### ESLint конфигурация

Создайте `.eslintrc.json`:

```json
{
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    "no-unused-vars": "warn",
    "no-console": "off"
  }
}
```

### Prettier конфигурация

Создайте `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 4,
  "trailingComma": "none",
  "printWidth": 100
}
```

### package.json для разработки

```json
{
  "name": "voxel-arena",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .js",
    "format": "prettier --write \"**/*.js\""
  },
  "dependencies": {
    "three": "^0.160.0",
    "cannon-es": "^0.20.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "eslint": "^8.56.0",
    "prettier": "^3.1.0"
  }
}
```

## 📝 API Документация

### Combat Module (`combat.js`)

```javascript
// Выполнить атаку
performAttack(attacker, robots);

// Нанести урон
damageRobot(target, damage, attacker);

// Обработать смерть
killRobot(victim, killer, gameState, addXPCallback, gameOverCallback);

// Обновить снаряды
updateProjectiles(arrows, robots, scene, world, dt);

// Создать стрелу
createArrow(shooter, scene, world);
```

### AI Module (`ai.js`)

```javascript
// Обновить ИИ врага
updateEnemyAI(enemy, player, dt);

// Обновить ИИ союзника
updateAllyAI(ally, player, enemies, dt);

// Патрулирование
patrolBehavior(robot, centerPoint, radius, speed, dt);

// Отступление
retreatBehavior(robot, threatSource, retreatSpeed);

// Получить состояние
getRobotState(robot);
```

### UI Module (`ui.js`)

```javascript
// Обновить HUD
updateHUD(player, gameState);

// Показать баннер
showBanner(text, duration);

// Панель улучшений
showUpgradePanel(player, gameState, applyPassiveCallback, unpauseCallback);

// Панель наград
showRewardPanel(wave, applyRewardCallback, unpauseCallback);

// Game Over
showGameOver(gameState);
```

### Waves Module (`waves.js`)

```javascript
// Проверить статус волны
checkWaveStatus(enemies, startNextWaveCallback);

// Запустить следующую волну
startNextWave(incrementCallback, buildCallback, spawnCallback, rewardCallback);

// Получить текущую волну
getCurrentWave();

// Спавн врагов
spawnEnemies(scene, world, difficultyKey, createRobotCallback, enemiesArray, robotsArray);

// Получить паттерн волны
getWavePattern(difficultyKey, waveNumber);
```

## 🎨 Кастомизация

Игроки могут настроить внешний вид своего робота:

- **Цвет корпуса**: 7 вариантов
- **Цвет визора**: 7 вариантов  
- **Цвет наплечников**: 7 вариантов

Настройки сохраняются в localStorage и применяются при следующем запуске.

## 🏆 Особенности геймплея

### Оружие

| Оружие | Урон | Скорость | Дальность |
|--------|------|----------|-----------|
| Меч | 2 | Быстро | Средняя |
| Топор | 4 | Медленно | Средняя |
| Лук | 3 | Средне | Дальняя |
| Копьё | 3 | Быстро | Высокая |

### Типы врагов

- **Basic** - Стандартные враги
- **Fast** - Быстрые, но слабые
- **Tank** - Медленные, но живучие
- **Ranged** - Атакуют на расстоянии

### Боссы

Уникальные боссы появляются на определённых волнах с увеличенными характеристиками.

## 🐛 Известные проблемы

- Отрубание конечностей требует доработки
- Система стрел может быть оптимизирована
- ИИ врагов нуждается в улучшении тактики

## 🤝 Вклад в проект

1. Fork репозиторий
2. Создайте ветку (`git checkout -b feature/AmazingFeature`)
3. Закоммитьте изменения (`git commit -m 'Add AmazingFeature'`)
4. Push в ветку (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект создан в образовательных целях.

## 🙏 Благодарности

- [Three.js](https://threejs.org/) - 3D графика
- [Cannon-es](https://github.com/pmndrs/cannon-es) - Физический движок
- Сообщество разработчиков игр на JavaScript

---

**Приятной игры!** 🎮
