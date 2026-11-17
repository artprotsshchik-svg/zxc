import {
  MODS_DATABASE,
  MOD_GROUPS,
  INCOMPATIBILITY_RULES,
  type ModItem,
} from '../data/modsData.ts';
import type {
  AssemblyPreferences,
  CheckerTier,
  ConflictDetection,
  DependencyWarning,
  DiagnosticIssue,
  DualPortPair,
  MissingSlotWarning,
  RecipeBridgeStatus,
  SupersederInfo,
} from './modTypes.ts';

export const MOD_BY_ID = new Map<string, ModItem>(MODS_DATABASE.map(m => [m.id, m]));
export const GROUP_BY_ID = new Map(MOD_GROUPS.map(g => [g.id, g]));

export function normalizeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function computeEffectivenessScore(mod: ModItem): number {
  let score = 0;
  if (mod.isGroupLeader) score += 500;
  if (mod.isGroupAddon) score += 250;
  if (mod.installed) score += 120;
  switch (mod.status) {
    case 'recommended':
      score += 1000;
      break;
    case 'useful':
      score += 600;
      break;
    case 'diagnostic':
      score += 350;
      break;
    case 'redundant':
      score += 100;
      break;
    case 'outdated':
      score += 50;
      break;
    case 'danger':
      score -= 800;
      break;
  }
  if (mod.coveredBy) score -= 220;
  if (mod.platform.includes('Несовм.') || mod.platform.includes('Fabric (Справка')) score -= 600;
  return score;
}

const MOD_SCORE_BY_ID = new Map<string, number>();
const MOD_SLUG_BY_ID = new Map<string, string>();
const MOD_BY_SLUG = new Map<string, ModItem>();
const MOD_BY_LOWER_NAME = new Map<string, ModItem>();
const MOD_COVERED_BY_LOWER = new Map<string, string>();

interface SearchIndexEntry {
  mod: ModItem;
  nameLower: string;
  slug: string;
  tagsLower: string;
  descLower: string;
  groupTitleLower: string;
  groupDescLower: string;
  altLower: string;
  tagsWords: string[];
  descWords: string[];
  altWords: string[];
  groupDescWords: string[];
  groupTitleWords: string[];
  wordsSet: Set<string>;
  wordsList: string[];
  allText: string;
}

const SEARCH_INDEX: SearchIndexEntry[] = [];

function extractWords(text: string): string[] {
  return text ? text.toLowerCase().split(/[^a-zа-яё0-9]+/i).filter(Boolean) : [];
}

for (const m of MODS_DATABASE) {
  MOD_SCORE_BY_ID.set(m.id, computeEffectivenessScore(m));
  const slug = normalizeSlug(m.name);
  MOD_SLUG_BY_ID.set(m.id, slug);
  if (slug && !MOD_BY_SLUG.has(slug)) MOD_BY_SLUG.set(slug, m);
  const nameLower = m.name.toLowerCase();
  if (!MOD_BY_LOWER_NAME.has(nameLower)) MOD_BY_LOWER_NAME.set(nameLower, m);
  if (m.coveredBy) MOD_COVERED_BY_LOWER.set(m.id, m.coveredBy.toLowerCase());

  const grp = m.groupId ? GROUP_BY_ID.get(m.groupId) : undefined;
  const tagsLower = (m.tags || []).join(' ').toLowerCase();
  const descLower = m.description.toLowerCase();
  const groupTitleLower = `${m.groupTitle || ''} ${m.category}`.toLowerCase();
  const groupDescLower = (grp?.description || '').toLowerCase();
  const altLower = `${m.bestAlternative || ''} ${m.warning || ''} ${m.platform}`.toLowerCase();
  const allText = `${nameLower} ${tagsLower} ${descLower} ${altLower} ${groupTitleLower} ${groupDescLower}`;
  const tagsWords = extractWords(tagsLower);
  const descWords = extractWords(descLower);
  const altWords = extractWords(altLower);
  const groupDescWords = extractWords(groupDescLower);
  const groupTitleWords = extractWords(groupTitleLower);
  const words = extractWords(allText);

  SEARCH_INDEX.push({
    mod: m,
    nameLower,
    slug,
    tagsLower,
    descLower,
    groupTitleLower,
    groupDescLower,
    altLower,
    tagsWords,
    descWords,
    altWords,
    groupDescWords,
    groupTitleWords,
    wordsSet: new Set(words),
    wordsList: Array.from(new Set(words)),
    allText,
  });
}

export function isUnsupportedOnForge(mod: ModItem): boolean {
  return mod.platform.includes('Несовм.') || mod.platform.includes('Fabric (Справка');
}

export const MOD_HARD_DEPENDENCIES: Record<string, string[]> = {
  'embeddium-extras': ['embeddium'],
  'sodium-chloride': ['embeddium'],
  'alloyium': ['embeddium'],
  'oculus': ['embeddium'],
  'lightstar': ['embeddium'],
  'amd-fsr-upscaler-render-scale-for-embeddium': ['embeddium'],
  'faster-iris-shadow-mapper': ['embeddium', 'oculus'],
  'sodium-embeddium-dynamic-lights': ['sodium-embeddium-options-api'],
  'emberlens': ['emberbium'],
  'vanillin': ['flywheel'],
  'distant-horizons-memory-fix-dh': ['distant-horizons'],
  'nvidium': ['sinytra-connector', 'forgified-fabric-api'],
  'nvidium-forged': ['nvidium', 'sinytra-connector', 'forgified-fabric-api'],
  'c2me-concurrent-chunk-management-engine': ['sinytra-connector', 'forgified-fabric-api'],
  'voxy': ['sinytra-connector', 'forgified-fabric-api', 'embeddium'],
  'very-many-players-vmp': ['sinytra-connector', 'forgified-fabric-api'],
  'connector-extras': ['sinytra-connector'],
  'particle-core': ['kotlin-for-forge', 'fzzy-config'],
  'fzzy-config': ['kotlin-for-forge'],
  'enhanced-block-entities-reloaded': ['matlib'],
  'connectivity': ['cupboard'],
  'fastali': ['advanced-loot-info-ali'],
  'tmrv-updated': ['emi'],
  'emi-loot': ['emi'],
  'emi-ores': ['emi'],
  'emiffect': ['emi'],
  'emi-trades': ['emi'],
  'emi-professions': ['emi'],
  'jeioptimizer': ['just-enough-items-jei'],
  'just-enough-freezes': ['just-enough-items-jei'],
  'just-enough-threads': ['just-enough-items-jei'],
  'jeir-jei-rewired': ['just-enough-items-jei'],
};

export const MOD_ALTERNATIVE_DEPENDENCIES: Record<string, string[][]> = {
  'gputape': [['embeddium', 'emberbium']],
  'nvidium': [['embeddium', 'emberbium']],
  'nvidium-forged': [['embeddium', 'emberbium']],
  'flerovium': [['embeddium', 'emberbium']],
  'sodium-embeddium-options-api': [['embeddium', 'emberbium']],
  'sodium-embeddium-dynamic-lights': [['embeddium', 'emberbium']],
  'accelerated-rendering': [['embeddium', 'emberbium']],
};

export function findModByDisplayName(name: string): ModItem | undefined {
  const trimmed = name.trim();
  if (!trimmed) return undefined;
  const exactLower = MOD_BY_LOWER_NAME.get(trimmed.toLowerCase());
  if (exactLower) return exactLower;
  const byId = MOD_BY_ID.get(trimmed.toLowerCase());
  if (byId) return byId;
  const target = normalizeSlug(trimmed);
  if (!target) return undefined;
  const exact = MOD_BY_SLUG.get(target);
  if (exact) return exact;
  for (const m of MODS_DATABASE) {
    const ms = MOD_SLUG_BY_ID.get(m.id) || '';
    if (ms.startsWith(target)) return m;
  }
  return undefined;
}

const PURPOSE_SYNONYMS: Array<[RegExp, string[]]> = [
  [/^(фпс|fps|кадр|кадры|кадров|производ)/i, ['fps', 'render', 'рендер', 'culling', 'куллинг', 'чанк']],
  [/^(озу|рам|ram|память|памяти|оператив)/i, ['ram', 'память', 'памяти', 'memory', 'утечк', 'leak', 'dedup', 'дедуплик']],
  [/^(утечк|leak|утечки)/i, ['утечк', 'leak', 'memory', 'память', 'памяти', 'alltheleaks']],
  [/^(лаг|лаги|лагов|фриз|фризы|фризов|статтер|подвис|микрофриз|tps|тпс|тик)/i, ['tps', 'stutter', 'фриз', 'лаг', 'тиках', 'физик', 'radium', 'spark', 'профил']],
  [/^(моб|мобы|мобов|существ|сущност|entity|entities|животн|жител)/i, ['entity', 'entities', 'моб', 'сущност', 'ии', 'ai', 'villager', 'жител', 'culling']],
  [/^(ии|ai|интеллект|мозг)/i, ['ai', 'brain', 'ии', 'моб', 'сущност', 'radium', 'villager']],
  [/^(тен|тени|теней|shadow)/i, ['shadow', 'тени', 'теней', 'тень', 'iris', 'oculus']],
  [/^(свет|света|освещ|ярк|light|fullbright)/i, ['light', 'освещ', 'свет', 'dynamic', 'solix', 'lightstar', 'fullbright']],
  [/^(шейдер|шейдеры|шейдеров|shader)/i, ['shader', 'шейдер', 'oculus', 'iris', 'emberlens', 'dlss']],
  [/^(чанк|чанки|чанков|chunk|прогруз)/i, ['chunk', 'чанк', 'c2me', 'noisium', 'render', 'прогруз']],
  [/^(дальност|прорисов|лод|lod|distance)/i, ['distance', 'дальност', 'lod', 'distant', 'horizons', 'voxy', 'nvidium', 'bobby']],
  [/^(звук|звуки|звука|аудио|sound|audio)/i, ['sound', 'звук', 'аудио', 'audio']],
  [/^(сет|сеть|сети|пинг|ping|пакет|netty|сервер|онлайн|мультиплеер)/i, ['network', 'netty', 'сеть', 'сетев', 'пинг', 'ping', 'packet', 'пакет', 'krypton', 'server']],
  [/^(частиц|частицы|particle|эффект)/i, ['particle', 'частиц', 'эффект']],
  [/^(рецепт|рецепты|крафт|верстак|печк|jei|emi)/i, ['recipe', 'рецепт', 'крафт', 'jei', 'emi', 'workbench', 'furnace', 'tmrv']],
  [/^(шрифт|шрифты|текст|интерфейс|меню|f3|hud|gui|ui)/i, ['font', 'шрифт', 'ui', 'gui', 'f3', 'immediatelyfast', 'hud', 'меню']],
  [/^(генер|мир|структур|биом|шум|worldgen)/i, ['worldgen', 'генерац', 'структур', 'биом', 'biome', 'noise', 'шум', 'noisium']],
  [/^(запуск|загруз|старт|boot|load)/i, ['boot', 'load', 'запуск', 'загруз', 'smooth', 'modernfix']],
  [/^(редстоун|механизм|воронк|create|криейт)/i, ['redstone', 'редстоун', 'create', 'flywheel', 'воронк', 'radium']],
  [/^(сундук|таблич|рамк|печ|chest|block\s*entit)/i, ['chest', 'сундук', 'таблич', 'рамк', 'block', 'entity', 'eber', 'enhanced']],
  [/^(опыт|предмет|дроп|лут|clumps|xp|item)/i, ['item', 'xp', 'опыт', 'clumps', 'предмет', 'дроп', 'despawn']],
  [/^(профайл|диагност|монитор|spark|тпс)/i, ['spark', 'observable', 'profiler', 'профил', 'диагност', 'лаг']],
  [/^(бэкап|сохран|zstd|backup)/i, ['backup', 'бэкап', 'сохран', 'zstd']],
  [/^(апскейл|fsr|dlss|масштаб|разрешен)/i, ['fsr', 'upscal', 'dlss', 'апскейл', 'масштаб']],
];

function stemRuWord(word: string): string {
  if (word.length < 4 || !/^[а-яё]+$/i.test(word)) return word;
  const stripped = word.replace(
    /(иями|ями|ами|ого|его|ому|ему|ыми|ими|ость|ение|ание|ция|ции|ов|ев|ей|ам|ям|ах|ях|ом|ем|ой|ий|ый|ая|ое|ые|ие|ую|юю|у|ю|а|я|е|и|ы|о)$/i,
    ''
  );
  return stripped.length >= 3 ? stripped : word.slice(0, Math.max(3, word.length - 1));
}

function getExpandedTerms(token: string): string[] {
  const terms = new Set<string>([token]);
  const stemmed = stemRuWord(token);
  if (stemmed !== token) terms.add(stemmed);

  for (const [pattern, syns] of PURPOSE_SYNONYMS) {
    if (pattern.test(token)) {
      for (const s of syns) terms.add(s);
    }
  }
  return Array.from(terms);
}

function wordPrefixMatches(words: string[], term: string): boolean {
  if (term.length <= 2) {
    return words.some(w => w === term);
  }
  if (term.length === 3) {
    return words.some(w => w === term || w.startsWith(term));
  }
  return words.some(w => w.startsWith(term));
}

function textMatchesTerm(text: string, words: string[], term: string): boolean {
  if (!text) return false;
  if (term.length <= 4) {
    return wordPrefixMatches(words, term);
  }
  return wordPrefixMatches(words, term) || text.includes(term);
}

const SEARCH_INDEX_BY_ID = new Map<string, SearchIndexEntry>(
  SEARCH_INDEX.map(entry => [entry.mod.id, entry])
);

const PASSIVE_LIB_TAGS = new Set(['library', 'api', 'dependency', 'библиотека', 'зависимость']);

function scoreEntryAgainstTokens(
  entry: SearchIndexEntry,
  expandedTokens: Array<{ raw: string; stem: string; terms: string[] }>,
  fullQueryLower: string
): number {
  let totalRank = 0;
  let hasDirectNameMatch = false;

  for (const tok of expandedTokens) {
    const { raw, stem, terms } = tok;
    let nameScore = 0;
    if (entry.nameLower === raw) {
      nameScore = 2600;
      hasDirectNameMatch = true;
    } else if (entry.nameLower.startsWith(raw)) {
      nameScore = 1500;
      hasDirectNameMatch = true;
    } else if (entry.nameLower.includes(raw) && raw.length >= 3) {
      nameScore = 950;
      hasDirectNameMatch = true;
    }

    let bestTag = 0;
    let bestDesc = 0;
    let bestAlt = 0;
    let bestGroupDesc = 0;
    let bestGroupTitle = 0;

    for (const term of terms) {
      const isPrimaryTerm = term === raw || term === stem;
      const mult = isPrimaryTerm ? 1 : 0.72;

      if (entry.wordsSet.has(term) || (term.length >= 3 && entry.wordsList.some(w => w.startsWith(term)))) {
        if (entry.tagsWords.length > 0 && wordPrefixMatches(entry.tagsWords, term)) {
          bestTag = Math.max(bestTag, Math.round(760 * mult));
        }
        if (entry.descLower && textMatchesTerm(entry.descLower, entry.descWords, term)) {
          bestDesc = Math.max(bestDesc, Math.round(620 * mult));
        }
        if (entry.altLower && textMatchesTerm(entry.altLower, entry.altWords, term)) {
          bestAlt = Math.max(bestAlt, Math.round(320 * mult));
        }
        if (entry.groupDescLower && textMatchesTerm(entry.groupDescLower, entry.groupDescWords, term)) {
          bestGroupDesc = Math.max(bestGroupDesc, Math.round(250 * mult));
        }
        if (entry.groupTitleLower && textMatchesTerm(entry.groupTitleLower, entry.groupTitleWords, term)) {
          bestGroupTitle = Math.max(bestGroupTitle, Math.round(170 * mult));
        }
      } else if (term.length >= 5 && entry.allText.includes(term)) {
        if (entry.tagsLower.includes(term)) bestTag = Math.max(bestTag, Math.round(540 * mult));
        if (entry.descLower.includes(term)) bestDesc = Math.max(bestDesc, Math.round(460 * mult));
        if (entry.groupDescLower.includes(term)) bestGroupDesc = Math.max(bestGroupDesc, Math.round(190 * mult));
        else bestGroupTitle = Math.max(bestGroupTitle, Math.round(120 * mult));
      }
    }

    const fieldPrimary = Math.max(nameScore, bestTag, bestDesc, bestAlt, bestGroupDesc, bestGroupTitle);
    if (fieldPrimary === 0) {
      return 0;
    }

    // Cumulative multi-field reinforcement (e.g. matches tags + description + group)
    const tokenRank =
      nameScore +
      bestTag * 0.85 +
      bestDesc * 0.75 +
      bestGroupDesc * 0.45 +
      bestGroupTitle * 0.35 +
      bestAlt * 0.3;

    totalRank += tokenRank;
  }

  if (entry.nameLower === fullQueryLower) totalRank += 1400;
  else if (entry.nameLower.startsWith(fullQueryLower)) totalRank += 650;

  if (!hasDirectNameMatch) {
    const isPassiveLib = entry.tagsWords.some(w => PASSIVE_LIB_TAGS.has(w)) || entry.mod.category === 'Библиотеки и API';
    if (isPassiveLib) {
      totalRank -= 420;
    }
    if (entry.mod.status === 'danger') {
      totalRank -= 450;
    }
    if (entry.mod.status === 'outdated') {
      totalRank -= 280;
    }
    if (entry.mod.coveredBy || (entry.mod.supersededBy && entry.mod.supersededBy.length > 0)) {
      totalRank -= 180;
    }
    if (isUnsupportedOnForge(entry.mod)) {
      totalRank -= 320;
    }
  } else if (entry.nameLower !== fullQueryLower && !entry.nameLower.startsWith(fullQueryLower)) {
    if (entry.mod.status === 'outdated') totalRank -= 220;
    if (entry.mod.status === 'danger') totalRank -= 350;
    if (entry.mod.coveredBy || (entry.mod.supersededBy && entry.mod.supersededBy.length > 0)) totalRank -= 160;
  }

  if (entry.mod.isGroupLeader) totalRank += 140;
  if (entry.mod.healthTier === 'green' && entry.mod.status === 'recommended') totalRank += 120;
  totalRank += (MOD_SCORE_BY_ID.get(entry.mod.id) ?? 0) * 0.16;

  return Math.max(1, totalRank);
}

export function matchesModPurposeQuery(modOrId: ModItem | string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const id = typeof modOrId === 'string' ? modOrId : modOrId.id;
  const entry = SEARCH_INDEX_BY_ID.get(id);
  if (!entry) return false;
  const tokens = q.split(/\s+/).filter(Boolean);
  const expandedTokens = tokens.map(t => ({
    raw: t,
    stem: stemRuWord(t),
    terms: getExpandedTerms(t),
  }));
  return scoreEntryAgainstTokens(entry, expandedTokens, q) > 0;
}

export function searchModsByQuery(query: string, limit = 15): ModItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  const expandedTokens = tokens.map(t => ({
    raw: t,
    stem: stemRuWord(t),
    terms: getExpandedTerms(t),
  }));

  const scored: Array<{ mod: ModItem; rank: number }> = [];

  for (const entry of SEARCH_INDEX) {
    const rank = scoreEntryAgainstTokens(entry, expandedTokens, q);
    if (rank > 0) {
      scored.push({ mod: entry.mod, rank });
    }
  }

  scored.sort((a, b) => b.rank - a.rank || a.mod.name.localeCompare(b.mod.name, 'ru'));
  return scored.slice(0, limit).map(s => s.mod);
}

export const FABRIC_TO_FORGE_SWAP: Record<string, string> = {
  'lithium': 'radium-re-reforged',
  'krypton': 'krypton-reno',
  'sodium': 'embeddium',
  'iris-shaders': 'oculus',
  'very-many-players-vmp': 'vmp-forge',
  'c2me-concurrent-chunk-management-engine': 'concurrent-chunk-management-engine-forge-c2me',
  'dashloader': 'modernfix',
  'exordium': 'immediatelyfast',
};

export const DUAL_PORT_PAIRS: DualPortPair[] = [
  {
    id: 'gpu-chunk-renderer',
    title: 'GPU-рендер чанков (без шейдеров)',
    forgeModId: 'alloyium',
    forgeLabel: 'Alloyium (Нативный Forge)',
    forgeSummary: 'OpenGL 4.3 Compute без Sinytra; +1.3×–1.6× FPS на любых GPU (NVIDIA/AMD/Intel) и с шейдерами.',
    fabricModId: 'nvidium',
    fabricLabel: 'Nvidium (Fabric + Sinytra)',
    fabricSummary: 'NVIDIA Mesh Shaders (3×–10× FPS) через Sinytra Connector + алиас Embeddium (только без шейдеров).',
    switchableOnForge: true,
    altForgeIds: ['revidium-accedium'],
    altFabricIds: ['nvidium-forged'],
  },
  {
    id: 'c2me',
    title: 'Многопоточные чанки (C2ME)',
    forgeModId: 'concurrent-chunk-management-engine-forge-c2me',
    forgeLabel: 'C2ME-Forge (C2MEF)',
    forgeSummary: 'Нативный порт без Sinytra Connector — избегает конфликтов шины событий Forge 1.20.1.',
    fabricModId: 'c2me-concurrent-chunk-management-engine',
    fabricLabel: 'C2ME (Fabric + Sinytra)',
    fabricSummary: 'Оригинальный Fabric C2ME от ishland через Sinytra (нужны Connector Extras и noTickViewDistance = false).',
    switchableOnForge: true,
    altForgeIds: ['c2mer'],
  },
  {
    id: 'vmp',
    title: 'Высокий онлайн / игроки (VMP)',
    forgeModId: 'vmp-forge',
    forgeLabel: 'Very Many Players (Forge)',
    forgeSummary: 'Нативный Forge-порт без Sinytra и без конфликтов миксинов трекинга сущностей.',
    fabricModId: 'very-many-players-vmp',
    fabricLabel: 'VMP (Fabric + Sinytra)',
    fabricSummary: 'Оригинальный Fabric VMP через Sinytra Connector (может конфликтовать миксинами в тяжёлых паках).',
    switchableOnForge: true,
  },
  {
    id: 'zip-loading',
    title: 'Чтение .zip паков (ModernFix ↔ Quick Pack)',
    forgeModId: 'modernfix',
    forgeLabel: 'ModernFix (Нативный Forge)',
    forgeSummary: 'Ускоряет загрузку ресурсов нативно в Forge 1.20.1 без сторонних мостов.',
    fabricModId: 'quick-pack',
    fabricLabel: 'Quick Pack (Fabric / Quick Pack-Fix)',
    fabricSummary: 'Оригинал drexhd под Fabric — на Forge 1.20.1 требует Quick Pack-Fix или Sinytra Connector.',
    switchableOnForge: true,
  },
  {
    id: 'lithium-tps',
    title: 'Физика и ИИ (Radium ↔ Lithium)',
    forgeModId: 'radium-re-reforged',
    forgeLabel: 'Radium Re-Reforged (Нативный Forge)',
    forgeSummary: 'Стабильный порт Lithium с патчами под Create, C2ME и Forge-краши NBT.',
    fabricModId: 'lithium',
    fabricLabel: 'Lithium (Fabric — несовм. с Forge)',
    fabricSummary: 'Оригинальный Fabric Lithium падает даже с Sinytra Connector — ставьте Radium Re-Reforged.',
    switchableOnForge: false,
  },
  {
    id: 'krypton-net',
    title: 'Сеть Netty (Krypton Reno / Krypton Hybrid ↔ Krypton)',
    forgeModId: 'krypton-reno',
    forgeLabel: 'Krypton Reno / Krypton Hybrid (Нативный Forge)',
    forgeSummary: 'Нативный сетевой стек для Forge 1.20.1 (Krypton Hybrid для Mohist/Arclight; Pluto остановился на 1.18.2).',
    fabricModId: 'krypton',
    fabricLabel: 'Krypton (Fabric — несовм. с Forge)',
    fabricSummary: 'Velocity-нативки Fabric Krypton не работают через Sinytra — нужен Krypton Reno.',
    switchableOnForge: false,
    altForgeIds: ['krypton-hybrid', 'pluto'],
  },
  {
    id: 'sodium-core',
    title: 'Базовый 3D-рендер (Embeddium ↔ Sodium)',
    forgeModId: 'embeddium',
    forgeLabel: 'Embeddium (Нативный Forge)',
    forgeSummary: 'Официальный стандарт для Forge 1.20.1 (с алиасом "embeddium": "sodium" для Nvidium в Sinytra).',
    fabricModId: 'sodium',
    fabricLabel: 'Sodium (Fabric — несовм. с Forge)',
    fabricSummary: 'Fabric-оригинал Sodium крашнет Forge даже с Sinytra Connector.',
    switchableOnForge: false,
    altForgeIds: ['emberbium'],
  },
  {
    id: 'iris-shaders',
    title: 'Шейдеры (Oculus / Emberlens ↔ Iris)',
    forgeModId: 'oculus',
    forgeLabel: 'Oculus / Emberlens (Нативный Forge)',
    forgeSummary: 'Нативный порт Iris Shaders для Embeddium (либо Emberlens поверх Emberbium).',
    fabricModId: 'iris-shaders',
    fabricLabel: 'Iris Shaders (Fabric — несовм. с Forge)',
    fabricSummary: 'Fabric Iris несовместим с Forge 1.20.1 — используйте Oculus или Emberlens.',
    switchableOnForge: false,
    altForgeIds: ['emberlens'],
  },
  {
    id: 'worldgen-noisium',
    title: 'Шум генерации мира (Noisiumed ↔ Noisium)',
    forgeModId: 'noisiumed',
    forgeLabel: 'Noisiumed (Актуальный форк Forge)',
    forgeSummary: 'Поддерживаемое продолжение архивного Noisium для Forge 1.20.1.',
    fabricModId: 'noisium',
    fabricLabel: 'Noisium (Архивный порт)',
    fabricSummary: 'Прекращённый предшественник Noisiumed — оставляйте только один из них.',
    switchableOnForge: true,
  },
];

export function getDualPortPairForMod(modId: string): DualPortPair | null {
  for (const pair of DUAL_PORT_PAIRS) {
    if (
      pair.forgeModId === modId ||
      pair.fabricModId === modId ||
      pair.altForgeIds?.includes(modId) ||
      pair.altFabricIds?.includes(modId)
    ) {
      return pair;
    }
  }
  return null;
}

export function getDirectDependencies(modId: string, contextSet?: Set<string>): string[] {
  const deps = new Set<string>(MOD_HARD_DEPENDENCIES[modId] || []);
  const altGroups = MOD_ALTERNATIVE_DEPENDENCIES[modId];
  if (altGroups) {
    for (const options of altGroups) {
      if (options.length === 0) continue;
      const satisfied = contextSet ? options.find(opt => contextSet.has(opt)) : undefined;
      deps.add(satisfied || options[0]);
    }
  }
  const mod = MOD_BY_ID.get(modId);
  if (mod && mod.platform.includes('Sinytra')) {
    deps.add('sinytra-connector');
    deps.add('forgified-fabric-api');
  }
  if (mod?.recipeEcosystem === 'jei-plugin') {
    if (contextSet?.has('emi') && contextSet?.has('tmrv-updated')) {
      deps.add('emi');
      deps.add('tmrv-updated');
    } else if (!contextSet?.has('just-enough-items-jei')) {
      deps.add('just-enough-items-jei');
    }
  }
  return Array.from(deps);
}

export function getTransitiveDependencies(
  modId: string,
  visited = new Set<string>(),
  contextSet?: Set<string>
): string[] {
  if (visited.has(modId)) return [];
  visited.add(modId);
  const direct = getDirectDependencies(modId, contextSet);
  const result = new Set<string>(direct);
  for (const d of direct) {
    for (const td of getTransitiveDependencies(d, visited, contextSet)) {
      result.add(td);
    }
  }
  return Array.from(result);
}

const EXCLUSIVE_POOL_BY_MOD_ID = new Map<string, { groupId: string; poolIds: string[] }>();
for (const g of MOD_GROUPS) {
  if (!g.exclusive) continue;
  const addonSet = new Set(g.addonIds);
  const pool = g.memberIds.filter(id => !addonSet.has(id));
  const entry = { groupId: g.id, poolIds: pool };
  for (const id of pool) {
    EXCLUSIVE_POOL_BY_MOD_ID.set(id, entry);
  }
}

export function getExclusivePoolForMod(modId: string): { groupId: string; poolIds: string[] } | null {
  return EXCLUSIVE_POOL_BY_MOD_ID.get(modId) ?? null;
}

const PRECOMPUTED_RULE_CONFLICT_SETS = new Map<string, Set<string>>();
const PRECOMPUTED_RULE_CONFLICTS = new Map<string, string[]>();
const PRECOMPUTED_RULE_META = INCOMPATIBILITY_RULES.map(rule => ({
  rule,
  slugSet: new Set(rule.conflictingMods.map(normalizeSlug)),
  isOptiFine: rule.title.includes('OptiFine'),
  isNvidiumShader: rule.title.includes('Nvidium и шейдеров'),
}));

for (const mod of MODS_DATABASE) {
  const slug = MOD_SLUG_BY_ID.get(mod.id) || '';
  const conflicts = new Set<string>();

  for (const { slugSet, isOptiFine, isNvidiumShader } of PRECOMPUTED_RULE_META) {
    if (!slugSet.has(slug)) continue;

    if (isOptiFine) {
      for (const m of MODS_DATABASE) {
        const ms = MOD_SLUG_BY_ID.get(m.id) || '';
        if (slug === 'optifine') {
          if (ms !== 'optifine' && slugSet.has(ms)) conflicts.add(m.id);
        } else if (ms === 'optifine') {
          conflicts.add(m.id);
        }
      }
      continue;
    }

    if (isNvidiumShader) {
      for (const m of MODS_DATABASE) {
        const ms = MOD_SLUG_BY_ID.get(m.id) || '';
        if (mod.id === 'nvidium') {
          if (m.id !== 'nvidium' && slugSet.has(ms)) conflicts.add(m.id);
        } else if (m.id === 'nvidium') {
          conflicts.add(m.id);
        }
      }
      continue;
    }

    for (const m of MODS_DATABASE) {
      const ms = MOD_SLUG_BY_ID.get(m.id) || '';
      if (m.id !== mod.id && slugSet.has(ms)) {
        conflicts.add(m.id);
      }
    }
  }

  const exclusive = EXCLUSIVE_POOL_BY_MOD_ID.get(mod.id);
  if (exclusive) {
    for (const pid of exclusive.poolIds) {
      if (pid !== mod.id) conflicts.add(pid);
    }
  }

  PRECOMPUTED_RULE_CONFLICT_SETS.set(mod.id, conflicts);
  PRECOMPUTED_RULE_CONFLICTS.set(mod.id, Array.from(conflicts));
}

const EMPTY_CONFLICT_ARR: string[] = [];

export function getRuleConflictingIds(modId: string): string[] {
  return PRECOMPUTED_RULE_CONFLICTS.get(modId) ?? EMPTY_CONFLICT_ARR;
}

function hasAnyConflictInSet(modId: string, activeSet: Set<string>): boolean {
  const set = PRECOMPUTED_RULE_CONFLICT_SETS.get(modId);
  if (!set || set.size === 0) return false;
  for (const cid of set) {
    if (activeSet.has(cid)) return true;
  }
  return false;
}

export function analyzeSelection(selectedIds: string[]) {
  const selectedSet = new Set(selectedIds);
  const selectedMods = MODS_DATABASE.filter(m => selectedSet.has(m.id));
  const conflicts: ConflictDetection[] = [];
  const conflictingIdSet = new Set<string>();

  for (const { rule, slugSet, isOptiFine, isNvidiumShader } of PRECOMPUTED_RULE_META) {
    if (isOptiFine) {
      const opti = selectedMods.find(m => (MOD_SLUG_BY_ID.get(m.id) || '') === 'optifine');
      if (!opti) continue;
      const others = selectedMods.filter(m => {
        const n = MOD_SLUG_BY_ID.get(m.id) || '';
        return n !== 'optifine' && slugSet.has(n);
      });
      if (others.length > 0) {
        const matched = [opti, ...others];
        matched.forEach(m => conflictingIdSet.add(m.id));
        conflicts.push({
          rule,
          matchedIds: matched.map(m => m.id),
          matchedNames: matched.map(m => m.name),
        });
      }
      continue;
    }

    if (isNvidiumShader) {
      const nvid = selectedMods.find(m => m.id === 'nvidium');
      if (!nvid) continue;
      const others = selectedMods.filter(
        m => m.id !== 'nvidium' && slugSet.has(MOD_SLUG_BY_ID.get(m.id) || '')
      );
      if (others.length > 0) {
        const matched = [nvid, ...others];
        matched.forEach(m => conflictingIdSet.add(m.id));
        conflicts.push({
          rule,
          matchedIds: matched.map(m => m.id),
          matchedNames: matched.map(m => m.name),
        });
      }
      continue;
    }

    const matched = selectedMods.filter(sm => slugSet.has(MOD_SLUG_BY_ID.get(sm.id) || ''));
    if (matched.length > 1) {
      matched.forEach(m => conflictingIdSet.add(m.id));
      conflicts.push({
        rule,
        matchedIds: matched.map(m => m.id),
        matchedNames: matched.map(m => m.name),
      });
    }
  }

  const warnings: DependencyWarning[] = [];
  const hasSinytra = selectedSet.has('sinytra-connector');
  const hasFFAPI = selectedSet.has('forgified-fabric-api');
  const hasEmbeddium = selectedSet.has('embeddium');
  const hasEmberbium = selectedSet.has('emberbium');
  const hasEmi = selectedSet.has('emi');
  const hasJei = selectedSet.has('just-enough-items-jei');
  const hasTmrv = selectedSet.has('tmrv-updated');

  for (const mod of selectedMods) {
    if (mod.platform.includes('Sinytra')) {
      if (!hasSinytra || !hasFFAPI) {
        warnings.push({
          modId: mod.id,
          modName: mod.name,
          severity: 'red',
          message: `${mod.name} (Fabric-мод) не запустится на Forge без Sinytra Connector и Forgified Fabric API.`,
          fixModIds: ['sinytra-connector', 'forgified-fabric-api'],
        });
      }
      if (mod.id === 'nvidium' && !hasEmbeddium && !hasEmberbium) {
        warnings.push({
          modId: mod.id,
          modName: mod.name,
          severity: 'red',
          message: 'Nvidium на Forge требует Embeddium или Emberbium (и алиас embeddium -> sodium в конфиге Sinytra .connector).',
          fixModIds: ['embeddium'],
        });
      }
    }

    const hardDeps = MOD_HARD_DEPENDENCIES[mod.id] || [];
    const missingDeps = hardDeps.filter(depId => !selectedSet.has(depId));
    const missingNonSinytra = missingDeps.filter(
      depId => !(mod.platform.includes('Sinytra') && ['sinytra-connector', 'forgified-fabric-api', 'embeddium', 'emberbium'].includes(depId))
    );
    if (missingNonSinytra.length > 0) {
      const missingNames = missingNonSinytra.map(id => MOD_BY_ID.get(id)?.name || id);
      const isCriticalViewerMissing =
        mod.recipeEcosystem === 'emi-only' ||
        mod.recipeEcosystem === 'tmrv-bridge' ||
        mod.recipeEcosystem === 'jei-engine';
      warnings.push({
        modId: mod.id,
        modName: mod.name,
        severity: isCriticalViewerMissing ? 'red' : 'yellow',
        message: `${mod.name} требует: ${missingNames.join(' + ')}. Добавьте зависимость, иначе мод не сработает.`,
        fixModIds: missingNonSinytra,
      });
    }

    const altDepGroups = MOD_ALTERNATIVE_DEPENDENCIES[mod.id] || [];
    for (const options of altDepGroups) {
      if (mod.id === 'nvidium' && options.includes('embeddium')) continue;
      if (options.length > 0 && !options.some(optId => selectedSet.has(optId))) {
        const optNames = options.map(id => MOD_BY_ID.get(id)?.name || id);
        warnings.push({
          modId: mod.id,
          modName: mod.name,
          severity: 'yellow',
          message: `${mod.name} требует один из базовых модов: ${optNames.join(' или ')}.`,
          fixModIds: [options[0]],
        });
      }
    }

    if (mod.recipeEcosystem === 'jei-plugin' && !hasJei && !(hasEmi && hasTmrv)) {
      warnings.push({
        modId: mod.id,
        modName: mod.name,
        severity: 'red',
        message: hasEmi
          ? `${mod.name} — плагин JEI: для работы внутри чистого EMI нужна прослойка TMRV Updated (или JEI).`
          : `${mod.name} — плагин JEI: установите Just Enough Items (JEI) или связку EMI + TMRV Updated.`,
        fixModIds: hasEmi ? ['tmrv-updated'] : ['just-enough-items-jei'],
      });
    }

    const activeSuperseder = getModSuperseder(mod, selectedSet, undefined, false);
    if (activeSuperseder && activeSuperseder.isActiveInSelection) {
      warnings.push({
        modId: mod.id,
        modName: mod.name,
        severity: 'yellow',
        message: `${mod.name} лишний — ${activeSuperseder.reason}.`,
      });
    } else if (mod.coveredBy && selectedMods.some(other => other.name === mod.coveredBy || mod.coveredBy?.includes(other.name))) {
      warnings.push({
        modId: mod.id,
        modName: mod.name,
        severity: 'yellow',
        message: `${mod.name} избыточен — его функции уже встроены в ${mod.coveredBy}.`,
      });
    }

    if (isUnsupportedOnForge(mod)) {
      warnings.push({
        modId: mod.id,
        modName: mod.name,
        severity: 'red',
        message: `${mod.name} (${mod.platform}) не работает нативно на Forge 1.20.1 — ${mod.bestAlternative || 'удалите или замените Forge-портом'}.`,
      });
    } else if (mod.platform.includes('NeoForge') && !/\bForge\b/.test(mod.platform)) {
      warnings.push({
        modId: mod.id,
        modName: mod.name,
        severity: 'yellow',
        message: `${mod.name} рассчитан на ${mod.platform}, а не на Forge 1.20.1.`,
      });
    }
  }

  const runtimeOnlyConflictIdSet = new Set<string>();
  const hardCrashConflictIdSet = new Set<string>();
  for (const c of conflicts) {
    const isEmberlensNvidiumOnly =
      c.rule.title.includes('Nvidium и шейдеров') &&
      c.matchedIds.includes('nvidium') &&
      c.matchedIds.includes('emberlens') &&
      !c.matchedIds.includes('oculus') &&
      !c.matchedIds.includes('iris-shaders');
    if (isEmberlensNvidiumOnly) {
      c.matchedIds.forEach(id => runtimeOnlyConflictIdSet.add(id));
    } else {
      c.matchedIds.forEach(id => hardCrashConflictIdSet.add(id));
    }
  }
  const effectiveRuntimeOnlySet = new Set(
    Array.from(runtimeOnlyConflictIdSet).filter(id => !hardCrashConflictIdSet.has(id))
  );

  return {
    selectedMods,
    conflicts,
    conflictingIdSet,
    runtimeOnlyConflictIdSet: effectiveRuntimeOnlySet,
    warnings,
  };
}

const ORANGE_CAVEAT_MOD_IDS = new Set([
  'accelerated-rendering',
  'accelerated-rendering-turned',
  'accelerated-recoiling',
  'tritium',
  'c2mer',
  'concurrent-chunk-management-engine-forge-c2me',
  'bobby-reforged',
  'structure-dfu-cache',
]);

export function getCheckerTier(
  mod: ModItem,
  conflictingIdSet: Set<string> = new Set(),
  warningSeverity?: 'red' | 'orange' | 'yellow',
  runtimeOnlyConflictIdSet?: Set<string>
): { tier: CheckerTier; label: string; reason: string } {
  const isRuntimeOnlyConflict =
    conflictingIdSet.has(mod.id) && Boolean(runtimeOnlyConflictIdSet?.has(mod.id));

  if (
    mod.status === 'danger' ||
    (conflictingIdSet.has(mod.id) && !isRuntimeOnlyConflict) ||
    warningSeverity === 'red' ||
    isUnsupportedOnForge(mod)
  ) {
    const reason =
      mod.status === 'danger'
        ? mod.warning || 'Плацебо или высокий риск поломки/фризов'
        : conflictingIdSet.has(mod.id)
          ? 'Активный конфликт с другим выбранным модом'
          : mod.warning || mod.bestAlternative || 'Несовместим с Forge 1.20.1 или отсутствуют зависимости';
    return { tier: 'red', label: 'Плохо / Конфликт', reason };
  }

  if (isRuntimeOnlyConflict) {
    return {
      tier: 'orange',
      label: 'Конфликт режима',
      reason:
        mod.id === 'emberlens'
          ? 'Не работает при активном Nvidium (шейдеры отключают Mesh Shaders)'
          : 'При включении шейдеров Emberlens Nvidium отключается или конфликтует',
    };
  }

  if (warningSeverity === 'orange') {
    return {
      tier: 'orange',
      label: 'Риск / Оговорка',
      reason: mod.warning || mod.bestAlternative || 'Требует внимания и проверки совместимости',
    };
  }

  if (mod.healthTier === 'green' && warningSeverity !== 'yellow') {
    return { tier: 'green', label: 'Стабильно', reason: 'Проверенный стабильный лидер для Forge' };
  }

  if (
    warningSeverity !== 'yellow' &&
    (ORANGE_CAVEAT_MOD_IDS.has(mod.id) ||
      (mod.status === 'redundant' &&
        mod.id !== 'fastchest-revived' &&
        mod.id !== 'memory-leak-fix-modern-port'))
  ) {
    const reason =
      mod.coveredBy
        ? `Уже встроен в ${mod.coveredBy}`
        : mod.warning || mod.bestAlternative || 'Экспериментальный, дублирующий или требующий много ресурсов мод';
    return { tier: 'orange', label: 'Сомнительно / Риск', reason };
  }

  const isNeoForgeOnly = mod.platform.includes('NeoForge') && !/\bForge\b/.test(mod.platform);
  const needsBridgeOrExperimental =
    mod.platform.includes('Sinytra') ||
    mod.platform.includes('Fabric') ||
    mod.platform.includes('Quick Pack-Fix') ||
    mod.platform.includes('устаревший порт') ||
    mod.platform.includes('1.20.4') ||
    mod.platform.includes('Эксперимент') ||
    mod.id === 'concurrent-chunk-management-engine-forge-c2me' ||
    mod.id === 'c2mer' ||
    mod.id === 'tritium' ||
    mod.id === 'nvidium-forged';

  const isSuitableNative =
    warningSeverity !== 'yellow' &&
    !mod.coveredBy &&
    !isNeoForgeOnly &&
    !needsBridgeOrExperimental &&
    (mod.status === 'useful' || mod.status === 'diagnostic');

  if (isSuitableNative) {
    const reason =
      mod.status === 'diagnostic'
        ? 'Инструмент диагностики — работает стабильно, FPS сам не повышает'
        : mod.bestAlternative || mod.description;
    return { tier: 'lime', label: 'Сносно / Подходит', reason };
  }

  let reason = mod.warning || mod.bestAlternative || '';
  if (!reason) {
    if (mod.platform.includes('Sinytra')) reason = 'Работает на Forge через Sinytra Connector (требует настройки)';
    else if (mod.coveredBy) reason = `Уже встроен в ${mod.coveredBy}`;
    else if (mod.status === 'outdated') reason = 'Устарел — есть более новый лидер';
    else reason = 'Условно полезен с ограничениями по версии или лоадеру';
  }

  return { tier: 'yellow', label: 'Не гарантировано', reason };
}

export function getBaseHealthTier(mod: ModItem): CheckerTier {
  return getCheckerTier(mod, new Set()).tier;
}

const DUBIOUS_EXPLICIT_REASONS: Record<string, string> = {
  'accelerated-rendering': 'OpenGL 4.6: повышает расход VRAM и может вызывать артефакты с некоторыми модами/шейдерами',
  'accelerated-rendering-turned': 'Форк Accelerated Rendering: высокий расход VRAM и риск багов в сложных сценах',
  'accelerated-recoiling': 'Экспериментальный форк Accelerated Rendering для совместимости',
  tritium: 'Экспериментальный комбайн оптимизаций — возможны перекрытия и конфликты миксинов',
  c2mer: 'Экспериментальный порт C2ME — нестабильнее основного C2MEF',
  'nvidium-forged': 'Неофициальный порт Nvidium — менее проверен, чем связка Sinytra + Nvidium',
  'structure-dfu-cache': 'Ускоряет старт, но на тяжёлых модпаках требует проверки кеша структур',
  soundgc: 'Агрессивная очистка звуковых буферов — в редких случаях обрывает длинные треки',
  'capability-fix-revived': 'Сторонний фикс-порт — используйте только при реальных лагах capability в профайлере',
  'memory-leak-fix-modern-port': 'В основном перекрыт ModernFix и AllTheLeaks',
  'quick-pack': 'Спорная оптимизация — требует проверки совместимости',
  'fastchest-revived': 'Переключает рендер сундуков на статический (перекрывается EBER)',
  'bobby-reforged': 'Старый порт 2023 года без обновлений — уступает Distant Horizons',
  'minimal-backup-zstd': 'Мод бэкапов, а не ускоритель FPS — полезен только для сохранений',
  'config-preset-switch-low-medium-high-f10': 'Переключатель пресетов графики, сам по себе FPS не поднимает',
};

export function getDubiousModReason(
  mod: ModItem,
  selectedSet?: Set<string>,
  prefs?: AssemblyPreferences
): string | null {
  if (DUBIOUS_EXPLICIT_REASONS[mod.id]) {
    return DUBIOUS_EXPLICIT_REASONS[mod.id];
  }
  if (mod.status === 'danger') {
    return mod.warning || 'Опасный или плацебо-мод (риск краша/статтеров)';
  }
  if (isUnsupportedOnForge(mod)) {
    return `Не работает нативно на Forge 1.20.1 (${mod.platform})`;
  }
  if (mod.coveredBy) {
    return `Сомнительно: функции уже встроены в ${mod.coveredBy}`;
  }
  if (mod.status === 'outdated' || mod.status === 'redundant') {
    return mod.bestAlternative || mod.warning || 'Устаревший или дублирующий мод';
  }
  const sup = getModSuperseder(mod, selectedSet, prefs, true);
  if (sup) {
    return `Сомнительно в сборке: ${sup.reason}`;
  }
  const baseTier = getBaseHealthTier(mod);
  if (baseTier === 'orange' || baseTier === 'yellow' || baseTier === 'red') {
    return mod.warning || mod.statusLabel || 'Нестабильный, экспериментальный или требующий оговорок мод';
  }
  return null;
}

export function buildCheckerDiagnostics(selectedIds: string[]): DiagnosticIssue[] {
  const analysis = analyzeSelection(selectedIds);
  const selectedSet = new Set(selectedIds);
  const issues: DiagnosticIssue[] = [];

  for (let i = 0; i < analysis.conflicts.length; i++) {
    const c = analysis.conflicts[i];
    const isEmberlensNvidiumOnly =
      c.rule.title.includes('Nvidium и шейдеров') &&
      c.matchedIds.includes('nvidium') &&
      c.matchedIds.includes('emberlens') &&
      !c.matchedIds.includes('oculus') &&
      !c.matchedIds.includes('iris-shaders');

    if (isEmberlensNvidiumOnly) {
      issues.push({
        id: `conflict-nvidium-emberlens-${i}`,
        kind: 'runtime',
        severity: 'orange',
        title: 'Nvidium и Emberlens (шейдеры) не работают вместе',
        betweenIds: c.matchedIds,
        betweenNames: c.matchedNames,
        problem:
          'При активном Nvidium сам Emberlens не вызывает краш, но не работает — включение любого шейдер-пака конфликтует с Nvidium Mesh Shaders.',
        bestSolution:
          'Если играете с шейдерами — уберите Nvidium (Emberlens лучше Oculus в паре с Emberbium). Если играете без шейдеров на NVIDIA — уберите Emberlens.',
        keepPreferredId: 'emberlens',
        removeIds: ['nvidium'],
      });
      continue;
    }

    const matchedMods = c.matchedIds
      .map(id => MOD_BY_ID.get(id))
      .filter((m): m is ModItem => Boolean(m));
    const sortedWinners = [...matchedMods].sort(
      (a, b) => computeEffectivenessScore(b) - computeEffectivenessScore(a)
    );
    let winner = sortedWinners[0];
    // Prefer Emberlens over Oculus when Emberbium is active
    if (
      c.matchedIds.includes('emberlens') &&
      c.matchedIds.includes('oculus') &&
      selectedSet.has('emberbium') &&
      !selectedSet.has('embeddium')
    ) {
      winner = MOD_BY_ID.get('emberlens') ?? winner;
    }
    const losers = matchedMods.filter(m => m.id !== winner?.id);

    issues.push({
      id: `conflict-${i}-${c.matchedIds.join('_')}`,
      kind: 'conflict',
      severity: 'red',
      title: c.rule.title,
      betweenIds: c.matchedIds,
      betweenNames: c.matchedNames,
      problem: c.rule.explanation,
      bestSolution: winner
        ? `${c.rule.recommendation} Лучший выбор здесь: оставить «${winner.name}» и убрать ${losers.map(l => `«${l.name}»`).join(', ')}.`
        : c.rule.recommendation,
      keepPreferredId: winner?.id,
      removeIds: losers.map(l => l.id),
    });
  }

  for (let i = 0; i < analysis.warnings.length; i++) {
    const w = analysis.warnings[i];
    const mod = MOD_BY_ID.get(w.modId);
    const fixMods = (w.fixModIds ?? [])
      .map(id => MOD_BY_ID.get(id))
      .filter((m): m is ModItem => Boolean(m));

    if (w.fixModIds && w.fixModIds.length > 0) {
      const betweenIds = Array.from(new Set([w.modId, ...w.fixModIds]));
      const betweenNames = betweenIds.map(id => MOD_BY_ID.get(id)?.name || id);
      issues.push({
        id: `warn-dep-${i}-${w.modId}`,
        kind: 'dependency',
        severity: w.severity,
        title: `Не хватает зависимости для ${w.modName}`,
        betweenIds,
        betweenNames,
        problem: w.message,
        bestSolution: `Добавьте ${fixMods.map(m => m.name).join(' + ')} (либо уберите ${w.modName}, если этот стек не нужен).`,
        addIds: w.fixModIds,
        removeIds: [w.modId],
      });
      continue;
    }

    const sup = mod ? getModSuperseder(mod, selectedSet, undefined, false) : null;
    const isRedundant = Boolean(sup || mod?.coveredBy);
    const betweenNames = sup
      ? [w.modName, ...sup.byNames]
      : mod?.coveredBy
        ? [w.modName, mod.coveredBy]
        : [w.modName, 'Forge 1.20.1'];

    issues.push({
      id: `warn-other-${i}-${w.modId}`,
      kind: isRedundant ? 'redundant' : 'platform',
      severity: w.severity,
      title: isRedundant
        ? `Дублирование функций: ${w.modName}`
        : `Проблема совместимости: ${w.modName}`,
      betweenIds: [w.modId],
      betweenNames,
      problem: w.message,
      bestSolution:
        mod?.bestAlternative ||
        (sup
          ? `Удалите «${w.modName}» — его задачи полностью закрывает ${sup.byNames.join(' + ')}.`
          : `Удалите «${w.modName}» или замените на нативный аналог для Forge 1.20.1.`),
      removeIds: [w.modId],
    });
  }

  return issues;
}

export function getModEffectivenessScore(mod: ModItem): number {
  return MOD_SCORE_BY_ID.get(mod.id) ?? computeEffectivenessScore(mod);
}

export function evaluateAssemblyHealth(selectedIds: string[]) {
  const analysis = analyzeSelection(selectedIds);
  const selectedSet = new Set(selectedIds);

  const essentialGroupIds = [
    'core-renderer',
    'memory-core',
    'tick-physics-engine',
    'block-culling',
    'networking',
  ];

  const missingCoreSlots: MissingSlotWarning[] = [];
  if (selectedIds.length > 0) {
    for (const gid of essentialGroupIds) {
      const grp = GROUP_BY_ID.get(gid);
      if (!grp) continue;
      const hasAny = grp.memberIds.some(id => selectedSet.has(id));
      if (!hasAny) {
        const leader = MOD_BY_ID.get(grp.leaderId);
        if (leader) {
          missingCoreSlots.push({
            groupId: grp.id,
            groupTitle: grp.title,
            leaderId: leader.id,
            leaderName: leader.name,
          });
        }
      }
    }
  }

  return {
    ...analysis,
    missingCoreSlots,
  };
}

export function getRecipeBridgeStatus(
  mod: ModItem,
  selectedSet: Set<string>,
  prefs?: AssemblyPreferences
): RecipeBridgeStatus {
  const hasEmi = selectedSet.has('emi');
  const hasJei = selectedSet.has('just-enough-items-jei');
  const hasTmrv = selectedSet.has('tmrv-updated');
  const viewerPref = prefs?.recipeViewer;

  if (mod.platform.includes('Sinytra')) {
    if (prefs && !prefs.allowSinytra) {
      return { compatible: false, reason: 'Прослойка Sinytra Connector выключена' };
    }
    if (selectedSet.has('sinytra-connector') && selectedSet.has('forgified-fabric-api')) {
      return { compatible: true, viaBridge: 'Через прослойку Sinytra Connector' };
    }
  }

  const allowsEmi = viewerPref === 'none' ? false : hasEmi || viewerPref === 'emi' || viewerPref === 'emi-jei';
  const allowsJei = viewerPref === 'none' ? false : hasJei || viewerPref === 'jei' || viewerPref === 'emi-jei';

  if (mod.id === 'emi') {
    if (viewerPref === 'jei' || viewerPref === 'none') {
      return { compatible: false, reason: viewerPref === 'none' ? 'Просмотрщик рецептов отключён' : 'Выбран режим JEI' };
    }
    return { compatible: true };
  }

  if (mod.id === 'just-enough-items-jei') {
    if (viewerPref === 'emi' || viewerPref === 'none') {
      return { compatible: false, reason: viewerPref === 'none' ? 'Просмотрщик рецептов отключён' : 'Выбран режим чистого EMI (без JEI)' };
    }
    return { compatible: true };
  }

  const eco = mod.recipeEcosystem;
  if (!eco) return { compatible: true };

  if (eco === 'emi-only') {
    if (viewerPref === 'jei' || viewerPref === 'none') {
      return { compatible: false, reason: 'Аддон работает только с EMI' };
    }
    if (!allowsEmi && (hasJei || viewerPref !== undefined)) {
      return { compatible: false, reason: 'Требует установленный EMI' };
    }
    return { compatible: true };
  }

  if (eco === 'tmrv-bridge') {
    if (viewerPref === 'none' || viewerPref === 'jei') {
      return { compatible: false, reason: 'Прослойка нужна только для EMI без JEI' };
    }
    if (hasJei || viewerPref === 'emi-jei') {
      return { compatible: false, reason: 'Не нужен при наличии JEI (EMI сам подхватит JEI)' };
    }
    if (!allowsEmi) {
      return { compatible: false, reason: 'Требует установленный EMI' };
    }
    return { compatible: true, viaBridge: 'Прослойка JEI-плагинов для EMI' };
  }

  if (eco === 'jei-engine') {
    if (viewerPref === 'emi' || viewerPref === 'none') {
      return { compatible: false, reason: 'Работает только с самим JEI (не работает в чистом EMI)' };
    }
    if (!allowsJei && (hasEmi || viewerPref !== undefined)) {
      return { compatible: false, reason: 'Требует сам JEI (не работает через TMRV)' };
    }
    return { compatible: true };
  }

  if (eco === 'jei-plugin') {
    if (viewerPref === 'none') {
      return { compatible: false, reason: 'Просмотрщик рецептов отключён' };
    }
    if (allowsJei && viewerPref !== 'emi') {
      if (hasEmi) return { compatible: true, viaBridge: 'Нативный мост EMI + JEI' };
      return { compatible: true };
    }
    if (allowsEmi) {
      if (hasTmrv) {
        return { compatible: true, viaBridge: 'Через прослойку TMRV Updated (EMI)' };
      }
      return { compatible: false, reason: 'В чистом EMI не работает без прослойки TMRV Updated' };
    }
    return { compatible: true };
  }

  if (eco === 'emi-or-jei') {
    if (viewerPref === 'none' && mod.id !== 'fast-recipe-search') {
      return { compatible: false, reason: 'Требует JEI или EMI' };
    }
    return { compatible: true };
  }

  return { compatible: true };
}

export function getModSuperseder(
  mod: ModItem,
  selectedSet?: Set<string>,
  prefs?: AssemblyPreferences,
  allowGlobalSupersede = false
): SupersederInfo | null {
  const activeSet = selectedSet ?? new Set<string>();

  if (mod.supersededWhenAll && mod.supersededWhenAll.length > 0) {
    if (mod.supersededWhenAll.every(id => activeSet.has(id))) {
      const names = mod.supersededWhenAll.map(id => MOD_BY_ID.get(id)?.name || id);
      return {
        byNames: names,
        isActiveInSelection: true,
        reason: `полностью перекрывается более лучшей связкой: ${names.join(' + ')}`,
      };
    }
  }

  if (mod.supersededBy && mod.supersededBy.length > 0) {
    const activeBest = mod.supersededBy.filter(id => activeSet.has(id));
    if (activeBest.length > 0) {
      const names = activeBest.map(id => MOD_BY_ID.get(id)?.name || id);
      return {
        byNames: names,
        isActiveInSelection: true,
        reason: `полностью перекрывается более лучшим: ${names.join(' / ')}`,
      };
    }

    if (allowGlobalSupersede) {
      const viableBest = mod.supersededBy.filter(id => {
        const bm = MOD_BY_ID.get(id);
        if (!bm || isUnsupportedOnForge(bm)) return false;
        if (prefs && !getRecipeBridgeStatus(bm, activeSet, prefs).compatible) return false;
        if (hasAnyConflictInSet(bm.id, activeSet)) return false;
        return true;
      });
      if (viableBest.length > 0) {
        const names = viableBest.map(id => MOD_BY_ID.get(id)?.name || id);
        return {
          byNames: names,
          isActiveInSelection: false,
          reason: `есть более совершенный аналог: ${names.join(' / ')}`,
        };
      }
    }
  }

  if (mod.coveredBy) {
    let activeCover = false;
    const coverLower = MOD_COVERED_BY_LOWER.get(mod.id) ?? mod.coveredBy.toLowerCase();
    for (const id of activeSet) {
      const other = MOD_BY_ID.get(id);
      if (other && (other.name === mod.coveredBy || coverLower.includes(other.name.toLowerCase()))) {
        activeCover = true;
        break;
      }
    }
    if (activeCover || allowGlobalSupersede) {
      return {
        byNames: [mod.coveredBy],
        isActiveInSelection: activeCover,
        reason: `уже встроено в ${mod.coveredBy}`,
      };
    }
  }

  return null;
}

export function getModRestrictionBadge(
  mod: ModItem,
  selectedSet: Set<string>,
  prefs?: AssemblyPreferences
): { text: string; tone: 'red' | 'amber' | 'violet' | 'sky' } | null {
  if (mod.status === 'danger') {
    return { text: 'Опасно / Плацебо', tone: 'red' };
  }
  if (isUnsupportedOnForge(mod)) {
    const swapId = FABRIC_TO_FORGE_SWAP[mod.id];
    const swapName = swapId ? MOD_BY_ID.get(swapId)?.name : null;
    return {
      text: swapName ? `Только Fabric → есть ${swapName}` : 'Не работает на Forge',
      tone: 'red',
    };
  }

  const sup = getModSuperseder(mod, selectedSet, prefs, true);
  if (sup) {
    return {
      text: mod.coveredBy ? `Уже в ${mod.coveredBy}` : `Перекрыт: ${sup.byNames[0]}`,
      tone: 'amber',
    };
  }

  const bridge = getRecipeBridgeStatus(mod, selectedSet, prefs);
  if (!bridge.compatible) {
    return {
      text: bridge.reason || 'Не подходит к просмотрщику рецептов',
      tone: 'red',
    };
  }

  if (!selectedSet.has(mod.id)) {
    const activeConflicts = getRuleConflictingIds(mod.id)
      .filter(id => selectedSet.has(id))
      .map(id => MOD_BY_ID.get(id)?.name)
      .filter((n): n is string => Boolean(n));
    if (activeConflicts.length > 0) {
      return {
        text: `Конфликт с ${activeConflicts.slice(0, 2).join(', ')}`,
        tone: 'red',
      };
    }

    const missingDeps = getDirectDependencies(mod.id, selectedSet)
      .filter(id => !selectedSet.has(id))
      .map(id => MOD_BY_ID.get(id)?.name)
      .filter((n): n is string => Boolean(n));
    if (missingDeps.length > 0) {
      return {
        text: `Нужен ${missingDeps.join(' + ')}`,
        tone: 'sky',
      };
    }
  }

  if (bridge.viaBridge && mod.recipeEcosystem === 'jei-plugin') {
    return { text: bridge.viaBridge, tone: 'sky' };
  }

  if (mod.id === 'nvidium' && prefs && prefs.gpu !== 'nvidia') {
    return { text: 'Только NVIDIA GTX 16xx/RTX', tone: 'violet' };
  }
  if (mod.id === 'accelerated-rendering' && prefs && (prefs.goal === 'potato' || prefs.gpu === 'integrated')) {
    return { text: 'OpenGL 4.6 · жрёт VRAM (опасно для встройки)', tone: 'amber' };
  }
  return null;
}

export function isModIncompatibleWithSelection(
  mod: ModItem,
  selectedSet: Set<string>,
  prefs?: AssemblyPreferences
): boolean {
  if (selectedSet.has(mod.id)) return false;
  if (isUnsupportedOnForge(mod)) return true;

  if (!getRecipeBridgeStatus(mod, selectedSet, prefs).compatible) {
    return true;
  }

  if (hasAnyConflictInSet(mod.id, selectedSet)) {
    return true;
  }

  const deps = getTransitiveDependencies(mod.id, new Set(), selectedSet);
  if (
    deps.some(
      depId =>
        !selectedSet.has(depId) &&
        hasAnyConflictInSet(depId, selectedSet)
    )
  ) {
    return true;
  }

  if (
    prefs &&
    !prefs.allowSinytra &&
    (mod.platform.includes('Sinytra') || deps.includes('sinytra-connector'))
  ) {
    return true;
  }

  return false;
}

export function shouldHideMod(
  mod: ModItem,
  selectedSet: Set<string>,
  prefs: AssemblyPreferences | undefined,
  options: { hideIncompatible: boolean; hideUselessCovered: boolean }
): boolean {
  if (selectedSet.has(mod.id)) return false;
  if (options.hideUselessCovered) {
    if (mod.status === 'danger') return true;
    if (isUnsupportedOnForge(mod)) return true;
    if (getModSuperseder(mod, selectedSet, prefs, true) !== null) return true;
  }
  if (options.hideIncompatible && isModIncompatibleWithSelection(mod, selectedSet, prefs)) {
    return true;
  }
  return false;
}

export function getGroupMembersByRole(groupId: string) {
  const group = GROUP_BY_ID.get(groupId);
  if (!group) return null;
  const leader = MOD_BY_ID.get(group.leaderId) || null;
  const addons = group.addonIds
    .map(id => MOD_BY_ID.get(id))
    .filter((m): m is ModItem => Boolean(m));
  const excludedSet = new Set([group.leaderId, ...group.addonIds]);
  const removedAnalogs = group.memberIds
    .filter(id => !excludedSet.has(id))
    .map(id => MOD_BY_ID.get(id))
    .filter((m): m is ModItem => Boolean(m));
  return { group, leader, addons, removedAnalogs };
}
