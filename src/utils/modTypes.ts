import type { IncompatibilityRule } from '../data/modsData.ts';

export interface ConflictDetection {
  rule: IncompatibilityRule;
  matchedIds: string[];
  matchedNames: string[];
}

export interface DependencyWarning {
  modId: string;
  modName: string;
  severity: 'red' | 'orange' | 'yellow';
  message: string;
  fixModIds?: string[];
}

export interface DiagnosticIssue {
  id: string;
  kind: 'conflict' | 'runtime' | 'dependency' | 'redundant' | 'platform';
  severity: 'red' | 'orange' | 'yellow';
  title: string;
  betweenIds: string[];
  betweenNames: string[];
  problem: string;
  bestSolution: string;
  addIds?: string[];
  removeIds?: string[];
  keepPreferredId?: string;
}

export interface DualPortPair {
  id: string;
  title: string;
  forgeModId: string;
  forgeLabel: string;
  forgeSummary: string;
  fabricModId: string;
  fabricLabel: string;
  fabricSummary: string;
  switchableOnForge: boolean;
  altForgeIds?: string[];
  altFabricIds?: string[];
}

export type CheckerTier = 'green' | 'lime' | 'yellow' | 'orange' | 'red';

export type PortStrategy = 'native-forge' | 'hybrid' | 'fabric-sinytra';
export type RecipeViewerChoice = 'none' | 'jei' | 'emi' | 'emi-jei';

export interface AssemblyPreferences {
  gpu: 'nvidia' | 'amd-intel' | 'integrated';
  mode: 'singleplayer' | 'server' | 'hybrid-server';
  useShaders: boolean;
  useCreate: boolean;
  allowSinytra: boolean;
  portStrategy?: PortStrategy;
  recipeViewer?: RecipeViewerChoice;
  goal: 'balanced' | 'max-safe' | 'potato';
  focusModId?: string | null;
}

export const INITIAL_BUILDER_PREFS: AssemblyPreferences = {
  gpu: 'nvidia',
  mode: 'singleplayer',
  useShaders: false,
  useCreate: false,
  allowSinytra: true,
  portStrategy: 'hybrid',
  recipeViewer: 'jei',
  goal: 'balanced',
  focusModId: null,
};

export interface ExcludedModNote {
  name: string;
  reason: string;
}

export interface SmartAssemblyResult {
  modIds: string[];
  notes: string[];
  excluded: ExcludedModNote[];
}

export interface SmartToggleResult {
  nextIds: string[];
  notice: string | null;
  noticeTone: 'info' | 'warn';
}

export interface MissingSlotWarning {
  groupId: string;
  groupTitle: string;
  leaderId: string;
  leaderName: string;
}

export interface RecipeBridgeStatus {
  compatible: boolean;
  viaBridge?: string;
  reason?: string;
}

export interface SupersederInfo {
  byNames: string[];
  isActiveInSelection: boolean;
  reason: string;
}
