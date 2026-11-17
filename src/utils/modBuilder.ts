import { MOD_GROUPS, type ModItem } from '../data/modsData.ts';
import type {
  AssemblyPreferences,
  ExcludedModNote,
  PortStrategy,
  RecipeViewerChoice,
  SmartAssemblyResult,
  SmartToggleResult,
} from './modTypes.ts';
import {
  FABRIC_TO_FORGE_SWAP,
  MOD_BY_ID,
  getDirectDependencies,
  getDualPortPairForMod,
  getModEffectivenessScore,
  getModSuperseder,
  getRuleConflictingIds,
  getTransitiveDependencies,
  isUnsupportedOnForge,
} from './modAnalyzer.ts';

export function buildSmartAssembly(prefs: AssemblyPreferences): SmartAssemblyResult {
  const anchorRaw = prefs.focusModId ? MOD_BY_ID.get(prefs.focusModId) : undefined;
  const notes: string[] = [];
  const excluded: ExcludedModNote[] = [];

  let activeAnchor: ModItem | undefined = anchorRaw;
  if (anchorRaw && isUnsupportedOnForge(anchorRaw)) {
    const swapId = FABRIC_TO_FORGE_SWAP[anchorRaw.id];
    const swapMod = swapId ? MOD_BY_ID.get(swapId) : undefined;
    if (swapMod) {
      notes.push(`Упор «${anchorRaw.name}» недоступен на Forge 1.20.1 — автоматически переключён нативный порт ${swapMod.name}.`);
      excluded.push({ name: anchorRaw.name, reason: `Fabric-оригинал заменён на порт ${swapMod.name}.` });
      activeAnchor = swapMod;
    } else {
      notes.push(`Упор «${anchorRaw.name}» несовместим с Forge 1.20.1 — упор пропущен.`);
      excluded.push({ name: anchorRaw.name, reason: anchorRaw.bestAlternative || 'Не работает на Forge 1.20.1.' });
      activeAnchor = undefined;
    }
  } else if (anchorRaw && anchorRaw.status === 'danger') {
    notes.push(`Упор «${anchorRaw.name}» заблокирован умным движком: ${anchorRaw.warning || 'плацебо или высокий риск краша'}.`);
    excluded.push({ name: anchorRaw.name, reason: anchorRaw.warning || 'Опасный или плацебо-мод.' });
    activeAnchor = undefined;
  } else if (anchorRaw && anchorRaw.coveredBy) {
    notes.push(`Упор «${anchorRaw.name}» уже встроен в ${anchorRaw.coveredBy} — использован основной лидер.`);
  }

  const portStrategy: PortStrategy =
    prefs.portStrategy ?? (prefs.allowSinytra ? 'hybrid' : 'native-forge');

  let recipeViewer: RecipeViewerChoice = prefs.recipeViewer ?? 'jei';
  if (activeAnchor) {
    if (activeAnchor.id === 'tmrv-updated' || activeAnchor.id === 'emi' || activeAnchor.recipeEcosystem === 'emi-only') {
      recipeViewer = activeAnchor.id === 'tmrv-updated' || recipeViewer === 'none' || recipeViewer === 'jei' ? 'emi' : recipeViewer;
    } else if (activeAnchor.id === 'just-enough-items-jei' || activeAnchor.recipeEcosystem === 'jei-engine') {
      recipeViewer = recipeViewer === 'emi-jei' ? 'emi-jei' : 'jei';
    } else if (activeAnchor.recipeEcosystem === 'jei-plugin' && recipeViewer === 'none') {
      recipeViewer = 'jei';
    }
  }

  const effectivePrefs: AssemblyPreferences = {
    ...prefs,
    portStrategy,
    recipeViewer,
    allowSinytra: portStrategy === 'fabric-sinytra' ? true : prefs.allowSinytra,
    focusModId: activeAnchor?.id ?? null,
  };

  let useEmberlensPipeline = false;
  if (activeAnchor) {
    const aid = activeAnchor.id;
    const anchorPair = getDualPortPairForMod(aid);
    if (aid === 'nvidium' || aid === 'nvidium-forged') {
      effectivePrefs.gpu = 'nvidia';
      effectivePrefs.allowSinytra = true;
      effectivePrefs.useShaders = false;
      if (effectivePrefs.goal === 'potato') effectivePrefs.goal = 'balanced';
      notes.push(`Упор на ${activeAnchor.name}: активирован Sinytra Connector + Embeddium + Flerovium, а шейдеры и Alloyium отключены для работы Mesh Shaders.`);
    } else if (aid === 'alloyium') {
      if (effectivePrefs.goal === 'potato') effectivePrefs.goal = 'balanced';
      notes.push('Упор на Alloyium: выбран нативный OpenGL Compute конвейер (без Nvidium). Доступно переключение на Nvidium (Fabric + Sinytra) в блоке выбора портов.');
    } else if (aid === 'emberlens' || aid === 'emberbium') {
      useEmberlensPipeline = true;
      effectivePrefs.useShaders = true;
      if (effectivePrefs.goal === 'potato') effectivePrefs.goal = 'balanced';
      notes.push(`Упор на ${activeAnchor.name}: подключена альтернативная связка Emberbium + Emberlens (вместо Embeddium + Oculus + Nvidium).`);
    } else if (aid === 'oculus' || aid === 'faster-iris-shadow-mapper') {
      effectivePrefs.useShaders = true;
      if (effectivePrefs.goal === 'potato') effectivePrefs.goal = 'balanced';
      notes.push(`Упор на ${activeAnchor.name}: включён шейдерный стек Embeddium + Oculus (Nvidium исключён).`);
    } else if (aid === 'c2me-concurrent-chunk-management-engine' || activeAnchor.platform.includes('Sinytra')) {
      effectivePrefs.allowSinytra = true;
      notes.push(`Упор на ${activeAnchor.name} (Fabric + Sinytra): подключены Sinytra Connector + Forgified Fabric API.${anchorPair?.switchableOnForge ? ` Можно в 1 клик переключить на нативный Forge-порт ${anchorPair.forgeLabel}.` : ''}`);
    } else if (aid === 'concurrent-chunk-management-engine-forge-c2me' || aid === 'c2mer' || aid === 'vmp-forge') {
      notes.push(`Упор на нативный Forge-порт ${activeAnchor.name}: Fabric-дубликаты исключены.${anchorPair?.switchableOnForge ? ` При желании можно переключить на ${anchorPair.fabricLabel}.` : ''}`);
    } else if (aid === 'pluto' || aid === 'krypton-hybrid') {
      notes.push(`Упор на сетевой стек ${activeAnchor.name}: он заменил стандартный Krypton Reno в сетевом слоте.`);
    } else if (aid === 'accelerated-rendering') {
      if (effectivePrefs.goal === 'potato') effectivePrefs.goal = 'balanced';
      notes.push('Упор на Accelerated Rendering: подключён OpenGL 4.6 GPU-инстансинг сущностей и анимаций GeckoLib.');
    } else if (aid === 'distant-horizons' || aid === 'distant-horizons-memory-fix-dh') {
      notes.push('Упор на Distant Horizons: добавлены DH Memory Fix, Noisiumed и асинхронная подгрузка чанков под сверхдальний LOD.');
    } else if (aid === 'emi' || aid === 'tmrv-updated') {
      notes.push(`Упор на ${activeAnchor.name}: включена экосистема EMI + прослойка TMRV Updated + нативные EMI-плагины.`);
    } else {
      notes.push(`Упор на мод ${activeAnchor.name}: конфликтные аналоги исключены, а недостающие зависимости подтянуты автоматически.`);
    }
  } else if (portStrategy === 'native-forge') {
    notes.push('Режим портов «Нативный Forge»: для C2ME, VMP, GPU-рендера (Alloyium) и сети выбраны прямые Forge-порты без зависимости от Sinytra Connector.');
  } else if (portStrategy === 'fabric-sinytra') {
    notes.push('Режим портов «Fabric + Sinytra»: подключены оригинальные Fabric-версии (Nvidium, C2ME, VMP) через Sinytra Connector (LTS) + Forgified Fabric API.');
  } else {
    notes.push('Режим «Гибрид (Умный баланс)»: VMP и C2ME берутся нативными Forge-портами без лишних миксинов, а для NVIDIA без шейдеров подключается Nvidium через Sinytra.');
  }

  const isPotato = effectivePrefs.goal === 'potato' || effectivePrefs.gpu === 'integrated';
  const isHeavy = effectivePrefs.goal === 'max-safe';

  const ids = new Set<string>([
    'embeddium',
    'sodium-chloride',
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
    'noisiumed',
    'ixeris',
    'dynamic-fps',
    'packet-fixer',
    'fastvancements',
    'clumps',
    'let-me-despawn',
    'cloth-config-v12',
    'matlib',
  ]);

  if (recipeViewer === 'jei') {
    ids.add('just-enough-items-jei');
    ids.add('jei-emi-optimizations');
    ids.add('fast-recipe-search');
    if (isHeavy) {
      ids.add('jeioptimizer');
      ids.add('just-enough-freezes');
      ids.add('just-enough-threads');
    }
    notes.push('Просмотрщик рецептов: Just Enough Items (JEI) + JEI/EMI Optimizations' + (isHeavy ? ' + многопоточная индексация JEI.' : '.'));
    excluded.push({ name: 'EMI / TMRV Updated / EMI Loot', reason: 'Отключены, так как выбран классический режим JEI.' });
  } else if (recipeViewer === 'emi') {
    ids.add('emi');
    ids.add('tmrv-updated');
    ids.add('jei-emi-optimizations');
    ids.add('fast-recipe-search');
    if (isHeavy) {
      ids.add('emi-loot');
      ids.add('emi-ores');
      ids.add('emiffect');
      ids.add('emi-professions');
    }
    notes.push('Просмотрщик рецептов: EMI + прослойка TMRV Updated (запускает плагины JEI внутри EMI без самого JEI).');
    excluded.push({ name: 'Just Enough Items (JEI) + JEIOptimizer / Threads', reason: 'Заменены на EMI + TMRV Updated.' });
    if (isHeavy) {
      excluded.push({ name: 'JER / JEP / JEED', reason: 'Полностью перекрыты более быстрыми нативными EMI-плагинами (EMI Loot + EMI Ores, EMI Professions, EMIffect).' });
    }
  } else if (recipeViewer === 'emi-jei') {
    ids.add('emi');
    ids.add('just-enough-items-jei');
    ids.add('jei-emi-optimizations');
    ids.add('fast-recipe-search');
    if (isHeavy) {
      ids.add('emi-loot');
      ids.add('emi-ores');
      ids.add('emiffect');
      ids.add('emi-professions');
      ids.add('jeioptimizer');
      ids.add('just-enough-freezes');
      ids.add('just-enough-threads');
    }
    notes.push('Режим EMI + JEI: работают оба просмотрщика (прослойка TMRV Updated отключена, так как EMI нативно подхватывает установленный JEI).');
    excluded.push({ name: 'TMRV Updated', reason: 'Конфликтует с JEI — не нужен при совместной установке EMI + JEI.' });
  } else {
    excluded.push({ name: 'JEI / EMI и их плагины', reason: 'Просмотрщик рецептов отключён в настройках сборки.' });
  }

  if (effectivePrefs.mode === 'hybrid-server') {
    ids.add('krypton-hybrid');
    ids.add('connectivity');
    ids.add('servercore');
    notes.push('Выбран Krypton Hybrid (сжатие Zstd и фиксы для гибридных серверов Mohist/Arclight) вместо Krypton Reno.');
    excluded.push({ name: 'Krypton Reno', reason: 'Заменён на Krypton Hybrid для совместимости с гибрид-ядром.' });
  } else {
    ids.add('krypton-reno');
    if (effectivePrefs.mode === 'server') {
      ids.add('servercore');
      ids.add('connectivity');
      ids.add('fast-ip-ping');
      ids.add('spark');
      if (!effectivePrefs.allowSinytra && isHeavy) {
        ids.add('vmp-forge');
      }
      notes.push('Для сетевой игры добавлены ServerCore, Connectivity, Fast IP Ping и Spark.');
    } else {
      ids.add('smooth-boot-reloaded');
      notes.push('Для одиночной игры добавлен Smooth Boot (Reloaded) для безопасного распределения потоков CPU без поломки спавн-чанков.');
    }
  }

  if (isHeavy) {
    [
      'duplicate-nbt-flattener',
      'capability-fix-revived',
      'structure-dfu-cache',
      'structure-layout-optimizer',
      'broken-tag-fixer',
      'stutterfix-reforged',
      'threadtweak-reforged',
      'smooth-boot-reloaded',
      'lightspeedre',
      'language-reload-reforged',
      'fastsuite',
      'fastfurnace',
      'fastworkbench',
      'fast-item-frames',
      'sodium-chloride',
      'flerovium',
      'better-biome-reblend',
      'kerria',
      'servercore',
      'immersive-optimization',
      'alternate-current',
      'entity-collision-optimization',
      'villager-optimizer',
      'falling-blocks-fps-fix',
      'restmode',
      'particle-core',
      'kotlin-for-forge',
      'fzzy-config',
      'fast-sounds',
      'soundgc',
      'reload-looping-sound-fix',
      'connectivity',
      'cupboard',
      'geckolib-animation-optimizer',
      'async-screenshot',
    ].forEach(id => ids.add(id));
    notes.push('Для максимальной сборки подключены кеш рецептов FastSuite/Furnace/Workbench, Structure DFU Cache и потоковые фиксы.');
  } else {
    excluded.push({ name: 'FastSuite / FastFurnace / FastWorkbench', reason: 'Не требуются в лёгкой сборке (лишняя зависимость Placebo).' });
  }

  const anchorForcesAlloyium = activeAnchor?.id === 'alloyium' || activeAnchor?.id === 'revidium-accedium';
  const anchorForcesNvidium = activeAnchor?.id === 'nvidium' || activeAnchor?.id === 'nvidium-forged';
  const useNvidium =
    !useEmberlensPipeline &&
    !anchorForcesAlloyium &&
    (anchorForcesNvidium ||
      (effectivePrefs.allowSinytra &&
        portStrategy !== 'native-forge' &&
        effectivePrefs.gpu === 'nvidia' &&
        !effectivePrefs.useShaders &&
        !isPotato));

  if (useEmberlensPipeline) {
    ids.add('emberbium');
    ids.add('emberlens');
    ids.add('flywheel');
    ids.add('vanillin');
    excluded.push({
      name: 'Embeddium + Oculus + Alloyium + Nvidium',
      reason: 'Заменены на альтернативный шейдерный стек Emberbium + Emberlens.',
    });
  } else if (isPotato && !anchorForcesAlloyium) {
    ids.add('amd-fsr-upscaler-render-scale-for-embeddium');
    ids.add('restmode');
    ids.add('particle-core');
    ids.add('kotlin-for-forge');
    ids.add('fzzy-config');
    ids.add('fast-sounds');
    ids.add('dynamicrenderdistance');
    notes.push('Режим слабой графики: добавлены AMD FSR апскейлер, проверенная динамическая дальность DynamicRenderDistance, RestMode и оптимизатор частиц (без дубля PartiCull).');
    excluded.push({ name: 'FastBoot / Accelerated Rendering / Alloyium', reason: 'FastBoot уже встроен в ModernFix, а Compute Shaders могут перегружать слабую GPU и активно расходовать VRAM.' });
  } else if (!useNvidium) {
    ids.add('alloyium');
    if (effectivePrefs.goal === 'max-safe' || activeAnchor?.id === 'accelerated-rendering') {
      ids.add('accelerated-rendering');
      notes.push('Для дискретной GPU добавлены Alloyium, Flerovium и Accelerated Rendering (OpenGL 4.6 — расходует больше VRAM GPU, при нехватке видеопамяти уберите).');
    } else {
      notes.push('Добавлен Alloyium (нативный Compute-аддон к Embeddium для любых видеокарт без Sinytra).');
    }
  } else {
    ids.add('flerovium');
    excluded.push({ name: 'Alloyium', reason: 'Заменён на Nvidium (оба мода перехватывают GPU-рендер чанков Embeddium).' });
  }

  if (!useEmberlensPipeline && effectivePrefs.useShaders && effectivePrefs.goal !== 'potato') {
    ids.add('oculus');
    ids.add('faster-iris-shadow-mapper');
    ids.add('gputape');
    notes.push('Активированы шейдеры: Oculus + Faster Iris Shadow Mapper + GPUTape (стандартный стек на Embeddium).');
    excluded.push({ name: 'Emberlens', reason: 'Форк Oculus, требующий Emberbium вместо Embeddium (исключён во избежание конфликта).' });
    if (effectivePrefs.allowSinytra) {
      excluded.push({ name: 'Nvidium', reason: 'Жёсткий конфликт с буферами шейдеров Oculus (исключён автоматически).' });
    }
  } else if (effectivePrefs.useShaders && effectivePrefs.goal === 'potato') {
    excluded.push({ name: 'Oculus и шейдеры', reason: 'Пропущены, так как выбрана цель «Слабый ПК».' });
  }

  if (effectivePrefs.useCreate) {
    ids.add('flywheel');
    ids.add('vanillin');
    ids.add('immersive-optimization');
    ids.add('alternate-current');
    ids.add('entity-collision-optimization');
    ids.add('observable');
    notes.push('Для Create/индустрии добавлены Flywheel, Vanillin, Alternate Current, Immersive Optimization и Observable.');
  }

  const useFabricC2ME =
    effectivePrefs.allowSinytra &&
    activeAnchor?.id !== 'concurrent-chunk-management-engine-forge-c2me' &&
    activeAnchor?.id !== 'c2mer' &&
    (activeAnchor?.id === 'c2me-concurrent-chunk-management-engine' || portStrategy === 'fabric-sinytra');

  const useNativeC2MEF =
    !useFabricC2ME &&
    activeAnchor?.id !== 'c2me-concurrent-chunk-management-engine' &&
    (activeAnchor?.id === 'concurrent-chunk-management-engine-forge-c2me' ||
      (!isPotato && (isHeavy || portStrategy === 'native-forge' || effectivePrefs.allowSinytra)));

  const useFabricVMP =
    effectivePrefs.allowSinytra &&
    activeAnchor?.id !== 'vmp-forge' &&
    (activeAnchor?.id === 'very-many-players-vmp' || (portStrategy === 'fabric-sinytra' && effectivePrefs.mode !== 'singleplayer' && isHeavy));

  if (useFabricC2ME) {
    ids.add('c2me-concurrent-chunk-management-engine');
    excluded.push({ name: 'C2ME-Forge (C2MEF)', reason: 'Выбран оригинальный Fabric C2ME через Sinytra Connector.' });
  } else if (useNativeC2MEF) {
    ids.add('concurrent-chunk-management-engine-forge-c2me');
    if (effectivePrefs.allowSinytra) {
      excluded.push({ name: 'C2ME (Fabric)', reason: 'Заменён на нативный C2ME-Forge (C2MEF) во избежание конфликтов шины событий.' });
    }
  }

  if (useFabricVMP) {
    ids.add('very-many-players-vmp');
    ids.delete('vmp-forge');
    excluded.push({ name: 'Very Many Players (Forge)', reason: 'Выбрана Fabric-версия VMP через Sinytra Connector.' });
  } else if (effectivePrefs.mode !== 'singleplayer' && isHeavy) {
    ids.add('vmp-forge');
    if (effectivePrefs.allowSinytra) {
      excluded.push({ name: 'VMP (Fabric)', reason: 'Выбран нативный VMP (Forge) без конфликтов миксинов через Sinytra.' });
    }
  }

  if (effectivePrefs.allowSinytra) {
    const needsSinytraBridge =
      useNvidium ||
      useFabricC2ME ||
      useFabricVMP ||
      Boolean(activeAnchor?.platform.includes('Sinytra'));

    if (needsSinytraBridge || portStrategy === 'fabric-sinytra') {
      ids.add('sinytra-connector');
      ids.add('forgified-fabric-api');
      ids.add('connector-extras');
    }

    if (useNvidium) {
      ids.add('nvidium');
      notes.push('Через Sinytra подключён Nvidium (RTX/GTX 16xx+). В connector.json добавьте алиас "embeddium": "sodium" (или Nvidium Forged).');
    } else if (activeAnchor?.id !== 'bobby-reforged') {
      ids.add('distant-horizons');
      ids.add('distant-horizons-memory-fix-dh');
      if (portStrategy === 'native-forge' && effectivePrefs.gpu === 'nvidia' && !effectivePrefs.useShaders && !isPotato) {
        excluded.push({ name: 'Nvidium', reason: 'Отключён из-за приоритета «Нативный Forge» (используется Alloyium + Distant Horizons).' });
      } else if (effectivePrefs.gpu !== 'nvidia') {
        excluded.push({ name: 'Nvidium', reason: 'Требует видеокарту NVIDIA (GTX 16xx / RTX 20xx+), заменён на Alloyium + Distant Horizons.' });
      } else if (isPotato) {
        excluded.push({ name: 'Nvidium', reason: 'Для слабого ПК вместо Mesh Shaders подключён Distant Horizons.' });
      }
      notes.push('Подключён Distant Horizons (безопасный LOD на любой GPU и совместим с шейдерами).');
    }
  } else {
    excluded.push({ name: 'Nvidium / C2ME (Fabric) / VMP (Fabric)', reason: 'Прослойка Sinytra Connector выключена — сборка на 100% нативном Forge.' });
  }

  if (activeAnchor && !activeAnchor.coveredBy) {
    for (const cid of getRuleConflictingIds(activeAnchor.id)) {
      if (ids.delete(cid)) {
        const cname = MOD_BY_ID.get(cid)?.name || cid;
        if (!excluded.some(e => e.name === cname)) {
          excluded.push({ name: cname, reason: `Заменён из-за упора сборки на ${activeAnchor.name}.` });
        }
      }
    }

    ids.add(activeAnchor.id);
    for (const depId of getTransitiveDependencies(activeAnchor.id)) {
      for (const depConflict of getRuleConflictingIds(depId)) {
        if (ids.delete(depConflict)) {
          const cname = MOD_BY_ID.get(depConflict)?.name || depConflict;
          if (!excluded.some(e => e.name === cname)) {
            excluded.push({ name: cname, reason: `Конфликтует с зависимостью упора (${MOD_BY_ID.get(depId)?.name || depId}).` });
          }
        }
      }
      ids.add(depId);
    }

    let cascadeChanged = true;
    while (cascadeChanged) {
      cascadeChanged = false;
      for (const id of Array.from(ids)) {
        if (getDirectDependencies(id).some(d => !ids.has(d))) {
          ids.delete(id);
          cascadeChanged = true;
        }
      }
    }
  }

  excluded.push(
    { name: 'OptiFine / Xenon / Rubidium', reason: 'Конфликтуют с базовым рендерером.' },
    { name: 'Lithium / Krypton / Indium / DashLoader', reason: 'Fabric-оригиналы заменены на нативные порты Forge (Radium Re-Reforged, Krypton Reno/Hybrid/Pluto, ModernFix).' }
  );

  const cleaned = smartFixAssembly(Array.from(ids), effectivePrefs);
  return { modIds: cleaned, notes, excluded };
}

export function smartFixAssembly(selectedIds: string[], prefs?: AssemblyPreferences): string[] {
  const next = new Set(selectedIds);
  const focusId = prefs?.focusModId || null;

  for (const id of Array.from(next)) {
    const mod = MOD_BY_ID.get(id);
    if (!mod) {
      next.delete(id);
      continue;
    }
    if (isUnsupportedOnForge(mod)) {
      next.delete(id);
      const swap = FABRIC_TO_FORGE_SWAP[id];
      if (swap) next.add(swap);
      continue;
    }
    if (mod.status === 'danger' || mod.coveredBy) {
      next.delete(id);
      continue;
    }
  }

  for (const g of MOD_GROUPS) {
    if (!g.exclusive) continue;
    const addonSet = new Set(g.addonIds);
    const pool = g.memberIds.filter(id => !addonSet.has(id));
    const chosen = pool.filter(id => next.has(id));
    if (chosen.length > 1) {
      chosen.sort((a, b) => {
        if (focusId && a === focusId) return -1;
        if (focusId && b === focusId) return 1;
        if (a === g.leaderId) return -1;
        if (b === g.leaderId) return 1;
        return getModEffectivenessScore(MOD_BY_ID.get(b)!) - getModEffectivenessScore(MOD_BY_ID.get(a)!);
      });
      chosen.slice(1).forEach(id => next.delete(id));
    }
  }

  if (next.has('nvidium') && next.has('oculus')) {
    if (focusId === 'nvidium' || focusId === 'nvidium-forged') next.delete('oculus');
    else if (focusId === 'oculus') next.delete('nvidium');
    else next.delete(prefs?.useShaders ? 'nvidium' : 'oculus');
  }
  if (next.has('nvidium') && next.has('emberlens')) {
    if (focusId === 'nvidium' || focusId === 'nvidium-forged') next.delete('emberlens');
    else if (focusId === 'emberlens' || focusId === 'emberbium') next.delete('nvidium');
    else next.delete(prefs?.useShaders ? 'nvidium' : 'emberlens');
  }
  if (next.has('nvidium') && next.has('alloyium')) {
    if (focusId === 'alloyium') {
      next.delete('nvidium');
    } else if (focusId === 'nvidium' || focusId === 'nvidium-forged') {
      next.delete('alloyium');
    } else {
      const keepNvidium =
        prefs?.gpu === 'nvidia' &&
        !prefs?.useShaders &&
        prefs?.allowSinytra !== false &&
        prefs?.portStrategy !== 'native-forge';
      next.delete(keepNvidium ? 'alloyium' : 'nvidium');
    }
  }
  if (next.has('nvidium') && next.has('revidium-accedium')) {
    next.delete(focusId === 'revidium-accedium' ? 'nvidium' : 'revidium-accedium');
  }
  if (next.has('oculus') && next.has('emberlens')) {
    if (focusId === 'emberlens' || focusId === 'emberbium' || (next.has('emberbium') && !next.has('embeddium'))) {
      next.delete('oculus');
    } else {
      next.delete('emberlens');
    }
  }
  if (next.has('c2me-concurrent-chunk-management-engine') && next.has('concurrent-chunk-management-engine-forge-c2me')) {
    if (focusId === 'concurrent-chunk-management-engine-forge-c2me') {
      next.delete('c2me-concurrent-chunk-management-engine');
    } else if (focusId === 'c2me-concurrent-chunk-management-engine') {
      next.delete('concurrent-chunk-management-engine-forge-c2me');
    } else if (prefs?.portStrategy === 'fabric-sinytra') {
      next.delete('concurrent-chunk-management-engine-forge-c2me');
    } else {
      next.delete('c2me-concurrent-chunk-management-engine');
    }
  }
  if (next.has('c2mer') && (next.has('c2me-concurrent-chunk-management-engine') || next.has('concurrent-chunk-management-engine-forge-c2me'))) {
    if (focusId === 'c2mer') {
      next.delete('c2me-concurrent-chunk-management-engine');
      next.delete('concurrent-chunk-management-engine-forge-c2me');
    } else {
      next.delete('c2mer');
    }
  }
  if (next.has('vmp-forge') && next.has('very-many-players-vmp')) {
    if (focusId === 'very-many-players-vmp') next.delete('vmp-forge');
    else if (focusId === 'vmp-forge') next.delete('very-many-players-vmp');
    else if (prefs?.portStrategy === 'fabric-sinytra') next.delete('vmp-forge');
    else next.delete('very-many-players-vmp');
  }
  if (next.has('noisiumed') && next.has('noisium')) {
    next.delete(focusId === 'noisium' ? 'noisiumed' : 'noisium');
  }
  if (next.has('modernfix') && next.has('dashloader')) {
    next.delete('dashloader');
  }
  if (next.has('jasione') && next.has('redirected')) next.delete('redirected');
  if (next.has('jasione') && next.has('redirector-modern')) next.delete('redirector-modern');
  if (next.has('krypton-hybrid') && next.has('aegisnetworking-krypton-hybrid')) {
    next.delete(focusId === 'aegisnetworking-krypton-hybrid' ? 'krypton-hybrid' : 'aegisnetworking-krypton-hybrid');
  }
  if (next.has('tmrv-updated') && next.has('just-enough-items-jei')) {
    if (focusId === 'tmrv-updated') next.delete('just-enough-items-jei');
    else if (focusId === 'just-enough-items-jei') next.delete('tmrv-updated');
    else if (prefs?.recipeViewer === 'emi') next.delete('just-enough-items-jei');
    else next.delete('tmrv-updated');
  }
  if (next.has('accelerated-rendering') && next.has('accelerated-rendering-turned')) {
    next.delete(focusId === 'accelerated-rendering-turned' ? 'accelerated-rendering' : 'accelerated-rendering-turned');
  }

  for (const id of Array.from(next)) {
    if (focusId && id === focusId) continue;
    const mod = MOD_BY_ID.get(id);
    if (!mod) continue;
    const sup = getModSuperseder(mod, next, prefs, false);
    if (sup?.isActiveInSelection) {
      next.delete(id);
    }
  }

  let pruneOrphans = true;
  while (pruneOrphans) {
    pruneOrphans = false;
    for (const id of Array.from(next)) {
      const deps = getDirectDependencies(id, next);
      if (deps.some(d => !next.has(d) && getRuleConflictingIds(d).some(c => next.has(c)))) {
        next.delete(id);
        pruneOrphans = true;
      }
    }
  }

  for (const id of Array.from(next)) {
    for (const dep of getTransitiveDependencies(id, new Set(), next)) {
      if (!getRuleConflictingIds(dep).some(c => next.has(c))) {
        next.add(dep);
      }
    }
  }

  return Array.from(next);
}

export function toggleModSmart(
  currentIds: string[],
  modId: string,
  options: { strict: boolean; prefs?: AssemblyPreferences }
): SmartToggleResult {
  const mod = MOD_BY_ID.get(modId);
  if (!mod) return { nextIds: currentIds, notice: null, noticeTone: 'info' };

  const currentSet = new Set(currentIds);

  if (currentSet.has(modId)) {
    const next = new Set(currentIds);
    next.delete(modId);

    if (!options.strict) {
      return { nextIds: Array.from(next), notice: null, noticeTone: 'info' };
    }

    const removedDependents: string[] = [];
    let changed = true;
    while (changed) {
      changed = false;
      for (const id of Array.from(next)) {
        const depMod = MOD_BY_ID.get(id);
        const deps = getDirectDependencies(id, next);
        const pluginLostAllHosts =
          depMod?.recipeEcosystem === 'jei-plugin' &&
          !next.has('just-enough-items-jei') &&
          !(next.has('emi') && next.has('tmrv-updated'));
        if (deps.some(d => !next.has(d)) || pluginLostAllHosts) {
          next.delete(id);
          removedDependents.push(depMod?.name || id);
          changed = true;
        }
      }
    }

    return {
      nextIds: Array.from(next),
      notice:
        removedDependents.length > 0
          ? `Убран ${mod.name} и зависимые от него моды: ${removedDependents.join(', ')}.`
          : null,
      noticeTone: 'info',
    };
  }

  if (!options.strict) {
    return { nextIds: [...currentIds, modId], notice: null, noticeTone: 'info' };
  }

  if (mod.status === 'danger') {
    return {
      nextIds: currentIds,
      notice: `${mod.name} заблокирован умной защитой: ${mod.warning || 'плацебо или высокий риск краша'}. Отключите режим 1-слота для ручного теста.`,
      noticeTone: 'warn',
    };
  }

  if (isUnsupportedOnForge(mod)) {
    const swapId = FABRIC_TO_FORGE_SWAP[mod.id];
    if (swapId && MOD_BY_ID.has(swapId)) {
      const swapped = toggleModSmart(currentIds, swapId, options);
      const swapName = MOD_BY_ID.get(swapId)!.name;
      return {
        nextIds: swapped.nextIds,
        notice: `${mod.name} не работает на Forge 1.20.1 — автоматически подключён Forge-порт ${swapName}.`,
        noticeTone: 'info',
      };
    }
    return {
      nextIds: currentIds,
      notice: `${mod.name} не работает на Forge 1.20.1 (${mod.bestAlternative || 'несовместим даже через Sinytra'}).`,
      noticeTone: 'warn',
    };
  }

  if (mod.coveredBy) {
    return {
      nextIds: currentIds,
      notice: `${mod.name} не нужен — его функции уже встроены в ${mod.coveredBy}.`,
      noticeTone: 'warn',
    };
  }

  const next = new Set(currentIds);
  const removedNames: string[] = [];
  const addedDeps: string[] = [];

  const conflictingIds = getRuleConflictingIds(modId);
  for (const cid of conflictingIds) {
    if (next.has(cid)) {
      next.delete(cid);
      removedNames.push(MOD_BY_ID.get(cid)?.name || cid);
    }
  }

  next.add(modId);
  for (const depId of getTransitiveDependencies(modId, new Set(), next)) {
    if (!next.has(depId)) {
      for (const depConflict of getRuleConflictingIds(depId)) {
        if (next.has(depConflict)) {
          next.delete(depConflict);
          removedNames.push(MOD_BY_ID.get(depConflict)?.name || depConflict);
        }
      }
      next.add(depId);
      addedDeps.push(MOD_BY_ID.get(depId)?.name || depId);
    }
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const id of Array.from(next)) {
      if (getDirectDependencies(id, next).some(d => !next.has(d))) {
        next.delete(id);
        removedNames.push(MOD_BY_ID.get(id)?.name || id);
        changed = true;
      }
    }
  }

  const parts: string[] = [];
  if (addedDeps.length > 0) parts.push(`добраны зависимости: ${addedDeps.join(', ')}`);
  if (removedNames.length > 0) parts.push(`заменены конфликтные: ${removedNames.join(', ')}`);

  return {
    nextIds: Array.from(next),
    notice: parts.length > 0 ? `${mod.name} выбран — ${parts.join('; ')}.` : null,
    noticeTone: 'info',
  };
}

export function removeModsCascade(currentIds: string[], removeIds: string[]): { nextIds: string[]; cascadedNames: string[] } {
  const next = new Set(currentIds);
  for (const rid of removeIds) {
    next.delete(rid);
  }
  const cascadedNames: string[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of Array.from(next)) {
      if (getDirectDependencies(id, next).some(d => !next.has(d))) {
        next.delete(id);
        cascadedNames.push(MOD_BY_ID.get(id)?.name || id);
        changed = true;
      }
    }
  }
  return { nextIds: Array.from(next), cascadedNames };
}
