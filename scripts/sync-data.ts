import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  DATABASE_UPDATED_AT,
  MODS_DATABASE,
  MOD_GROUPS,
  MOD_PRESETS,
  INCOMPATIBILITY_RULES,
  GOLDEN_STANDARD_MODS,
} from '../src/data/modsData.ts';

const outDir = path.resolve('public/data');
fs.mkdirSync(outDir, { recursive: true });

const bundle = {
  schemaVersion: 2,
  updatedAt: DATABASE_UPDATED_AT,
  mods: MODS_DATABASE,
  groups: MOD_GROUPS,
  presets: MOD_PRESETS,
  rules: INCOMPATIBILITY_RULES,
  golden: GOLDEN_STANDARD_MODS,
};

const bundleJson = JSON.stringify(bundle);
const sha256 = crypto.createHash('sha256').update(bundleJson).digest('hex');

const manifest = {
  schemaVersion: 2,
  updatedAt: DATABASE_UPDATED_AT,
  sha256,
  bytes: Buffer.byteLength(bundleJson, 'utf-8'),
  counts: {
    mods: MODS_DATABASE.length,
    groups: MOD_GROUPS.length,
    presets: MOD_PRESETS.length,
    rules: INCOMPATIBILITY_RULES.length,
    golden: GOLDEN_STANDARD_MODS.length,
  },
  bundleFile: 'db-bundle.json',
};

fs.writeFileSync(path.join(outDir, 'db-bundle.json'), bundleJson + '\n', 'utf-8');
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf-8');

console.log(
  `Synced hot-update bundle: updatedAt=${DATABASE_UPDATED_AT}, mods=${manifest.counts.mods}, presets=${manifest.counts.presets}, sha256=${sha256.slice(0, 12)}`
);
