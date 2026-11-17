import metaData from './db/meta.json';
import renderMods from './db/mods-render.json';
import memoryCpuMods from './db/mods-memory-cpu.json';
import worldTpsMods from './db/mods-world-tps.json';
import netRecipesMiscMods from './db/mods-net-recipes-misc.json';
import groupsData from './db/groups.json';
import presetsData from './db/presets.json';
import rulesData from './db/rules.json';
import goldenData from './db/golden.json';

export const DATABASE_UPDATED_AT: string = metaData.updatedAt;

export type ModStatus = 'recommended' | 'useful' | 'outdated' | 'redundant' | 'danger' | 'diagnostic';
export type HealthTier = 'green' | 'yellow' | 'red';
export type RecipeEcosystem = 'jei-engine' | 'jei-plugin' | 'emi-only' | 'tmrv-bridge' | 'emi-or-jei';

export interface ModItem {
  id: string;
  name: string;
  category: string;
  platform: string;
  installed?: boolean;
  lastUpdated?: string;
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
  supersededBy?: string[];
  supersededWhenAll?: string[];
  recipeEcosystem?: RecipeEcosystem;
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

export type PresetCategory = 'nvidium' | 'max' | 'shaders' | 'server' | 'potato' | 'demo';

export interface ModPreset {
  id: string;
  name: string;
  category: PresetCategory;
  badge: string;
  badgeColor: 'emerald' | 'sky' | 'violet' | 'amber' | 'rose';
  description: string;
  crashRisk: string;
  modIds: string[];
}

export interface GoldenStandardEntry {
  name: string;
  role: string;
}

export const MODS_DATABASE: ModItem[] = [
  ...(renderMods as ModItem[]),
  ...(memoryCpuMods as ModItem[]),
  ...(worldTpsMods as ModItem[]),
  ...(netRecipesMiscMods as ModItem[]),
];

export const MOD_GROUPS: ModGroupInfo[] = groupsData as ModGroupInfo[];
export const MOD_PRESETS: ModPreset[] = presetsData as ModPreset[];
export const INCOMPATIBILITY_RULES: IncompatibilityRule[] = rulesData as IncompatibilityRule[];
export const GOLDEN_STANDARD_MODS: GoldenStandardEntry[] = goldenData as GoldenStandardEntry[];
