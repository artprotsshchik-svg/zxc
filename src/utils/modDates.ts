import modDatesJson from '../data/db/mod-dates.json';
import type { ModItem } from '../data/modsData.ts';

export const MOD_LAST_UPDATED_MAP: Record<string, string> = modDatesJson;

export function getModUpdatedLabel(mod: ModItem): string | undefined {
  return mod.lastUpdated || MOD_LAST_UPDATED_MAP[mod.id];
}
