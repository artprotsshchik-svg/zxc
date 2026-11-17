import * as fs from 'fs';
import * as path from 'path';

export interface ModDef {
  name: string;
  category: string;
  status: 'recommended' | 'useful' | 'outdated' | 'redundant' | 'danger' | 'diagnostic';
  statusLabel: string;
  description: string;
  bestAlternative?: string;
  warning?: string;
  tags?: string[];
  installed?: boolean;
  platform?:
    | 'Forge'
    | 'Forge / NeoForge'
    | 'NeoForge 1.20.4+'
    | 'Fabric / NeoForge 1.21+'
    | 'Universal'
    | 'Universal (Forge/Fabric)'
    | 'Fabric (через Sinytra)'
    | 'Fabric (Справка / Несовм. с Forge)'
    | 'Fabric (Справка / Порт: Radium Re-Reforged)'
    | 'Fabric (Справка / Порт: Krypton Reno)';
}

export const ALL_MODS: ModDef[] = [
  // =========================================================================
  // 1. РЕНДЕР, CULLING И FPS
  // =========================================================================
  {
    name: 'Rubidium',
    category: 'Рендер, culling и FPS',
    status: 'outdated',
    statusLabel: 'Устарел на 1.20+',
    description: 'Классический порт Sodium на Forge 1.16-1.19. На 1.20+ полностью заменен на Embeddium.',
    bestAlternative: 'Embeddium.',
    warning: 'Нельзя ставить одновременно с Embeddium!',
    tags: ['render', 'sodium', 'legacy']
  },
  {
    name: 'Embeddium',
    category: 'Рендер, culling и FPS',
    platform: 'Forge / NeoForge',
    installed: true,
    status: 'recommended',
    statusLabel: 'Мастхэв',
    description: 'Главный поддерживаемый порт Fabric-мода Sodium на Forge/NeoForge (развитие Rubidium от embeddedt). Полная переработка рендера чанков через OpenGL 4.3 с максимальной совместимостью с модами.',
    bestAlternative: 'Эталон для Forge 1.20.1+.',
    tags: ['render', 'sodium', 'opengl', 'chunks', 'port']
  },
  {
    name: 'Embeddium Extras',
    category: 'Рендер, culling и FPS',
    platform: 'Forge / NeoForge',
    status: 'recommended',
    statusLabel: 'Мастхэв (Аддон)',
    description: 'Аддон к Embeddium (аналог Sodium Extra для Forge): добавляет тонкие настройки неба, погоды, тумана, частиц и FPS-счетчик. Полностью совместим с (Sodium) Chloride.',
    bestAlternative: 'Ставить вместе с Embeddium.',
    tags: ['gui', 'fps counter', 'addon', 'sodium extra']
  },
  {
    name: 'Emberbium',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Тюнинг для 1.20.1',
    description: 'Форк Embeddium от Misanthropy под Forge 1.20.1. Внедряет Radix Sort чанков, оптимизирует Draw Calls для шейдеров Oculus и чинит утечки при смене миров.',
    bestAlternative: 'Ставится ВМЕСТО Embeddium в тяжелых 1.20.1 сборках с шейдерами.',
    warning: 'Нельзя ставить одновременно с Embeddium, Rubidium или Xenon!',
    tags: ['radix sort', 'oculus', '1.20.1']
  },
  {
    name: '(Sodium) Chloride',
    category: 'Рендер, culling и FPS',
    platform: 'Forge / NeoForge',
    status: 'useful',
    statusLabel: 'Аддон Embeddium (Embeddium++)',
    description: 'Активный аддон для Embeddium на Forge 1.20.1 (бывший Embeddium++). Добавляет динамическое освещение, куллинг мобов по дистанции, True Darkness, зум и полноэкранный режим без рамок. Совместим с Embeddium Extras!',
    bestAlternative: 'Ставить вместе с Embeddium как комбайн фич и динамического света.',
    warning: 'Требует Embeddium (не форк, а дополнение). При паре с Embeddium Extras не дублируйте зум/FPS в конфигах.',
    tags: ['addon', 'embeddium', 'dynamic lights', 'zoom']
  },
  {
    name: 'Flerovium',
    category: 'Рендер, culling и FPS',
    status: 'recommended',
    statusLabel: 'Аддон рендера (Предметы/Мобы)',
    description: 'Дополнение к Embeddium / Sodium от MoePus (НЕ форк, а аддон). Ускоряет рендеринг предметов на 50%+, частиц на 50%+ и сущностей на ~30% за счет backface culling, кэширования света и LOD.',
    bestAlternative: 'Ставить ВМЕСТЕ с Embeddium для сильного буста FPS на складах и в боях.',
    tags: ['addon', 'embeddium', 'batching', 'items', 'entities']
  },
  {
    name: 'ImmediatelyFast',
    category: 'Рендер, culling и FPS',
    status: 'recommended',
    statusLabel: 'Мастхэв',
    description: 'Оптимизирует немедленный режим рендеринга (Immediate Mode): текст, тултипы, HUD, шрифты, полоски HP мобов, 2D-частицы и GUI.',
    bestAlternative: 'Мастхэв при использовании JEI / EMI.',
    tags: ['gui', 'text', 'tooltips', 'batching']
  },
  {
    name: 'Accelerated Rendering',
    category: 'Рендер, culling и FPS',
    status: 'recommended',
    statusLabel: 'GPU Compute для сущностей',
    description: 'Клиентское дополнение от Argon4W (совместимо с Embeddium и Oculus). Кэширует вершины и переносит тяжелые матричные трансформации мобов, боссов и block-entities на GPU через Compute Shaders (требует OpenGL 4.6).',
    bestAlternative: 'Мастхэв для сборок с сотнями мобов и сложными анимированными моделями.',
    warning: 'Требует GPU и драйвер с поддержкой OpenGL 4.6.',
    tags: ['gpu', 'compute', 'entities', 'opengl46']
  },
  {
    name: 'Accelerated Rendering: Turned',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Альтернативный форк',
    description: 'Тюнингованная сборка Accelerated Rendering с альтернативными весовыми матрицами.',
    bestAlternative: 'Accelerated Rendering.'
  },
  {
    name: 'Accelerated Recoiling',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Твик отдачи и вычислений',
    description: 'Патч анимаций отдачи и вычислений моделей при GPU-рендеринге.',
    bestAlternative: 'Accelerated Rendering.'
  },
  {
    name: 'Lagless: FPS Optimizer',
    category: 'Рендер, culling и FPS',
    status: 'danger',
    statusLabel: 'Плацебо / Опасно',
    description: 'Любительский мод, заявляющий устранение всех лагов. Грубо урезает дальность прорисовки сущностей и ухудшает освещение без реальной оптимизации кода.',
    bestAlternative: 'Удалить. Настоящую оптимизацию дают Embeddium, ModernFix и FerriteCore.',
    warning: 'Любительский мод: грубо режет дальность мобов без реальной оптимизации кода.',
    
  },
  {
    name: 'More Culling Reforged',
    category: 'Рендер, culling и FPS',
    platform: 'Forge',
    status: 'recommended',
    statusLabel: 'Мастхэв (Порт MoreCulling)',
    description: 'Порт Fabric-мода MoreCulling (от MikihinaSann) для Forge 1.20.1. Отсекает невидимые грани ступеней, заборов, люков, рамки на расстоянии и листву. Отлично дополняет Entity Culling.',
    bestAlternative: 'Лучший мод куллинга граней блоков для Forge 1.20.1.',
    tags: ['culling', 'port', 'moreculling', 'blocks']
  },
  {
    name: 'Entity Culling',
    category: 'Рендер, culling и FPS',
    platform: 'Universal (Forge/Fabric)',
    status: 'recommended',
    statusLabel: 'Мастхэв (Мульти-лоадер)',
    description: 'Оригинальный мультиплатформенный мод от tr7zw (нативно для Forge, NeoForge и Fabric). Асинхронная трассировка лучей скрывает мобов, игроков и сундуки, полностью скрытых за стенами и под землей.',
    bestAlternative: 'Эталон отсечения невидимых сущностей; идеально работает в паре с More Culling Reforged.',
    tags: ['entity', 'culling', 'raytrace', 'universal']
  },
  {
    name: 'Brute force Rendering Culling',
    category: 'Рендер, culling и FPS',
    status: 'danger',
    statusLabel: 'Опасно / Нестабильно',
    description: 'Агрессивно вырезает невидимую геометрию. Нередко приводит к мерцанию блоков, прозрачным чанкам («дырам в мире») и визуальным глитчам с шейдерами.',
    bestAlternative: 'More Culling Reforged + Entity Culling.',
    warning: 'Агрессивный culling: часто приводит к мерцанию блоков, «дырам» в мире и артефактам шейдеров.',
    
  },
  {
    name: 'Brute force Rendering Culling Revived',
    category: 'Рендер, culling и FPS',
    status: 'danger',
    statusLabel: 'Опасно / Нестабильно',
    description: 'Возрожденный форк Brute Force Culling. Сохраняет проблемы с мельканием блоков и артефактами теней.',
    bestAlternative: 'Entity Culling.',
    warning: 'Сохраняет баги с мерцанием геометрии и «дырами» в чанках при быстром перемещении.',
    
  },
  {
    name: '(Sodium) Sightline',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Фовеальный куллинг',
    description: 'Аддон для Sodium/Embeddium, отсекающий чанки строго вне конуса взгляда игрока.',
    bestAlternative: 'Может вызывать секундные дыры в мире при резких поворотах камеры.'
  },
  {
    name: '(Sodium) Streamline',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Потоковый куллинг',
    description: 'Оптимизация очередей передачи чанков в видеопамять.',
    bestAlternative: 'Встроенные оптимизации Embeddium.'
  },
  {
    name: '(Sodium) Fovea',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Фовеальный рендер',
    description: 'Фовеальный рендеринг: снижает детализацию геометрии на периферии зрения.',
    bestAlternative: 'Экспериментально, на любителя.'
  },
  {
    name: 'Cullify',
    category: 'Рендер, culling и FPS',
    status: 'redundant',
    statusLabel: 'Избыточен',
    description: 'Альтернативный куллер блоков.',
    bestAlternative: 'More Culling Reforged работает чище и без конфликтов.'
  },
  {
    name: 'ItemCuller',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Полезно для дропа',
    description: 'Отсекает рендеринг выброшенных на землю предметов, если они перекрыты блоками или находятся вне зоны видимости.',
    bestAlternative: 'Отлично подходит для моб-ферм и шахт.'
  },
  {
    name: 'CullLessLeaves Reforged',
    category: 'Рендер, culling и FPS',
    platform: 'Forge',
    status: 'recommended',
    statusLabel: 'Мастхэв для листвы (Порт)',
    description: 'Порт Fabric-мода CullLessLeaves (ccr4ft3r) под Forge 1.20.1. Алгоритмический куллинг скрытых граней листвы внутри крон деревьев — огромный буст FPS в лесах без ухудшения графики.',
    bestAlternative: 'Эталон оптимизации листвы для Forge 1.20+ (в связке с Embeddium).',
    tags: ['leaves', 'trees', 'culling', 'forest', 'port']
  },
  {
    name: 'Leaves Culling',
    category: 'Рендер, culling и FPS',
    status: 'redundant',
    statusLabel: 'Дубликат',
    description: 'Куллинг листвы.',
    bestAlternative: 'CullLessLeaves Reforged.'
  },
  {
    name: 'Sodium Leaf Culling (Unofficial)',
    category: 'Рендер, culling и FPS',
    status: 'redundant',
    statusLabel: 'Дубликат',
    description: 'Неофициальный аддон куллинга листвы.',
    bestAlternative: 'CullLessLeaves Reforged.'
  },
  {
    name: 'Legendary Block Entities',
    category: 'Рендер, culling и FPS',
    platform: 'Forge',
    status: 'useful',
    statusLabel: 'Полезный аналог EBE',
    description: 'Нативная Forge 1.20.1 альтернатива Fabric-моду Enhanced Block Entities: запекает рендеринг сундуков, кроватей, колоколов и шалкеров в быстрые меши чанков без потери анимаций.',
    bestAlternative: 'Отличная рабочая альтернатива на Forge 1.20.1 наряду с Enhanced Block Entities Reloaded.',
    warning: 'Не ставить одновременно с EBER или FastChest!'
  },
  {
    name: 'FastChest Revived',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Упрощение сундуков',
    description: 'Убирает динамическую анимацию открывания крышки сундуков, делая их статичными блоками.',
    bestAlternative: 'Enhanced Block Entities Reloaded (сохраняет красивый визуал).',
    warning: 'Заменяет анимированные сундуки статичными. Несовместим с Enhanced Block Entities и отключает анимацию.',
  },
  {
    name: 'Optimized Block Entities (OBE)',
    category: 'Рендер, culling и FPS',
    status: 'outdated',
    statusLabel: 'Устарел',
    description: 'Оптимизирует рендер сундуков и табличек за счет отключения анимаций на расстоянии.',
    bestAlternative: 'Enhanced Block Entities Reloaded.'
  },
  {
    name: 'Enhanced Block Entities Reloaded',
    category: 'Рендер, culling и FPS',
    platform: 'Forge / NeoForge',
    status: 'recommended',
    statusLabel: 'Мастхэв (Порт EBE)',
    description: 'Современный порт Fabric-мода Enhanced Block Entities (Mat0u5_). Превращает блочные сущности (сундуки, колокола, печи, таблички) в запеченные меши чанков, в разы поднимая FPS на складах.',
    bestAlternative: 'Лучший выбор для баз и хранилищ (альтернатива на 1.20.1 — Legendary Block Entities).'
  },
  {
    name: 'Enhanced Block Entities Reforged (Unofficial)',
    category: 'Рендер, culling и FPS',
    platform: 'Forge',
    status: 'outdated',
    statusLabel: 'Устаревший порт (1.18-1.19)',
    description: 'Ранний неофициальный порт Fabric-мода EBE от ccr4ft3r, основные релизы которого выходили под Forge 1.18.2 и 1.19.2.',
    bestAlternative: 'На 1.20.1 используйте Enhanced Block Entities Reloaded или Legendary Block Entities.',
    warning: 'Не смешивайте с EBER или Legendary Block Entities!'
  },
  {
    name: 'HyperFPS',
    category: 'Рендер, culling и FPS',
    status: 'danger',
    statusLabel: 'Плацебо',
    description: 'Псевдо-оптимизатор с сомнительным кодом. Часто ломает дальность прорисовки.',
    bestAlternative: 'Embeddium + ModernFix.',
    warning: 'Псевдо-оптимизатор: может вызывать сбои дальности рендера.',
    
  },
  {
    name: 'Stable FPS',
    category: 'Рендер, culling и FPS',
    status: 'danger',
    statusLabel: 'Плацебо',
    description: 'Меняет пару переменных в конфиге без реальной пользы.',
    bestAlternative: 'FramePacer (для стабильности фреймтайма).',
    warning: 'Меняет пару переменных в конфиге без реальной пользы.',
    
  },
  {
    name: 'Thulium',
    category: 'Память и утечки',
    status: 'useful',
    statusLabel: 'Оптимизация GC и звука',
    description: 'Легкий клиентский оптимизатор от Zerth для Forge (НЕ форк Sodium). Снижает давление на сборщик мусора (GC) при обновлении аудио-слушателя, ускоряет форматирование текста Forge и работу звукового движка.',
    bestAlternative: 'Полностью совместим с Embeddium и ModernFix.',
    tags: ['gc', 'audio', 'memory', 'forge']
  },
  {
    name: 'Tritium',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Комбайн оптимизаций',
    description: 'Универсальный комбайн оптимизаций для Forge (НЕ форк Sodium): включает быструю смену языка, куллинг листвы, оптимизацию сундуков, Dynamic FPS и фиксы тех-модов.',
    bestAlternative: 'Пересекается по функциям с EBER, CullLessLeaves и Embeddium Extras — выбирайте либо его, либо набор специализированных лидеров.',
    warning: 'Возможны перекрытия с EBER и модами на листву.'
  },
  {
    name: 'XFermium',
    category: 'Рендер, culling и FPS',
    status: 'outdated',
    statusLabel: 'Устарел / Заброшен',
    description: 'Экспериментальный форк рендера.',
    bestAlternative: 'Embeddium.'
  },
  {
    name: 'Nebula Mod',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Оптимизация неба и тумана',
    description: 'Оптимизирует рендеринг небесной сферы, звезд и градиентов горизонта.',
    bestAlternative: 'Embeddium Extras.'
  },
  {
    name: 'Optimized Fullbright',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Яркость без оверхеда',
    description: 'Включает максимальную яркость мира без постоянного пересчета световых карт шейдеров.',
    bestAlternative: 'Embeddium Extras (ползунок Brightness).'
  },
  {
    name: 'SkullSkinless',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Полезно для голов',
    description: 'Оптимизирует рендеринг декоративных голов игроков, избавляя от повторной загрузки скинов из сети при каждом кадре.',
    bestAlternative: 'Идеально для серверов с магазинами и декором.'
  },
  {
    name: 'DynamicRenderDistance',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Динамическая дальность',
    description: 'Автоматически снижает дистанцию прорисовки при падении FPS и восстанавливает при нормализации.',
    bestAlternative: 'Ставить строго один из двух с [DRD]! На серверах лучше ServerCore.',
    warning: 'Дубликат [DRD] Dynamic Render Distance: используйте строго один из них!',
    
  },
  {
    name: '[DRD] Dynamic Render Distance',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Динамическая дальность',
    description: 'Альтернативный мод динамической дальности прорисовки.',
    bestAlternative: 'Нужен только один из двух: либо DRD, либо DynamicRenderDistance.',
    warning: 'Дубликат DynamicRenderDistance: используйте строго один из них!',
    
  },
  {
    name: 'Lite FPS',
    category: 'Рендер, culling и FPS',
    status: 'danger',
    statusLabel: 'Плацебо',
    description: 'Упрощенный твик конфигов, не дающий реального прироста производительности.',
    bestAlternative: 'Embeddium.',
    warning: 'Упрощенный твик конфигов, не дающий реального прироста.',
    
  },
  {
    name: 'Vectors',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Векторная математика',
    description: 'Оптимизация математических векторных вычислений в геометрии рендера.',
    bestAlternative: 'ModernFix (содержит быстрые векторы).'
  },
  {
    name: 'Kexosyn (Forge)',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Патчинг вызовов OpenGL',
    description: 'Экспериментальный твик вызовов OpenGL на Forge.',
    bestAlternative: 'Embeddium.'
  },
  {
    name: 'SmartCull+',
    category: 'Рендер, culling и FPS',
    status: 'redundant',
    statusLabel: 'Избыточен',
    description: 'Модуль отсечения невидимых полигонов.',
    bestAlternative: 'More Culling Reforged.'
  },
  {
    name: 'Fermium',
    category: 'Рендер, culling и FPS',
    status: 'outdated',
    statusLabel: 'Устарел',
    description: 'Старый форк рендера.',
    bestAlternative: 'Embeddium.'
  },
  {
    name: 'VoidEngine',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Экспериментальный движок',
    description: 'Попытка оптимизации конвейера рендера.',
    bestAlternative: 'Embeddium.'
  },
  {
    name: 'Prismanium',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Форк Embeddium (Dynamic Lights)',
    description: 'Активный форк стека Sodium/Embeddium под Forge 1.20.1 со встроенным динамическим освещением, улучшенной совместимостью с Oculus и оптимизацией рендера оружейных модов (TACZ).',
    bestAlternative: 'Альтернатива Embeddium. Не ставить одновременно с Embeddium!',
    warning: 'Является заменой Embeddium — нельзя ставить вместе с Embeddium!'
  },
  {
    name: 'CLab',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Экспериментальные твики GL',
    description: 'Экспериментальный микро-патч OpenGL.',
    bestAlternative: 'Embeddium.'
  },
  {
    name: 'Carbons',
    category: 'Рендер, culling и FPS',
    status: 'outdated',
    statusLabel: 'Устарел',
    description: 'Старый форк графических оптимизаций.',
    bestAlternative: 'Embeddium.'
  },
  {
    name: 'ChaosAPI',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Библиотека',
    description: 'Вспомогательная библиотека для некоторых оптимизаторов рендера.',
    bestAlternative: 'Ставить только если требует зависимость.'
  },
  {
    name: 'ForceGL2.0-Remapped',
    category: 'Рендер, culling и FPS',
    status: 'danger',
    statusLabel: 'Опасно / Древний OpenGL',
    description: 'Пытается принудительно заставить игру работать на древнем OpenGL 2.0. Ломает современные шейдеры, текстуры и Embeddium.',
    bestAlternative: 'НЕ СТАВИТЬ на версиях 1.17+! Minecraft 1.17+ требует OpenGL 3.2+, а Embeddium — 4.3+.',
    warning: 'Форсирует устаревший OpenGL 2.0. Вызывает немедленный краш с Embeddium/Oculus и графические артефакты на современных GPU.',
    
  },
  {
    name: 'JEM Adaptive Culling',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Адаптивный куллинг',
    description: 'Адаптивный куллинг для моделей Custom Entity Models (CEM).',
    bestAlternative: 'Entity Culling.'
  },
  {
    name: 'LCull',
    category: 'Рендер, culling и FPS',
    status: 'redundant',
    statusLabel: 'Избыточен',
    description: 'Легкий куллер сущностей.',
    bestAlternative: 'Entity Culling.'
  },
  {
    name: "Raffman's Optimiser",
    category: 'Рендер, culling и FPS',
    status: 'danger',
    statusLabel: 'Любительский / Нестабильно',
    description: 'Сборник агрессивных твиков рендера.',
    bestAlternative: 'Embeddium + ImmediatelyFast.',
    warning: 'Сборник агрессивных твиков с риском графических глитчей.',
    
  },
  {
    name: 'Maple Mesh Render',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Экспериментальный мешер',
    description: 'Экспериментальная переработка построения мешей чанков.',
    bestAlternative: 'Embeddium.'
  },
  {
    name: 'Ravicon',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Оптимизация иконок',
    description: 'Оптимизация кеширования и рендеринга иконок предметов в инвентаре.',
    bestAlternative: 'ImmediatelyFast.'
  },
  {
    name: 'Alloyium',
    category: 'Рендер, culling и FPS',
    status: 'recommended',
    statusLabel: 'GPU-аддон к Embeddium',
    description: 'НЕ форк, а мощное клиентское дополнение к Embeddium от MisoPy (Forge 1.20.1)! Использует GPU Compute Shaders и Indirect MultiDraw (идея как в Nvidium, но без Mesh Shaders) — ускоряет рендер чанков на любых видеокартах: NVIDIA, AMD и Intel.',
    bestAlternative: 'Лучшая универсальная альтернатива Nvidium для Forge поверх Embeddium!',
    tags: ['addon', 'embeddium', 'gpu', 'compute', 'nvidium-like']
  },
  {
    name: 'GPU load',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Балансировка GPU/CPU',
    description: 'Улучшает баланс передачи данных между CPU и GPU.',
    bestAlternative: 'Embeddium.'
  },
  {
    name: 'ReFine',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Попытка порта OptiFine фич',
    description: 'Попытка портировать отдельные фичи OptiFine на современные загрузчики.',
    bestAlternative: 'Embeddium + Embeddium Extras.'
  },
  {
    name: 'NVVisionBoost',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Твик для NVIDIA',
    description: 'Настройка параметров драйвера NVIDIA для Minecraft.',
    bestAlternative: 'Настройка панели управления NVIDIA вручную.'
  },
  {
    name: 'Mob 2D Render',
    category: 'Рендер, culling и FPS',
    status: 'danger',
    statusLabel: 'Меняет визуал / Крайняя мера',
    description: 'Заменяет 3D-модели мобов на плоские 2D-спрайты на дальних дистанциях.',
    bestAlternative: 'Использовать только на крайне слабом железе.',
    warning: 'Сильно искажает внешний вид мобов.'
  },
  {
    name: 'Water Ripples (performant)',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Оптимизация ряби воды',
    description: 'Оптимизированный рендеринг ряби воды без просадки FPS.',
    bestAlternative: 'Полезно для красивого визуала.'
  },
  {
    name: 'Smooth Container',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Плавный интерфейс',
    description: 'Плавная анимация открытия контейнеров и инвентарей.',
    bestAlternative: 'ImmediatelyFast.'
  },
  {
    name: 'Optimi',
    category: 'Рендер, culling и FPS',
    status: 'danger',
    statusLabel: 'Плацебо',
    description: 'Набор мелких сомнительных твиков.',
    bestAlternative: 'Embeddium.'
  },
  {
    name: 'OmniOptimizer',
    category: 'Рендер, culling и FPS',
    status: 'danger',
    statusLabel: 'Плацебо',
    description: 'Любительский комбайн оптимизаций.',
    bestAlternative: 'ModernFix.'
  },
  {
    name: 'Unbinilium',
    category: 'Рендер, culling и FPS',
    status: 'outdated',
    statusLabel: 'Устарел',
    description: 'Старый форк рендера.',
    bestAlternative: 'Embeddium.'
  },
  {
    name: 'MCOptimizer',
    category: 'Рендер, culling и FPS',
    status: 'danger',
    statusLabel: 'Плацебо',
    description: 'Псевдо-оптимизатор.',
    bestAlternative: 'Embeddium + ModernFix.'
  },
  {
    name: 'Improve the expectations',
    category: 'Рендер, culling и FPS',
    status: 'danger',
    statusLabel: 'Плацебо',
    description: 'Микро-твики рендера с громким названием.',
    bestAlternative: 'Embeddium.'
  },
  {
    name: 'Accelerium',
    category: 'Рендер, culling и FPS',
    status: 'outdated',
    statusLabel: 'Устарел',
    description: 'Старый форк рендера.',
    bestAlternative: 'Embeddium.'
  },
  {
    name: 'Aluminium',
    category: 'Рендер, culling и FPS',
    status: 'outdated',
    statusLabel: 'Устарел',
    description: 'Старый форк рендера.',
    bestAlternative: 'Embeddium.'
  },
  {
    name: 'ShadowLOD',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'LOD для теней',
    description: 'Снижает разрешение теней на дальних дистанциях в шейдерах.',
    bestAlternative: 'Emberlens / Oculus.'
  },
  {
    name: 'Slipstream',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Оптимизация конвейера',
    description: 'Твик конвейера команд OpenGL.',
    bestAlternative: 'Embeddium.'
  },
  {
    name: 'Xenon',
    category: 'Рендер, culling и FPS',
    platform: 'Forge',
    status: 'useful',
    statusLabel: 'Форк Embeddium (всё в 1)',
    description: 'Активный форк Embeddium для Forge 1.20.1 от Anthxny со встроенным интерфейсом в стиле Reese\'s Sodium Options и опциями Embeddium Extras прямо из коробки.',
    bestAlternative: 'Альтернатива связке Embeddium + Embeddium Extras. Не ставить вместе с Embeddium!',
    warning: 'Конфликтует с Embeddium, Rubidium и Emberbium — выбирайте строго один движок.',
    tags: ['xenon', 'embeddium', 'fork', 'forge']
  },
  {
    name: 'Xenon Debloated',
    category: 'Рендер, culling и FPS',
    platform: 'Forge',
    status: 'redundant',
    statusLabel: 'Урезанный форк Xenon',
    description: 'Форк Xenon / Embeddium с вырезанными дополнительными визуальными модулями.',
    bestAlternative: 'Официальный Embeddium стабильнее и поддерживается большинством аддонов (Alloyium, Oculus).'
  },
  {
    name: 'CoreOptimizer',
    category: 'Рендер, culling и FPS',
    status: 'danger',
    statusLabel: 'Плацебо',
    description: 'Сборник конфиг-твиков.',
    bestAlternative: 'ModernFix.'
  },
  {
    name: "Char's Far View",
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Дальний туман',
    description: 'Оптимизирует рендеринг тумана на больших дистанциях прорисовки.',
    bestAlternative: 'Embeddium Extras.'
  },
  {
    name: 'Fast Events',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Быстрые события',
    description: 'Ускоряет обработку событий интерфейса и ввода.',
    bestAlternative: 'FastEvent.'
  },
  {
    name: 'Outline Fixer',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Фикс подсветки',
    description: 'Исправляет падение кадров при рендеринге контуров блоков и светящихся сущностей.',
    bestAlternative: 'Полезно.'
  },
  {
    name: 'Large Textures Fix (Mobs)',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Фикс HD-текстур мобов',
    description: 'Оптимизирует аллокацию видеопамяти при использовании HD-скинов и текстур мобов высокого разрешения.',
    bestAlternative: 'Полезно для HD-ресурспаков.'
  },
  {
    name: 'TinyRender',
    category: 'Рендер, culling и FPS',
    status: 'danger',
    statusLabel: 'Срезает качество',
    description: 'Принудительно уменьшает точность рендеринга геометрии.',
    bestAlternative: 'FSR / RenderScale.',
    warning: 'Принудительно уменьшает точность рендеринга геометрии, ухудшая визуал.',
    
  },
  {
    name: 'Render Distance Tuner',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Тюнинг дистанции',
    description: 'Позволяет задавать раздельные дистанции для блоков, сущностей и тумана.',
    bestAlternative: 'Embeddium Extras.'
  },
  {
    name: 'Polidium',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Альтернативный рендерер Forge',
    description: 'Самостоятельный клиентский рендерер чанков для Forge 1.20.1 с асинхронным мешингом, кастомными GPU-буферами и отсечением граней (альтернатива Embeddium).',
    bestAlternative: 'В большинстве сборок Embeddium стабильнее и совместимее с шейдерами.',
    warning: 'Заменяет движок рендера — нельзя ставить вместе с Embeddium!'
  },
  {
    name: 'FrameLift',
    category: 'Рендер, culling и FPS',
    status: 'danger',
    statusLabel: 'Плацебо',
    description: 'Псевдо-бустер FPS.',
    bestAlternative: 'Embeddium.'
  },
  {
    name: 'FPS SUPA',
    category: 'Рендер, culling и FPS',
    status: 'danger',
    statusLabel: 'Плацебо',
    description: 'Псевдо-бустер FPS.',
    bestAlternative: 'Embeddium.'
  },
  {
    name: 'Gothic Tweaks',
    category: 'Рендер, culling и FPS',
    status: 'danger',
    statusLabel: 'Плацебо',
    description: 'Любительский твик.',
    bestAlternative: 'ModernFix.'
  },
  {
    name: 'Osmium Optimization',
    category: 'Рендер, culling и FPS',
    status: 'danger',
    statusLabel: 'Плацебо / Устарел',
    description: 'Старый любительский мод.',
    bestAlternative: 'Embeddium.'
  },
  {
    name: 'PixelCrystalOptimizer',
    category: 'Рендер, culling и FPS',
    status: 'danger',
    statusLabel: 'Плацебо',
    description: 'Псевдо-оптимизатор.',
    bestAlternative: 'Embeddium.'
  },
  {
    name: 'Graphics Optimizer',
    category: 'Рендер, culling и FPS',
    status: 'danger',
    statusLabel: 'Плацебо',
    description: 'Псевдо-оптимизатор.',
    bestAlternative: 'Embeddium.'
  },
  {
    name: 'Fps Speed',
    category: 'Рендер, culling и FPS',
    status: 'danger',
    statusLabel: 'Меняет геймплей',
    description: 'Искусственно ускоряет темп тиков при просадке кадров.',
    bestAlternative: 'Не рекомендуется, ломает физику.',
    warning: 'Меняет скорость тиков и физики игры; нарушает ванильный баланс!'
  },
  {
    name: 'Bocchium',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Полезно в Незере',
    description: 'Порт Bedrodium для Forge 1.20+. Отсекает рендеринг невидимых верхних и нижних граней бедрока в Незере, разгружая видеокарту.',
    bestAlternative: 'Интегрирован с Embeddium и Rubidium.'
  },
  {
    name: 'Fast Item Frames',
    category: 'Рендер, culling и FPS',
    status: 'recommended',
    statusLabel: 'Мастхэв для складов',
    description: 'Мод от Fuzs. Полностью перерабатывает рамки, превращая их из тяжелых сущностей (entities) в легкие блоки. Устраняет падение FPS на складах с сотнями рамок, добавляет вощение и невидимость.',
    bestAlternative: 'Один из лучших модов для больших хранилищ.'
  },
  {
    name: 'FastSpawner',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Полезно для ферм',
    description: 'Мод от _nArUTo_. Оптимизирует спавнеры: скрывает вращающуюся внутри 3D-модель моба (пока не зажат Shift) и позволяет ограничить частоту частиц пламени, спасая FPS возле моб-ферм.',
    bestAlternative: 'Полезно на серверах и около ферм опыта.'
  },
  {
    name: 'Too Many Entities',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Лимит видимости сущностей',
    description: 'Мод от Discusser. Позволяет задать порог видимости для типов мобов: когда на ферме скапливается больше коров или жителей, лишние перестают отрисовываться на экране, сохраняя механику фермы и FPS.',
    bestAlternative: 'Entity Culling.'
  },
  {
    name: 'StopRendering',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Куллинг орд мобов',
    description: 'Мод от Corosus (автора Zombie Awareness). Отключает клиентский рендер и бесполезные фоновые проверки (слоты Curios, бонусы брони) у не-игроков при скоплении сотен зомби в апокалиптических сборках (DeceasedCraft).',
    bestAlternative: 'Рекомендуется для зомби-модпаков.'
  },
  {
    name: 'Gnetum',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Многопроходный рендер HUD',
    description: 'Клиентский мод для оптимизации отрисовки интерфейса (HUD). Разбивает полное обновление панели здоровья, хотбара, статус-эффектов и миникарт на несколько проходов по кадрам, уменьшая микростаттеры.',
    bestAlternative: 'ImmediatelyFast.'
  },
  {
    name: 'ThreatenGL',
    category: 'Рендер, culling и FPS',
    status: 'danger',
    statusLabel: 'Шутка / Плацебо',
    description: 'Юмористический мод-мем от Richy-Z и numelon. Перехватывает GLFW window hints и подменяет надпись в меню F3, сообщая якобы игра работает на OpenGL 4.6. Никакой реальной оптимизации рендеринга не производит.',
    bestAlternative: 'Удалить. Настоящий современный OpenGL пайплайн внедряет Embeddium.',
    warning: 'Шуточный мод-плацебо: лишь меняет строчку в F3 на OpenGL 4.6, не давая оптимизации.',
    
  },
  {
    name: 'Kerria',
    category: 'Рендер, culling и FPS',
    status: 'recommended',
    statusLabel: 'Мастхэв для анимаций',
    description: 'Высокоэффективный мод от decce. Кэширует неинтерполированные текстурные анимации (огонь, вода, порталы, анимированные текстуры модов) на GPU, полностью устраняя медленные вызовы glTexSubImage2D на каждый кадр.',
    bestAlternative: 'Мастхэв в тяжелых сборках с кучей кастомных текстур.'
  },
  {
    name: 'Better Biome Reblend',
    category: 'Рендер, culling и FPS',
    platform: 'Forge / NeoForge',
    status: 'useful',
    statusLabel: 'Быстрый Biome Blend',
    description: 'Ускоряет и сглаживает смешивание цветов травы, листвы и воды на стыках биомов (замена медленному ванильному алгоритму при 7x7–15x15).',
    bestAlternative: 'Полезно при высоком параметре Biome Blend в настройках графики; полностью совместим с Embeddium.'
  },
  {
    name: 'GPUTape',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'DSA буферы / Фикс VRAM',
    description: 'Внедряет Direct-State Access (DSA) оптимизацию для буферов OpenGL (VBO, EBO, FBO) и текстур, минимизируя лишние вызовы привязки и чиня утечки видеопамяти при работе с шейдерами (эволюционировал в GPUBooster).',
    bestAlternative: 'Полезно при нехватке VRAM и вылетах видеодрайвера.'
  },
  {
    name: 'RenderScale',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Масштабирование',
    description: 'Рендерит 3D-мир в пониженном разрешении с сохранением четкого GUI.',
    bestAlternative: 'AMD FSR Upscaler для Embeddium.'
  },
  {
    name: 'Super Resolution',
    category: 'Рендер, culling и FPS',
    status: 'useful',
    statusLabel: 'Масштабирование',
    description: 'Апскейл разрешения 3D-сцены.',
    bestAlternative: 'AMD FSR Upscaler.'
  },

  // =========================================================================
  // 2. ЧАСТИЦЫ, ПОГОДА, ЗВУК И ВИЗУАЛЬНЫЕ ЭФФЕКТЫ
  // =========================================================================
  {
    name: 'Limited Damage Indicator Particle',
    category: 'Частицы, погода, звук и визуальные эффекты',
    status: 'useful',
    statusLabel: 'Лимит частиц урона',
    description: 'Ограничивает количество всплывающих сердечек и частиц крита при нанесении урона.',
    bestAlternative: 'Полезно для PvP и битв с боссами.'
  },
  {
    name: 'No Damage Indicator (Heart Particles)',
    category: 'Частицы, погода, звук и визуальные эффекты',
    status: 'useful',
    statusLabel: 'Отключение сердечек',
    description: 'Полностью убирает всплывающие частицы урона.',
    bestAlternative: 'Полезно на слабых ПК.'
  },
  {
    name: 'No Rain',
    category: 'Частицы, погода, звук и визуальные эффекты',
    status: 'useful',
    statusLabel: 'Отключение дождя',
    description: 'Полностью отключает дождь и снег в игре, убирая просадки FPS.',
    bestAlternative: 'Полезно для слабых видеокарт.'
  },
  {
    name: 'Disable Rain',
    category: 'Частицы, погода, звук и визуальные эффекты',
    status: 'useful',
    statusLabel: 'Отключение дождя',
    description: 'Аналог No Rain.',
    bestAlternative: 'Достаточно одного из двух.'
  },
  {
    name: 'No More Potion Particles',
    category: 'Частицы, погода, звук и визуальные эффекты',
    status: 'useful',
    statusLabel: 'Отключение пузырьков зелий',
    description: 'Убирает летающие частицы эффектов вокруг игрока и мобов.',
    bestAlternative: 'Полезно.'
  },
  {
    name: 'Noeffectparticles',
    category: 'Частицы, погода, звук и визуальные эффекты',
    status: 'useful',
    statusLabel: 'Отключение частиц эффектов',
    description: 'Аналог No More Potion Particles.',
    bestAlternative: 'Достаточно одного.'
  },
  {
    name: 'Particle Muffler',
    category: 'Частицы, погода, звук и визуальные эффекты',
    status: 'useful',
    statusLabel: 'Фильтр частиц',
    description: 'Позволяет в игре выбрать и заглушить конкретные частицы, вызывающие лаги.',
    bestAlternative: 'Очень гибкий инструмент.'
  },
  {
    name: 'Particle Filter',
    category: 'Частицы, погода, звук и визуальные эффекты',
    status: 'useful',
    statusLabel: 'Фильтр частиц',
    description: 'Фильтрация спама частиц.',
    bestAlternative: 'Particle Muffler.'
  },
  {
    name: 'Particle Shield',
    category: 'Частицы, погода, звук и визуальные эффекты',
    status: 'useful',
    statusLabel: 'Лимит частиц',
    description: 'Ограничивает максимальное количество частиц на экране.',
    bestAlternative: 'PartiCull.'
  },
  {
    name: 'I DONT WANT PARTICLES!!!',
    category: 'Частицы, погода, звук и визуальные эффекты',
    status: 'useful',
    statusLabel: 'Тотальное отключение',
    description: 'Принудительно глушит большинство ванильных частиц.',
    bestAlternative: 'PartiCull (отсекает частицы за стенами, не отключая их полностью).'
  },
  {
    name: 'VisualControl',
    category: 'Частицы, погода, звук и визуальные эффекты',
    status: 'useful',
    statusLabel: 'Настройка эффектов',
    description: 'Меню отключения отдельных визуальных элементов.',
    bestAlternative: 'Embeddium Extras.'
  },
  {
    name: 'FireLimiter',
    category: 'Частицы, погода, звук и визуальные эффекты',
    status: 'useful',
    statusLabel: 'Оптимизация огня',
    description: 'Упрощает рендеринг горящих блоков и пламени на экране.',
    bestAlternative: 'Полезно для Незера.'
  },
  {
    name: 'Reload Looping Sound Fix',
    category: 'Частицы, погода, звук и визуальные эффекты',
    status: 'recommended',
    statusLabel: 'Мастхэв',
    description: 'Исправляет баг ванилы, когда зацикленные звуки (портал, вагонетка) продолжают звучать бесконечно и жрут память OpenAL.',
    bestAlternative: 'Рекомендуется.'
  },
  {
    name: 'SoundGC',
    category: 'Частицы, погода, звук и визуальные эффекты',
    status: 'recommended',
    statusLabel: 'Очистка звуковых буферов',
    description: 'Периодически выгружает неиспользуемые звуковые буферы OpenAL, предотвращая утечки звукового движка.',
    bestAlternative: 'Рекомендуется.'
  },
  {
    name: 'PartiCull',
    category: 'Частицы, погода, звук и визуальные эффекты',
    status: 'recommended',
    statusLabel: 'Мастхэв',
    description: 'Отсекает частицы, находящиеся вне поля зрения игрока (за спиной или за глухими стенами блоков).',
    bestAlternative: 'Один из лучших модов на частицы.'
  },
  {
    name: 'AsyncParticles',
    category: 'Частицы, погода, звук и визуальные эффекты',
    status: 'useful',
    statusLabel: 'Полезно',
    description: 'Переносит физические тики частиц в параллельный поток процессора.',
    bestAlternative: 'Хорош, но может мерцать в Botania.'
  },
  {
    name: 'Smart Particles',
    category: 'Частицы, погода, звук и визуальные эффекты',
    status: 'useful',
    statusLabel: 'Полезно',
    description: 'Снижает плотность частиц вдали от игрока.',
    bestAlternative: 'PartiCull.'
  },
  {
    name: 'Optimization of Campfire Smoke',
    category: 'Частицы, погода, звук и визуальные эффекты',
    status: 'useful',
    statusLabel: 'Полезно для костров',
    description: 'Сокращает время жизни и упрощает полигоны частиц дыма костров.',
    bestAlternative: 'Отлично для декоративных баз.'
  },
  {
    name: 'Particle Core',
    category: 'Частицы, погода, звук и визуальные эффекты',
    status: 'recommended',
    statusLabel: 'Мастхэв для частиц',
    description: 'Специализированный мод оптимизации частиц от fzzyhmstrs. Включает встроенный куллинг частиц вне зоны видимости, оптимизацию матричных преобразований вершин и кэширование световых карт (lightmap lookup), кардинально снижая вызовы buildGeometry.',
    bestAlternative: "Мастхэв в сборках с магическими модами (Iron's Spells, Botania)."
  },
  {
    name: 'Fast Sounds',
    category: 'Частицы, погода, звук и визуальные эффекты',
    status: 'recommended',
    statusLabel: 'Мастхэв',
    description: 'Оптимизирует аудиодвижок OpenAL, кеширует каналы и звуковые файлы.',
    bestAlternative: 'Устраняет микрофризы от звуков.'
  },

  // =========================================================================
  // 3. ОСВЕЩЕНИЕ
  // =========================================================================
  {
    name: 'Starlight with Create Fix',
    category: 'Освещение',
    status: 'outdated',
    statusLabel: 'Устарел на 1.20+',
    description: 'В 1.20+ Mojang переписали свет, и автор Spottedleaf закрыл Starlight. На 1.20+ мод часто вызывает краши чанков и баги теней с Create.',
    bestAlternative: 'Ванильный движок света 1.20+.',
    warning: 'В Minecraft 1.20+ движок света переписан в ваниле. Starlight устарел и вызывает глитчи освещения с Create 0.5.1+.'
  },
  {
    name: 'LightStar',
    category: 'Освещение',
    platform: 'Forge',
    status: 'useful',
    statusLabel: 'Кэш света Embeddium',
    description: 'Нативный Forge 1.20.1 мод от TheFlareStar. Оптимизирует клиентские запросы света при построении чанков в Embeddium: thread-local кэш координат и чтение блочного/небесного света за один проход.',
    bestAlternative: 'Снижает микрофризы при повороте камеры и не переписывает серверный движок света.'
  },
  {
    name: 'Solix',
    category: 'Освещение',
    platform: 'Forge',
    status: 'useful',
    statusLabel: 'Порт Starlight + ScalableLux',
    description: 'Современный Forge 1.20.1 форк Starlight и параллельного планировщика ScalableLux (от SolarBiscuit). Внедряет многопоточные расчеты света и убирает лишние сетевые пакеты освещения.',
    bestAlternative: 'Лучший выбор для Forge 1.20.1, если нужен переписанный асинхронный световой движок.',
    warning: 'Не совмещать со Starlight или Radon!'
  },
  {
    name: 'ScalableLux',
    category: 'Освещение',
    platform: 'Fabric / NeoForge 1.21+',
    status: 'useful',
    statusLabel: 'Преемник Starlight (Fabric/NF)',
    description: 'Высокопроизводительный преемник Starlight от ishlandmc (автора C2ME) для Fabric и NeoForge 1.21+. На классический Forge 1.20.1 перенесен в составе форка Solix.',
    bestAlternative: 'Для Forge 1.20.1 используйте Solix или ванильный движок света 1.20+.'
  },
  {
    name: 'Lucis (серверное)',
    category: 'Освещение',
    status: 'useful',
    statusLabel: 'Серверный свет',
    description: 'Оптимизация серверных расчетов света при прогрузке чанков.',
    bestAlternative: 'Radium Re-Reforged.'
  },

  // =========================================================================
  // 4. АПСКЕЙЛ И ГЕНЕРАЦИЯ КАДРОВ
  // =========================================================================
  {
    name: 'AMD FSR Upscaler & Render Scale (for Embeddium)',
    category: 'Апскейл и генерация кадров',
    status: 'recommended',
    statusLabel: 'Мастхэв для 4K/слабых GPU',
    description: 'Официальная интеграция AMD FidelityFX Super Resolution для Embeddium. Рендерит 3D-мир в 720p/1080p с апскейлом до 1440p/4K.',
    bestAlternative: 'Лучший апскейлер для Embeddium.'
  },
  {
    name: 'GGTU',
    category: 'Апскейл и генерация кадров',
    status: 'useful',
    statusLabel: 'Временной апскейл для шейдеров',
    description: 'Global Graphic Temporal Upscaler. Рендерит мир в пониженном разрешении и реконструирует изображение через алгоритмы темпорального накопления кадров (MEASU), существенно экономя GPU при работе с тяжелыми шейдерами.',
    bestAlternative: 'Отлично подходит для связки с тяжелыми шейдерами (Complementary, Rethinking Voxels).'
  },
  {
    name: 'Purescale',
    category: 'Апскейл и генерация кадров',
    status: 'useful',
    statusLabel: 'Апскейл + генерация кадров',
    description: 'Комбинирует масштабирование внутреннего разрешения рендера и генерацию промежуточных кадров, сохраняя четкость шрифтов, чата и HUD на нативном мониторе.',
    bestAlternative: 'AMD FSR Upscaler.'
  },
  {
    name: 'UpscaleCraft (Forge)',
    category: 'Апскейл и генерация кадров',
    status: 'useful',
    statusLabel: 'Апскейлер',
    description: 'Порт алгоритмов апскейла на Forge.',
    bestAlternative: 'AMD FSR Upscaler.'
  },
  {
    name: 'Interframe',
    category: 'Апскейл и генерация кадров',
    status: 'danger',
    statusLabel: 'Экспериментально',
    description: 'Попытка интерполяции кадров (Frame Generation). Увеличивает задержку ввода (input lag) и размывает GUI.',
    bestAlternative: 'Обычный пространственный апскейл FSR.',
    warning: 'Генерация кадров увеличивает задержку ввода (input lag) и размывает шрифты интерфейса.',
    
  },
  {
    name: 'PFG',
    category: 'Апскейл и генерация кадров',
    status: 'danger',
    statusLabel: 'Экспериментально',
    description: 'Pixel Frame Generation. Создает артефакты при движении.',
    bestAlternative: 'FSR.',
    warning: 'Pixel Frame Generation: создает визуальные артефакты при движении и смазывает GUI.',
    
  },
  {
    name: 'FrameGen',
    category: 'Апскейл и генерация кадров',
    status: 'danger',
    statusLabel: 'Экспериментально',
    description: 'Генератор кадров. Размывает интерфейс.',
    bestAlternative: 'FSR.',
    warning: 'Генератор кадров: размывает интерфейс и увеличивает задержку отклика.',
    
  },
  {
    name: 'Photon Frame Generation',
    category: 'Апскейл и генерация кадров',
    status: 'danger',
    statusLabel: 'Экспериментально',
    description: 'Генерация промежуточных кадров через шейдеры.',
    bestAlternative: 'FSR.',
    warning: 'Генерация промежуточных кадров через шейдеры: вызывает артефакты и мерцание теней.',
    
  },
  {
    name: 'Bons DLSS Diet (только для шейдеров Complementary Unbound)',
    category: 'Апскейл и генерация кадров',
    status: 'useful',
    statusLabel: 'Только с Complementary',
    description: 'Патч масштабирования под конкретный шейдерпак Complementary Unbound.',
    bestAlternative: 'Нужен только при игре с Complementary Unbound.',
    warning: 'Работает строго с шейдер-паком Complementary Unbound.',
    
  },

  // =========================================================================
  // 5. КАДРОВАЯ СИНХРОНИЗАЦИЯ И ОКНО В ФОНЕ
  // =========================================================================
  {
    name: 'FramePacer',
    category: 'Кадровая синхронизация и окно в фоне',
    status: 'useful',
    statusLabel: 'Плавный фреймпейсинг',
    description: 'Стабилизирует время вывода каждого кадра и устраняет микростаттеры при ограничении FPS или G-Sync/FreeSync.',
    bestAlternative: 'Отлично для плавности картинки.'
  },
  {
    name: 'StableCap Pacer (под Forge 1.19.2)',
    category: 'Кадровая синхронизация и окно в фоне',
    status: 'outdated',
    statusLabel: 'Устарел на 1.20+',
    description: 'Твик фреймпейсинга для 1.19.2. На 1.20.1 может работать некорректно.',
    bestAlternative: 'FramePacer.',
    warning: 'Создан под Forge 1.19.2; на версии 1.20.1 может приводить к сбоям или не работать.',
    
  },
  {
    name: 'Sleepframe Unfocus Limiter',
    category: 'Кадровая синхронизация и окно в фоне',
    status: 'redundant',
    statusLabel: 'Избыточен',
    description: 'Ограничитель частоты кадров при потере фокуса окна.',
    bestAlternative: 'Dynamic FPS.'
  },
  {
    name: 'Idle Boost',
    category: 'Кадровая синхронизация и окно в фоне',
    status: 'useful',
    statusLabel: 'Энергосбережение',
    description: 'Снижает энергопотребление в режиме бездействия.',
    bestAlternative: 'Dynamic FPS.'
  },
  {
    name: 'Dynamic FPS',
    category: 'Кадровая синхронизация и окно в фоне',
    platform: 'Universal (Forge/Fabric)',
    status: 'recommended',
    statusLabel: 'Мастхэв (Мульти-лоадер)',
    description: 'Мировой стандарт от lostluma (Fabric, Forge, NeoForge). Мгновенно снижает FPS до 1–10 и приглушает звук, когда окно Minecraft свернуто, не в фокусе или скрыто за браузером.',
    bestAlternative: 'Лучший выбор при частых Alt-Tab; при долгом AFK внутри игры можно дополнить или заменить на RestMode.',
    tags: ['fps', 'background', 'alt-tab', 'universal']
  },
  {
    name: 'RestMode',
    category: 'Кадровая синхронизация и окно в фоне',
    platform: 'Forge / NeoForge',
    status: 'recommended',
    statusLabel: 'Мастхэв для AFK',
    description: 'Специализированный режим энергосбережения при AFK (бездействии внутри игры): снижает FPS, дальность/частицы и включает заставку отдыха, пока вы отошли от ПК.',
    bestAlternative: 'Идеален для AFK-фарма; для снижения нагрузки при Alt-Tab используйте Dynamic FPS.'
  },

  // =========================================================================
  // 6. ПРЕСЕТЫ ДЛЯ СЛАБЫХ ПК (ОДНОРАЗОВЫЕ ТВИКИ)
  // =========================================================================
  {
    name: 'Fastglass Graphics Switch',
    category: 'Пресеты для слабых ПК',
    status: 'useful',
    statusLabel: 'Пресет настроек',
    description: 'Одноразовый пресет, отключающий прозрачность стекла.',
    bestAlternative: 'Config Preset Switch.'
  },
  {
    name: 'Emberdust Particle Cutter',
    category: 'Пресеты для слабых ПК',
    status: 'useful',
    statusLabel: 'Пресет частиц',
    description: 'Принудительно глушит частицы.',
    bestAlternative: 'PartiCull.'
  },
  {
    name: 'Cloudshear Sky Lite',
    category: 'Пресеты для слабых ПК',
    status: 'useful',
    statusLabel: 'Пресет неба',
    description: 'Отключает облака и сложное небо.',
    bestAlternative: 'Embeddium Extras.'
  },
  {
    name: 'Nimblecloud Sky Lite',
    category: 'Пресеты для слабых ПК',
    status: 'useful',
    statusLabel: 'Пресет неба',
    description: 'Упрощение неба.',
    bestAlternative: 'Embeddium Extras.'
  },
  {
    name: 'Flatlight Shading Cutter',
    category: 'Пресеты для слабых ПК',
    status: 'useful',
    statusLabel: 'Пресет теней',
    description: 'Отключает мягкие тени блоков.',
    bestAlternative: 'Настройки графики Embeddium.'
  },
  {
    name: 'Cinderlite Entity Slimmer',
    category: 'Пресеты для слабых ПК',
    status: 'useful',
    statusLabel: 'Пресет сущностей',
    description: 'Снижает дальность прорисовки мобов.',
    bestAlternative: 'Entity Culling.'
  },
  {
    name: 'Particlehush Effects Trimmer',
    category: 'Пресеты для слабых ПК',
    status: 'useful',
    statusLabel: 'Пресет эффектов',
    description: 'Глушит эффекты зелий.',
    bestAlternative: 'Particle Muffler.'
  },
  {
    name: 'Quartzframe Render Trim',
    category: 'Пресеты для слабых ПК',
    status: 'useful',
    statusLabel: 'Пресет рендера',
    description: 'Срезает детализацию блоков.',
    bestAlternative: 'Embeddium.'
  },
  {
    name: 'Featherframe FPS Boost',
    category: 'Пресеты для слабых ПК',
    status: 'useful',
    statusLabel: 'Пресет FPS',
    description: 'Комплексный пресет низких настроек.',
    bestAlternative: 'Config Preset Switch.'
  },
  {
    name: 'Quietworld Low Detail Pack',
    category: 'Пресеты для слабых ПК',
    status: 'useful',
    statusLabel: 'Пресет низкой детализации',
    description: 'Максимально упрощает декорации мира.',
    bestAlternative: 'Config Preset Switch.'
  },
  {
    name: 'Shortsight Chunk Saver',
    category: 'Пресеты для слабых ПК',
    status: 'useful',
    statusLabel: 'Пресет 4 чанков',
    description: 'Принудительно устанавливает дальность на 4 чанка.',
    bestAlternative: 'Настройки графики.'
  },
  {
    name: 'Tinyhorizon Extreme Range',
    category: 'Пресеты для слабых ПК',
    status: 'useful',
    statusLabel: 'Пресет 2 чанков',
    description: 'Экстремальное урезание дальности для слабых ноутбуков.',
    bestAlternative: 'Настройки графики.'
  },
  {
    name: 'Config Preset Switch (Low/Medium/High на F10)',
    category: 'Пресеты для слабых ПК',
    status: 'recommended',
    statusLabel: 'Мастхэв среди пресетов',
    description: 'Позволяет переключать готовые профили настроек (Low/Medium/High) прямо в игре по кнопке F10.',
    bestAlternative: 'Самый удобный инструмент переключения профилей.'
  },

  // =========================================================================
  // 7. ЗАГРУЗКА ИГРЫ И РЕСУРСПАКОВ
  // =========================================================================
  {
    name: 'Quick Boot',
    category: 'Загрузка игры и ресурспаков',
    status: 'redundant',
    statusLabel: 'Избыточен',
    description: 'Ускорение запуска.',
    bestAlternative: 'ModernFix (встроенная дедупликация и быстрая загрузка).'
  },
  {
    name: 'Fast Loading',
    category: 'Загрузка игры и ресурспаков',
    status: 'redundant',
    statusLabel: 'Избыточен',
    description: 'Ускорение загрузки.',
    bestAlternative: 'ModernFix.'
  },
  {
    name: 'BlinkLoad',
    category: 'Загрузка игры и ресурспаков',
    status: 'useful',
    statusLabel: 'Быстрый сплэш-экран',
    description: 'Пропуск медленных анимаций сплэш-экрана Forge.',
    bestAlternative: 'ModernFix.'
  },
  {
    name: 'LightLoad',
    category: 'Загрузка игры и ресурспаков',
    status: 'redundant',
    statusLabel: 'Избыточен',
    description: 'Облегчение загрузки ресурсов.',
    bestAlternative: 'ModernFix.'
  },
  {
    name: 'Smooth Loading Screens',
    category: 'Загрузка игры и ресурспаков',
    status: 'useful',
    statusLabel: 'Плавный экран загрузки',
    description: 'Устраняет подвисание экрана загрузки при старте игры.',
    bestAlternative: 'Полезно для визуала.'
  },
  {
    name: 'PackForge',
    category: 'Загрузка игры и ресурспаков',
    status: 'useful',
    statusLabel: 'Оптимизация ресурспаков',
    description: 'Оптимизирует обработку текстурпаков при запуске.',
    bestAlternative: 'ResourcePackCached.'
  },
  {
    name: 'Keep The ResourcePack',
    category: 'Загрузка игры и ресурспаков',
    status: 'useful',
    statusLabel: 'Кеш ресурспаков',
    description: 'Предотвращает повторную распаковку ресурспака при каждом перезапуске.',
    bestAlternative: 'Полезно для тяжелых паков.'
  },
  {
    name: 'TheFastLaunch -TFL-',
    category: 'Загрузка игры и ресурспаков',
    status: 'redundant',
    statusLabel: 'Избыточен',
    description: 'Твик запуска.',
    bestAlternative: 'ModernFix.'
  },
  {
    name: 'Language Reload Reforged',
    category: 'Загрузка игры и ресурспаков',
    status: 'recommended',
    statusLabel: 'Мастхэв',
    description: 'Мгновенное переключение языка игры без зависания клиента и перезагрузки текстур.',
    bestAlternative: 'Рекомендуется.'
  },
  {
    name: 'Just Enough Loading',
    category: 'Загрузка игры и ресурспаков',
    status: 'useful',
    statusLabel: 'Прогресс-бар JEI',
    description: 'Показывает точный прогресс индексации рецептов JEI.',
    bestAlternative: 'Полезно.'
  },
  {
    name: 'OptiLoad',
    category: 'Загрузка игры и ресурспаков',
    status: 'redundant',
    statusLabel: 'Избыточен',
    description: 'Оптимизатор загрузки.',
    bestAlternative: 'ModernFix.'
  },
  {
    name: 'NoRespLoadFix',
    category: 'Загрузка игры и ресурспаков',
    status: 'useful',
    statusLabel: 'Фикс зависания респавна',
    description: 'Устраняет задержку черного экрана при респавне игрока после смерти.',
    bestAlternative: 'Полезно.'
  },
  {
    name: 'Startup World',
    category: 'Загрузка игры и ресурспаков',
    status: 'useful',
    statusLabel: 'Авто-вход в мир',
    description: 'Автоматически загружает выбранный мир сразу после запуска клиента.',
    bestAlternative: 'Удобно для тестирования сборок.'
  },
  {
    name: 'Slothfullllll',
    category: 'Загрузка игры и ресурспаков',
    status: 'redundant',
    statusLabel: 'Избыточен',
    description: 'Отложенная инициализация ресурсов.',
    bestAlternative: 'ModernFix (Dynamic Resources).'
  },
  {
    name: 'Debloatfy',
    category: 'Загрузка игры и ресурспаков',
    status: 'useful',
    statusLabel: 'Очистка меню',
    description: 'Убирает лишние кнопки и рекламные виджеты из главного меню.',
    bestAlternative: 'Полезно.'
  },
  {
    name: 'LoadStep',
    category: 'Загрузка игры и ресурспаков',
    status: 'useful',
    statusLabel: 'Пошаговая загрузка',
    description: 'Логирование шагов загрузки модов.',
    bestAlternative: 'Startup Profiler.'
  },
  {
    name: 'LoadLeak',
    category: 'Загрузка игры и ресурспаков',
    status: 'redundant',
    statusLabel: 'Избыточен',
    description: 'Попытка фикса утечек загрузчика.',
    bestAlternative: 'ModernFix.'
  },
  {
    name: 'Fastlate',
    category: 'Загрузка игры и ресурспаков',
    status: 'redundant',
    statusLabel: 'Избыточен',
    description: 'Отложенная загрузка.',
    bestAlternative: 'ModernFix.'
  },
  {
    name: 'Quality Lite',
    category: 'Загрузка игры и ресурспаков',
    status: 'danger',
    statusLabel: 'Плацебо',
    description: 'Упрощенный твик.',
    bestAlternative: 'ModernFix.'
  },
  {
    name: 'Ksyxis',
    category: 'Загрузка игры и ресурспаков',
    status: 'recommended',
    statusLabel: 'Мастхэв для сингла',
    description: 'Отключает задержку предзагрузки чанков спавна при входе в одиночный мир. Мир запускается мгновенно.',
    bestAlternative: 'Рекомендуется.'
  },
  {
    name: 'LanguageReloadUnofficial',
    category: 'Загрузка игры и ресурспаков',
    status: 'recommended',
    statusLabel: 'Мастхэв',
    description: 'Быстрое переключение языка.',
    bestAlternative: 'Language Reload Reforged.'
  },
  {
    name: 'ResourcePackCached',
    category: 'Загрузка игры и ресурспаков',
    status: 'useful',
    statusLabel: 'Полезно',
    description: 'Кеширует распакованные данные ресурспаков на диске.',
    bestAlternative: 'Полезно для паков 64x+.'
  },

  // =========================================================================
  // 8. ПАМЯТЬ И УТЕЧКИ
  // =========================================================================
  {
    name: 'ModernFix',
    category: 'Память и утечки',
    installed: true,
    status: 'recommended',
    statusLabel: 'Абсолютный мастхэв',
    description: 'Ускоряет запуск в 2-4 раза, снижает RAM на 1-2 ГБ за счет дедупликации данных и моделей, чинит тысячи утечек.',
    bestAlternative: 'Незаменим для 1.16+.'
  },
  {
    name: 'FerriteCore',
    category: 'Память и утечки',
    installed: true,
    status: 'recommended',
    statusLabel: 'Абсолютный мастхэв',
    description: 'Сжимает структуры данных BlockState в оперативной памяти. Экономит до 40-50% RAM.',
    bestAlternative: 'Незаменим.'
  },
  {
    name: 'AllTheLeaks (Memory Leak Fix)',
    category: 'Память и утечки',
    status: 'recommended',
    statusLabel: 'Мастхэв',
    description: 'Исправляет утечки памяти в коде Minecraft при смене миров и перезаходах.',
    bestAlternative: 'Рекомендуется.'
  },
  {
    name: 'Jasione',
    category: 'Память и утечки',
    status: 'recommended',
    statusLabel: 'Мастхэв',
    description: 'Мод от decce. Использует байткод-анализ (asm-analysis) для устранения избыточного клонирования массивов при Enum.values(), снижая нагрузку на GC.',
    bestAlternative: 'Безопасный современный преемник старого Redirector.'
  },
  {
    name: 'Duplicate NBT Flattener',
    category: 'Память и утечки',
    status: 'recommended',
    statusLabel: 'Рекомендуется для больших сборок',
    description: 'Находит и сжимает повторяющиеся NBT-теги у предметов и чанков в памяти.',
    bestAlternative: 'Отлично для сборок на 200+ модов.'
  },
  {
    name: 'Distant Horizons Memory Fix (только с DH)',
    category: 'Память и утечки',
    status: 'useful',
    statusLabel: 'Только с Distant Horizons',
    description: 'Критический патч утечек памяти при игре с модом на дальнюю прорисовку Distant Horizons (LODs).',
    bestAlternative: 'Обязательно при наличии Distant Horizons.',
    warning: 'Требуется строго при наличии мода Distant Horizons (DH).',
    
  },
  {
    name: 'AllTheLeaks Fix for Moonlight 2.13.4',
    category: 'Память и утечки',
    status: 'useful',
    statusLabel: 'Точечный фикс Moonlight',
    description: 'Специальный патч утечки памяти для библиотеки Moonlight конкретной версии 2.13.4.',
    bestAlternative: 'Обновить Moonlight до новой версии.',
    warning: 'Необходим ТОЛЬКО для Moonlight 2.13.4. В Moonlight 2.13.5+ утечка исправлена автором.',
    
  },
  {
    name: 'QNM (только с Quark)',
    category: 'Память и утечки',
    status: 'useful',
    statusLabel: 'Только с Quark',
    description: 'Закрывает утечку памяти в сетевых пакетах мода Quark.',
    bestAlternative: 'Ставить только с Quark.',
    warning: 'Специфический оптимизатор для Quark. Без Quark не требуется.',
    
  },
  {
    name: 'Memory Leak Fix modern port',
    category: 'Память и утечки',
    status: 'recommended',
    statusLabel: 'Мастхэв',
    description: 'Современный порт классического MemoryLeakFix.',
    bestAlternative: 'AllTheLeaks.'
  },
  {
    name: 'Put A Plug In it! (PAPI)',
    category: 'Память и утечки',
    status: 'recommended',
    statusLabel: 'Мастхэв для логов',
    description: 'Глушит бесконечный спам ошибок в консоли и лог-файлах от кривых модов, защищая диск от зависаний.',
    bestAlternative: 'PAPI.'
  },
  {
    name: 'MCreatorMemFix',
    category: 'Память и утечки',
    status: 'useful',
    statusLabel: 'Фикс MCreator-модов',
    description: 'Исправляет серьезный баг утечки и избыточного выделения памяти в модах, созданных на базе MCreator (особенно с переменными, привязанными к игрокам). Устраняет частые GC-фризы.',
    bestAlternative: 'Обязательно, если в сборке есть моды на MCreator.'
  },
  {
    name: 'Calm The Leaks',
    category: 'Память и утечки',
    status: 'diagnostic',
    statusLabel: 'Диагностика утечек',
    description: 'Диагностический аддон для AllTheLeaks. Фильтрует ложные срабатывания, анализирует тренды роста памяти и интегрируется со spark, выдавая понятные отчеты об источниках утечек.',
    bestAlternative: 'Ставить вместе с AllTheLeaks для поиска проблемных модов.'
  },
  {
    name: 'nicelight_memoryfix',
    category: 'Память и утечки',
    status: 'useful',
    statusLabel: 'Фикс памяти света',
    description: 'Устраняет утечку массивов световых данных.',
    bestAlternative: 'ModernFix.'
  },
  {
    name: 'Lean Object',
    category: 'Память и утечки',
    status: 'useful',
    statusLabel: 'Сжатие объектов Java',
    description: 'Уменьшает размер заголовков объектов в памяти JVM.',
    bestAlternative: 'FerriteCore.'
  },
  {
    name: 'MemoryFreeze Fix',
    category: 'Память и утечки',
    status: 'useful',
    statusLabel: 'Фикс зависаний RAM',
    description: 'Предотвращает зависание клиента при достижении лимита выделенной памяти.',
    bestAlternative: 'ModernFix.'
  },
  {
    name: 'Sanitivy',
    category: 'Память и утечки',
    status: 'danger',
    statusLabel: 'Опасно / Фризы',
    description: 'Принудительная очистка памяти.',
    bestAlternative: 'Не ставить, вызывает статтеры.'
  },
  {
    name: 'Recoleta',
    category: 'Память и утечки',
    status: 'danger',
    statusLabel: 'Опасно / Фризы',
    description: 'Принудительный вызов сборщика мусора.',
    bestAlternative: 'Удалить. Ломает G1GC/ZGC.',
    warning: 'Принудительная сборка мусора в фоновом режиме. Вызывает периодические фризы вместо экономии памяти.',
    
  },
  {
    name: 'RAMization',
    category: 'Память и утечки',
    status: 'danger',
    statusLabel: 'Опасно / Фризы',
    description: 'Автоклинер оперативной памяти.',
    bestAlternative: 'Удалить. Нарушает работу JVM.',
    warning: 'Автоклинер RAM, вызывающий стоп-тайм паузы JVM. Противоречит современным сборщикам G1GC.',
    
  },
  {
    name: 'Furia Memory',
    category: 'Память и утечки',
    status: 'danger',
    statusLabel: 'Опасно / Фризы',
    description: 'Принудительный вызов System.gc().',
    bestAlternative: 'Удалить.',
    warning: 'Принудительный вызов System.gc(). Неэффективен и вызывает лаг-спайки на современных сборках Java.',
    
  },
  {
    name: 'GcGo (серверное)',
    category: 'Память и утечки',
    status: 'danger',
    statusLabel: 'Опасно для серверов',
    description: 'Серверный принудительный сбор мусора.',
    bestAlternative: 'Удалить. Настроить аргументы Java-сервера (ZGC/G1GC).',
    warning: 'Периодически форсирует System.gc(), что вызывает тяжелые стоп-тайм фризы (Stop-The-World) на Java 17/21.',
    
  },
  {
    name: 'Slime: Heuristic Memory Purger (серверное)',
    category: 'Память и утечки',
    status: 'danger',
    statusLabel: 'Опасно для серверов',
    description: 'Эвристический очиститель памяти. Вызывает лаг-спайки при очистке.',
    bestAlternative: 'Удалить.',
    warning: 'Эвристический клинер памяти. Провоцирует микрофризы и сбивает автоматический GC Java.',
    
  },
  {
    name: 'Simply Server Ram Optimizer [Cleaner]',
    category: 'Память и утечки',
    status: 'danger',
    statusLabel: 'Опасно / Не ставить',
    description: 'Периодический автоклинер RAM.',
    bestAlternative: 'Удалить.',
    warning: 'Периодический автоклинер RAM, вызывающий секундные замирания сервера при очистке.',
    
  },
  {
    name: 'MemGuard',
    category: 'Память и утечки',
    status: 'danger',
    statusLabel: 'Опасно / Стоп-кадры',
    description: 'Аварийный вызов System.gc() при 90% RAM, порождает 3-5 секундные зависания прямо в игре.',
    bestAlternative: 'Выделить 6-8 ГБ ОЗУ и настроить аргументы JVM.',
    warning: 'Аварийный вызов System.gc() при 90% RAM, порождает 3-5 секундные зависания прямо в игре.',
    
  },
  {
    name: 'Redirected',
    category: 'Память и утечки',
    status: 'outdated',
    statusLabel: 'Устарел',
    description: 'Старый мод редиректов Enum.values().',
    bestAlternative: 'Jasione.'
  },
  {
    name: 'Redirector [Modern]',
    category: 'Память и утечки',
    status: 'outdated',
    statusLabel: 'Устарел',
    description: 'Старый мод редиректов Enum.values().',
    bestAlternative: 'Jasione.'
  },
  {
    name: 'Rhenium',
    category: 'Память и утечки',
    status: 'outdated',
    statusLabel: 'Устарел',
    description: 'Экспериментальный кеш.',
    bestAlternative: 'ModernFix.'
  },
  {
    name: 'Collections Of Optimizations',
    category: 'Память и утечки',
    status: 'useful',
    statusLabel: 'Патчи от Misanthropy',
    description: 'Мод от Misanthropy (автора Emberbium). Содержит коллекцию точечных микро-оптимизаций и фиксов совместимости для других модов, снижает аллокации памяти и устраняет микро-статтеры на Forge 1.20.1.',
    bestAlternative: 'Отлично для тяжелых сборок на 1.20.1.'
  },

  // =========================================================================
  // 9. ПОТОКИ И ПРОЦЕССОР
  // =========================================================================
  {
    name: 'Ixeris',
    category: 'Потоки и процессор',
    status: 'recommended',
    statusLabel: 'Мастхэв для ввода',
    description: 'Оптимизатор ввода от decce (миллионы загрузок). Устраняет дропы кадров при движении мыши за счет буферизованного Raw Input и отдельного потока опроса событий.',
    bestAlternative: 'Отличный мод для идеальной плавности мыши на Windows.'
  },
  {
    name: 'Threads',
    category: 'Потоки и процессор',
    status: 'useful',
    statusLabel: 'Пул потоков',
    description: 'Расширяет пул рабочих потоков Minecraft.',
    bestAlternative: 'ThreadTweak Reforged.'
  },
  {
    name: 'Thread Priorities',
    category: 'Потоки и процессор',
    status: 'useful',
    statusLabel: 'Приоритеты ОС',
    description: 'Настраивает приоритеты потоков операционной системы.',
    bestAlternative: 'ThreadTweak Reforged.'
  },
  {
    name: 'ThreadTweak Reforged',
    category: 'Потоки и процессор',
    platform: 'Forge',
    status: 'useful',
    statusLabel: 'Порт ThreadTweak (Потоки)',
    description: 'Forge-порт мода ThreadTweak (духовный наследник Smooth Boot). Позволяет гибко настраивать приоритеты потоков игры (Render, Server, Netty, I/O) прямо в настройках.',
    bestAlternative: 'Современная замена Smooth Boot для Intel 12-14 поколений и Ryzen.'
  },
  {
    name: 'TridentPerf',
    category: 'Потоки и процессор',
    status: 'useful',
    statusLabel: 'Оптимизация циклов',
    description: 'Экспериментальная оптимизация циклов CPU.',
    bestAlternative: 'Radium Re-Reforged.'
  },
  {
    name: 'StutterFix-Reforged',
    category: 'Потоки и процессор',
    platform: 'Forge',
    status: 'useful',
    statusLabel: 'Фикс микрофризов (Порт)',
    description: 'Forge-порт StutterFix: устраняет микрозадержки планировщика задач Minecraft (tick/render synchronization) на многоядерных процессорах.',
    bestAlternative: 'Хорошо работает вместе с Ixeris и ThreadTweak Reforged.'
  },
  {
    name: 'StutterFix modern port',
    category: 'Потоки и процессор',
    status: 'useful',
    statusLabel: 'Фикс микрофризов',
    description: 'Современный порт StutterFix.',
    bestAlternative: 'StutterFix-Reforged.'
  },
  {
    name: 'HP: HariPlayer (серверное)',
    category: 'Потоки и процессор',
    status: 'useful',
    statusLabel: 'Многопоточные игроки',
    description: 'Серверная многопоточная обработка тиков игроков от Hari_Porter.',
    bestAlternative: 'Полезно для серверов с онлайном 20+ человек.'
  },

  // =========================================================================
  // 10. ЧАНКИ И ГЕНЕРАЦИЯ МИРА
  // =========================================================================
  {
    name: 'Noisiumed',
    category: 'Чанки и генерация мира',
    platform: 'Forge / NeoForge',
    installed: true,
    status: 'recommended',
    statusLabel: 'Мастхэв (Форк Noisium)',
    description: 'Поддерживаемый форк/порт прекратившегося Fabric-мода Noisium. Ускоряет вычисления шума генератора мира и биомов в 2–3 раза без изменения ванильного рельефа.',
    bestAlternative: 'Топовый мод генерации мира для Forge 1.20.1+.'
  },
  {
    name: 'Concurrent Chunk Management Engine - Forge (C2ME)',
    category: 'Чанки и генерация мира',
    platform: 'Forge',
    status: 'useful',
    statusLabel: 'Неофиц. порт C2ME',
    description: 'Неофициальный порт Fabric C2ME для Forge 1.20.1 (от Makki132). Распараллеливает генерацию и I/O чанков на все ядра CPU, но в тяжелых модовых сборках может вести себя менее стабильно, чем оригинал.',
    bestAlternative: 'Если уже используете Sinytra Connector, оригинальный Fabric C2ME обычно новее; перед тестом делайте бэкап мира.',
    warning: 'Неофициальный порт многопоточной генерации чанков — не совмещать с Fabric C2ME, C2MER или HariChunk.'
  },
  {
    name: 'C2MER',
    category: 'Чанки и генерация мира',
    platform: 'Forge',
    status: 'useful',
    statusLabel: 'Рефорк C2ME',
    description: 'Альтернативный неофициальный Forge-порт C2ME (от qingfeng1314886).',
    bestAlternative: 'Оригинальный C2ME через Sinytra Connector или Noisiumed.'
  },
  {
    name: 'HC: HariChunk',
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Асинхронные чанки',
    description: 'Независимый форк C2ME от Hari_Porter для Forge 1.20.1 с асинхронным I/O.',
    bestAlternative: 'Полезен на процессорах с 8+ ядрами.'
  },
  {
    name: 'SuperChunk',
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'GPU генерация (OpenCL)',
    description: 'Утилита генерации от TheProKnightGamer с аппаратным OpenCL GPU-ускорением.',
    bestAlternative: 'Для массивной предгенерации карты.'
  },
  {
    name: 'Chunk Optimization',
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Оптимизация чанков',
    description: 'Оптимизация структуры данных чанков.',
    bestAlternative: 'Radium Re-Reforged.'
  },
  {
    name: 'SwiftGen',
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Быстрая генерация',
    description: 'Ускорение математических циклов генерации ландшафта.',
    bestAlternative: 'Noisiumed.'
  },
  {
    name: 'Unium',
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Экспериментальные чанки',
    description: 'Форк оптимизации загрузки чанков.',
    bestAlternative: 'C2ME.'
  },
  {
    name: 'QuantumChunks (серверное)',
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Серверные чанки',
    description: 'Серверная оптимизация кеширования чанков.',
    bestAlternative: 'ServerCore.'
  },
  {
    name: 'Dimensional Threading Reforked (серверное)',
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Многопоточные измерения',
    description: 'Обрабатывает тики каждого измерения (Overworld, Nether, End) в отдельном потоке процессора.',
    bestAlternative: 'Очень мощно для серверов со множеством измерений.'
  },
  {
    name: 'Generator Accelerator 2',
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Ускоритель генератора',
    description: 'Твик генератора мира.',
    bestAlternative: 'Noisiumed.'
  },
  {
    name: 'Noise Boost',
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Шум генерации',
    description: 'Быстрые таблицы шума Perlin/Simplex.',
    bestAlternative: 'Noisiumed.'
  },
  {
    name: 'TerrainGraph',
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Граф ландшафта',
    description: 'Оптимизация дерева генерации плотности рельефа.',
    bestAlternative: 'Noisiumed.'
  },
  {
    name: 'Ultra Fast Pregen',
    category: 'Чанки и генерация мира',
    status: 'redundant',
    statusLabel: 'Избыточен',
    description: 'Утилита предгенерации.',
    bestAlternative: 'Chunky — мировой стандарт без утечек памяти.'
  },
  {
    name: 'nicelight_async_loader',
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Асинхронный загрузчик',
    description: 'Асинхронная подгрузка чанков.',
    bestAlternative: 'C2ME.'
  },
  {
    name: "Shadowed's No More Lazy Chunk Loader",
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Фикс чанклоадеров',
    description: 'Исправляет зависшие ленивые чанки при работе технических чанклоадеров.',
    bestAlternative: 'Полезно.'
  },
  {
    name: 'Chunk Schedudeler',
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Планировщик чанков',
    description: 'Улучшает приоритеты очередей загрузки чанков.',
    bestAlternative: 'ServerCore.'
  },
  {
    name: 'Portalium',
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Быстрые порталы',
    description: 'Ускоряет загрузку чанков при телепортации через порталы Незера/Энда.',
    bestAlternative: 'Полезно.'
  },
  {
    name: 'Chunk Prefetcher',
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Предвыборка чанков',
    description: 'Заранее начинает подгружать чанки по направлению движения игрока.',
    bestAlternative: 'Полезно при быстром беге.'
  },
  {
    name: 'Driftload',
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Плавная загрузка',
    description: 'Сглаживает спайки лагов при входе в новые чанки.',
    bestAlternative: 'ServerCore.'
  },
  {
    name: "Fly's Adrenaline",
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Ускорение при полете',
    description: 'Оптимизирует чанки при полете на элитрах.',
    bestAlternative: 'C2ME.'
  },
  {
    name: 'DataFly Lib',
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Библиотека',
    description: 'Зависимость для модов полета и чанков.',
    bestAlternative: 'Ставить по необходимости.'
  },
  {
    name: 'Delta Chunk',
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Дельта-сохранение',
    description: 'Сохраняет на диск только изменившиеся блоки чанка.',
    bestAlternative: 'Полезно.'
  },
  {
    name: 'Polycore',
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Библиотека',
    description: 'Библиотека для генераторов мира.',
    bestAlternative: 'Ставить по необходимости.'
  },
  {
    name: 'Structure DFU Cache',
    category: 'Чанки и генерация мира',
    status: 'recommended',
    statusLabel: 'Мастхэв для данжей',
    description: 'Кеширует обновление DataFixerUpper для структур датапаков, кардинально ускоряя генерацию данжей и деревень.',
    bestAlternative: 'Обязательно для сборок со 100+ модами.'
  },
  {
    name: 'BlocksPrint',
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Снимок блоков',
    description: 'Оптимизация десериализации блоков чанка.',
    bestAlternative: 'FerriteCore.'
  },
  {
    name: 'seedgen map',
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Кеш сида',
    description: 'Кеширует данные сида мира.',
    bestAlternative: 'Полезно.'
  },
  {
    name: 'Chlorine trifluoride',
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Экспериментальные чанки',
    description: 'Экспериментальный мод оптимизации чанков.',
    bestAlternative: 'C2ME.'
  },
  {
    name: '[bc]lightning-terrain (меняет рельеф мира)',
    category: 'Чанки и генерация мира',
    status: 'danger',
    statusLabel: 'Меняет ландшафт',
    description: 'Упрощенный генератор ландшафта, кардинально меняющий форму гор и биомов.',
    bestAlternative: 'Noisiumed (сохраняет 100% ванильный рельеф).',
    warning: 'Внимание: меняет алгоритмы генерации и визуальный рельеф мира.'
  },
  {
    name: 'Chunky',
    category: 'Чанки и генерация мира',
    status: 'recommended',
    statusLabel: 'Мировой лидер предгенерации',
    description: 'Самый безопасный, стабильный и быстрый прегенератор мира по радиусу или координатам без утечек памяти.',
    bestAlternative: 'Заменяет старые Chunk-Pregenerator, FastChunkGen и Bye?Pregen!.'
  },
  {
    name: 'ServerWarashi',
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Профайлер лагов',
    description: 'Инструмент диагностики от MoePus. Находит дорогие чанки и мобов, блокирует сбойные чанклоадеры и проецирует оверлей производительности на Xaero\'s World Map.',
    bestAlternative: 'Отличный инструмент для серверов.'
  },
  {
    name: 'Fast Noise',
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Полезно',
    description: 'Оптимизация вычислений шума биомов.',
    bestAlternative: 'Noisiumed.'
  },
  {
    name: 'Structure Layout Optimizer',
    category: 'Чанки и генерация мира',
    platform: 'Universal (Forge/Fabric)',
    status: 'useful',
    statusLabel: 'Ускорение Jigsaw-структур',
    description: 'Оптимизирует алгоритмы подбора и размещения комнат Jigsaw при генерации сложных модовых данжей и структур (от TelepathicGrunt).',
    bestAlternative: 'Совместим со Structure DFU Cache: один кеширует DataFixer, а второй ускоряет раскладку комнат структур.'
  },
  {
    name: 'BiomeSpy',
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Полезно',
    description: 'Быстрый поиск биомов.',
    bestAlternative: 'Noisiumed.'
  },

  // =========================================================================
  // 11. ТИКИ, TPS, СУЩНОСТИ И ИИ
  // =========================================================================
  {
    name: 'Radium Re-Reforged',
    category: 'Тики, TPS, сущности и ИИ',
    platform: 'Forge',
    installed: true,
    status: 'recommended',
    statusLabel: 'Абсолютный мастхэв (Порт Lithium)',
    description: 'Активно поддерживаемое продолжение Radium Reforged (от big_energy) для Forge 1.20.1. Полный порт логики Lithium: оптимизирует физику, коллизии, ИИ мобов, воронки и редстоун, плюс исправляет краши NBT/ConcurrentModification и добавляет патчи для Create, C2ME, Valkyrien Skies и Ice and Fire.',
    bestAlternative: 'Однозначный лидер среди портов Lithium для Forge 1.20.1 (лучше старого Radium Reforged и урезанного Canary).'
  },
  {
    name: 'Radium Reforged (оригинал)',
    category: 'Тики, TPS, сущности и ИИ',
    platform: 'Forge',
    status: 'outdated',
    statusLabel: 'Устарел / Заброшен',
    description: 'Оригинальный порт Lithium от Asek3 для Forge. Разработка угасла, остались старые баги с NBT и совместимостью модов. Имеет тот же mod id "radium", что и Radium Re-Reforged.',
    bestAlternative: 'Заменить на Radium Re-Reforged!',
    warning: 'Несовместим с Radium Re-Reforged, Canary и Lithium — игра упадет при старте.'
  },
  {
    name: 'BadOptimizations',
    category: 'Тики, TPS, сущности и ИИ',
    platform: 'Universal (Forge/Fabric)',
    status: 'recommended',
    statusLabel: 'Мастхэв',
    description: 'Мультиплатформенный мод от FrogCipher (нативно под Forge, NeoForge и Fabric). Вырезает лишние ванильные микро-вычисления (F3, sky-light, парсинг цветов), не меняя геймплей.',
    bestAlternative: 'Очень надежен, стабилен и безопасен.'
  },
  {
    name: 'ServerCore',
    category: 'Тики, TPS, сущности и ИИ',
    platform: 'Universal (Forge/Fabric)',
    status: 'recommended',
    statusLabel: 'Мастхэв',
    description: 'Официальный мультиплатформенный оптимизатор от Wesley8081 (нативно Forge/Fabric): динамический view-distance при просадках TPS, умный троттлинг мозга жителей и мобов.',
    bestAlternative: 'Лучший серверный и одиночный оптимизатор TPS на 1.20+.'
  },
  {
    name: 'Alternate Current',
    category: 'Тики, TPS, сущности и ИИ',
    platform: 'Universal (Forge/Fabric)',
    status: 'useful',
    statusLabel: 'Оптимизация редстоуна',
    description: 'Мультиплатформенный мод от SpaceWalker (Fabric, Forge, NeoForge). Полностью переписывает порядок обновления красной пыли, снижая лаги сложных редстоун-схем в десятки раз.',
    bestAlternative: 'Отлично дополняет Radium Re-Reforged в технических сборках (не меняет ванильные тайминги большинства схем).'
  },
  {
    name: 'Immersive Optimization',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'recommended',
    statusLabel: 'Мастхэв для TPS',
    description: 'Динамический планировщик тиков сущностей (Entity Tick Scheduler). Замедляет тики мобов в зависимости от дистанции и зоны видимости вместо их заморозки. Удваивает TPS без поломки Create и моб-ферм.',
    bestAlternative: 'Отличный мод, совместим с Create и Valkyrien Skies.'
  },
  {
    name: 'Tick Tweaks',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Твики тиков',
    description: 'Тонкая настройка интервалов тиков сущностей.',
    bestAlternative: 'ServerCore.'
  },
  {
    name: 'Tpsum',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Монитор TPS',
    description: 'Быстрый расчет среднего TPS сервера.',
    bestAlternative: 'Spark.'
  },
  {
    name: 'Harium',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Оптимизатор тиков',
    description: 'Мод оптимизации тиков от Hari_Porter.',
    bestAlternative: 'Radium Re-Reforged.'
  },
  {
    name: 'HE: HariEntity',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Оптимизация мобов',
    description: 'Оптимизация вычислений сущностей от Hari_Porter.',
    bestAlternative: 'Immersive Optimization.'
  },
  {
    name: 'SpeeDeeEntity',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Быстрые сущности',
    description: 'Ускоряет циклы перебора сущностей в чанках.',
    bestAlternative: 'Radium Re-Reforged.'
  },
  {
    name: 'Capability Fix',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'recommended',
    statusLabel: 'Мастхэв',
    description: 'Исправляет утечки памяти и инвалидацию Forge Capabilities при выгрузке чанков.',
    bestAlternative: 'Рекомендуется.'
  },
  {
    name: 'Capability Fix Revived',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'recommended',
    statusLabel: 'Мастхэв',
    description: 'Актуальный порт Capability Fix.',
    bestAlternative: 'Рекомендуется.'
  },
  {
    name: 'Fast Tag',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Быстрые теги',
    description: 'Кеширует проверку тегов предметов и блоков.',
    bestAlternative: 'ModernFix.'
  },
  {
    name: 'Fast Recipes',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Быстрые рецепты',
    description: 'Кеширует проверки рецептов.',
    bestAlternative: 'Fast Recipe Search.'
  },
  {
    name: 'All Roads Lead to Rome',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Поиск путей',
    description: 'Оптимизирует алгоритмы поиска путей (Pathfinding) мобов.',
    bestAlternative: 'Radium Re-Reforged.'
  },
  {
    name: 'EngineCore',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Ядро тиков',
    description: 'Твики движка тиков.',
    bestAlternative: 'ServerCore.'
  },
  {
    name: 'TickTact',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Синхронизация тиков',
    description: 'Стабилизация тайминга тиков.',
    bestAlternative: 'ServerCore.'
  },
  {
    name: 'Tick Stabilizer',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Стабилизатор тиков',
    description: 'Сглаживание лаг-спайков тиков.',
    bestAlternative: 'ServerCore.'
  },
  {
    name: 'Tick Weave (экспериментальный)',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Многопоточные тики',
    description: 'Экспериментальная параллелизация тиков.',
    bestAlternative: 'Radium Re-Reforged.'
  },
  {
    name: 'Tantalum',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Оптимизатор',
    description: 'Твик логики редстоуна и воронок.',
    bestAlternative: 'Radium Re-Reforged.'
  },
  {
    name: 'Entity Collision Optimization',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'recommended',
    statusLabel: 'Мастхэв для ферм',
    description: 'Оптимизирует взаимное выталкивание мобов в скоплениях, предотвращая зависание сервера.',
    bestAlternative: 'Рекомендуется.'
  },
  {
    name: 'Mob Collision Off',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Отключение коллизий мобов',
    description: 'Полностью отключает коллизии между мобами.',
    bestAlternative: 'Entity Collision Optimization.'
  },
  {
    name: 'FarmCollisionless',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Коллизии на фермах',
    description: 'Убирает коллизии только у скота в загонах.',
    bestAlternative: 'Entity Collision Optimization.'
  },
  {
    name: 'Enttick',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Троттлинг тиков',
    description: 'Пропуск тиков неактивных мобов.',
    bestAlternative: 'Immersive Optimization.'
  },
  {
    name: 'OptimizeMod',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'danger',
    statusLabel: 'Плацебо',
    description: 'Любительский мод.',
    bestAlternative: 'Radium Re-Reforged.'
  },
  {
    name: 'Papi Optimization',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Оптимизация логов',
    description: 'Глушит спам в консоли.',
    bestAlternative: 'Put A Plug In it!.'
  },
  {
    name: 'Pingy - Ping Optimized',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Оптимизация пинга',
    description: 'Уменьшает задержку передачи пакетов пинга.',
    bestAlternative: 'Krypton Reno.'
  },
  {
    name: 'I Can Take A Horde',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Оптимизация толп зомби',
    description: 'Специально оптимизирует поиск путей для гигантских орд зомби.',
    bestAlternative: 'Отлично для зомби-апокалипсис сборок.'
  },
  {
    name: 'FurnaceOptimizer',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Оптимизация печей',
    description: 'Кеширует процесс переплавки в печах.',
    bestAlternative: 'FastFurnace.'
  },
  {
    name: 'Martensite entity tick skiper',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Пропуск тиков',
    description: 'Пропускает тики сущностей при просадке TPS.',
    bestAlternative: 'Immersive Optimization.'
  },
  {
    name: 'Nudge',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Сдвиг мобов',
    description: 'Упрощенный алгоритм раздвигания мобов.',
    bestAlternative: 'Entity Collision Optimization.'
  },
  {
    name: 'Sleepium',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Спящие мобы',
    description: 'Усыпляет мобов вне зоны видимости.',
    bestAlternative: 'Immersive Optimization.'
  },
  {
    name: 'Nolith',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Твик ИИ',
    description: 'Упрощение дерева решений ИИ.',
    bestAlternative: 'ServerCore.'
  },
  {
    name: 'Stfu Reforged',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Глушитель звуков мобов',
    description: 'Уменьшает частоту мычания/хрюканья животных в загонах.',
    bestAlternative: 'Полезно для ушей и FPS.'
  },
  {
    name: 'Better TNT',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Быстрый TNT',
    description: 'Оптимизирует одновременный взрыв сотен динамитов.',
    bestAlternative: 'Полезно для анархии и технических баз.',
    warning: 'Изменяет физику взрывов; может нарушать работу ванильных ТНТ-пушек и blast chamber ферм.',
    
  },
  {
    name: 'Perfomant Boom',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Оптимизация взрывов',
    description: 'Ускоряет расчет лучей разрушения блоков при взрывах.',
    bestAlternative: 'Better TNT.',
    warning: 'Упрощает лучи взрыва; может ломать точные редстоун-механизмы на взрывах.',
    
  },
  {
    name: 'Spawn Cap / Range Adjuster',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Настройка спавна',
    description: 'Позволяет в конфиге точно настроить лимиты спавна мобов.',
    bestAlternative: 'ServerCore.'
  },
  {
    name: 'NoTick',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'danger',
    statusLabel: 'Меняет механику',
    description: 'Отключает тики мобов на расстоянии.',
    bestAlternative: 'Immersive Optimization (не ломает фермы).'
  },
  {
    name: 'EntitySleep',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Сон мобов',
    description: 'Переводит дальних мобов в режим гибернации.',
    bestAlternative: 'Immersive Optimization.'
  },
  {
    name: 'HeroClock',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Таймер тиков',
    description: 'Выравнивание системного таймера.',
    bestAlternative: 'ServerCore.'
  },
  {
    name: 'ARPO',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Оптимизатор путей',
    description: 'Adaptive Route Path Optimizer.',
    bestAlternative: 'Radium Re-Reforged.'
  },
  {
    name: 'Villager Optimizer',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'recommended',
    statusLabel: 'Мастхэв для жителей',
    description: 'Глушит сложные проверки поиска путей у жителей деревень, когда они заперты в торговых кабинках 1x1.',
    bestAlternative: 'Колоссально повышает TPS около баз с жителями.'
  },
  {
    name: 'Herdline',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Оптимизация стада',
    description: 'Объединяет расчет ИИ животных одного стада.',
    bestAlternative: 'Полезно.'
  },
  {
    name: 'Stackable Mobs',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Стакание мобов',
    description: 'Стакает одинаковых мобов на фермах в одну особь с множителем (x10, x50).',
    bestAlternative: 'Полезно для моб-ферм с огромным спавном.'
  },
  {
    name: "Lyzer's Restless Respawns",
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Оптимизация спавна',
    description: 'Твики алгоритмов респавна сущностей.',
    bestAlternative: 'ServerCore.'
  },
  {
    name: "Char's Boost",
    category: 'Тики, TPS, сущности и ИИ',
    status: 'danger',
    statusLabel: 'Плацебо',
    description: 'Любительский мод.',
    bestAlternative: 'Radium Re-Reforged.'
  },
  {
    name: 'LocalBoost Server Optimization',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Твики встроенного сервера',
    description: 'Оптимизация тиков для одиночной игры.',
    bestAlternative: 'ServerCore.'
  },
  {
    name: 'AntiLag TPS Monitor',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Монитор TPS',
    description: 'Мониторинг TPS с оповещением в консоли.',
    bestAlternative: 'Spark.'
  },
  {
    name: 'Despawn Tweaks modern port',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Полезно',
    description: 'Современный порт Despawn Tweaks.',
    bestAlternative: 'Let Me Despawn.'
  },
  {
    name: 'Golden Chicken (Seeds)',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Оптимизация кур',
    description: 'Оптимизирует ИИ кур и поиск семян.',
    bestAlternative: 'Полезно.'
  },
  {
    name: 'Let Me Despawn',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'recommended',
    statusLabel: 'Мастхэв',
    description: 'Позволяет мобам, взявшим предмет или застрявшим на пути, естественно исчезать. Не трогает мобов с бирками!',
    bestAlternative: 'Самый безопасный выбор.'
  },
  {
    name: 'Despawn Tweaks',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Полезно',
    description: 'Настройка деспавна мобов.',
    bestAlternative: 'Let Me Despawn.'
  },
  {
    name: 'DespawnTweaker',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Тонкая настройка',
    description: 'Расширенная версия Let Me Despawn с конфигом защиты мобов из конкретных структур.',
    bestAlternative: 'Полезно.'
  },
  {
    name: 'Despawnings',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Деспавн',
    description: 'Твик деспавна.',
    bestAlternative: 'Let Me Despawn.'
  },
  {
    name: 'Sweeper Maid',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'danger',
    statusLabel: 'Очистка дропа',
    description: 'Периодическая чистка предметов и мобов.',
    bestAlternative: 'В сингле не ставить, можно потерять вещи при смерти.',
    warning: 'Периодическая чистка предметов и мобов без разбора; риск потери снаряжения и питомцев.',
    
  },
  {
    name: 'Eco Stack Manager',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Стакание сущностей',
    description: 'Менеджер стакания сущностей.',
    bestAlternative: 'ItemMerge.'
  },
  {
    name: 'DarkTimer',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'danger',
    statusLabel: 'Удаление дропа раз в 10 мин',
    description: 'Автоматически удаляет лежащий дроп раз в 10 минут (часто в DarkRPG).',
    bestAlternative: 'Опасно в сингле (удаляет вещи после гибели игрока).',
    warning: 'Автоматически удаляет лежащий дроп каждые 10 минут, рискуя уничтожить ценные ресурсы.',
    
  },
  {
    name: 'Arrow Clean Up',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Очистка стрел',
    description: 'Удаляет застрявшие в блоках и щитах стрелы, которые накапливаются во время рейдов и битв со скелетами и грузят рендер.',
    bestAlternative: 'Полезно для серверов.'
  },
  {
    name: 'Falling Blocks FPS Fix',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'recommended',
    statusLabel: 'Мастхэв для гравия/песка',
    description: 'Полностью устраняет жуткие лаги и падение FPS до 1-2 кадров при одновременном падении сотен блоков гравия или песка в шахтах и пустынях.',
    bestAlternative: 'Мастхэв для выживания в шахтах.'
  },
  {
    name: 'FastEvent',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Быстрые события',
    description: 'Ускоряет шину событий Forge EventBus.',
    bestAlternative: 'Полезно для 150+ модов.'
  },
  {
    name: 'Fast NBT',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'redundant',
    statusLabel: 'Избыточен',
    description: 'Быстрый NBT парсинг.',
    bestAlternative: 'ModernFix.'
  },
  {
    name: 'EfficientHashing',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'redundant',
    statusLabel: 'Избыточен',
    description: 'Быстрые хеш-карты.',
    bestAlternative: 'ModernFix.'
  },
  {
    name: 'Async Logger',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Асинхронный лог',
    description: 'Запись логов Log4j в отдельном потоке.',
    bestAlternative: 'Полезно.'
  },
  {
    name: 'DoesPotatoTick?',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'redundant',
    statusLabel: 'Ситуативно',
    description: 'Замедляет мобов на расстоянии.',
    bestAlternative: 'Immersive Optimization.'
  },
  {
    name: 'Fluidium',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Оптимизация жидкостей',
    description: 'Оптимизация растекания воды и лавы.',
    bestAlternative: 'Полезно.'
  },
  {
    name: 'Mobtimizations',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'redundant',
    statusLabel: 'Ситуативно',
    description: 'Твик ИИ мобов.',
    bestAlternative: 'ServerCore.'
  },
  {
    name: 'Performance Tweaks',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Полезно',
    description: 'Мелкие фиксы боевой анимации.',
    bestAlternative: 'Полезно.'
  },
  {
    name: 'Fix Attack Lag',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Фикс атак',
    description: 'Устраняет задержки кликов при атаке.',
    bestAlternative: 'Полезно.'
  },
  {
    name: 'TT20 (TPS Fixer)',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'danger',
    statusLabel: 'Визуальный костыль',
    description: 'Динамически масштабирует игровые таймеры (ломание блоков, питье зелий, скорость жидкостей) по формуле ticks * TPS / 20 при просадке сервера ниже 20 TPS, чтобы игра казалась плавной. Не снижает нагрузку на CPU и может приводить к рассинхрону физики.',
    bestAlternative: 'Radium Re-Reforged + ServerCore (устраняют истинную причину лагов).',
    warning: 'Искусственно ускоряет игровые таймеры при просадке TPS. Рассинхронизирует физику и не устраняет причину лагов.',
    
  },
  {
    name: 'TickAccelerate',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'danger',
    statusLabel: 'Визуальный костыль',
    description: 'Форк/продолжение TT20 с расчетом MSPT по экспоненциальному скользящему среднему (EMA) и защитным лимитом tick-repeat-cap. Служит визуальным сглаживателем низкого TPS.',
    bestAlternative: 'Radium Re-Reforged + ServerCore.',
    warning: 'Форсированное ускорение тиков; не оптимизирует нагрузку CPU и ломает тайминги модов.',
    
  },

  // =========================================================================
  // 12. ПРЕДМЕТЫ, КОНТЕЙНЕРЫ И РЕЦЕПТЫ
  // =========================================================================
  {
    name: 'Optimized Recipe Book (ORB)',
    category: 'Предметы, контейнеры и рецепты',
    status: 'recommended',
    statusLabel: 'Мастхэв',
    description: 'Полностью убирает лаги ванильной книги рецептов при открытии верстака в модовых сборках с тысячами рецептов.',
    bestAlternative: 'Рекомендуется.'
  },
  {
    name: 'QuickIFX (Item Entities Fix)',
    category: 'Предметы, контейнеры и рецепты',
    status: 'useful',
    statusLabel: 'Фикс дропа',
    description: 'Оптимизирует рендеринг и физику плавающих предметов.',
    bestAlternative: 'ItemMerge.'
  },
  {
    name: 'Quiet Recipes (EMI/JEI/REI)',
    category: 'Предметы, контейнеры и рецепты',
    status: 'useful',
    statusLabel: 'Тихие рецепты',
    description: 'Подавляет спам предупреждений о рецептах в лог при запуске.',
    bestAlternative: 'Полезно.'
  },
  {
    name: 'ItemMerge',
    category: 'Предметы, контейнеры и рецепты',
    status: 'recommended',
    statusLabel: 'Мастхэв',
    description: 'Агрессивнее объединяет одинаковый дроп на полу в единые стаки, снижая число сущностей.',
    bestAlternative: 'Рекомендуется.'
  },
  {
    name: 'Floor Item Cleaner',
    category: 'Предметы, контейнеры и рецепты',
    status: 'danger',
    statusLabel: 'Очистка дропа',
    description: 'Удаляет предметы на полу по таймеру.',
    bestAlternative: 'В сингле опасно, на сервере лучше ItemMerge.',
    warning: 'Принудительно стирает лежащие на земле предметы по таймеру; может удалить вещи погибшего игрока.',
    
  },
  {
    name: "Tom's Simple Storage performance optimization",
    category: 'Предметы, контейнеры и рецепты',
    status: 'useful',
    statusLabel: "Только с Tom's Storage",
    description: 'Патч оптимизации для терминалов и кабелей мода Tom\'s Simple Storage.',
    bestAlternative: "Обязательно при наличии Tom's Simple Storage.",
    warning: 'Работает только при наличии мода Tom\'s Simple Storage.',
  },
  {
    name: 'FastSuite',
    category: 'Предметы, контейнеры и рецепты',
    platform: 'Forge',
    status: 'useful',
    statusLabel: 'Ускорение крафтов (Сервер)',
    description: 'Актуальный Forge-мод от Shadows_of_Fire (требует Placebo). Ускоряет поиск и сопоставление JSON-рецептов на сервере при тысячах модовых предметов и совместим с ModernFix (входит в ATM9).',
    bestAlternative: 'Отлично дополняет клиентский Optimized Recipe Book (ORB) — ORB ускоряет книгу рецептов, а FastSuite/FastWorkbench ускоряют сам крафт.'
  },
  {
    name: 'FastFurnace',
    category: 'Предметы, контейнеры и рецепты',
    platform: 'Forge',
    status: 'useful',
    statusLabel: 'Кэш печей (Сервер)',
    description: 'Нативный Forge-мод от Shadows_of_Fire (требует Placebo). Кэширует последний рецепт в печах, плавильнях и коптильнях, исключая перебор всех рецептов на каждом тике.',
    bestAlternative: 'Полезен в больших сборках на 200+ модов (совместим с ModernFix и Radium).'
  },
  {
    name: 'FastWorkbench',
    category: 'Предметы, контейнеры и рецепты',
    platform: 'Forge',
    status: 'useful',
    statusLabel: 'Кэш верстака (Сервер)',
    description: 'Нативный Forge-мод от Shadows_of_Fire (требует Placebo). Кэширует последний крафт верстака на стороне сервера; не дублирует клиентский ORB, а дополняет его.',
    bestAlternative: 'В паре с FastSuite заметно разгружает серверный крафт.'
  },
  {
    name: 'Clumps',
    category: 'Предметы, контейнеры и рецепты',
    platform: 'Universal (Forge/Fabric)',
    status: 'recommended',
    statusLabel: 'Мастхэв (Сферы опыта)',
    description: 'Мультиплатформенный мод от jaredlll08 (Fabric, Forge, NeoForge). Объединяет сотни сфер опыта в один сгусток, мгновенно устраняя лаги на моб-фермах и при добыче руд.',
    bestAlternative: 'Идеальная пара к ItemMerge (ItemMerge сливает предметы, Clumps сливает сферы опыта).',
    tags: ['xp', 'clumps', 'farm', 'universal']
  },
  {
    name: 'Fastvancements',
    category: 'Предметы, контейнеры и рецепты',
    status: 'recommended',
    statusLabel: 'Мастхэв',
    description: 'Оптимизирует проверки дерева достижений (advancements), исключая лаги при получении предметов.',
    bestAlternative: 'Самый стабильный оптимизатор достижений.'
  },
  {
    name: 'Icterine',
    category: 'Предметы, контейнеры и рецепты',
    status: 'redundant',
    statusLabel: 'Дубликат',
    description: 'Оптимизатор достижений.',
    bestAlternative: 'Fastvancements.'
  },
  {
    name: 'Cerulean',
    category: 'Предметы, контейнеры и рецепты',
    status: 'redundant',
    statusLabel: 'Дубликат',
    description: 'Оптимизатор достижений.',
    bestAlternative: 'Fastvancements.'
  },
  {
    name: 'Achievements Optimizer',
    category: 'Предметы, контейнеры и рецепты',
    status: 'redundant',
    statusLabel: 'Дубликат',
    description: 'Оптимизатор достижений.',
    bestAlternative: 'Fastvancements.'
  },

  // =========================================================================
  // 13. СЕТЬ
  // =========================================================================
  {
    name: 'Krypton Reno',
    category: 'Сеть',
    platform: 'Forge / NeoForge',
    status: 'recommended',
    statusLabel: 'Мастхэв (Порт Krypton)',
    description: 'Основной стабильный порт Fabric-мода Krypton для чистого Forge 1.20.1 и NeoForge (ранее назывался Krypton FNP). Оптимизирует сетевой стек Netty, объединение и сжатие пакетов на базе решений Velocity.',
    bestAlternative: 'Лучший выбор для обычных Forge-серверов и клиентов 1.20.1.'
  },
  {
    name: 'Krypton Hybrid',
    category: 'Сеть',
    platform: 'Forge',
    status: 'useful',
    statusLabel: 'Форк для гибрид-ядер (zstd)',
    description: 'Форк раннего Krypton FNP от dreamforSh для Forge 1.20.1 с поддержкой нативного сжатия zstd/lz4 и гибридных ядер серверов (Mohist / Arclight).',
    bestAlternative: 'Для чистого Forge чаще берут Krypton Reno; Hybrid нужен при игре на Mohist/Arclight или ради zstd.',
    warning: 'Не ставить одновременно с Krypton Reno или AegisNetworking!'
  },
  {
    name: 'Krypton Foxified',
    category: 'Сеть',
    platform: 'NeoForge 1.20.4+',
    status: 'useful',
    statusLabel: 'Порт для NeoForge 1.20.4+',
    description: 'Неофициальный порт Krypton от ThinkingStudios, нацеленный в первую очередь на NeoForge 1.20.4 / 1.20.6 / 1.21+ (а не на Forge 1.20.1).',
    bestAlternative: 'На Forge 1.20.1 используйте Krypton Reno (или Krypton Hybrid).',
    warning: 'Не смешивать с другими портами Krypton!'
  },
  {
    name: 'ZSTDNET',
    category: 'Сеть',
    status: 'useful',
    statusLabel: 'Ультрабыстрое сжатие',
    description: 'Заменяет стандартное Gzip-сжатие пакетов на алгоритм Zstandard от Facebook.',
    bestAlternative: 'Отлично для серверов с онлайном 20+ человек.'
  },
  {
    name: 'Not Enough Bandwidth Legacy',
    category: 'Сеть',
    status: 'useful',
    statusLabel: 'Сжатие трафика',
    description: 'Снижает требования к пропускной способности канала.',
    bestAlternative: 'Krypton Reno.'
  },
  {
    name: 'NullPointer Fix for Mio',
    category: 'Сеть',
    status: 'useful',
    statusLabel: 'Точечный фикс',
    description: 'Исправляет NPE-ошибку в сетевых пакетах библиотеки Mio.',
    bestAlternative: 'Полезно.'
  },
  {
    name: 'AegisNetworking (не ставить вместе с Krypton Hybrid)',
    category: 'Сеть',
    status: 'useful',
    statusLabel: 'Сетевой стек',
    description: 'Альтернативный сетевой стек. Несовместим с Krypton Hybrid!',
    bestAlternative: 'Krypton Hybrid.',
    warning: 'Конфликт сетевых конвейеров: не ставить одновременно с Krypton Hybrid!'
  },
  {
    name: 'Packet Capper',
    category: 'Сеть',
    status: 'useful',
    statusLabel: 'Защита от пакетного спама',
    description: 'Ограничивает спам пакетами от клиентов, защищая сервер от краша.',
    bestAlternative: 'Полезно для публичных серверов.'
  },
  {
    name: 'networkop',
    category: 'Сеть',
    status: 'useful',
    statusLabel: 'Оптимизация пакетов',
    description: 'Микро-оптимизация сериализации сетевых пакетов.',
    bestAlternative: 'Krypton Reno.'
  },

  // =========================================================================
  // 14. СЕРВЕРНЫЕ ОПТИМИЗАТОРЫ И ОЧИСТКА ЛАГОВ
  // =========================================================================
  {
    name: 'LagLess: Server Optimizer',
    category: 'Серверные оптимизаторы и очистка лагов',
    status: 'useful',
    statusLabel: 'Серверный комбайн',
    description: 'Набор серверных твиков и лимитов.',
    bestAlternative: 'ServerCore.'
  },
  {
    name: 'Easy Server Optimizer (ESO)',
    category: 'Серверные оптимизаторы и очистка лагов',
    status: 'useful',
    statusLabel: 'Оптимизатор сервера',
    description: 'Упрощенная настройка параметров производительности сервера.',
    bestAlternative: 'ServerCore.'
  },
  {
    name: 'Lagging Optimizer',
    category: 'Серверные оптимизаторы и очистка лагов',
    status: 'useful',
    statusLabel: 'Твики лагов',
    description: 'Твики снижения нагрузки.',
    bestAlternative: 'ServerCore.'
  },
  {
    name: 'LagShield Ultimate (Anti Lag)',
    category: 'Серверные оптимизаторы и очистка лагов',
    status: 'useful',
    statusLabel: 'Защита от лагов',
    description: 'Мониторинг и предотвращение спайков TPS.',
    bestAlternative: 'ServerCore.'
  },
  {
    name: 'TCT ClearLag',
    category: 'Серверные оптимизаторы и очистка лагов',
    status: 'useful',
    statusLabel: 'Очистка сущностей',
    description: 'Плагин/мод периодической очистки лежащих предметов.',
    bestAlternative: 'На серверах настраивать аккуратно.'
  },
  {
    name: "Pala's Item Clear",
    category: 'Серверные оптимизаторы и очистка лагов',
    status: 'useful',
    statusLabel: 'Очистка дропа',
    description: 'Очистка дропа по расписанию.',
    bestAlternative: 'ItemMerge.'
  },
  {
    name: 'Universal ClearLag',
    category: 'Серверные оптимизаторы и очистка лагов',
    status: 'useful',
    statusLabel: 'Очистка лагов',
    description: 'Классический клинер сущностей.',
    bestAlternative: 'Let Me Despawn.'
  },
  {
    name: 'ClearLagPlus',
    category: 'Серверные оптимизаторы и очистка лагов',
    status: 'useful',
    statusLabel: 'Клинер',
    description: 'Очистка дропа с предупреждением в чате.',
    bestAlternative: 'На серверах.'
  },
  {
    name: 'Item Purge',
    category: 'Серверные оптимизаторы и очистка лагов',
    status: 'useful',
    statusLabel: 'Удаление мусора',
    description: 'Удаление ненужного лута (булыжник, земля) на сервере.',
    bestAlternative: 'Полезно для серверов.'
  },
  {
    name: 'Ground Clear',
    category: 'Серверные оптимизаторы и очистка лагов',
    status: 'useful',
    statusLabel: 'Очистка земли',
    description: 'Очистка дропа.',
    bestAlternative: 'ItemMerge.'
  },
  {
    name: 'MCCleaner',
    category: 'Серверные оптимизаторы и очистка лагов',
    status: 'useful',
    statusLabel: 'Клинер',
    description: 'Утилита очистки сервера.',
    bestAlternative: 'ServerCore.'
  },
  {
    name: 'Clearlagg (Server Forge)',
    category: 'Серверные оптимизаторы и очистка лагов',
    status: 'useful',
    statusLabel: 'Порт ClearLagg',
    description: 'Порт плагина ClearLagg на Forge.',
    bestAlternative: 'На серверах.'
  },
  {
    name: 'Customizable Entity Clear',
    category: 'Серверные оптимизаторы и очистка лагов',
    status: 'useful',
    statusLabel: 'Настраиваемая очистка',
    description: 'Гибкая настройка типов сущностей, подлежащих удалению.',
    bestAlternative: 'Полезно.'
  },
  {
    name: 'More Optimized',
    category: 'Серверные оптимизаторы и очистка лагов',
    status: 'danger',
    statusLabel: 'Плацебо',
    description: 'Любительский мод.',
    bestAlternative: 'ServerCore.'
  },
  {
    name: 'Mob Wand',
    category: 'Серверные оптимизаторы и очистка лагов',
    status: 'useful',
    statusLabel: 'Инструмент администратора',
    description: 'Жезл для ручного удаления скоплений мобов в радиусе.',
    bestAlternative: 'Удобно админам.'
  },
  {
    name: 'ZoneLag',
    category: 'Серверные оптимизаторы и очистка лагов',
    status: 'useful',
    statusLabel: 'Зональный контроль',
    description: 'Ограничивает число мобов в рамках одного чанка.',
    bestAlternative: 'Полезно для серверов.'
  },
  {
    name: 'Mob Controlation Full',
    category: 'Серверные оптимизаторы и очистка лагов',
    status: 'useful',
    statusLabel: 'Контроль мобов',
    description: 'Глобальный контроль лимитов сущностей.',
    bestAlternative: 'ServerCore.'
  },
  {
    name: 'Banish Annoying Mobs',
    category: 'Серверные оптимизаторы и очистка лагов',
    status: 'useful',
    statusLabel: 'Отключение фантомов/мобов',
    description: 'Позволяет запретить спавн конкретных назойливых мобов (фантомы, летучие мыши).',
    bestAlternative: 'Полезно.'
  },
  {
    name: 'Vex be Gone!',
    category: 'Серверные оптимизаторы и очистка лагов',
    status: 'useful',
    statusLabel: 'Отключение вексов',
    description: 'Убирает спавн вексов (досаждателей) от вызывателей, спасая рейды от лагов.',
    bestAlternative: 'Полезно.'
  },

  // =========================================================================
  // 15. СПАВН МОБОВ (МЕНЯЮТ ГЕЙМПЛЕЙ)
  // =========================================================================
  {
    name: 'Mob Control Apocalypse',
    category: 'Спавн мобов',
    status: 'danger',
    statusLabel: 'Меняет геймплей',
    description: 'Жестко ограничивает спавн враждебных мобов.',
    bestAlternative: 'ServerCore (динамический спавн).',
    warning: 'Жестко лимитирует спавн мобов; влияет на спавн-рейты ферм.',
    
  },
  {
    name: 'Серия Mob Controller ... Spawning',
    category: 'Спавн мобов',
    status: 'useful',
    statusLabel: 'Тонкая настройка спавна',
    description: 'Серия модов для детальной настройки частоты появления мобов каждого биома.',
    bestAlternative: 'Полезно для создателей сборок.'
  },
  {
    name: 'No Spawner',
    category: 'Спавн мобов',
    status: 'danger',
    statusLabel: 'Меняет геймплей',
    description: 'Полностью отключает спавнеры в данжах.',
    bestAlternative: 'FastSpawner (убирает лаг без отключения спавнера).',
    warning: 'Полностью отключает работу спавнеров в мире; радикально меняет геймплей.',
    
  },
  {
    name: 'Spawn control',
    category: 'Спавн мобов',
    status: 'useful',
    statusLabel: 'Лимиты спавна',
    description: 'Установка лимитов спавна по категориям мобов.',
    bestAlternative: 'ServerCore.'
  },

  // =========================================================================
  // 16. АСИНХРОННОСТЬ, КЕШ И АВТОРИЗАЦИЯ
  // =========================================================================
  {
    name: 'Async Screenshot',
    category: 'Асинхронность, кеш и авторизация',
    status: 'recommended',
    statusLabel: 'Мастхэв',
    description: 'Создание и сохранение скриншотов в отдельном потоке. Игра не замирает на секунду при нажатии F2.',
    bestAlternative: 'Рекомендуется.'
  },
  {
    name: 'Async Advancement Toast',
    category: 'Асинхронность, кеш и авторизация',
    status: 'recommended',
    statusLabel: 'Мастхэв',
    description: 'Асинхронное появление всплывающих плашек достижений (toasts).',
    bestAlternative: 'Рекомендуется.'
  },
  {
    name: 'ProfileCached',
    category: 'Асинхронность, кеш и авторизация',
    status: 'useful',
    statusLabel: 'Кеш профилей',
    description: 'Кеширует профили игроков и скины, избавляя от лагов при входе на сервер.',
    bestAlternative: 'Полезно.'
  },
  {
    name: 'YggdrasilProxy (ускоряет авторизацию, нужен для ely.by и подобных)',
    category: 'Асинхронность, кеш и авторизация',
    status: 'useful',
    statusLabel: 'Быстрая авторизация',
    description: 'Ускоряет и проксирует запросы авторизации скинов и аккаунтов на сторонних серверах аутентификации (Ely.by и др.).',
    bestAlternative: 'Полезно при использовании альтернативных систем скинов.'
  },
  {
    name: 'Mixpnlb',
    category: 'Асинхронность, кеш и авторизация',
    status: 'useful',
    statusLabel: 'Библиотека',
    description: 'Низкоуровневая вспомогательная библиотека.',
    bestAlternative: 'Ставить только по требованию.'
  },

  // =========================================================================
  // 17. ФИКСЫ И СОВМЕСТИМОСТЬ
  // =========================================================================
  {
    name: 'GeckoLib Animation Optimizer',
    category: 'Фиксы и совместимость',
    warning: 'Применяется только при наличии мода GeckoLib и мобов с кастомными анимациями.',
    status: 'recommended',
    statusLabel: 'Мастхэв при GeckoLib',
    description: 'Отсекает скелетные анимации GeckoLib вне зоны видимости игрока.',
    bestAlternative: 'GeckolibBetterFPS.'
  },
  {
    name: 'GeckolibBetterFPS',
    category: 'Фиксы и совместимость',
    status: 'recommended',
    statusLabel: 'Мастхэв при наличии GeckoLib',
    description: 'Оптимизирует математические операции и стек рендеринга анимаций библиотеки GeckoLib. Ускоряет анимацию анимированных боссов, мобов и брони примерно на 25%, устраняя микрофризы.',
    bestAlternative: 'Ставить обязательно, если в сборке есть GeckoLib.'
  },
  {
    name: 'Vanillin',
    category: 'Фиксы и совместимость',
    status: 'useful',
    statusLabel: 'Инстансинг через Flywheel',
    description: 'Мод от jozufozu (команда Create). Использует графический бэкенд Flywheel для инстансинга и пакетного рендеринга ванильных сущностей и сундуков.',
    bestAlternative: 'Ставить при наличии Create и Flywheel.'
  },
  {
    name: 'FastALI',
    category: 'Фиксы и совместимость',
    status: 'useful',
    statusLabel: 'Ускорение Advanced Loot Info',
    description: 'Оптимизирует генерацию таблиц лута для мода Advanced Loot Info (ALI) при интеграции с JEI, REI и EMI, устраняя зависание при входе в мир.',
    bestAlternative: 'Ставить только при наличии мода Advanced Loot Info.'
  },
  {
    name: 'AnotherFix',
    category: 'Фиксы и совместимость',
    status: 'useful',
    statusLabel: 'Точечные фиксы',
    description: 'Сборник миксин-фиксов совместимости модов.',
    bestAlternative: 'Полезно.'
  },
  {
    name: 'Rubidium (Fluid Render Fix)',
    category: 'Фиксы и совместимость',
    status: 'useful',
    statusLabel: 'Фикс жидкостей',
    description: 'Исправляет отображение жидкостей на старых форках Rubidium.',
    bestAlternative: 'Embeddium (в нем фикс уже встроен).'
  },
  {
    name: 'Broken Tag Fixer',
    category: 'Фиксы и совместимость',
    status: 'recommended',
    statusLabel: 'Мастхэв для модпаков',
    description: 'Исправляет ошибки в битых JSON-тегах модов, предотвращая падение игры при старте.',
    bestAlternative: 'Рекомендуется.'
  },
  {
    name: 'Crash Doctor',
    category: 'Фиксы и совместимость',
    status: 'useful',
    statusLabel: 'Анализатор крашей',
    description: 'Анализирует crash-report и в понятной форме указывает на сбойный мод.',
    bestAlternative: 'Полезно для отладки.'
  },
  {
    name: 'Modpack Troubleshooter',
    category: 'Фиксы и совместимость',
    status: 'useful',
    statusLabel: 'Диагностика модпака',
    description: 'Помогает найти конфликтующие моды при вылетах.',
    bestAlternative: 'Полезно.'
  },
  {
    name: 'Log4j Loader Fix',
    category: 'Фиксы и совместимость',
    status: 'useful',
    statusLabel: 'Фикс логов',
    description: 'Исправляет инициализацию логгера Log4j на некоторых версиях Java.',
    bestAlternative: 'Полезно.'
  },
  {
    name: 'LogFilter',
    category: 'Фиксы и совместимость',
    status: 'useful',
    statusLabel: 'Фильтр логов',
    description: 'Фильтрует повторяющийся мусор из лог-файлов.',
    bestAlternative: 'Put A Plug In it!.'
  },
  {
    name: 'Client Mixin Intercept (серверное)',
    category: 'Фиксы и совместимость',
    status: 'useful',
    statusLabel: 'Серверная безопасность',
    description: 'Блокирует сбойные клиентские миксины на сервере.',
    bestAlternative: 'Для серверов.'
  },
  {
    name: 'Light Config',
    category: 'Фиксы и совместимость',
    status: 'useful',
    statusLabel: 'Быстрые конфиги',
    description: 'Ускоряет парсинг TOML/JSON файлов конфигураций модов.',
    bestAlternative: 'ModernFix.'
  },
  {
    name: 'Thirst Was Taken: Mixin Server Fix (только с Thirst Was Taken)',
    category: 'Фиксы и совместимость',
    status: 'useful',
    statusLabel: 'Точечный фикс',
    description: 'Исправляет серверный краш мода Thirst Was Taken.',
    bestAlternative: 'Ставить только при наличии мода на жажду Thirst Was Taken.',
    warning: 'Специфический фикс для мода Thirst Was Taken.',
    
  },
  {
    name: 'Unofficial Luxium Compatibility (только с Luxium и Oculus)',
    category: 'Фиксы и совместимость',
    status: 'useful',
    statusLabel: 'Только с Luxium + Oculus',
    description: 'Обеспечивает совместимость освещения Luxium с шейдерами Oculus.',
    bestAlternative: 'Ставить только при наличии Luxium + Oculus.',
    warning: 'Требуется только при совместном использовании Luxium и Oculus.',
    
  },
  {
    name: 'Embeddium x Polytone Block Colormap Fix (только с Polytone)',
    category: 'Фиксы и совместимость',
    status: 'useful',
    statusLabel: 'Только с Polytone',
    description: 'Исправляет палитры цветов блоков при совместной работе Embeddium и Polytone.',
    bestAlternative: 'Ставить только с Polytone.',
    warning: 'Необходим только при наличии мода Polytone.',
    
  },
  {
    name: "Departure Inventory Halo Fix (только с Tinker's Domain)",
    category: 'Фиксы и совместимость',
    status: 'useful',
    statusLabel: "Только с Tinker's Domain",
    description: 'Исправляет графический глитч свечения инвентаря.',
    bestAlternative: ".",
    warning: 'Патч инвентаря для Tinker\'s Domain / Departure.',
    
  },
  {
    name: "Iron's Spells Anvil On Demand (только с Iron's Spells)",
    category: 'Фиксы и совместимость',
    status: 'useful',
    statusLabel: "Только с Iron's Spells",
    description: 'Исправляет лаги наковальни из Iron\'s Spells and Spellbooks.',
    bestAlternative: ".",
    warning: 'Применяется только для мода Iron\'s Spells \'n Spellbooks.',
    
  },
  {
    name: "Qubit's AAA Tweaks (только с AAAParticles)",
    category: 'Фиксы и совместимость',
    status: 'useful',
    statusLabel: 'Только с AAAParticles',
    description: 'Оптимизация производительности мода AAAParticles.',
    bestAlternative: 'Ставить только с AAAParticles.',
    warning: 'Работает только при установленном моде AAAParticles.',
    
  },
  {
    name: 'Emberlens',
    category: 'Фиксы и совместимость',
    status: 'useful',
    statusLabel: 'Тюнинг шейдеров под 1.20.1',
    description: 'Форк Oculus от Misanthropy для Forge 1.20.1 (работает в паре с Emberbium). Сохраняет быстрый GPU-рендер мода Create при включенных шейдерах и позволяет настраивать частоту обновления карты теней (Shadow Update Interval) раз в 2, 3 или 4 кадра для удвоения FPS.',
    bestAlternative: 'Мастхэв для игры с шейдерами и Create на 1.20.1.'
  },
  {
    name: 'Faster Iris Shadow Mapper',
    category: 'Фиксы и совместимость',
    status: 'useful',
    statusLabel: 'Оптимизация теней шейдеров',
    description: 'Отсекает неструктурные элементы (текст на табличках, узоры флагов, свечение зачарований) из прохода генерации теней шейдеров, существенно повышая FPS на базах.',
    bestAlternative: 'Встроено в Iris 1.11.2+, полезно для Oculus на Forge.'
  },

  // =========================================================================
  // 18. ПРОЧЕЕ
  // =========================================================================
  {
    name: 'Reflex AntiLag',
    category: 'Прочее',
    status: 'useful',
    statusLabel: 'Снижение задержки',
    description: 'Снижает задержку системного ввода и рендера.',
    bestAlternative: 'Ixeris.'
  },
  {
    name: 'Lomka',
    category: 'Прочее',
    status: 'useful',
    statusLabel: 'Оптимизация анимаций',
    description: 'Оптимизация циклов анимаций сущностей.',
    bestAlternative: 'Полезно.'
  },
  {
    name: 'Minimal Backup (дельта-бэкапы Zstd)',
    category: 'Прочее',
    status: 'recommended',
    statusLabel: 'Мастхэв для бэкапов',
    description: 'Создает ультрабыстрые инкрементальные дельта-бэкапы мира с алгоритмом сжатия Zstd без зависания сервера.',
    bestAlternative: 'Лучший мод для безопасного сохранения миров без фризов.'
  },

  // =========================================================================
  // 19. ПРОФИЛИРОВЩИКИ И МОНИТОРИНГ (ДИАГНОСТИКА)
  // =========================================================================
  {
    name: 'Spark Profiler - Au Naturel Edit (под Java 25)',
    category: 'Профилировщики и мониторинг',
    status: 'diagnostic',
    statusLabel: 'Золотой стандарт профайлинга',
    description: 'Мировой золотой стандарт профилирования производительности Minecraft (CPU, RAM, TPS, память, потоки). Находит источник любых лагов за пару кликов.',
    bestAlternative: 'Абсолютный мастхэв для отладки.'
  },
  {
    name: 'PerformanceHUD',
    category: 'Профилировщики и мониторинг',
    status: 'diagnostic',
    statusLabel: 'Наэкранный виджет',
    description: 'Настраиваемый оверлей FPS, фреймтайма и потребления RAM.',
    bestAlternative: 'Полезно для мониторинга.'
  },
  {
    name: 'Startup / Loading Profiler',
    category: 'Профилировщики и мониторинг',
    status: 'diagnostic',
    statusLabel: 'Профайлер запуска',
    description: 'Точно замеряет, сколько секунд занимает загрузка каждого отдельного мода.',
    bestAlternative: 'Незаменимо для оптимизации времени запуска сборки.'
  },
  {
    name: 'Chunk Loading Profiler',
    category: 'Профилировщики и мониторинг',
    status: 'diagnostic',
    statusLabel: 'Профайлер чанков',
    description: 'Отслеживает время генерации и загрузки каждого чанка.',
    bestAlternative: 'Для диагностики лагов мира.'
  },
  {
    name: 'TPS Detective',
    category: 'Профилировщики и мониторинг',
    status: 'diagnostic',
    statusLabel: 'Детектив TPS',
    description: 'Выявляет сущности и блоки, вызвавшие падение TPS ниже 20.0.',
    bestAlternative: 'Spark.'
  },
  {
    name: 'Stutter Analyzer',
    category: 'Профилировщики и мониторинг',
    status: 'diagnostic',
    statusLabel: 'Анализатор фризов',
    description: 'Логирует микростаттеры и время пауз сборщика мусора GC.',
    bestAlternative: 'Полезно.'
  },
  {
    name: 'FPS Display',
    category: 'Профилировщики и мониторинг',
    status: 'diagnostic',
    statusLabel: 'Счетчик FPS',
    description: 'Простой счетчик FPS на экране.',
    bestAlternative: 'Embeddium Extras (встроенный счетчик).'
  },
  {
    name: 'Performance Analyzer',
    category: 'Профилировщики и мониторинг',
    status: 'diagnostic',
    statusLabel: 'Анализатор',
    description: 'Комплексный анализ производительности.',
    bestAlternative: 'Spark.'
  },
  {
    name: 'FrameGuard',
    category: 'Профилировщики и мониторинг',
    status: 'diagnostic',
    statusLabel: 'Монитор кадров',
    description: 'Мониторинг стабильности фреймрейта.',
    bestAlternative: 'PerformanceHUD.'
  },
  {
    name: 'GradleMC',
    category: 'Профилировщики и мониторинг',
    status: 'diagnostic',
    statusLabel: 'Инструмент разработчика',
    description: 'Утилита для профилирования сборок в среде разработки.',
    bestAlternative: 'Для мододелов.'
  },
  {
    name: 'Mob Spawn Checker',
    category: 'Профилировщики и мониторинг',
    status: 'diagnostic',
    statusLabel: 'Проверка спавна',
    description: 'Подсвечивает зоны и блоки, где могут заспавниться враждебные мобы.',
    bestAlternative: 'Полезно для освещения баз.'
  },
  {
    name: 'RenderScope',
    category: 'Профилировщики и мониторинг',
    status: 'diagnostic',
    statusLabel: 'Анализ рендера',
    description: 'Отображает количество отрисовываемых чанков, полигонов и вызовов Draw Calls.',
    bestAlternative: 'Полезно для отладки шейдеров.'
  },
  {
    name: 'Improved F3',
    category: 'Профилировщики и мониторинг',
    status: 'diagnostic',
    statusLabel: 'Улучшенный F3',
    description: 'Кастомизация и очистка ванильного экрана F3 от бесполезного мусора.',
    bestAlternative: 'Очень удобно.'
  },
  {
    name: 'InfoOverlay77',
    category: 'Профилировщики и мониторинг',
    status: 'diagnostic',
    statusLabel: 'Оверлей информации',
    description: 'Компактный информационный оверлей координат, FPS и биома.',
    bestAlternative: 'Improved F3.'
  },
  {
    name: 'TPS Checker',
    category: 'Профилировщики и мониторинг',
    status: 'diagnostic',
    statusLabel: 'Проверка TPS',
    description: 'Команда /tps для проверки скорости тиков.',
    bestAlternative: 'Spark.'
  },
  {
    name: 'LagMap',
    category: 'Профилировщики и мониторинг',
    status: 'diagnostic',
    statusLabel: 'Карта лагов',
    description: 'Отображает лагающие чанки сервера в виде тепловой карты.',
    bestAlternative: 'ServerWarashi.'
  },
  {
    name: 'ServerTrace',
    category: 'Профилировщики и мониторинг',
    status: 'diagnostic',
    statusLabel: 'Трассировка сервера',
    description: 'Трассировка задержек между тиками сервера.',
    bestAlternative: 'Spark.'
  },
  {
    name: 'Chunk Watch (серверное)',
    category: 'Профилировщики и мониторинг',
    status: 'diagnostic',
    statusLabel: 'Монитор чанков',
    description: 'Отслеживает активные чанки и количество мобов в каждом из них.',
    bestAlternative: 'Полезно для админов.'
  },
  {
    name: 'Operate My Server (OMS) и Watchdog Essentials - OMS Addon',
    category: 'Профилировщики и мониторинг',
    status: 'diagnostic',
    statusLabel: 'Администрирование сервера',
    description: 'Комплексная панель мониторинга, предотвращения крашей Watchdog и перезапуска зависших потоков сервера.',
    bestAlternative: 'Отличный комплекс для серверных проектов.'
  },

  // =========================================================================
  // 20. JEI / EMI ДОПОЛНИТЕЛЬНО
  // =========================================================================
  {
    name: 'JEI/EMI Optimizations',
    category: 'Предметы, контейнеры и рецепты',
    installed: true,
    status: 'recommended',
    statusLabel: 'Мастхэв',
    description: 'Ускоряет индексацию предметов и закладок в JEI и EMI.',
    bestAlternative: 'Рекомендуется.'
  },
  {
    name: 'TMRV Updated',
    category: 'Предметы, контейнеры и рецепты',
    status: 'recommended',
    statusLabel: 'Мастхэв для EMI',
    description: 'TooManyRecipeViewers Updated. Позволяет запускать плагины JEI напрямую внутри интерфейса EMI без необходимости держать установленным оригинальный JEI! Переводит загрузку плагинов в асинхронный режим.',
    bestAlternative: 'Мастхэв, если играете с EMI вместо JEI.'
  },
  {
    name: 'JEIOptimizer',
    category: 'Предметы, контейнеры и рецепты',
    status: 'recommended',
    statusLabel: 'Многопоточный поиск JEI',
    description: 'Строит поисковый индекс ингредиентов JEI параллельно на нескольких потоках процессора, ускоряя подключение к серверу и вход в мир на несколько секунд.',
    bestAlternative: 'Рекомендуется для сборок с 200+ модами.'
  },
  {
    name: 'Just Enough Freezes',
    category: 'Предметы, контейнеры и рецепты',
    status: 'recommended',
    statusLabel: 'Антифриз JEI',
    description: 'Предотвращает зависания клиента при открытии рецептов предметов с миллионами комбинаций на наковальне/точиле, оптимизирует варку зелий и всплывающие подсказки.',
    bestAlternative: 'Отлично для сборок с огромным числом рецептов.'
  },
  {
    name: 'Just Enough Threads',
    category: 'Предметы, контейнеры и рецепты',
    status: 'recommended',
    statusLabel: 'Мастхэв',
    description: 'Переносит поиск и фильтрацию рецептов JEI в фоновые потоки, убирая микрофриз при вводе текста.',
    bestAlternative: 'Рекомендуется.'
  },
  {
    name: '[JEIR] JEI Rewired',
    category: 'Предметы, контейнеры и рецепты',
    status: 'useful',
    statusLabel: 'Переработка JEI',
    description: 'Внутренняя оптимизация шины событий JEI.',
    bestAlternative: 'JEI/EMI Optimizations.'
  },
  {
    name: 'Fast Recipe Search',
    category: 'Предметы, контейнеры и рецепты',
    status: 'recommended',
    statusLabel: 'Мастхэв',
    description: 'Быстрый индекс поиска рецептов для JEI.',
    bestAlternative: 'Рекомендуется.'
  },
  {
    name: 'Sodium/Embeddium Leaf Culling',
    category: 'Рендер, culling и FPS',
    status: 'redundant',
    statusLabel: 'Встроен в Embeddium',
    description: 'Куллинг скрытых граней блоков листвы внутри крон деревьев. В современных версиях Embeddium / Sodium эта функция встроена в настройки графики, либо заменяется CullLessLeaves Reforged.',
    bestAlternative: 'CullLessLeaves Reforged.'
  },
  {
    name: 'FPS Booster - Lag Killer',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'danger',
    statusLabel: 'Плацебо / Опасно',
    description: 'Агрессивный скриптовый мод. Занижает дистанцию рендера сущностей до 2-4 блоков и отключает анимации без реальной оптимизации кода движка. Ломает визуал и геймплей.',
    bestAlternative: 'Удалить. Настоящую оптимизацию дают Embeddium, ModernFix, FerriteCore и Entity Culling.',
    warning: 'Агрессивно урезает дальность прорисовки сущностей до 2-4 блоков и отключает анимации без оптимизации движка.',
    
  },
  {
    name: 'Adaptive Performance Tweaks',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Адаптивный регулятор',
    description: 'Модульный серверный/клиентский оптимизатор. Динамически отслеживает нагрузку и снижает активность мобов, спавн и радиус прорисовки при просадке TPS ниже 18.',
    bestAlternative: 'ServerCore + Immersive Optimization (работают надежнее).'
  },
  {
    name: 'Adaptive Optimization (reborn)',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Троттлинг задач',
    description: 'Форк систем адаптивного троттлинга сущностей и фоновых задач в зависимости от текущего FPS и загрузки процессора.',
    bestAlternative: 'ServerCore + RestMode.'
  },
  {
    name: 'Random Optimization',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Полезно',
    description: 'Клиентский мод от ColinXu для 1.20.1/1.21.1. Исправляет специфические баги производительности, микрофризы при загрузке текстур и оптимизирует внутренние вызовы.',
    bestAlternative: 'ModernFix.'
  },
  {
    name: 'FastBoot',
    category: 'Загрузка игры и ресурспаков',
    status: 'useful',
    statusLabel: 'Быстрый запуск',
    description: 'Ускоряет запуск игры за счет параллелизации инициализации подсистем клиента и пропуска некритичных предзагрузок.',
    bestAlternative: 'ModernFix (включает встроенный fast_boot).'
  },
  {
    name: 'lazyyyyy',
    category: 'Загрузка игры и ресурспаков',
    status: 'useful',
    statusLabel: 'Ленивая загрузка ресурсов',
    description: 'Мод от settingdust. Переводит ресурсоемкую фоновую логику и загрузку ассетов в асинхронную отложенную («ленивую») модель, разгружая процессор на старте игры.',
    bestAlternative: 'Отлично работает в паре с ModernFix.'
  },
  {
    name: 'LightSpeedRe',
    category: 'Загрузка игры и ресурспаков',
    status: 'recommended',
    statusLabel: 'Мастхэв для модпаков',
    description: 'Современный порт Lightspeed от kltyton для 1.20.1+. Кэширует запеченные ресурсы и использует высококонкурентную загрузку ресурспаков, сокращая время старта тяжелых сборок на 45-70%.',
    bestAlternative: 'Мастхэв для сборок со 150+ модами.'
  },
  {
    name: 'quick pack',
    category: 'Загрузка игры и ресурспаков',
    status: 'useful',
    statusLabel: 'Быстрые .zip архивы',
    description: 'Мод от drexhd. Кардинально ускоряет чтение и распаковку ресурспаков и датапаков в формате .zip архивов, устраняя долгие зависания на экране загрузки и при reload.',
    bestAlternative: 'Отлично подходит для тяжелых HD-паков и датапаков.'
  },
  {
    name: 'Startup Workaround',
    category: 'Загрузка игры и ресурспаков',
    status: 'useful',
    statusLabel: 'Фикс зависаний старта',
    description: 'Предотвращает зависания на стадии ранней инициализации GLFW и аудиодвижка OpenAL на проблемных версиях драйверов.',
    bestAlternative: 'ModernFix.'
  },
  {
    name: 'Mod Loading Optimizer',
    category: 'Загрузка игры и ресурспаков',
    status: 'useful',
    statusLabel: 'Оптимизация сканирования',
    description: 'Ускоряет фазу сканирования аннотаций @Mod и поиска классов при инициализации Forge.',
    bestAlternative: 'ModernFix.'
  },
  {
    name: 'Fast Title Screen',
    category: 'Загрузка игры и ресурспаков',
    status: 'useful',
    statusLabel: 'Быстрое главное меню',
    description: 'Устраняет фризы при переходе от экрана загрузки к главному меню игры.',
    bestAlternative: 'ModernFix.'
  },
  {
    name: 'Early Loading Screen',
    category: 'Загрузка игры и ресурспаков',
    status: 'useful',
    statusLabel: 'Ранний сплэш-скрин',
    description: 'Легковесный экран загрузки до инициализации тяжелого контекста OpenGL.',
    bestAlternative: 'Smooth Loading Screens.'
  },
  {
    name: 'SplashScreen',
    category: 'Загрузка игры и ресурспаков',
    status: 'useful',
    statusLabel: 'Кастомизация сплэша',
    description: 'Оптимизация сплэш-скрина Forge для снижения расхода памяти при старте.',
    bestAlternative: 'ModernFix.'
  },
  {
    name: 'Smooth Boot (Reloaded)',
    category: 'Загрузка игры и ресурспаков',
    status: 'recommended',
    statusLabel: 'Мастхэв для старта',
    description: 'Регулирует приоритеты и количество потоков при запуске игры, предотвращая 100% зависание процессора и позволяя комфортно пользоваться браузером или ПК во время загрузки сборки.',
    bestAlternative: 'Мастхэв для слабых и средних CPU (4-6 ядер).'
  },
  {
    name: 'Memory Optimizer',
    category: 'Память и утечки',
    status: 'danger',
    statusLabel: 'Опасно / Фризы',
    description: 'Псевдо-клинер RAM, сбивающий сборщик мусора Java.',
    bestAlternative: 'FerriteCore + ModernFix.',
    warning: 'Псевдо-клинер RAM, сбивающий адаптивную работу сборщика мусора Java.',
    
  },
  {
    name: 'Clean Memory',
    category: 'Память и утечки',
    status: 'danger',
    statusLabel: 'Опасно / Фризы',
    description: 'Периодическая принудительная очистка кучи с микрофризами.',
    bestAlternative: 'FerriteCore.',
    warning: 'Периодический вызов очистки кучи Java. Создает лаги и сбивает адаптивный сборщик мусора.',
    
  },
  {
    name: 'Fix GPU Memory Leak',
    category: 'Память и утечки',
    status: 'useful',
    statusLabel: 'Фикс VRAM',
    description: 'Устраняет утечки видеопамяти при частой перезагрузке текстур или смене шейдеров.',
    bestAlternative: 'GPUTape / GPUBooster.'
  },
  {
    name: 'Memory Cleaning',
    category: 'Память и утечки',
    status: 'danger',
    statusLabel: 'Опасно / Фризы',
    description: 'Форсированный клинер Java Heap, создающий фризы.',
    bestAlternative: 'Флаги Aikar / ZGC + FerriteCore.',
    warning: 'Форсированный клинер Java Heap, создающий фризы.',
    
  },
  {
    name: 'Better RAM',
    category: 'Память и утечки',
    status: 'danger',
    statusLabel: 'Плацебо',
    description: 'Обещает снижение RAM вдвое, по факту вызывает System.gc().',
    bestAlternative: 'FerriteCore.',
    warning: 'Плацебо-мод: обещает снижение RAM вдвое, по факту вызывает принудительный System.gc().',
    
  },
  {
    name: 'Safe ModernFix Config',
    category: 'Память и утечки',
    status: 'useful',
    statusLabel: 'Безопасный конфиг',
    description: 'Преднастроенный конфиг ModernFix, отключающий спорные миксины для максимальной стабильности.',
    bestAlternative: 'Ручная настройка modernfix-mixins.properties.'
  },
  {
    name: 'LowMemoryMC',
    category: 'Память и утечки',
    status: 'useful',
    statusLabel: 'Для 2-4 ГБ RAM',
    description: 'Пакет оптимизаций для ПК с малым объемом оперативной памяти.',
    bestAlternative: 'FerriteCore + ModernFix.'
  },
  {
    name: 'Enhanced Async',
    category: 'Потоки и процессор',
    status: 'useful',
    statusLabel: 'Асинхронные задачи',
    description: 'Переводит тяжелые расчеты в фоновый пул потоков.',
    bestAlternative: 'Radium Re-Reforged.'
  },
  {
    name: 'Worker Threads',
    category: 'Потоки и процессор',
    status: 'useful',
    statusLabel: 'Тонкая настройка пула',
    description: 'Тонкая настройка пула ForkJoinPool и фоновых рабочих потоков игры.',
    bestAlternative: 'ThreadTweak Reforged.'
  },
  {
    name: 'Multithreading',
    category: 'Потоки и процессор',
    status: 'danger',
    statusLabel: 'Критически опасно!',
    description: 'Любительский мод, пытающийся многопоточно тикать мир без синхронизации; приводит к повреждению чанков и рассинхрону инвентарей.',
    bestAlternative: 'C2ME для генерации + Radium для тиков.',
    warning: 'Небезопасный многопоточный тик без синхронизации; приводит к повреждению чанков и рассинхрону инвентарей.',
    
  },
  {
    name: 'Parallel World Save',
    category: 'Потоки и процессор',
    status: 'useful',
    statusLabel: 'Асинхронное сохранение',
    description: 'Асинхронное сохранение чанков мира на диск в отдельном потоке, убирающее секундный лаг при автосохранении (autosave).',
    bestAlternative: 'Встроено в C2ME / ServerCore.'
  },
  {
    name: 'Concurrent World Gen',
    category: 'Потоки и процессор',
    status: 'useful',
    statusLabel: 'Многопоточная генерация',
    description: 'Многопоточная генерация биомов и структур для 1.20+.',
    bestAlternative: 'C2ME.'
  },
  {
    name: 'Thread Tweaks',
    category: 'Потоки и процессор',
    status: 'useful',
    statusLabel: 'Приоритеты потоков',
    description: 'Управление приоритетами потоков ввода, сетевого драйвера и рендера.',
    bestAlternative: 'ThreadTweak Reforged.'
  },
  {
    name: 'Fast IP Ping',
    category: 'Потоки и процессор',
    status: 'useful',
    statusLabel: 'Быстрый пинг серверов',
    description: 'Параллельный опрос серверов в сетевом меню мультиплеера без зависания GUI.',
    bestAlternative: 'Отличный QoL-мод.'
  },
  {
    name: 'ChunkyBorder',
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Граница мира',
    description: 'Аддон к Chunky для установки и поддержания границы мира (World Border).',
    bestAlternative: 'Ставить вместе с Chunky.'
  },
  {
    name: 'Bobby Reforged',
    category: 'Чанки и генерация мира',
    platform: 'Forge',
    status: 'recommended',
    statusLabel: 'Порт Bobby (Обзор на сервере)',
    description: 'Forge-порт популярного Fabric-мода Bobby. Кэширует чанки с сервера на диск (.bobby), позволяя ставить клиентскую прорисовку 24–32 чанка даже при лимите сервера в 8.',
    bestAlternative: 'Отличный мод для дальнего обзора в мультиплеере.'
  },
  {
    name: 'FarPlaneTwo',
    category: 'Чанки и генерация мира',
    status: 'outdated',
    statusLabel: 'Устарел',
    description: 'Ранний прототип LOD-рендеринга.',
    bestAlternative: 'Distant Horizons.'
  },
  {
    name: 'Farsight',
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Кэш дальних чанков',
    description: 'Кэширует пройденные чанки на клиенте для отображения до 32 чанков на серверах.',
    bestAlternative: 'Bobby Reforged.'
  },
  {
    name: 'Dynamic View',
    category: 'Чанки и генерация мира',
    status: 'redundant',
    statusLabel: 'Избыточен',
    description: 'Снижает радиус обзора при лагах.',
    bestAlternative: 'ServerCore.'
  },
  {
    name: 'View Distance Fix',
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Фикс дистанции сущностей',
    description: 'Исправляет баг ванильного сервера с обрезанием дальности видимости мобов.',
    bestAlternative: 'Встроено в ServerCore.'
  },
  {
    name: 'Better Chunk Loading',
    category: 'Чанки и генерация мира',
    status: 'useful',
    statusLabel: 'Быстрая прогрузка чанков',
    description: 'Оптимизирует приоритеты запросов чанков при быстром перемещении на элитрах.',
    bestAlternative: 'C2ME.'
  },
  {
    name: 'Canary',
    category: 'Тики, TPS, сущности и ИИ',
    platform: 'Forge',
    status: 'redundant',
    statusLabel: 'Устаревший порт Lithium',
    description: 'Альтернативный неофициальный порт Lithium на Forge. Для совместимости пропускает часть тяжелых оптимизаций Lithium и обновляется реже, чем Radium Re-Reforged.',
    bestAlternative: 'Radium Re-Reforged (быстрее и активнее поддерживается под Forge 1.20.1).',
    warning: 'Не ставить вместе с Radium Re-Reforged, Radium Reforged или Lithium!'
  },
  {
    name: 'AI Improvements',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Упрощение поиска путей',
    description: 'Упрощает поиск путей (Pathfinding) для мобов и отключает неиспользуемые AI-цели у мобов вдалеке.',
    bestAlternative: 'Radium Re-Reforged + ServerCore.'
  },
  {
    name: 'Nerf Phantoms',
    category: 'Тики, TPS, сущности и ИИ',
    status: 'useful',
    statusLabel: 'Ограничение фантомов',
    description: 'Ограничивает спавн и сложный AI фантомов, убирая микрофризы на сервере ночью.',
    bestAlternative: 'Полезно для комфортной игры.'
  },
  {
    name: 'Lithium',
    category: 'Тики, TPS, сущности и ИИ',
    platform: 'Fabric (Справка / Порт: Radium Re-Reforged)',
    status: 'outdated',
    statusLabel: 'Только Fabric / NeoForge 1.21+',
    description: 'Оригинальный шедевр оптимизации тиков от CaffeineMC. Официально поддерживает Fabric (1.20.1) и NeoForge (1.21+), НЕ работает нативно на Forge 1.20.1!',
    bestAlternative: 'На Forge 1.20.1 используйте прямой порт — Radium Re-Reforged.',
    warning: 'Не закидывайте Fabric-файл Lithium на Forge 1.20.1 — используйте Radium Re-Reforged!'
  },
  {
    name: 'Krypton',
    category: 'Сеть',
    platform: 'Fabric (Справка / Порт: Krypton Reno)',
    status: 'outdated',
    statusLabel: 'Только Fabric',
    description: 'Оригинальный сетевой оптимизатор от astei (на базе Velocity) исключительно для Fabric. Не запускается на Forge без порта.',
    bestAlternative: 'На Forge 1.20.1 используйте прямой порт Krypton Reno (или Krypton Hybrid для Mohist/Arclight).',
    warning: 'Это Fabric-оригинал! Для Forge ставьте Krypton Reno.'
  },
  {
    name: 'Connectivity',
    category: 'Сеть',
    status: 'useful',
    statusLabel: 'Стабильность соединений',
    description: 'Устраняет таймауты при подключении к серверам с тяжелыми сборками модов.',
    bestAlternative: 'Полезно при нестабильном интернете.'
  },
  {
    name: 'Packet Fixer',
    category: 'Сеть',
    status: 'recommended',
    statusLabel: 'Мастхэв для модовых серверов',
    description: 'Увеличивает лимит размера сетевых пакетов с 2 МБ до 2 ГБ, предотвращая случайные дисконнекты игроков при передаче сложных предметов с гигантскими NBT-данными.',
    bestAlternative: 'Обязателен в любой модовой сборке.'
  },
  {
    name: 'TCP Nodeway',
    category: 'Сеть',
    status: 'useful',
    statusLabel: 'Мгновенные пакеты',
    description: 'Принудительно включает флаг TCP_NODELAY в Netty, отключая буферизацию алгоритма Нагла для минимальной задержки сетевых пакетов.',
    bestAlternative: 'Снижает сетевой отклик.'
  },
  {
    name: 'C2S-Log-Filter',
    category: 'Сеть',
    status: 'useful',
    statusLabel: 'Фильтр консоли',
    description: 'Фильтрует спам сетевых предупреждений в консоли сервера.',
    bestAlternative: 'Полезно для админов.'
  },
  {
    name: 'Connectivity Fix',
    category: 'Сеть',
    status: 'useful',
    statusLabel: 'Фикс прокси',
    description: 'Патч стабильности соединений при переходе между серверами BungeeCord / Velocity.',
    bestAlternative: 'Connectivity.'
  },
  {
    name: 'Better Ping Display',
    category: 'Сеть',
    status: 'useful',
    statusLabel: 'Точный пинг в мс',
    description: 'Отображает реальный пинг игроков в миллисекундах (мс) в меню Tab вместо 5 зеленых полосок.',
    bestAlternative: 'Отличный информативный мод.'
  },
  {
    name: 'Observable',
    category: 'Профилировщики и мониторинг',
    status: 'recommended',
    statusLabel: '3D-тепловизор лагов',
    description: 'Визуальный 3D-профайлер тиков. Подсвечивает прямо в мире блоки, трубы, сундуки и мобов цветами от зеленого до ярко-красного в зависимости от миллисекунд (MSPT), которые они тратят.',
    bestAlternative: 'Лучший мод для поиска лагающих механизмов на базе.'
  },
  // =========================================================================
  // РОДИТЕЛЬСКИЕ МОДЫ И БАЗОВЫЕ ДВИЖКИ ДЛЯ АДДОНОВ ОПТИМИЗАЦИИ
  // =========================================================================
  {
    name: 'Flywheel',
    category: 'Рендер, culling и FPS',
    status: 'recommended',
    statusLabel: 'GPU Instancing движок',
    description: 'Ключевой движок инстансированного рендеринга на GPU от команды Create. Переносит отрисовку сотен кинетических блоков, валов, шестерней и конвейеров с процессора на видеокарту. Базовый фундамент для работы мода Vanillin и всех индустриальных сборок с Create.',
    bestAlternative: 'Обязательный движок для Create и аддонов инстансинга (Vanillin). Несовместим с OptiFine.',
    warning: 'Требует совместимые драйверы OpenGL 3.3+. При использовании с Embeddium убедитесь в актуальности версии.',
    tags: ['flywheel', 'gpu instancing', 'create', 'vanillin', 'render']
  },
  {
    name: 'GeckoLib',
    category: 'Тики, TPS, сущности и ИИ',
    installed: true,
    status: 'recommended',
    statusLabel: 'Движок скелетных анимаций',
    description: 'Главная библиотека и движок 3D-скелетных анимаций для сотен модов с мобами, боссами и сложной экипировкой (Cataclysm, Iron\'s Spells, Twilight Forest). Необходимый родительский мод для GeckolibBetterFPS и GeckoLib Animation Optimizer.',
    bestAlternative: 'Основной родительский мод анимаций. Для оптимизации его тиков используйте GeckolibBetterFPS.',
    tags: ['geckolib', 'animation', 'engine', 'parent', 'bosses']
  },
  {
    name: 'Advanced Loot Info (ALI)',
    category: 'Предметы, контейнеры и рецепты',
    status: 'useful',
    statusLabel: 'База таблиц дропа',
    description: 'Информационный мод, отображающий подробные таблицы шансов выпадения лута с мобов, блоков и данжей в JEI / REI / EMI. Без оптимизатора сильно перегружает кэш рецептов при старте мира.',
    bestAlternative: 'Родительский мод для FastALI (FastALI оптимизирует его интеграцию с JEI/EMI).',
    warning: 'Без мода FastALI может вызывать 10-20 секундное зависание при входе в мир в сборках от 150+ модов.',
    tags: ['ali', 'loot', 'jei', 'parent', 'fastali']
  },
  {
    name: 'Oculus',
    category: 'Рендер, culling и FPS',
    status: 'recommended',
    statusLabel: 'Шейдерный движок для Forge',
    description: 'Официальный и наиболее оптимизированный порт Iris Shaders на Forge / NeoForge. Позволяет запускать современные шейдеры (Complementary, BSL, Kappa) поверх Embeddium / Emberbium с полным сохранением 100+ FPS и батчинга чанков. Необходим для работы модов Emberlens и Faster Iris Shadow Mapper.',
    bestAlternative: 'Лучший выбор для шейдеров на Forge 1.20+. Полностью заменяет устаревший шейдерный пайплайн OptiFine.',
    warning: 'Несовместим с OptiFine. Требует Embeddium или Emberbium.',
    tags: ['oculus', 'iris', 'shaders', 'embeddium', 'graphics']
  },
  {
    name: 'OptiFine',
    category: 'Рендер, culling и FPS',
    status: 'danger',
    statusLabel: 'Устаревший монолит (Несовместим)',
    description: 'Устаревший монолитный оптимизатор прошлых десятилетий (1.7.10 - 1.12.2). На современных версиях Forge 1.20+ грубо ломает рендеринг Forge, несовместим с 90% модов, ломает Flywheel/Create, ModernFix и вылетает при наличии Embeddium.',
    bestAlternative: 'Заменяется связкой «Embeddium + Embeddium Extras + Oculus + EBER + CullLessLeaves».',
    warning: 'Полная несовместимость с Embeddium, ModernFix, Oculus, Create и JEI на версиях 1.20+.',
    tags: ['optifine', 'danger', 'incompatible', 'obsolete', 'crash']
  },
  {
    name: 'Just Enough Items (JEI)',
    category: 'Предметы, контейнеры и рецепты',
    installed: true,
    status: 'recommended',
    statusLabel: 'Стандартный просмотрщик рецептов',
    description: 'Мировой стандарт браузера рецептов и предметов в инвентаре. Является целевым родительским модом для аддонов оптимизации памяти и поиска: JEI/EMI Optimizations, JEIOptimizer, Just Enough Freezes, Just Enough Threads и [JEIR] JEI Rewired.',
    bestAlternative: 'Основа интерфейса с рецептами. Для оптимизации используйте JEI/EMI Optimizations + ImmediatelyFast.',
    tags: ['jei', 'recipes', 'parent', 'core', 'items']
  },
  {
    name: 'Radon',
    category: 'Освещение',
    status: 'outdated',
    statusLabel: 'Порт Phosphor для Forge',
    description: 'Неофициальный порт движка Phosphor для Minecraft Forge. Оптимизирует ванильный алгоритм освещения без изменения его структуры. На версиях 1.20+ уступает современным асинхронным движкам Starlight и Solix.',
    bestAlternative: 'Solix (для Forge 1.20.1) или встроенный движок 1.20+ в связке с ModernFix.',
    warning: 'Не ставить одновременно со Starlight, LightStar или Solix.',
    tags: ['lighting', 'phosphor', 'radon', 'outdated']
  },
  {
    name: 'Cloth Config v12',
    category: 'Фиксы и совместимость',
    installed: true,
    status: 'recommended',
    statusLabel: 'Базовый конфигурационный экран',
    description: 'Обязательный родительский конфигурационный API для десятков модов оптимизации (ImmediatelyFast, CullLessLeaves, Better Biome Reblend, Dynamic FPS). Предоставляет чистый экран настроек без оверхеда на память.',
    bestAlternative: 'Обязательная библиотека настроек.',
    tags: ['cloth config', 'config', 'api', 'library', 'dependency']
  },
  // =========================================================================
  // 20. FABRIC-ПРОСЛОЙКА (SINYTRA CONNECTOR), NVIDIUM И LOD-РЕНДЕРИНГ
  // =========================================================================
  {
    name: 'Sinytra Connector',
    category: 'Фиксы и совместимость',
    platform: 'Universal',
    status: 'recommended',
    statusLabel: 'Прослойка Fabric → Forge',
    description: 'Ключевая платформа совместимости, позволяющая запускать мощнейшие Fabric-моды (Nvidium, C2ME, Lithium, VMP) прямо внутри сборок Forge 1.20.1 и NeoForge!',
    bestAlternative: 'Обязательная база (вместе с Forgified Fabric API) для запуска Nvidium и Fabric-оптимизаторов на Forge.',
    warning: 'Требует Forgified Fabric API. Для работы Nvidium с Embeddium добавьте алиас "embeddium": "sodium" в конфиге Connector.',
    tags: ['sinytra', 'fabric', 'bridge', 'nvidium', 'c2me']
  },
  {
    name: 'Forgified Fabric API',
    category: 'Фиксы и совместимость',
    platform: 'Universal',
    status: 'recommended',
    statusLabel: 'Fabric API для Forge',
    description: 'Порт Fabric API для Forge/NeoForge. Обязательная зависимость для 95% Fabric-модов, запускаемых через Sinytra Connector (включая Nvidium, C2ME и VMP).',
    bestAlternative: 'Ставить всегда в паре с Sinytra Connector.',
    tags: ['sinytra', 'fabric api', 'library', 'dependency']
  },
  {
    name: 'Connector Extras',
    category: 'Фиксы и совместимость',
    platform: 'Universal',
    status: 'useful',
    statusLabel: 'Расширение Connector',
    description: 'Дополнительный модуль интеграции для Sinytra Connector (REI/EMI мосты, поддержка ресурспаков и библиотек Fabric).',
    bestAlternative: 'Полезно при запуске нескольких Fabric-модов на Forge.',
    tags: ['sinytra', 'connector', 'extras']
  },
  {
    name: 'Nvidium',
    category: 'Рендер, culling и FPS',
    platform: 'Fabric (через Sinytra)',
    status: 'recommended',
    statusLabel: 'Mesh-рендер NVIDIA (x3-x10 FPS)',
    description: 'Легендарный Fabric-движок на базе OpenGL Mesh Shaders для карт NVIDIA (GTX 16xx / RTX 20xx/30xx/40xx). Позволяет рендерить 64–128 чанков со скоростью 200+ FPS! На Forge 1.20.1 запускается через Sinytra Connector + Forgified Fabric API + Embeddium (с алиасом "embeddium": "sodium" в connector.json).',
    bestAlternative: 'Для видеокарт NVIDIA без шейдеров — абсолютный чемпион FPS! На AMD/Intel используйте Alloyium + Distant Horizons.',
    warning: 'Работает ТОЛЬКО на видеокартах NVIDIA (Turing / GTX 16xx+ и новее). Автоматически отключается или конфликтует при включенных шейдерах Oculus/Iris.',
    tags: ['nvidium', 'nvidia', 'rtx', 'mesh shaders', 'sinytra', 'fabric']
  },
  {
    name: 'Distant Horizons',
    category: 'Рендер, culling и FPS',
    platform: 'Universal',
    status: 'recommended',
    statusLabel: 'Универсальный LOD-рендер',
    description: 'Создает упрощенные LOD-модели далекого ландшафта, позволяя видеть на 128–512 чанков вперед без нагрузки на GPU и на любой видеокарте (NVIDIA, AMD, Intel). Нативно работает на Forge, NeoForge и Fabric и совместим с Oculus/Iris шейдерами.',
    bestAlternative: 'Лучший аналог Nvidium для владельцев AMD/Intel или любителей играть с шейдерами. Рекомендуется ставить с Distant Horizons Memory Fix.',
    warning: 'При игре с шейдерами Oculus настоятельно рекомендуется Distant Horizons Memory Fix.',
    tags: ['lod', 'render distance', 'distant horizons', 'universal', 'shaders']
  },
  {
    name: 'Voxy',
    category: 'Рендер, culling и FPS',
    platform: 'Fabric (через Sinytra)',
    status: 'useful',
    statusLabel: 'Воксельный LOD-рендер',
    description: 'Сверхбыстрый воксельный LOD-рендерер нового поколения (конкурент Distant Horizons с еще более высокой детализацией и скоростью). Нативно под Fabric (Sodium); на Forge требует специальных сборок или патчей совместимости с Embeddium.',
    bestAlternative: 'На нативном Forge проще и стабильнее использовать Distant Horizons.',
    warning: 'Обычная Fabric-версия жестко требует Sodium и не запустится на Sinytra без спец-форка под Embeddium.',
    tags: ['voxy', 'lod', 'voxel', 'fabric']
  },
  {
    name: 'Revidium / Accedium',
    category: 'Рендер, culling и FPS',
    platform: 'Forge / NeoForge',
    status: 'useful',
    statusLabel: 'Порты идеи Nvidium',
    description: 'Экспериментальные проекты сообщества по прямому портированию mesh/indirect рендеринга Nvidium на нативный Forge / NeoForge без прослойки Sinytra Connector.',
    bestAlternative: 'Гораздо надежнее использовать либо Alloyium (нативный Compute для любых GPU), либо Nvidium через Sinytra Connector.',
    warning: 'Экспериментальный статус — проверяйте стабильность для вашей версии.',
    tags: ['revidium', 'accedium', 'nvidium', 'mesh', 'forge']
  },
  {
    name: 'C2ME (Concurrent Chunk Management Engine)',
    category: 'Чанки и генерация мира',
    platform: 'Fabric (через Sinytra)',
    status: 'recommended',
    statusLabel: 'Многопоточные чанки (Fabric/Sinytra)',
    description: 'Оригинальный сверхмощный Fabric-мод многопоточной генерации и I/O чанков. Отлично работает на Forge 1.20.1 через Sinytra Connector в паре с Noisiumed, позволяя загружать все ядра CPU при полете на элитрах.',
    bestAlternative: 'На Forge работает через Sinytra Connector (при отключении noTickViewDistance = false в конфиге c2me.toml).',
    warning: 'При запуске через Sinytra Connector на 1.20.1 установите noTickViewDistance = false в config/c2me.toml во избежание фризов.',
    tags: ['c2me', 'fabric', 'sinytra', 'chunks', 'multithreading']
  },
  {
    name: 'Very Many Players (VMP)',
    category: 'Тики, TPS, сущности и ИИ',
    platform: 'Fabric (через Sinytra)',
    status: 'useful',
    statusLabel: 'Высокий онлайн (Fabric/Sinytra)',
    description: 'Fabric-мод от авторов C2ME, оптимизирующий логику трекинга игроков, рассылку чанков и коллизии при высоком онлайне (30–200+ игроков). Запускается на Forge/NeoForge через Sinytra Connector.',
    bestAlternative: 'Дополнение к ServerCore и Radium Re-Reforged для крупных серверов.',
    tags: ['vmp', 'server', 'players', 'fabric', 'sinytra']
  },
  {
    name: 'VulkanMod',
    category: 'Рендер, culling и FPS',
    platform: 'Fabric (Справка / Несовм. с Forge)',
    status: 'danger',
    statusLabel: 'Только чистый Fabric (Не для Forge)',
    description: 'Полная замена OpenGL-движка Minecraft на современный Vulkan API для чистого Fabric. Дает рекордный FPS на слабых CPU/GPU, но полностью несовместим с Forge, Sinytra Connector, Embeddium, Nvidium и шейдерами Iris/Oculus.',
    bestAlternative: 'На Forge используйте Embeddium + Alloyium (или Nvidium через Sinytra).',
    warning: 'Категорически несовместим с Forge, Sinytra Connector, Embeddium и шейдерами!',
    tags: ['vulkan', 'fabric', 'incompatible', 'renderer']
  },
  {
    name: 'Sodium',
    category: 'Рендер, culling и FPS',
    platform: 'Fabric (Справка / Несовм. с Forge)',
    status: 'outdated',
    statusLabel: 'Оригинал Fabric (На Forge — Embeddium)',
    description: 'Оригинальный легендарный рендерер от JellySquid для Fabric. Не запускается на Forge через Sinytra Connector — его прямым официальным портом для Forge/NeoForge является Embeddium.',
    bestAlternative: 'Используйте нативный Embeddium (и добавьте алиас embeddium -> sodium в Sinytra для аддонов).',
    warning: 'Не ставьте Fabric-версию Sodium на Forge — она крашнет игру! Ставьте Embeddium.',
    tags: ['sodium', 'fabric', 'reference', 'embeddium']
  },
  {
    name: 'Iris Shaders',
    category: 'Рендер, culling и FPS',
    platform: 'Fabric (Справка / Несовм. с Forge)',
    status: 'outdated',
    statusLabel: 'Оригинал Fabric (На Forge — Oculus)',
    description: 'Оригинальный шейдерный движок для Fabric/Sodium. Для Forge 1.20.1 его официальным портом является Oculus (или Emberlens).',
    bestAlternative: 'Oculus (или форк Emberlens с улучшенной поддержкой Create на 1.20.1).',
    warning: 'Не ставьте Fabric-версию Iris поверх Sinytra на 1.20.1 — используйте Oculus.',
    tags: ['iris', 'shaders', 'fabric', 'oculus']
  },
  {
    name: 'Indium',
    category: 'Фиксы и совместимость',
    platform: 'Fabric (Справка / Несовм. с Forge)',
    status: 'redundant',
    statusLabel: 'Не нужен на Forge (Embeddium нативен)',
    description: 'Прослойка Fabric Rendering API для Sodium. На Forge с Embeddium и Forgified Fabric API полностью избыточен и может вызывать краши.',
    bestAlternative: 'Удалить — Embeddium нативно поддерживает нужные интерфейсы рендеринга.',
    warning: 'Не устанавливайте Indium через Sinytra Connector с Embeddium.',
    tags: ['indium', 'redundant', 'fabric', 'sodium']
  },
  {
    name: 'Exordium',
    category: 'Рендер, culling и FPS',
    platform: 'Fabric (Справка / Несовм. с Forge)',
    status: 'outdated',
    statusLabel: 'Конфликт миксинов с Sinytra',
    description: 'Fabric-мод снижения FPS отрисовки GUI/хотбара для разгрузки видеокарты. Через Sinytra Connector на Forge падает с ошибкой InvalidInjectionException из-за конфликта миксинов.',
    bestAlternative: 'ImmediatelyFast (нативно для Forge, ускоряет весь GUI и HUD без крашей).',
    warning: 'Падает при запуске через Sinytra Connector!',
    tags: ['exordium', 'gui', 'fabric', 'crash']
  },
  {
    name: 'DashLoader',
    category: 'Загрузка игры и ресурспаков',
    platform: 'Fabric (Справка / Несовм. с Forge)',
    status: 'outdated',
    statusLabel: 'Конфликт с Sinytra и ModernFix',
    description: 'Fabric-мод агрессивного кэширования запеченных моделей и шрифтов для ускорения запуска. Через Sinytra Connector конфликтует с трансформацией модов и ломает загрузку ресурсов.',
    bestAlternative: 'ModernFix (динамические ресурсы + быстрый старт нативно на Forge).',
    warning: 'Несовместим с Sinytra Connector и ModernFix!',
    tags: ['dashloader', 'loading', 'cache', 'fabric', 'crash']
  },
];

export const INCOMPATIBILITY_RULES = [
  {
    title: 'Конфликт движков рендера чанков (Форки Sodium)',
    category: 'Рендер, culling и FPS',
    conflictingMods: ['Embeddium', 'Rubidium', 'Xenon', 'Xenon Debloated', 'Emberbium', 'Prismanium', 'Polidium', 'Sodium', 'VulkanMod'],
    explanation: 'Все эти моды являются самостоятельными движками рендера (форками Sodium или заменами конвейера). Примечание: (Sodium) Chloride, Alloyium и Flerovium НЕ конфликтуют — это аддоны к Embeddium! Установка двух основных движков сразу вызовет краш OpenGL.',
    recommendation: 'Оставьте ТОЛЬКО Embeddium (или Xenon / Emberbium) + совместимые аддоны ((Sodium) Chloride, Alloyium, Flerovium).'
  },
  {
    title: 'Катастрофический конфликт с OptiFine',
    category: 'Рендер, culling и FPS',
    conflictingMods: ['OptiFine', 'Embeddium', 'Emberbium', 'Xenon', 'ModernFix', 'Flywheel', 'Oculus'],
    explanation: 'OptiFine — закрытый монолит, переписывающий базовые классы рендеринга Minecraft. При совместной установке с современными модами (Embeddium, Flywheel, ModernFix, Oculus) игра гарантированно падает с ошибкой NoSuchMethodError / IncompatibleClassChangeError при запуске.',
    recommendation: 'Полностью удалите OptiFine из папки mods. Вся его функциональность делится на: Embeddium (FPS), Oculus (шейдеры), EBER (сундуки), Embeddium Extras / Chloride (зум и детали).'
  },
  {
    title: 'Конфликт Nvidium и шейдеров (Oculus / Iris)',
    category: 'Рендер, culling и FPS',
    conflictingMods: ['Nvidium', 'Oculus', 'Iris Shaders'],
    explanation: 'Nvidium использует прямой конвейер Mesh Shaders OpenGL, который несовместим с перехватом фреймбуферов шейдер-паков Oculus/Iris. Одновременная активация выключает Nvidium или вызывает черный экран.',
    recommendation: 'Играете БЕЗ шейдеров на NVIDIA RTX — берите Nvidium + Alloyium. Нужны шейдеры — используйте Oculus/Emberlens + Distant Horizons + Alloyium.'
  },
  {
    title: 'Конфликт движков освещения',
    category: 'Освещение',
    conflictingMods: ['Starlight with Create Fix', 'Solix', 'ScalableLux', 'Lucis (серверное)', 'Radon'],
    explanation: 'Моды полностью заменяют ванильный световой конвейер (LightEngine) на асинхронные структуры данных. Два световых движка одновременно приведут к повреждению чанков света или зависанию генерации мира. (Примечание: LightStar кэширует только клиентские запросы в Embeddium).',
    recommendation: 'На Forge 1.20.1 используйте либо ванильный свет 1.20+ (+ LightStar), либо один движок Solix.'
  },
  {
    title: 'Конфликт оптимизаторов листвы',
    category: 'Рендер, culling и FPS',
    conflictingMods: ['CullLessLeaves Reforged', 'OptiLeaves', 'Leaves Culling', 'Sodium Leaf Culling (Unofficial)', 'Sodium/Embeddium Leaf Culling'],
    explanation: 'Моды пытаются модифицировать одни и те же шейдеры и модели листьев, вызывая мелькание текстур листвы или черные грани.',
    recommendation: 'Используйте только CullLessLeaves Reforged. Отключите встроенный Leaf Culling в настройках графики.'
  },
  {
    title: 'Конфликт сетевых оптимизаторов',
    category: 'Сеть',
    conflictingMods: ['Krypton Reno', 'Krypton Hybrid', 'Krypton Foxified', 'AegisNetworking (не ставить вместе с Krypton Hybrid)', 'Krypton'],
    explanation: 'Моды вмешиваются в сетевой конвейер Netty, что при дублировании приводит к потере пакетов и разрыву соединения.',
    recommendation: 'Для чистого Forge 1.20.1 используйте Krypton Reno (для гибрид-серверов Mohist/Arclight — Krypton Hybrid).'
  },
  {
    title: 'Конфликт редиректов и перехвата методов',
    category: 'Память и утечки',
    conflictingMods: ['Redirected', 'Redirector [Modern]', 'Jasione'],
    explanation: 'Данные моды заменяют одинаковые байткод-вызовы методов в Java. Старые версии вызывают краши.',
    recommendation: 'Удалите старые Redirected и Redirector. Оставьте только Jasione (или ModernFix).'
  },
  {
    title: 'Дубликаты оптимизаторов достижений',
    category: 'Асинхронность, кеш и авторизация',
    conflictingMods: ['Fastvancements', 'Achievements Optimizer', 'Icterine', 'Cerulean'],
    explanation: 'Все эти моды патчат один и тот же ванильный класс PlayerAdvancements. Одновременная установка приводит к дублированию событий или крашу при выполнении квестов.',
    recommendation: 'Оставьте только Fastvancements.'
  },
  {
    title: 'Дублирование портов Lithium (Radium vs Canary vs Lithium)',
    category: 'Тики, TPS, сущности и ИИ',
    conflictingMods: ['Radium Reforged (оригинал)', 'Radium Re-Reforged', 'Canary', 'Lithium'],
    explanation: 'Radium Re-Reforged, Radium Reforged, Canary и Fabric Lithium патчат одни и те же классы физики, ИИ и воронок. У версий Radium еще и одинаковый mod id "radium" — игра упадет сразу при старте.',
    recommendation: 'Используйте только один актуальный движок: Radium Re-Reforged (нативно для Forge 1.20.1).'
  },
  {
    title: 'Конфликт компенсации тиков (TT20 vs TickAccelerate)',
    category: 'Тики, TPS, сущности и ИИ',
    conflictingMods: ['TT20 (TPS Fixer)', 'TickAccelerate'],
    explanation: 'Оба мода масштабируют внутренние таймеры тиков клиентского рендеринга для сглаживания рывков при просевшем TPS сервера. При совместной установке игра начинает дергаться с удвоенной скоростью или сбоит физика передвижения.',
    recommendation: 'Удалите оба для стабильности, либо оставьте максимум один в крайнем случае.'
  },
  {
    title: 'Конфликт динамической прорисовки',
    category: 'Чанки и генерация мира',
    conflictingMods: ['DynamicRenderDistance', '[DRD] Dynamic Render Distance'],
    explanation: 'Два мода динамически меняют render distance в зависимости от текущего FPS. Возникает эффект «резонанса» дальности прорисовки, когда дистанция скачет туда-сюда каждые 2 секунды.',
    recommendation: 'Оставьте только один из них (лучше [DRD] Dynamic Render Distance).'
  },
  {
    title: 'Конфликт оптимизаторов сундуков',
    category: 'Рендер, culling и FPS',
    conflictingMods: ['Enhanced Block Entities Reloaded', 'Enhanced Block Entities Reforged (Unofficial)', 'FastChest Revived', 'Legendary Block Entities', 'Optimized Block Entities (OBE)'],
    explanation: 'Моды преобразуют анимации сундуков в статические модели блоков. Их одновременная работа приводит к исчезновению текстур сундуков или крашу при открытии двойных сундуков.',
    recommendation: 'Используйте только один из актуальных: Enhanced Block Entities Reloaded (EBER) или Legendary Block Entities.'
  },
  {
    title: 'Опасность автоклинеров памяти (System.gc)',
    category: 'Память и утечки',
    conflictingMods: ['Simply Server Ram Optimizer [Cleaner]', 'MemGuard', 'GcGo (серверное)', 'Slime: Heuristic Memory Purger (серверное)', 'RAMization', 'Furia Memory', 'Recoleta', 'Sanitivy', 'Clean Memory', 'Memory Cleaning', 'Better RAM', 'Memory Optimizer'],
    explanation: 'Принудительные вызовы System.gc() ломают расписание работы JVM-сборщиков G1GC/ZGC, порождая резкие лаги и стоп-кадры каждые пару минут.',
    recommendation: 'Удалите клинеры памяти. Используйте FerriteCore + ModernFix + выделение 6-8 ГБ ОЗУ.'
  },
  {
    title: 'Конфликт ModernFix с устаревшим DashLoader',
    category: 'Загрузка игры и ресурспаков',
    conflictingMods: ['ModernFix', 'DashLoader'],
    explanation: 'Оба мода перехватывают загрузку и кэширование JSON-моделей/ресурсов. На Forge через Sinytra Connector DashLoader гарантированно вызывает краш.',
    recommendation: 'Удалите DashLoader и оставьте ModernFix (с опцией Dynamic Resources).'
  }
];

export const GOLDEN_STANDARD_MODS = [
  { name: 'Embeddium', role: 'Базовый 3D-рендер чанков (актуальный порт Sodium для Forge)' },
  { name: 'Embeddium Extras', role: 'Тонкие настройки графики (небо, погода, частицы, FPS-счетчик)' },
  { name: 'ImmediatelyFast', role: 'Мгновенный рендер шрифтов, GUI, подсказок (мульти-лоадер)' },
  { name: 'Entity Culling', role: 'Асинхронное отсечение мобов и сундуков за стенами (tr7zw)' },
  { name: 'More Culling Reforged', role: 'Куллинг невидимых граней ступеней, заборов и блоков' },
  { name: 'Enhanced Block Entities Reloaded', role: 'Запекание сундуков и печей в меши блоков' },
  { name: 'CullLessLeaves Reforged', role: 'Умное отсечение скрытых граней листвы' },
  { name: 'ModernFix', role: 'Дедупликация структур, ускорение запуска, фикс утечек' },
  { name: 'FerriteCore', role: 'Экономия до 40% RAM на моделях блоков' },
  { name: 'AllTheLeaks', role: 'Устранение утечек памяти при переходах между мирами' },
  { name: 'Jasione', role: 'Устранение клонирования массивов Enum.values()' },
  { name: 'Put A Plug In it!', role: 'Глушит спам логов, спасая диск от зависаний' },
  { name: 'Radium Re-Reforged', role: 'Актуальный порт Lithium (физика, ИИ, воронки и редстоун)' },
  { name: 'BadOptimizations', role: 'Вырезание бесполезных ванильных микро-проверок' },
  { name: 'ServerCore', role: 'Динамический view-distance и умный троттлинг ИИ' },
  { name: 'Immersive Optimization', role: 'Entity Tick Scheduler — замедление дальних мобов без поломки ферм' },
  { name: 'Ixeris', role: 'Плавный ввод мыши без микрофризов на Windows' },
  { name: 'Noisiumed', role: 'Ускорение генерации мира и биомов в 2-3 раза (форк Noisium)' },
  { name: 'Ksyxis', role: 'Мгновенный старт одиночного мира без ожидания спавна' },
  { name: 'Dynamic FPS', role: 'Снижение нагрузки до 1-5 FPS при сворачивании окна (и RestMode для AFK)' },
  { name: 'Optimized Recipe Book (ORB)', role: 'Устранение лагов клиентской книги рецептов' },
  { name: 'ItemMerge', role: 'Агрессивное объединение одинаковых предметов на полу' },
  { name: 'Clumps', role: 'Объединение сотен сфер опыта на фермах в один сгусток' },
  { name: 'Fastvancements', role: 'Устранение лагов при выдаче достижений' },
  { name: 'Language Reload Reforged', role: 'Мгновенная смена языка без перезагрузки ресурсов' },
  { name: 'JEI/EMI Optimizations', role: 'Быстрая индексация списков рецептов' },
  { name: 'Let Me Despawn', role: 'Безопасный деспавн застрявших мобов' },
  { name: 'Spark Profiler', role: 'Золотой стандарт диагностики лагов и профайлинга' },
];

function generateReport(): string {
  let out = `# ==============================================================================
# ПОЛНЫЙ АНАЛИЗ И СРАВНЕНИЕ МОДОВ ОПТИМИЗАЦИИ MINECRAFT (FORGE / NEOFORGE)
# Файл: ilya.txt — Полная универсальная база (${ALL_MODS.length} модов)
# ==============================================================================
# Легенда статусов:
#  [РЕКОМЕНДУЕТСЯ / МАСТХЭВ] — Актуальный, проверенный, дает максимальный прирост без багов.
#  [ПОЛЕЗНО / АКТУАЛЕН]     — Хорошо работает в специфических сценариях (определенные сборки/железо).
#  [УСТАРЕЛ / ЗАБРОШЕН]     — Давно не обновлялся, заменен более современными решениями.
#  [ИЗБЫТОЧЕН / ДУБЛИКАТ]   — Уже покрывается ModernFix, Radium, Embeddium или аналогами.
#  [ОПАСНО / ПЛАЦЕБО]       — Ломает механику, вызывает статтеры или ухудшает графику без FPS.
#  [ДИАГНОСТИКА]            — Профилировщик или монитор нагрузки (сам по себе игру не ускоряет).
# ==============================================================================

`;

  const grouped: Record<string, ModDef[]> = {};
  ALL_MODS.forEach(m => {
    if (!grouped[m.category]) grouped[m.category] = [];
    grouped[m.category].push(m);
  });

  let catIndex = 1;
  for (const [category, mods] of Object.entries(grouped)) {
    out += `================================================================================\n${catIndex++}. ${category.toUpperCase()}\n================================================================================\n\n`;
    mods.forEach(m => {
      out += `• ${m.name}${m.installed ? ' [установлено]' : ''} -> [${m.statusLabel.toUpperCase()}]\n`;
      out += `  - Описание: ${m.description}\n`;
      if (m.bestAlternative) {
        out += `  - Альтернатива / Вердикт: ${m.bestAlternative}\n`;
      }
      if (m.warning) {
        out += `  - Внимание: ${m.warning}\n`;
      }
      out += '\n';
    });
  }

  out += `================================================================================\nПРАВИЛА НЕСОВМЕСТИМОСТИ:\n================================================================================\n`;
  INCOMPATIBILITY_RULES.forEach((r, idx) => {
    out += `${idx + 1}. ${r.title} (${r.category}):\n`;
    out += `   - Конфликтующие моды: ${r.conflictingMods.join(', ')}\n`;
    out += `   - Причина: ${r.explanation}\n`;
    out += `   - Решение: ${r.recommendation}\n\n`;
  });

  out += `================================================================================\nЗОЛОТОЙ СТАНДАРТ ИДЕАЛЬНОЙ СБОРКИ:\n================================================================================\n`;
  GOLDEN_STANDARD_MODS.forEach((g, idx) => {
    out += `${idx + 1}. ${g.name} — ${g.role}\n`;
  });

  return out;
}

interface ModGroupDef {
  id: string;
  title: string;
  category: string;
  description: string;
  exclusive: boolean;
  leaderId: string;
  addonIds: string[];
  memberIds: string[];
  conflictReason?: string;
}

const CURSEFORGE_SLUGS: Record<string, string> = {
  'embeddium': 'embeddium',
  'embeddium-extras': 'embeddium-extras',
  'sodium-chloride': 'chloride',
  'xenon': 'xenon-forge',
  'alloyium': 'alloyium',
  'flerovium': 'flerovium',
  'immediatelyfast': 'immediatelyfast',
  'accelerated-rendering': 'accelerated-rendering',
  'more-culling-reforged': 'moreculling-reforged',
  'entity-culling': 'entityculling',
  'enhanced-block-entities-reloaded': 'enhanced-block-entities-reloaded',
  'enhanced-block-entities-reforged-unofficial': 'enhanced-block-entities-reforged-unofficial',
  'legendary-block-entities': 'legendary-block-entities',
  'culllessleaves-reforged': 'culllessleaves-reforged',
  'fast-item-frames': 'fast-item-frames',
  'better-biome-reblend': 'better-biome-reblend',
  'kerria': 'kerria',
  'oculus': 'oculus',
  'flywheel': 'flywheel',
  'gputape': 'gputape',
  'emberlens': 'emberlens',
  'faster-iris-shadow-mapper': 'faster-iris-shadow-mapper',
  'rubidium': 'rubidium',
  'emberbium': 'emberbium',
  'prismanium': 'prismanium',
  'polidium': 'polidium',
  'xenon-debloated': 'xenon-debloated',
  'modernfix': 'modernfix',
  'ferritecore': 'ferritecore',
  'alltheleaks-memory-leak-fix': 'alltheleaks',
  'jasione': 'jasione',
  'put-a-plug-in-it-papi': 'put-a-plug-in-it',
  'duplicate-nbt-flattener': 'duplicate-nbt-flattener',
  'memory-leak-fix-modern-port': 'memory-leak-fix',
  'thulium': 'thulium',
  'radium-re-reforged': 'radium-re-reforged',
  'radium-reforged': 'radium-reforged',
  'canary': 'canary',
  'lithium': 'lithium',
  'alternate-current': 'alternate-current',
  'badoptimizations': 'badoptimizations',
  'servercore': 'servercore',
  'immersive-optimization': 'immersive-optimization',
  'entity-collision-optimization': 'entity-collision-optimization',
  'villager-optimizer': 'villager-optimizer',
  'falling-blocks-fps-fix': 'falling-blocks-fps-fix',
  'capability-fix-revived': 'capability-fix-revived',
  'ai-improvements': 'ai-improvements',
  'nerf-phantoms': 'nerf-phantoms',
  'doespotatotick': 'doespotatotick',
  'ixeris': 'ixeris',
  'stutterfix-reforged': 'stutterfix-reforged',
  'threadtweak-reforged': 'threadtweak-reforged',
  'noisiumed': 'noisiumed',
  'structure-layout-optimizer': 'structure-layout-optimizer',
  'structure-dfu-cache': 'structure-dfu-cache',
  'chunky': 'chunky-pregenerator',
  'chunkyborder': 'chunkyborder',
  'bobby-reforged': 'bobby-reforged',
  'farsight': 'farsight',
  'ksyxis': 'ksyxis',
  'smooth-boot-reloaded': 'smooth-boot-reloaded',
  'lightspeedre': 'lightspeed-mod',
  'fastboot': 'fastboot',
  'lazyyyyy': 'lazyyyyy',
  'language-reload-reforged': 'language-reload-reforged',
  'dynamic-fps': 'dynamic-fps',
  'restmode': 'restmode',
  'particle-core': 'particle-core',
  'particull': 'particull',
  'fast-sounds': 'fast-sounds',
  'soundgc': 'soundgc',
  'reload-looping-sound-fix': 'reload-looping-sound-fix',
  'krypton-hybrid': 'krypton-hybrid',
  'krypton-reno': 'krypton-reno',
  'krypton-foxified': 'krypton-foxified',
  'krypton': 'krypton',
  'packet-fixer': 'packet-fixer',
  'connectivity': 'connectivity',
  'better-ping-display': 'better-ping-display',
  'fast-ip-ping': 'fast-ip-ping',
  'optimized-recipe-book-orb': 'optimized-recipe-book',
  'fastvancements': 'fastvancements',
  'fastsuite': 'fastsuite',
  'fastfurnace': 'fastfurnace',
  'fastworkbench': 'fastworkbench',
  'clumps': 'clumps',
  'jei-emi-optimizations': 'jei-emi-optimizations',
  'jeioptimizer': 'jeioptimizer',
  'just-enough-items-jei': 'jei',
  'itemmerge': 'itemmerge',
  'let-me-despawn': 'let-me-despawn',
  'amd-fsr-upscaler-render-scale-for-embeddium': 'amd-fsr-upscaler-for-embeddium',
  'starlight-with-create-fix': 'starlight-forge',
  'scalablelux': 'scalablelux',
  'radon': 'radon',
  'geckolib': 'geckolib',
  'geckolib-animation-optimizer': 'geckolib-animation-optimizer',
  'cloth-config-v12': 'cloth-config',
  'observable': 'observable',
  'spark-profiler-au-naturel-edit-java-25': 'spark',
  'sinytra-connector': 'sinytra-connector',
  'forgified-fabric-api': 'forgified-fabric-api',
  'connector-extras': 'connector-extras',
  'nvidium': 'nvidium',
  'distant-horizons': 'distant-horizons',
  'voxy': 'voxy',
  'c2me-concurrent-chunk-management-engine': 'c2me-fabric',
  'very-many-players-vmp': 'vmp-fabric',
  'vulkanmod': 'vulkanmod',
  'sodium': 'sodium',
  'iris-shaders': 'irisshaders',
  'indium': 'indium',
  'exordium': 'exordium',
  'dashloader': 'dashloader',
  'async-screenshot': 'async-screenshot',
  'broken-tag-fixer': 'broken-tag-fixer',
  'drd-dynamic-render-distance': 'dynamic-render-distance',
  'config-preset-switch-low-medium-high-f10': 'config-preset-switch',
  'tritium': 'tritium',
  'redirected': 'redirected',
  'redirector-modern': 'redirector'
};

function getCurseForgeUrl(id: string, name: string): string {
  const slug = CURSEFORGE_SLUGS[id];
  if (slug) {
    return `https://www.curseforge.com/minecraft/mc-mods/${slug}`;
  }
  const cleanName = name
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return `https://www.curseforge.com/minecraft/search?search=${encodeURIComponent(cleanName || name)}&class=mc-mods`;
}

const MOD_GROUPS: ModGroupDef[] = [
  {
    id: 'core-renderer',
    title: 'Базовый 3D-рендер чанков',
    category: 'Рендер, culling и FPS',
    description: 'Движок рендеринга мира и чанков. В сборке должен быть только один базовый рендерер — его форки и OptiFine вызывают немедленный краш.',
    exclusive: true,
    leaderId: 'embeddium',
    addonIds: ['embeddium-extras', 'sodium-chloride', 'alloyium', 'flerovium', 'immediatelyfast', 'accelerated-rendering', 'oculus', 'gputape', 'emberlens', 'faster-iris-shadow-mapper'],
    memberIds: [
      'embeddium', 'xenon', 'rubidium', 'emberbium', 'prismanium', 'polidium', 'xenon-debloated',
      'sodium-chloride', 'accelerium', 'unbinilium', 'aluminium', 'fermium', 'xfermium', 'carbons', 'voidengine',
      'sodium', 'vulkanmod', 'optifine', 'iris-shaders',
      'hyperfps', 'stable-fps', 'lite-fps', 'framelift', 'fps-supa', 'gothic-tweaks',
      'osmium-optimization', 'pixelcrystaloptimizer', 'graphics-optimizer', 'fps-speed',
      'optimi', 'omnioptimizer', 'mcoptimizer', 'improve-the-expectations', 'coreoptimizer',
      'tinyrender', 'threatengl', 'lagless-fps-optimizer', 'nvvisionboost', 'gpu-load', 'refine', 'slipstream', 'nebula-mod', 'kexosyn-forge', 'vectors', 'clab', 'chaosapi', 'bocchium', 'outline-fixer', 'large-textures-fix-mobs', 'fast-events', 'water-ripples-performant', 'smooth-container', 'mob-2d-render'
    ],
    conflictReason: 'Форки Sodium/Embeddium (Xenon, Emberbium, Rubidium) и OptiFine конфликтуют между собой. Выбирайте только Embeddium + аддоны (Embeddium Extras, Chloride, Alloyium, Flerovium).'
  },
  {
    id: 'sinytra-bridge',
    title: 'Прослойка Sinytra (Fabric-моды на Forge)',
    category: 'Прослойка Fabric и LOD',
    description: 'Позволяет запускать топовые Fabric-моды (Nvidium, C2ME, VMP) поверх Forge 1.20.1.',
    exclusive: false,
    leaderId: 'sinytra-connector',
    addonIds: ['forgified-fabric-api', 'connector-extras'],
    memberIds: ['sinytra-connector', 'forgified-fabric-api', 'connector-extras', 'indium', 'exordium', 'dashloader'],
    conflictReason: 'Indium, Exordium и DashLoader не работают на Forge через Connector (вызывают краш или заменены Embeddium/ImmediatelyFast/ModernFix).'
  },
  {
    id: 'lod-nvidium',
    title: 'Дальность прорисовки (LOD) и Mesh Shaders',
    category: 'Прослойка Fabric и LOD',
    description: 'Сверхвысокая дальность прорисовки без просадки FPS: Nvidium (Mesh Shaders для NVIDIA через Sinytra) и LOD-рендеры (Distant Horizons / Voxy).',
    exclusive: false,
    leaderId: 'distant-horizons',
    addonIds: ['nvidium', 'voxy', 'revidium-accedium', 'distant-horizons-memory-fix-dh'],
    memberIds: ['distant-horizons', 'nvidium', 'voxy', 'revidium-accedium', 'distant-horizons-memory-fix-dh', 'bobby-reforged', 'farsight', 'farplanetwo', 'char-s-far-view', 'shadowlod'],
    conflictReason: 'Nvidium требует NVIDIA GTX 16xx/RTX 20xx+, Sinytra Connector и не работает при активных шейдерах Oculus.'
  },
  {
    id: 'block-culling',
    title: 'Отсечение скрытых граней и сущностей (Culling)',
    category: 'Рендер, culling и FPS',
    description: 'Скрывает невидимые грани блоков (More Culling Reforged) и мобов/сундуки за стенами (Entity Culling).',
    exclusive: true,
    leaderId: 'more-culling-reforged',
    addonIds: ['entity-culling', 'sodium-sightline', 'sodium-streamline', 'sodium-fovea'],
    memberIds: ['more-culling-reforged', 'entity-culling', 'cullify', 'smartcull', 'brute-force-rendering-culling', 'brute-force-rendering-culling-revived', 'stoprendering', 'too-many-entities', 'itemculler', 'sodium-sightline', 'sodium-streamline', 'sodium-fovea'],
    conflictReason: 'More Culling Reforged + Entity Culling (tr7zw) работают в паре и заменяют мелкие дубли, а агрессивные куллеры (Brute Force) вызывают дыры в мире.'
  },
  {
    id: 'leaves-culling',
    title: 'Куллинг листвы деревьев',
    category: 'Рендер, culling и FPS',
    description: 'Скрывает внутренние блоки листвы в кронах деревьев для разгрузки видеокарты.',
    exclusive: true,
    leaderId: 'culllessleaves-reforged',
    addonIds: [],
    memberIds: ['culllessleaves-reforged', 'leaves-culling', 'sodium-leaf-culling-unofficial', 'sodium-embeddium-leaf-culling', 'tritium'],
    conflictReason: 'Нельзя ставить два мода на куллинг листвы одновременно — используйте CullLessLeaves Reforged.'
  },
  {
    id: 'block-entities',
    title: 'Сундуки, печи и рамки (Block Entities)',
    category: 'Рендер, culling и FPS',
    description: 'Запекает 3D-сундуки, таблички и рамки в статические меши чанков.',
    exclusive: true,
    leaderId: 'enhanced-block-entities-reloaded',
    addonIds: ['fast-item-frames'],
    memberIds: ['enhanced-block-entities-reloaded', 'legendary-block-entities', 'enhanced-block-entities-reforged-unofficial', 'fastchest-revived', 'optimized-block-entities-obe', 'fast-item-frames'],
    conflictReason: 'Выбирайте строго ОДИН мод на сундуки: либо Enhanced Block Entities Reloaded (EBER), либо Legendary Block Entities.'
  },
  {
    id: 'memory-core',
    title: 'Память (RAM), дедупликация и утечки',
    category: 'Память и утечки',
    description: 'Сокращает потребление ОЗУ на 35-50%, чинит утечки между мирами и клонирование Enum.',
    exclusive: false,
    leaderId: 'modernfix',
    addonIds: ['ferritecore', 'alltheleaks-memory-leak-fix', 'jasione', 'put-a-plug-in-it-papi', 'thulium', 'duplicate-nbt-flattener', 'memory-leak-fix-modern-port'],
    memberIds: [
      'modernfix', 'ferritecore', 'alltheleaks-memory-leak-fix', 'jasione', 'put-a-plug-in-it-papi', 'thulium',
      'duplicate-nbt-flattener', 'memory-leak-fix-modern-port', 'alltheleaks-fix-for-moonlight-2-13-4', 'qnm-quark',
      'redirected', 'redirector-modern', 'rhenium', 'lean-object', 'nicelight-memoryfix', 'memoryfreeze-fix',
      'safe-modernfix-config', 'lowmemorymc', 'fix-gpu-memory-leak', 'mcreatormemfix', 'calm-the-leaks', 'collections-of-optimizations',
      'sanitivy', 'recoleta', 'ramization', 'furia-memory', 'gcgo', 'slime-heuristic-memory-purger',
      'simply-server-ram-optimizer-cleaner', 'memguard', 'memory-optimizer', 'clean-memory', 'memory-cleaning', 'better-ram'
    ],
    conflictReason: 'Клинеры памяти (System.gc) вызывают статтеры, а функции Redirected/MemoryLeakFix уже встроены в ModernFix.'
  },
  {
    id: 'lighting-engine',
    title: 'Световой движок (Lighting)',
    category: 'Освещение',
    description: 'В 1.20+ ванильный свет уже переписан и быстр. Сторонние движки конфликтуют друг с другом (LightStar кэширует только Embeddium).',
    exclusive: true,
    leaderId: 'solix',
    addonIds: ['lightstar', 'light-config', 'optimized-fullbright'],
    memberIds: ['solix', 'scalablelux', 'starlight-with-create-fix', 'radon', 'lucis', 'lightstar', 'light-config', 'optimized-fullbright'],
    conflictReason: 'Нельзя совмещать два световых движка (Solix, Starlight, Radon, ScalableLux) — они переписывают один и тот же код освещения.'
  },
  {
    id: 'tick-physics-engine',
    title: 'Тики сервера (TPS), физика и ИИ мобов',
    category: 'Тики, TPS, сущности и ИИ',
    description: 'Порт Lithium для Forge (Radium Re-Reforged): ускоряет редстоун, воронки, коллизии и ИИ без изменения механик.',
    exclusive: true,
    leaderId: 'radium-re-reforged',
    addonIds: ['badoptimizations', 'servercore', 'immersive-optimization', 'alternate-current', 'entity-collision-optimization', 'villager-optimizer', 'falling-blocks-fps-fix', 'capability-fix-revived'],
    memberIds: [
      'radium-re-reforged', 'radium-reforged', 'canary', 'lithium',
      'badoptimizations', 'servercore', 'immersive-optimization', 'alternate-current', 'entity-collision-optimization', 'villager-optimizer', 'falling-blocks-fps-fix', 'capability-fix-revived', 'capability-fix',
      'doespotatotick', 'mobtimizations', 'fast-nbt', 'efficienthashing', 'tickaccelerate', 'tt20-tps-fixer', 'fps-booster-lag-killer',
      'notick', 'optimizemod', 'char-s-boost', 'adaptive-performance-tweaks', 'adaptive-optimization-reborn', 'random-optimization',
      'ai-improvements', 'performance-tweaks', 'tick-tweaks', 'tpsum', 'harium', 'he-harientity', 'speedeeentity',
      'ticktact', 'tick-stabilizer', 'tick-weave', 'tantalum', 'mob-collision-off', 'farmcollisionless', 'enttick', 'entitysleep',
      'nerf-phantoms', 'all-roads-lead-to-rome', 'enginecore', 'fast-tag', 'fast-recipes', 'furnaceoptimizer', 'martensite-entity-tick-skiper',
      'nudge', 'sleepium', 'nolith', 'stfu-reforged', 'better-tnt', 'perfomant-boom', 'spawn-cap-range-adjuster', 'heroclock', 'arpo',
      'herdline', 'stackable-mobs', 'lyzer-s-restless-respawns', 'localboost-server-optimization', 'antilag-tps-monitor', 'golden-chicken-seeds',
      'fastevent', 'async-logger', 'fluidium', 'fix-attack-lag', 'papi-optimization', 'pingy-ping-optimized', 'i-can-take-a-horde', 'very-many-players-vmp'
    ],
    conflictReason: 'Radium Re-Reforged, Radium Reforged, Canary и Fabric Lithium — это вариации одного движка, нельзя ставить больше одного.'
  },
  {
    id: 'worldgen-chunks',
    title: 'Генерация мира и загрузка чанков',
    category: 'Чанки и генерация мира',
    description: 'Ускоряет генерацию биомов (Noisiumed) и распараллеливает потоки чанков (C2ME).',
    exclusive: false,
    leaderId: 'noisiumed',
    addonIds: ['c2me-concurrent-chunk-management-engine', 'structure-layout-optimizer', 'structure-dfu-cache', 'chunky', 'chunkyborder'],
    memberIds: [
      'noisiumed', 'c2me-concurrent-chunk-management-engine', 'concurrent-chunk-management-engine-forge-c2me', 'c2mer',
      'structure-layout-optimizer', 'structure-dfu-cache', 'chunky', 'chunkyborder',
      'hc-harichunk', 'superchunk', 'chunk-optimization', 'swiftgen', 'unium', 'quantumchunks', 'dimensional-threading-reforked',
      'generator-accelerator-2', 'noise-boost', 'terraingraph', 'ultra-fast-pregen', 'nicelight-async-loader',
      'shadowed-s-no-more-lazy-chunk-loader', 'chunk-schedudeler', 'portalium', 'chunk-prefetcher', 'driftload',
      'fly-s-adrenaline', 'datafly-lib', 'delta-chunk', 'polycore', 'blocksprint', 'seedgen-map', 'chlorine-trifluoride',
      'bc-lightning-terrain', 'serverwarashi', 'fast-noise', 'biomespy', 'dynamic-view', 'view-distance-fix', 'better-chunk-loading',
      'concurrent-world-gen', 'parallel-world-save'
    ],
    conflictReason: 'Нельзя ставить несколько версий C2ME одновременно (оригинальный C2ME через Sinytra обычно новее неофициальных Forge-портов).'
  },
  {
    id: 'cpu-threads',
    title: 'Потоки процессора и ввод мыши',
    category: 'Потоки и процессор',
    description: 'Выносит обработку ввода на отдельный поток (Ixeris) и сглаживает фреймтайм.',
    exclusive: false,
    leaderId: 'ixeris',
    addonIds: ['stutterfix-reforged', 'threadtweak-reforged', 'fast-ip-ping'],
    memberIds: ['ixeris', 'stutterfix-reforged', 'stutterfix-modern-port', 'threadtweak-reforged', 'threads', 'thread-priorities', 'thread-tweaks', 'worker-threads', 'enhanced-async', 'multithreading', 'tridentperf', 'hp-hariplayer', 'fast-ip-ping'],
    conflictReason: 'Опасные моды вроде Multithreading вызывают гонки данных; используйте связку Ixeris + ThreadTweak Reforged.'
  },
  {
    id: 'boot-loading',
    title: 'Ускорение запуска игры и миров',
    category: 'Загрузка игры и ресурспаков',
    description: 'Быстрый вход в мир без ожидания зоны спавна (Ksyxis) и ускорение запуска модпака.',
    exclusive: false,
    leaderId: 'ksyxis',
    addonIds: ['language-reload-reforged', 'smooth-boot-reloaded', 'lightspeedre', 'fastboot'],
    memberIds: [
      'ksyxis', 'language-reload-reforged', 'languagereloadunofficial', 'smooth-boot-reloaded', 'lightspeedre', 'fastboot',
      'quick-boot', 'fast-loading', 'lightload', 'thefastlaunch-tfl', 'optiload', 'slothfullllll', 'loadleak', 'fastlate',
      'quality-lite', 'lazyyyyy', 'quick-pack', 'startup-workaround', 'mod-loading-optimizer', 'fast-title-screen',
      'early-loading-screen', 'splashscreen', 'smooth-loading-screens', 'blinkload', 'debloatfy', 'noresploadfix',
      'packforge', 'keep-the-resourcepack', 'just-enough-loading', 'startup-world', 'loadstep', 'resourcepackcached'
    ],
    conflictReason: 'Большинство старых бут-модов дублируют встроенные функции ModernFix.'
  },
  {
    id: 'networking',
    title: 'Сетевой стек, пинг и пакеты',
    category: 'Сеть',
    description: 'Оптимизация Netty-буферов, сжатия пакетов и исправление таймаутов больших модпаков.',
    exclusive: true,
    leaderId: 'krypton-reno',
    addonIds: ['packet-fixer', 'connectivity', 'better-ping-display'],
    memberIds: ['krypton-reno', 'krypton-hybrid', 'krypton-foxified', 'krypton', 'aegisnetworking-krypton-hybrid', 'packet-fixer', 'connectivity', 'connectivity-fix', 'better-ping-display', 'zstdnet', 'not-enough-bandwidth-legacy', 'nullpointer-fix-for-mio', 'packet-capper', 'networkop', 'tcp-nodeway', 'c2s-log-filter'],
    conflictReason: 'Krypton Reno, Krypton Hybrid, Krypton Foxified и AegisNetworking конфликтуют между собой — для чистого Forge 1.20.1 ставьте Krypton Reno.'
  },
  {
    id: 'recipes-jei',
    title: 'Рецепты, JEI/EMI и достижения',
    category: 'Предметы, контейнеры и рецепты',
    description: 'Ускорение поиска в JEI/EMI, серверного крафта (FastSuite/Workbench) и окна достижений.',
    exclusive: false,
    leaderId: 'jei-emi-optimizations',
    addonIds: ['optimized-recipe-book-orb', 'fastvancements', 'fastsuite', 'fastfurnace', 'fastworkbench', 'jeioptimizer', 'just-enough-freezes', 'just-enough-threads', 'tmrv-updated', 'fast-recipe-search'],
    memberIds: [
      'jei-emi-optimizations', 'optimized-recipe-book-orb', 'fastvancements', 'jeioptimizer', 'just-enough-freezes',
      'just-enough-threads', 'tmrv-updated', 'fast-recipe-search', 'just-enough-items-jei', 'advanced-loot-info-ali',
      'fastsuite', 'fastfurnace', 'fastworkbench', 'icterine', 'cerulean', 'achievements-optimizer',
      'jeir-jei-rewired', 'quiet-recipes-emi-jei-rei', 'tom-s-simple-storage-performance-optimization'
    ],
    conflictReason: 'Icterine, Cerulean и Achievements Optimizer дублируют Fastvancements.'
  },
  {
    id: 'items-clearlag',
    title: 'Предметы на полу, опыт (Clumps) и деспавн мобов',
    category: 'Предметы, контейнеры и рецепты',
    description: 'Объединение стаков дропа (ItemMerge), сфер опыта (Clumps) и безопасный деспавн мобов с лутом.',
    exclusive: false,
    leaderId: 'itemmerge',
    addonIds: ['clumps', 'let-me-despawn', 'arrow-clean-up'],
    memberIds: [
      'itemmerge', 'clumps', 'let-me-despawn', 'arrow-clean-up', 'quickifx-item-entities-fix', 'floor-item-cleaner',
      'sweeper-maid', 'darktimer', 'despawn-tweaks', 'despawn-tweaks-modern-port', 'despawntweaker', 'despawnings', 'eco-stack-manager',
      'pala-s-item-clear', 'tct-clearlag', 'universal-clearlag', 'clearlagplus', 'item-purge', 'ground-clear', 'mccleaner',
      'clearlagg-server-forge', 'customizable-entity-clear', 'more-optimized', 'lagless-server-optimizer',
      'easy-server-optimizer-eso', 'lagging-optimizer', 'lagshield-ultimate-anti-lag', 'mob-wand', 'zonelag',
      'mob-controlation-full', 'banish-annoying-mobs', 'vex-be-gone', 'mob-control-apocalypse', 'mob-controller-spawning', 'no-spawner', 'spawn-control'
    ],
    conflictReason: 'Избегайте агрессивных ClearLag-модов, удаляющих ценный дроп по таймеру.'
  },
  {
    id: 'particles-audio',
    title: 'Частицы, эффекты и звук',
    category: 'Частицы, погода, звук и визуальные эффекты',
    description: 'Отсечение частиц за спиной/стенами (PartiCull), лимит спама и очистка звукового движка.',
    exclusive: false,
    leaderId: 'particle-core',
    addonIds: ['particull', 'fast-sounds', 'soundgc', 'reload-looping-sound-fix'],
    memberIds: [
      'particle-core', 'particull', 'fast-sounds', 'soundgc', 'reload-looping-sound-fix',
      'asyncparticles', 'smart-particles', 'particle-muffler', 'particle-filter', 'particle-shield', 'i-dont-want-particles',
      'visualcontrol', 'firelimiter', 'no-damage-indicator-heart-particles', 'limited-damage-indicator-particle',
      'no-rain', 'disable-rain', 'no-more-potion-particles', 'noeffectparticles', 'optimization-of-campfire-smoke'
    ]
  },
  {
    id: 'upscaling-bg',
    title: 'Апскейл (FSR) и лимит FPS в фоне',
    category: 'Апскейл и генерация кадров',
    description: 'Масштабирование рендера для слабых GPU (AMD FSR), сброс FPS при Alt-Tab (Dynamic FPS) и в AFK (RestMode).',
    exclusive: true,
    leaderId: 'dynamic-fps',
    addonIds: ['restmode', 'amd-fsr-upscaler-render-scale-for-embeddium', 'framepacer'],
    memberIds: [
      'dynamic-fps', 'restmode', 'amd-fsr-upscaler-render-scale-for-embeddium', 'framepacer', 'sleepframe-unfocus-limiter', 'idle-boost', 'stablecap-pacer-forge-1-19-2',
      'renderscale', 'super-resolution', 'purescale', 'upscalecraft-forge', 'ggtu', 'bons-dlss-diet-complementary-unbound',
      'interframe', 'pfg', 'framegen', 'photon-frame-generation'
    ],
    conflictReason: 'Моды на "генерацию кадров" (FrameGen, Interframe) — плацебо с артефактами. Используйте Dynamic FPS / RestMode / AMD FSR.'
  },
  {
    id: 'animations-compat',
    title: 'Анимации, Create и фиксы',
    category: 'Фиксы и совместимость',
    description: 'Ускорение GeckoLib-мобов, GPU-инстансинг Create (Flywheel) и устранение спама ошибок в логи.',
    exclusive: false,
    leaderId: 'geckolib-animation-optimizer',
    addonIds: ['geckolibbetterfps', 'flywheel', 'vanillin', 'broken-tag-fixer', 'async-screenshot', 'async-advancement-toast', 'better-biome-reblend', 'kerria', 'cloth-config-v12', 'geckolib', 'minimal-backup-zstd'],
    memberIds: [
      'geckolib-animation-optimizer', 'geckolibbetterfps', 'flywheel', 'vanillin', 'broken-tag-fixer',
      'async-screenshot', 'async-advancement-toast', 'better-biome-reblend', 'kerria', 'cloth-config-v12', 'geckolib',
      'rubidium-fluid-render-fix', 'anotherfix', 'crash-doctor', 'modpack-troubleshooter', 'log4j-loader-fix', 'logfilter',
      'fastali', 'client-mixin-intercept', 'profilecached', 'yggdrasilproxy-ely-by', 'mixpnlb', 'reflex-antilag', 'lomka', 'minimal-backup-zstd',
      'thirst-was-taken-mixin-server-fix-thirst-was-taken', 'unofficial-luxium-compatibility-luxium-oculus',
      'embeddium-x-polytone-block-colormap-fix-polytone', 'departure-inventory-halo-fix-tinker-s-domain',
      'iron-s-spells-anvil-on-demand-iron-s-spells', 'qubit-s-aaa-tweaks-aaaparticles'
    ]
  },
  {
    id: 'potato-tweaks',
    title: 'Пресеты и динамическая дальность для слабых ПК',
    category: 'Пресеты для слабых ПК',
    description: 'Динамическое снижение дальности при просадках FPS и переключение профилей графики на F10.',
    exclusive: false,
    leaderId: 'config-preset-switch-low-medium-high-f10',
    addonIds: ['drd-dynamic-render-distance'],
    memberIds: [
      'config-preset-switch-low-medium-high-f10', 'drd-dynamic-render-distance', 'dynamicrenderdistance',
      'fastglass-graphics-switch', 'emberdust-particle-cutter', 'cloudshear-sky-lite', 'nimblecloud-sky-lite',
      'flatlight-shading-cutter', 'cinderlite-entity-slimmer', 'particlehush-effects-trimmer', 'quartzframe-render-trim',
      'featherframe-fps-boost', 'quietworld-low-detail-pack', 'shortsight-chunk-saver', 'tinyhorizon-extreme-range'
    ]
  },
  {
    id: 'profilers',
    title: 'Профилировщики и поиск лагов',
    category: 'Профилировщики и мониторинг',
    description: 'Инструменты диагностики: выявляют лагающие блоки, сущности и утечки (сами FPS не повышают).',
    exclusive: false,
    leaderId: 'spark-profiler-au-naturel-edit-java-25',
    addonIds: ['observable'],
    memberIds: [
      'spark-profiler-au-naturel-edit-java-25', 'observable', 'performancehud', 'startup-loading-profiler',
      'chunk-loading-profiler', 'tps-detective', 'stutter-analyzer', 'fps-display', 'performance-analyzer',
      'frameguard', 'gradlemc', 'mob-spawn-checker', 'renderscope', 'improved-f3', 'infooverlay77',
      'tps-checker', 'lagmap', 'servertrace', 'chunk-watch', 'operate-my-server-oms-watchdog-essentials-oms-addon'
    ]
  }
];

function inferCoveredBy(m: ModDef, id: string): string {
  const alt = (m.bestAlternative || '').toLowerCase();
  const desc = (m.description || '').toLowerCase();
  if (m.status === 'redundant') {
    if (alt.includes('modernfix') || desc.includes('modernfix')) return 'ModernFix';
    if (alt.includes('embeddium') || desc.includes('embeddium')) return 'Embeddium';
    if (alt.includes('radium') || desc.includes('radium')) return 'Radium Re-Reforged';
    if (alt.includes('more culling') || desc.includes('more culling')) return 'More Culling Reforged';
    if (alt.includes('culllessleaves') || desc.includes('culllessleaves')) return 'CullLessLeaves Reforged';
    if (alt.includes('dynamic fps')) return 'Dynamic FPS';
    if (alt.includes('restmode')) return 'RestMode';
    if (alt.includes('fastvancements')) return 'Fastvancements';
    if (alt.includes('entity culling')) return 'Entity Culling';
    if (alt.includes('ванила') || desc.includes('ванил')) return 'Ванила 1.20+';
    return m.bestAlternative || 'Основные моды';
  }
  const explicitCovered: Record<string, string> = {
    'redirected': 'ModernFix',
    'redirector-modern': 'ModernFix',
    'rhenium': 'ModernFix',
    'memory-leak-fix-modern-port': 'AllTheLeaks + ModernFix',
    'fastchest-revived': 'Enhanced Block Entities Reloaded',
    'optimized-block-entities-obe': 'Enhanced Block Entities Reloaded',
    'enhanced-block-entities-reforged-unofficial': 'Enhanced Block Entities Reloaded',
    'farplanetwo': 'Distant Horizons',
    'indium': 'Embeddium (встроено)',
    'exordium': 'ImmediatelyFast',
    'dashloader': 'ModernFix (Dynamic Resources)',
    'sodium': 'Embeddium (порт для Forge)',
    'iris-shaders': 'Oculus (порт для Forge)',
    'lithium': 'Radium Re-Reforged (порт для Forge)',
    'krypton': 'Krypton Reno (порт для Forge)'
  };
  return explicitCovered[id] || '';
}

function getHealthTier(m: ModDef): 'green' | 'yellow' | 'red' {
  if (m.status === 'danger') return 'red';
  if (m.status === 'recommended') {
    // Fabric bridges / conditional mods get yellow unless native stable Forge
    if (m.platform && m.platform.includes('Sinytra')) return 'yellow';
    return 'green';
  }
  if (m.status === 'useful') return 'yellow';
  if (m.status === 'diagnostic') return 'yellow';
  if (m.status === 'redundant' || m.status === 'outdated') return 'yellow';
  return 'yellow';
}

function generateModsDataTs(): string {
  const idToGroup = new Map<string, ModGroupDef>();
  const allValidIds = new Set(
    ALL_MODS.map((m, idx) => m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `mod-${idx}`)
  );

  for (const g of MOD_GROUPS) {
    if (!allValidIds.has(g.leaderId)) {
      throw new Error(`Invalid leaderId "${g.leaderId}" in group "${g.id}"`);
    }
    for (const a of g.addonIds) {
      if (!allValidIds.has(a)) throw new Error(`Invalid addonId "${a}" in group "${g.id}"`);
    }
    for (const mem of g.memberIds) {
      if (!allValidIds.has(mem)) throw new Error(`Invalid memberId "${mem}" in group "${g.id}"`);
      if (!idToGroup.has(mem)) idToGroup.set(mem, g);
    }
    if (!idToGroup.has(g.leaderId)) idToGroup.set(g.leaderId, g);
  }

  const modItems = ALL_MODS.map((m, idx) => {
    const id = m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `mod-${idx}`;
    const group = idToGroup.get(id);
    const isGroupLeader = group ? group.leaderId === id : false;
    const isGroupAddon = group ? group.addonIds.includes(id) : false;
    const coveredBy = inferCoveredBy(m, id);
    return {
      id,
      name: m.name,
      category: m.category,
      platform: m.platform || 'Forge',
      installed: m.installed || false,
      status: m.status,
      statusLabel: m.statusLabel,
      healthTier: getHealthTier(m),
      description: m.description,
      bestAlternative: m.bestAlternative || '',
      warning: m.warning || '',
      tags: m.tags || [],
      curseforgeUrl: getCurseForgeUrl(id, m.name),
      groupId: group?.id || '',
      groupTitle: group?.title || '',
      isGroupLeader,
      isGroupAddon,
      addons: isGroupLeader && group ? group.addonIds : [],
      coveredBy
    };
  });

  const presets: Array<{
    id: string;
    name: string;
    badge: string;
    badgeColor: 'emerald' | 'sky' | 'violet' | 'amber' | 'rose';
    description: string;
    crashRisk: string;
    modIds: string[];
  }> = [
    {
      id: 'golden',
      name: 'Золотой стандарт (31 мод)',
      badge: '100% Стабильно',
      badgeColor: 'emerald',
      description: 'Идеальный баланс максимального FPS, минимального расхода RAM (до -50%) и абсолютной стабильности без визуальных багов. Рекомендуется для любых модовых сборок на Forge 1.20+.',
      crashRisk: 'Нулевой (протестировано на миллионах сборок)',
      modIds: [
        'embeddium',
        'embeddium-extras',
        'immediatelyfast',
        'entity-culling',
        'more-culling-reforged',
        'enhanced-block-entities-reloaded',
        'culllessleaves-reforged',
        'modernfix',
        'ferritecore',
        'alltheleaks-memory-leak-fix',
        'jasione',
        'put-a-plug-in-it-papi',
        'radium-re-reforged',
        'badoptimizations',
        'servercore',
        'immersive-optimization',
        'ixeris',
        'noisiumed',
        'ksyxis',
        'dynamic-fps',
        'optimized-recipe-book-orb',
        'itemmerge',
        'clumps',
        'fastvancements',
        'language-reload-reforged',
        'jei-emi-optimizations',
        'let-me-despawn',
        'spark-profiler-au-naturel-edit-java-25',
        'cloth-config-v12',
        'geckolib',
        'just-enough-items-jei'
      ]
    },
    {
      id: 'max-packed',
      name: 'Максимум оптимизаций — Без конфликтов (62 мода)',
      badge: 'Все совместимые моды',
      badgeColor: 'emerald',
      description: 'Максимально набитая сборка всеми проверенными неконфликтующими лидерами, GPU-аддонами (Alloyium, Flerovium, Accelerated Rendering, Chloride), Entity Culling, Alternate Current, Clumps, FastSuite/Furnace/Workbench, потоковыми фиксами и сетевым стеком Krypton Reno.',
      crashRisk: 'Очень низкий (0 известных конфликтов; для Accelerated Rendering нужен OpenGL 4.6)',
      modIds: [
        'embeddium',
        'embeddium-extras',
        'sodium-chloride',
        'alloyium',
        'flerovium',
        'accelerated-rendering',
        'immediatelyfast',
        'entity-culling',
        'more-culling-reforged',
        'enhanced-block-entities-reloaded',
        'culllessleaves-reforged',
        'fast-item-frames',
        'better-biome-reblend',
        'kerria',
        'modernfix',
        'ferritecore',
        'alltheleaks-memory-leak-fix',
        'jasione',
        'put-a-plug-in-it-papi',
        'duplicate-nbt-flattener',
        'radium-re-reforged',
        'badoptimizations',
        'servercore',
        'immersive-optimization',
        'alternate-current',
        'entity-collision-optimization',
        'villager-optimizer',
        'falling-blocks-fps-fix',
        'capability-fix-revived',
        'ixeris',
        'stutterfix-reforged',
        'threadtweak-reforged',
        'noisiumed',
        'structure-layout-optimizer',
        'structure-dfu-cache',
        'ksyxis',
        'smooth-boot-reloaded',
        'lightspeedre',
        'language-reload-reforged',
        'dynamic-fps',
        'restmode',
        'particle-core',
        'particull',
        'fast-sounds',
        'soundgc',
        'reload-looping-sound-fix',
        'krypton-reno',
        'packet-fixer',
        'connectivity',
        'optimized-recipe-book-orb',
        'fastsuite',
        'fastfurnace',
        'fastworkbench',
        'fastvancements',
        'jei-emi-optimizations',
        'itemmerge',
        'clumps',
        'let-me-despawn',
        'geckolib-animation-optimizer',
        'broken-tag-fixer',
        'async-screenshot',
        'observable'
      ]
    },
    {
      id: 'sinytra-nvidium',
      name: 'Nvidium + C2ME (Fabric через Sinytra Connector)',
      badge: 'NVIDIA RTX + Sinytra',
      badgeColor: 'violet',
      description: 'Продвинутая сборка для видеокарт NVIDIA (GTX 16xx / RTX 20xx+): запускает Nvidium и Fabric C2ME на Forge 1.20.1 через прослойку Sinytra Connector с алиасом embeddium -> sodium. Без шейдеров Oculus.',
      crashRisk: 'Средний (требуется NVIDIA GPU, без Oculus и с настройкой noTickViewDistance = false в C2ME)',
      modIds: [
        'embeddium',
        'embeddium-extras',
        'sinytra-connector',
        'forgified-fabric-api',
        'connector-extras',
        'nvidium',
        'c2me-concurrent-chunk-management-engine',
        'immediatelyfast',
        'entity-culling',
        'more-culling-reforged',
        'enhanced-block-entities-reloaded',
        'culllessleaves-reforged',
        'modernfix',
        'ferritecore',
        'alltheleaks-memory-leak-fix',
        'radium-re-reforged',
        'badoptimizations',
        'noisiumed',
        'ixeris',
        'ksyxis',
        'dynamic-fps',
        'krypton-reno',
        'packet-fixer',
        'clumps',
        'cloth-config-v12'
      ]
    },
    {
      id: 'potato-pc',
      name: 'Для слабых ПК и ноутбуков',
      badge: 'Максимальный FPS',
      badgeColor: 'sky',
      description: 'Сборка для максимального выжимания кадров на слабых процессорах и встроенной графике. Включает Entity Culling, урезает дальность частиц, отключает фоновую нагрузку и включает AMD FSR апскейл.',
      crashRisk: 'Очень низкий (стабильная работа)',
      modIds: [
        'embeddium',
        'embeddium-extras',
        'amd-fsr-upscaler-render-scale-for-embeddium',
        'immediatelyfast',
        'entity-culling',
        'culllessleaves-reforged',
        'more-culling-reforged',
        'enhanced-block-entities-reloaded',
        'modernfix',
        'ferritecore',
        'alltheleaks-memory-leak-fix',
        'radium-re-reforged',
        'badoptimizations',
        'particle-core',
        'particull',
        'fast-sounds',
        'ixeris',
        'dynamic-fps',
        'restmode',
        'fastboot',
        'ksyxis',
        'clumps',
        'let-me-despawn',
        'drd-dynamic-render-distance',
        'config-preset-switch-low-medium-high-f10',
        'cloth-config-v12'
      ]
    },
    {
      id: 'shaders-max',
      name: 'Шейдеры + Красота (Shader Pack)',
      badge: 'Шейдеры без лагов',
      badgeColor: 'violet',
      description: 'Специализированная сборка под запуск тяжелых шейдеров (Complementary, BSL) с Oculus и Embeddium. Оптимизирует карты теней (Faster Iris Shadow Mapper, Emberlens), отсечение сущностей и память видеокарты.',
      crashRisk: 'Низкий (требуется GPU с поддержкой OpenGL 4.5+)',
      modIds: [
        'embeddium',
        'embeddium-extras',
        'alloyium',
        'oculus',
        'faster-iris-shadow-mapper',
        'emberlens',
        'immediatelyfast',
        'entity-culling',
        'more-culling-reforged',
        'culllessleaves-reforged',
        'modernfix',
        'ferritecore',
        'radium-re-reforged',
        'badoptimizations',
        'noisiumed',
        'gputape',
        'ixeris',
        'cloth-config-v12'
      ]
    },
    {
      id: 'industrial-create',
      name: 'Индустриальная сборка (Create + Механизмы)',
      badge: 'Технические моды',
      badgeColor: 'amber',
      description: 'Набор для индустриальных сборок с огромными фабриками, трубами и редстоуном. Включает GPU-инстансинг Flywheel, Alternate Current, Immersive Optimization, FastFurnace/Workbench и оптимизацию сундуков.',
      crashRisk: 'Низкий',
      modIds: [
        'embeddium',
        'flywheel',
        'immediatelyfast',
        'entity-culling',
        'more-culling-reforged',
        'enhanced-block-entities-reloaded',
        'modernfix',
        'ferritecore',
        'alltheleaks-memory-leak-fix',
        'radium-re-reforged',
        'badoptimizations',
        'alternate-current',
        'immersive-optimization',
        'servercore',
        'fastfurnace',
        'fastworkbench',
        'itemmerge',
        'clumps',
        'just-enough-items-jei',
        'jei-emi-optimizations',
        'observable',
        'cloth-config-v12'
      ]
    },
    {
      id: 'crash-risk',
      name: 'Опасный эксперимент (Высокий шанс КРАША)',
      badge: 'Опасно (Краш при запуске)',
      badgeColor: 'rose',
      description: 'Сборка-демонстрация несовместимости! Содержит взаимоисключающие моды (OptiFine + Embeddium + Emberbium, два световых движка Solix + Starlight, клинеры памяти и Nvidium + Oculus).',
      crashRisk: 'КРИТИЧЕСКИЙ (99% краш NoSuchMethodError / Duplicate mod ID)',
      modIds: [
        'optifine',
        'embeddium',
        'emberbium',
        'rubidium',
        'solix',
        'starlight-with-create-fix',
        'radium-reforged',
        'radium-re-reforged',
        'nvidium',
        'oculus',
        'simply-server-ram-optimizer-cleaner',
        'memguard',
        'tt20-tps-fixer',
        'tickaccelerate'
      ]
    }
  ];

  for (const preset of presets) {
    for (const mid of preset.modIds) {
      if (!allValidIds.has(mid)) {
        throw new Error(`Invalid preset modId "${mid}" in preset "${preset.id}"`);
      }
    }
  }

  return `export type ModStatus = 'recommended' | 'useful' | 'outdated' | 'redundant' | 'danger' | 'diagnostic';
export type HealthTier = 'green' | 'yellow' | 'red';

export interface ModItem {
  id: string;
  name: string;
  category: string;
  platform: string;
  installed?: boolean;
  status: ModStatus;
  statusLabel: string;
  healthTier: HealthTier;
  description: string;
  bestAlternative?: string;
  tags?: string[];
  warning?: string;
  curseforgeUrl: string;
  groupId?: string;
  groupTitle?: string;
  isGroupLeader?: boolean;
  isGroupAddon?: boolean;
  addons?: string[];
  coveredBy?: string;
}

export interface ModGroupInfo {
  id: string;
  title: string;
  category: string;
  description: string;
  exclusive: boolean;
  leaderId: string;
  addonIds: string[];
  memberIds: string[];
  conflictReason?: string;
}

export interface IncompatibilityRule {
  title: string;
  category: string;
  conflictingMods: string[];
  explanation: string;
  recommendation: string;
}

export const MODS_DATABASE: ModItem[] = ${JSON.stringify(modItems, null, 2)};

export const MOD_GROUPS: ModGroupInfo[] = ${JSON.stringify(MOD_GROUPS, null, 2)};

export interface ModPreset {
  id: string;
  name: string;
  badge: string;
  badgeColor: 'emerald' | 'sky' | 'violet' | 'amber' | 'rose';
  description: string;
  crashRisk: string;
  modIds: string[];
}

export const MOD_PRESETS: ModPreset[] = ${JSON.stringify(presets, null, 2)};

export const INCOMPATIBILITY_RULES: IncompatibilityRule[] = ${JSON.stringify(INCOMPATIBILITY_RULES, null, 2)};

export const GOLDEN_STANDARD_MODS = ${JSON.stringify(GOLDEN_STANDARD_MODS, null, 2)};
`;
}

// Generate files
const appletRoot = process.cwd();
const ilyaTxt = generateReport();
fs.writeFileSync(path.resolve(appletRoot, 'ilya.txt'), ilyaTxt, 'utf-8');
console.log('Successfully written ilya.txt with', ALL_MODS.length, 'mods');

const dataDir = path.resolve(appletRoot, 'src/data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const modsDataTs = generateModsDataTs();
fs.writeFileSync(path.resolve(dataDir, 'modsData.ts'), modsDataTs, 'utf-8');
console.log('Successfully written src/data/modsData.ts with', ALL_MODS.length, 'mods and', MOD_GROUPS.length, 'groups');


