import { MODS_DATABASE, type ModItem } from '../data/modsData.ts';

function normalizeJarToken(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\.jar(\.disabled)?$/i, '')
    .replace(/[-_+]mc?1\.\d+(\.\d+)?/gi, '')
    .replace(/[-_+](forge|neoforge|fabric|quilt|universal)\b/gi, '')
    .replace(/[-_+ ]v?\d+\.\d+.*$/i, '')
    .replace(/[^a-z0-9]+/g, '');
}

const JAR_ALIASES: Record<string, string> = {
  embeddium: 'embeddium',
  emberbium: 'emberbium',
  nvidium: 'nvidium',
  alloyium: 'alloyium',
  oculus: 'oculus',
  emberlens: 'emberlens',
  flerovium: 'flerovium',
  immediatelyfast: 'immediatelyfast',
  modernfix: 'modernfix',
  ferritecore: 'ferritecore',
  alltheleaks: 'alltheleaks-memory-leak-fix',
  badoptimizations: 'badoptimizations',
  capabilityfixrevived: 'capability-fix-revived',
  compactf3plus: 'compact-f3-plus',
  culllessleavesreforged: 'culllessleaves-reforged',
  culllessleaves: 'culllessleaves-reforged',
  eber: 'enhanced-block-entities-reloaded',
  enhancedblockentitiesreloaded: 'enhanced-block-entities-reloaded',
  enhancedblockentities: 'enhanced-block-entities-reloaded',
  fastsounds: 'fast-sounds',
  soundgc: 'soundgc',
  particlecore: 'particle-core',
  fzzyconfig: 'fzzy-config',
  kotlinforforge: 'kotlin-for-forge',
  kffmod: 'kotlin-for-forge',
  matlib: 'matlib',
  immersiveoptimization: 'immersive-optimization',
  ixeris: 'ixeris',
  jasione: 'jasione',
  kerria: 'kerria',
  noisiumed: 'noisiumed',
  packetfixer: 'packet-fixer',
  radiumrereforged: 'radium-re-reforged',
  radium: 'radium-re-reforged',
  resourcefulconfig: 'resourceful-config',
  connectorextras: 'connector-extras',
  connector: 'sinytra-connector',
  sinytraconnector: 'sinytra-connector',
  forgifiedfabricapi: 'forgified-fabric-api',
  fabricapi: 'forgified-fabric-api',
  sodiumdynamiclights: 'sodium-embeddium-dynamic-lights',
  sodiumoptionsapi: 'sodium-embeddium-options-api',
  solix: 'solix',
  structurelayoutoptimizer: 'structure-layout-optimizer',
  c2mef: 'concurrent-chunk-management-engine-forge-c2me',
  c2me: 'concurrent-chunk-management-engine-forge-c2me',
  connectivity: 'connectivity',
  cupboard: 'cupboard',
  kryptonreno: 'krypton-reno',
  servercore: 'servercore',
  entityculling: 'entity-culling',
  morecullingreforged: 'more-culling-reforged',
  clumps: 'clumps',
  dynamicfps: 'dynamic-fps',
  acceleratedrendering: 'accelerated-rendering',
  threadtweak: 'threadtweak-reforged',
};

const { MOD_TOKEN_INDEX, MOD_BY_ID_MAP } = (() => {
  const index = new Map<string, ModItem>();
  const byId = new Map<string, ModItem>();
  for (const mod of MODS_DATABASE) {
    byId.set(mod.id, mod);
    const idNorm = mod.id.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const nameNorm = mod.name.replace(/[^a-z0-9]/gi, '').toLowerCase();
    if (idNorm.length >= 4 && !index.has(idNorm)) index.set(idNorm, mod);
    if (nameNorm.length >= 4 && !index.has(nameNorm)) index.set(nameNorm, mod);
  }
  return { MOD_TOKEN_INDEX: index, MOD_BY_ID_MAP: byId };
})();

export function matchJarFilenamesToMods(jarFiles: string[]): {
  matchedIds: string[];
  unmatchedJars: string[];
} {
  const matchedSet = new Set<string>();
  const unmatchedJars: string[] = [];

  for (const jar of jarFiles) {
    const rawLower = jar.toLowerCase();
    if (rawLower.includes('c2me') && rawLower.includes('fabric')) {
      matchedSet.add('c2me-concurrent-chunk-management-engine');
      continue;
    }
    if (rawLower.includes('vmp') && rawLower.includes('fabric')) {
      matchedSet.add('very-many-players-vmp');
      continue;
    }

    const token = normalizeJarToken(jar);
    if (!token) {
      unmatchedJars.push(jar);
      continue;
    }

    const directAliasId = JAR_ALIASES[token];
    if (directAliasId) {
      matchedSet.add(directAliasId);
      continue;
    }

    const exact = MOD_TOKEN_INDEX.get(token);
    if (exact) {
      matchedSet.add(exact.id);
      continue;
    }

    let partialHit: ModItem | undefined;
    for (const [aliasKey, modId] of Object.entries(JAR_ALIASES)) {
      if (token.startsWith(aliasKey) && token.length - aliasKey.length <= 6) {
        matchedSet.add(modId);
        partialHit = MOD_BY_ID_MAP.get(modId);
        break;
      }
    }

    if (!partialHit) {
      unmatchedJars.push(jar);
    }
  }

  return {
    matchedIds: Array.from(matchedSet),
    unmatchedJars,
  };
}
