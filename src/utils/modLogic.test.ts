import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DATABASE_UPDATED_AT,
  GOLDEN_STANDARD_MODS,
  MODS_DATABASE,
  MOD_GROUPS,
  MOD_PRESETS,
} from '../data/modsData.ts';
import {
  DUAL_PORT_PAIRS,
  analyzeSelection,
  buildSmartAssembly,
  evaluateAssemblyHealth,
  findModByDisplayName,
  formatAssemblyTreeText,
  formatModNamesListText,
  getBaseHealthTier,
  getCheckerTier,
  getDualPortPairForMod,
  getGroupMembersByRole,
  getModRestrictionBadge,
  getModSuperseder,
  getModUpdatedLabel,
  getRecipeBridgeStatus,
  isUnsupportedOnForge,
  organizeAssemblyTree,
  removeModsCascade,
  shouldHideMod,
  smartFixAssembly,
  toggleModSmart,
  INITIAL_BUILDER_PREFS,
  type AssemblyPreferences,
} from './modLogic.ts';

test('all mods have valid CurseForge URLs, non-empty fields, and 100% MOD_GROUPS coverage', () => {
  assert.ok(MODS_DATABASE.length >= 500);
  const groupedIds = new Set(MOD_GROUPS.flatMap(g => g.memberIds));
  const ungrouped = MODS_DATABASE.filter(m => !groupedIds.has(m.id)).map(m => m.id);
  assert.deepEqual(ungrouped, [], `Found ungrouped mods: ${ungrouped.join(', ')}`);

  for (const mod of MODS_DATABASE) {
    assert.ok(mod.id.length > 0, `Empty id for ${mod.name}`);
    assert.ok(mod.curseforgeUrl.startsWith('https://www.curseforge.com/'), `Invalid URL for ${mod.name}: ${mod.curseforgeUrl}`);
    assert.ok(mod.platform.length > 0, `Empty platform for ${mod.name}`);
  }
});

test('all core Nvidium and Alloyium presets have zero conflicts, zero red warnings, and zero yellow warnings', () => {
  assert.equal(MOD_PRESETS.length, 2, `Expected 2 core Nvidium/Alloyium presets, got ${MOD_PRESETS.length}`);
  assert.ok(MOD_PRESETS.every(p => p.modIds.includes('nvidium') || p.modIds.includes('alloyium')));

  for (const preset of MOD_PRESETS) {
    const analysis = analyzeSelection(preset.modIds);
    assert.equal(
      analysis.conflicts.length,
      0,
      `Preset "${preset.id}" has unexpected conflicts: ${analysis.conflicts.map(c => c.matchedNames.join('+')).join('; ')}`
    );
    assert.equal(
      analysis.warnings.length,
      0,
      `Preset "${preset.id}" has unexpected warnings: ${analysis.warnings.map(w => `${w.modName}: ${w.message}`).join('; ')}`
    );

    const warningByMod = new Map<string, 'red' | 'yellow'>();
    for (const w of analysis.warnings) {
      const prev = warningByMod.get(w.modId);
      warningByMod.set(w.modId, prev === 'red' || w.severity === 'red' ? 'red' : 'yellow');
    }

    for (const mod of analysis.selectedMods) {
      const tier = getCheckerTier(mod, analysis.conflictingIdSet, warningByMod.get(mod.id));
      assert.notEqual(
        tier.tier,
        'red',
        `Core preset "${preset.id}" contains RED mod "${mod.name}" (${tier.reason})`
      );
    }
  }
});

test('incompatible mod mix triggers expected conflicts and red warnings', () => {
  const analysis = analyzeSelection([
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
    'tickaccelerate',
  ]);
  assert.ok(analysis.conflicts.length >= 5, `Expected >=5 conflicts, got ${analysis.conflicts.length}`);
  assert.ok(analysis.conflictingIdSet.has('optifine'));
  assert.ok(analysis.conflictingIdSet.has('nvidium'));
  assert.ok(analysis.conflictingIdSet.has('oculus'));
  assert.ok(analysis.conflictingIdSet.has('radium-re-reforged'));
  assert.ok(analysis.conflictingIdSet.has('solix'));
});

test('(Sodium) Chloride + Embeddium + Embeddium Extras + Alloyium have zero conflicts, whereas Xenon + Embeddium conflicts', () => {
  const clean = analyzeSelection(['embeddium', 'embeddium-extras', 'sodium-chloride', 'alloyium']);
  assert.equal(clean.conflicts.length, 0);
  assert.equal(clean.warnings.length, 0);

  const clash = analyzeSelection(['embeddium', 'xenon']);
  assert.equal(clash.conflicts.length, 1);
  assert.ok(clash.conflictingIdSet.has('embeddium'));
  assert.ok(clash.conflictingIdSet.has('xenon'));
});

test('LightStar does not conflict with Solix (client cache vs server light engine)', () => {
  const res = analyzeSelection(['embeddium', 'solix', 'lightstar']);
  assert.equal(res.conflicts.length, 0);
});

test('Fabric-only originals (Lithium, Krypton) are flagged red for Forge while their Forge ports (Radium Re-Reforged, Krypton Reno) are green', () => {
  const lithium = MODS_DATABASE.find(m => m.id === 'lithium');
  const krypton = MODS_DATABASE.find(m => m.id === 'krypton');
  const radium = MODS_DATABASE.find(m => m.id === 'radium-re-reforged');
  const kryptonReno = MODS_DATABASE.find(m => m.id === 'krypton-reno');
  const entityCulling = MODS_DATABASE.find(m => m.id === 'entity-culling');
  const dynamicFps = MODS_DATABASE.find(m => m.id === 'dynamic-fps');
  const clumps = MODS_DATABASE.find(m => m.id === 'clumps');
  const fastSuite = MODS_DATABASE.find(m => m.id === 'fastsuite');

  assert.ok(lithium && krypton && radium && kryptonReno && entityCulling && dynamicFps && clumps && fastSuite);
  assert.equal(isUnsupportedOnForge(lithium), true);
  assert.equal(isUnsupportedOnForge(krypton), true);
  assert.equal(getCheckerTier(lithium, new Set()).tier, 'red');
  assert.equal(getCheckerTier(krypton, new Set()).tier, 'red');

  for (const goodMod of [radium, kryptonReno, entityCulling, dynamicFps, clumps]) {
    assert.equal(isUnsupportedOnForge(goodMod), false);
    assert.equal(getCheckerTier(goodMod, new Set()).tier, 'green', `${goodMod.name} should be green`);
  }

  assert.equal(isUnsupportedOnForge(fastSuite), false);
  assert.equal(getCheckerTier(fastSuite, new Set()).tier, 'lime');
  assert.equal(getBaseHealthTier(fastSuite), 'lime');

  const nvidium = MODS_DATABASE.find(m => m.id === 'nvidium')!;
  const fastchest = MODS_DATABASE.find(m => m.id === 'fastchest-revived')!;
  const kryptonHybrid = MODS_DATABASE.find(m => m.id === 'krypton-hybrid')!;
  assert.equal(getBaseHealthTier(nvidium), 'yellow');
  assert.equal(getBaseHealthTier(fastchest), 'yellow');
  assert.equal(getBaseHealthTier(kryptonHybrid), 'lime');

  const nfCheck = analyzeSelection(['embeddium', 'krypton-foxified']);
  assert.equal(nfCheck.warnings.length, 1);
  assert.equal(nfCheck.warnings[0].severity, 'yellow');
});

test('Nvidium conflicts with Alloyium and Oculus, while Emberlens requires Emberbium and conflicts with Oculus/Embeddium', () => {
  const nvidiumAlloyium = analyzeSelection(['embeddium', 'sinytra-connector', 'forgified-fabric-api', 'nvidium', 'alloyium']);
  assert.ok(nvidiumAlloyium.conflicts.length >= 1);
  assert.ok(nvidiumAlloyium.conflictingIdSet.has('nvidium'));
  assert.ok(nvidiumAlloyium.conflictingIdSet.has('alloyium'));

  const oculusEmberlens = analyzeSelection(['emberbium', 'oculus', 'emberlens']);
  assert.ok(oculusEmberlens.conflicts.length >= 1);
  assert.ok(oculusEmberlens.conflictingIdSet.has('oculus'));
  assert.ok(oculusEmberlens.conflictingIdSet.has('emberlens'));

  const cleanEmberlens = analyzeSelection(['emberbium', 'emberlens']);
  assert.equal(cleanEmberlens.conflicts.length, 0);
  assert.equal(cleanEmberlens.warnings.length, 0);
});

test('Alloyium is an addon of Embeddium in core-renderer group', () => {
  const group = getGroupMembersByRole('core-renderer');
  assert.ok(group);
  assert.equal(group.leader?.id, 'embeddium');
  assert.ok(group.addons.some(a => a.id === 'alloyium'));
  assert.ok(group.addons.some(a => a.id === 'sodium-chloride'));
  assert.ok(group.removedAnalogs.some(r => r.id === 'xenon'));
});

test('buildSmartAssembly adapts to gpu, server mode, goal, shaders, create, and sinytra with zero conflicts', () => {
  const profiles: AssemblyPreferences[] = [
    { gpu: 'nvidia', mode: 'singleplayer', useShaders: false, useCreate: false, allowSinytra: true, goal: 'balanced' },
    { gpu: 'nvidia', mode: 'server', useShaders: true, useCreate: true, allowSinytra: true, goal: 'max-safe' },
    { gpu: 'amd-intel', mode: 'hybrid-server', useShaders: false, useCreate: true, allowSinytra: false, goal: 'max-safe' },
    { gpu: 'integrated', mode: 'singleplayer', useShaders: false, useCreate: false, allowSinytra: false, goal: 'potato' },
  ];

  for (const prefs of profiles) {
    const { modIds, notes, excluded } = buildSmartAssembly(prefs);
    assert.ok(notes.length > 0);
    assert.ok(excluded.length > 0);

    const analysis = analyzeSelection(modIds);
    assert.equal(analysis.conflicts.length, 0, `Smart assembly had conflicts for ${JSON.stringify(prefs)}`);

    const redWarnings = analysis.warnings.filter(w => w.severity === 'red');
    assert.equal(redWarnings.length, 0, `Smart assembly had red warnings for ${JSON.stringify(prefs)}: ${redWarnings.map(w => w.message).join('; ')}`);

    if (prefs.allowSinytra && prefs.gpu === 'nvidia' && !prefs.useShaders && prefs.goal !== 'potato') {
      assert.ok(modIds.includes('nvidium'));
      assert.ok(!modIds.includes('alloyium'));
      assert.ok(!modIds.includes('oculus'));
    }
    if (prefs.useShaders && prefs.goal !== 'potato') {
      assert.ok(modIds.includes('oculus'));
      assert.ok(!modIds.includes('emberlens'));
      assert.ok(!modIds.includes('nvidium'));
    }
    if (prefs.mode === 'hybrid-server') {
      assert.ok(modIds.includes('krypton-hybrid'));
      assert.ok(!modIds.includes('krypton-reno'));
    } else {
      assert.ok(modIds.includes('krypton-reno'));
    }
    if (prefs.goal === 'max-safe') {
      assert.ok(modIds.includes('fastsuite'));
      assert.ok(modIds.includes('structure-dfu-cache'));
    }
    if (prefs.goal === 'balanced') {
      assert.ok(!modIds.includes('fastsuite'));
    }
  }
});

test('toggleModSmart pulls transitive deps, resolves cross-group conflicts, swaps Fabric originals, and cascades removals', () => {
  // Choosing Emberlens pulls Emberbium and removes Embeddium & Nvidium
  const startWithNvidium = ['embeddium', 'sinytra-connector', 'forgified-fabric-api', 'nvidium'];
  const pickEmberlens = toggleModSmart(startWithNvidium, 'emberlens', { strict: true });
  assert.ok(pickEmberlens.nextIds.includes('emberlens'));
  assert.ok(pickEmberlens.nextIds.includes('emberbium'));
  assert.ok(!pickEmberlens.nextIds.includes('embeddium'));
  assert.ok(!pickEmberlens.nextIds.includes('nvidium'));

  // Picking Nvidium afterwards keeps Emberbium (alternative dep satisfied via .connector) and drops conflicting Emberlens
  const pickNvidiumBack = toggleModSmart(pickEmberlens.nextIds, 'nvidium', { strict: true });
  assert.ok(pickNvidiumBack.nextIds.includes('nvidium'));
  assert.ok(pickNvidiumBack.nextIds.includes('emberbium'));
  assert.ok(!pickNvidiumBack.nextIds.includes('emberlens'));

  // Picking Nvidium with no renderer yet pulls Embeddium by default
  const pickNvidiumFresh = toggleModSmart([], 'nvidium', { strict: true });
  assert.ok(pickNvidiumFresh.nextIds.includes('nvidium'));
  assert.ok(pickNvidiumFresh.nextIds.includes('embeddium'));

  // Removing Emberbium cascades to Nvidium when Embeddium is absent
  const dropEmberbium = toggleModSmart(pickNvidiumBack.nextIds, 'emberbium', { strict: true });
  assert.ok(!dropEmberbium.nextIds.includes('emberbium'));
  assert.ok(!dropEmberbium.nextIds.includes('nvidium'));

  // Picking Fabric Lithium in strict mode swaps to Radium Re-Reforged
  const swapLithium = toggleModSmart(['embeddium'], 'lithium', { strict: true });
  assert.ok(!swapLithium.nextIds.includes('lithium'));
  assert.ok(swapLithium.nextIds.includes('radium-re-reforged'));

  // Picking danger mod MemGuard in strict mode is blocked
  const blockDanger = toggleModSmart(['embeddium'], 'memguard', { strict: true });
  assert.equal(blockDanger.nextIds.includes('memguard'), false);
  assert.equal(blockDanger.noticeTone, 'warn');

  // removeModsCascade removes dependents when clearing a slot
  const cascade = removeModsCascade(['embeddium', 'lightstar', 'modernfix'], ['embeddium']);
  assert.deepEqual(cascade.nextIds, ['modernfix']);
});

test('smartFixAssembly repairs broken mixes and evaluateAssemblyHealth spots missing core slots', () => {
  const broken = ['optifine', 'embeddium', 'xenon', 'lithium', 'nvidium', 'oculus', 'memguard', 'redirected', 'jasione'];
  const repaired = smartFixAssembly(broken);
  const analysis = analyzeSelection(repaired);

  assert.equal(analysis.conflicts.length, 0);
  assert.equal(analysis.warnings.filter(w => w.severity === 'red').length, 0);
  assert.ok(repaired.includes('embeddium'));
  assert.ok(repaired.includes('radium-re-reforged'));
  assert.ok(!repaired.includes('optifine'));
  assert.ok(!repaired.includes('memguard'));
  assert.ok(!repaired.includes('redirected'));

  const incompleteHealth = evaluateAssemblyHealth(['modernfix']);
  assert.ok(incompleteHealth.missingCoreSlots.some(s => s.groupId === 'core-renderer'));
  assert.ok(incompleteHealth.missingCoreSlots.some(s => s.groupId === 'tick-physics-engine'));

  const nvidiumMod = MODS_DATABASE.find(m => m.id === 'nvidium')!;
  const restriction = getModRestrictionBadge(nvidiumMod, new Set(['oculus']));
  assert.ok(restriction?.text.includes('Oculus'));
});

test('verified Forge 1.20.1 ports exist, classify accurately, and respect mutual exclusivity', () => {
  const forgePorts = [
    'vmp-forge',
    'pluto',
    'fastload',
    'lazydfu-forge',
    'noisium',
    'nvidium-forged',
    'sodium-embeddium-options-api',
    'sodium-embeddium-dynamic-lights',
    'concurrent-chunk-management-engine-forge-c2me',
    'c2mer',
  ];

  for (const id of forgePorts) {
    const mod = MODS_DATABASE.find(m => m.id === id);
    assert.ok(mod, `Expected Forge port "${id}" in MODS_DATABASE`);
    assert.ok(mod.curseforgeUrl.startsWith('https://www.curseforge.com/minecraft/mc-mods/'), `Unexpected CF URL for ${id}: ${mod.curseforgeUrl}`);
    assert.equal(isUnsupportedOnForge(mod), false, `Forge port "${id}" should not be flagged unsupported on Forge`);
  }

  // Verified uncertain/outdated mods must be yellow instead of green/lime
  const memLeakFix = MODS_DATABASE.find(m => m.id === 'memory-leak-fix-modern-port')!;
  const quickPack = MODS_DATABASE.find(m => m.id === 'quick-pack')!;
  const nvidiumForged = MODS_DATABASE.find(m => m.id === 'nvidium-forged')!;
  assert.equal(getBaseHealthTier(memLeakFix), 'yellow');
  assert.equal(getCheckerTier(memLeakFix, new Set()).tier, 'yellow');
  assert.equal(getBaseHealthTier(quickPack), 'yellow');
  assert.equal(getCheckerTier(quickPack, new Set()).tier, 'yellow');
  assert.equal(getBaseHealthTier(nvidiumForged), 'yellow');

  // Mutual exclusions between ports and originals
  assert.ok(analyzeSelection(['vmp-forge', 'very-many-players-vmp']).conflicts.length >= 1);
  assert.ok(analyzeSelection(['noisium', 'noisiumed']).conflicts.length >= 1);
  assert.ok(analyzeSelection(['pluto', 'krypton-reno']).conflicts.length >= 1);
});

test('buildSmartAssembly supports focusModId anchoring across conflicting pipelines', () => {
  const basePrefs: AssemblyPreferences = {
    gpu: 'nvidia',
    mode: 'singleplayer',
    useShaders: false,
    useCreate: false,
    allowSinytra: true,
    goal: 'balanced',
  };

  // Anchor Alloyium -> excludes Nvidium even on NVIDIA + allowSinytra
  const alloyiumBuild = buildSmartAssembly({ ...basePrefs, focusModId: 'alloyium' });
  assert.ok(alloyiumBuild.modIds.includes('alloyium'));
  assert.ok(alloyiumBuild.modIds.includes('embeddium'));
  assert.ok(!alloyiumBuild.modIds.includes('nvidium'));
  assert.equal(analyzeSelection(alloyiumBuild.modIds).conflicts.length, 0);

  // Anchor Emberlens -> pulls Emberbium, strips Embeddium, Oculus, Nvidium, Alloyium cleanly
  const emberlensBuild = buildSmartAssembly({ ...basePrefs, focusModId: 'emberlens' });
  assert.ok(emberlensBuild.modIds.includes('emberlens'));
  assert.ok(emberlensBuild.modIds.includes('emberbium'));
  assert.ok(!emberlensBuild.modIds.includes('embeddium'));
  assert.ok(!emberlensBuild.modIds.includes('oculus'));
  assert.ok(!emberlensBuild.modIds.includes('nvidium'));
  assert.ok(!emberlensBuild.modIds.includes('alloyium'));
  const emberAnalysis = analyzeSelection(emberlensBuild.modIds);
  assert.equal(emberAnalysis.conflicts.length, 0);
  assert.equal(emberAnalysis.warnings.filter(w => w.severity === 'red').length, 0);

  // Anchor VMP Forge -> pulls VMP Forge and drops Fabric VMP + Sinytra if not needed
  const vmpBuild = buildSmartAssembly({ ...basePrefs, focusModId: 'vmp-forge' });
  assert.ok(vmpBuild.modIds.includes('vmp-forge'));
  assert.ok(!vmpBuild.modIds.includes('very-many-players-vmp'));
  assert.equal(analyzeSelection(vmpBuild.modIds).conflicts.length, 0);

  // Anchor Pluto -> replaces Krypton Reno cleanly
  const plutoBuild = buildSmartAssembly({ ...basePrefs, focusModId: 'pluto' });
  assert.ok(plutoBuild.modIds.includes('pluto'));
  assert.ok(!plutoBuild.modIds.includes('krypton-reno'));
  assert.equal(analyzeSelection(plutoBuild.modIds).conflicts.length, 0);

  // Anchor C2MEF -> pulls Forge C2ME port cleanly
  const c2meBuild = buildSmartAssembly({ ...basePrefs, focusModId: 'concurrent-chunk-management-engine-forge-c2me' });
  assert.ok(c2meBuild.modIds.includes('concurrent-chunk-management-engine-forge-c2me'));
  assert.equal(analyzeSelection(c2meBuild.modIds).conflicts.length, 0);

  // Anchor unsupported Fabric Lithium -> auto-swaps to Radium Re-Reforged with 0 conflicts
  const lithiumSwapBuild = buildSmartAssembly({ ...basePrefs, focusModId: 'lithium' });
  assert.ok(!lithiumSwapBuild.modIds.includes('lithium'));
  assert.ok(lithiumSwapBuild.modIds.includes('radium-re-reforged'));
  assert.equal(analyzeSelection(lithiumSwapBuild.modIds).conflicts.length, 0);

  // Anchor danger OptiFine -> rejected cleanly
  const optifineBuild = buildSmartAssembly({ ...basePrefs, focusModId: 'optifine' });
  assert.ok(!optifineBuild.modIds.includes('optifine'));
  assert.equal(analyzeSelection(optifineBuild.modIds).conflicts.length, 0);
});

test('DUAL_PORT_PAIRS resolve to valid mods and portStrategy switches Forge vs Fabric+Sinytra cleanly', () => {
  assert.ok(DUAL_PORT_PAIRS.length >= 8);
  for (const pair of DUAL_PORT_PAIRS) {
    assert.ok(MODS_DATABASE.some(m => m.id === pair.forgeModId), `Missing forgeModId ${pair.forgeModId}`);
    assert.ok(MODS_DATABASE.some(m => m.id === pair.fabricModId), `Missing fabricModId ${pair.fabricModId}`);
    assert.equal(getDualPortPairForMod(pair.forgeModId)?.id, pair.id);
    assert.equal(getDualPortPairForMod(pair.fabricModId)?.id, pair.id);
  }

  const serverHeavyBase: AssemblyPreferences = {
    gpu: 'nvidia',
    mode: 'server',
    useShaders: false,
    useCreate: false,
    allowSinytra: true,
    goal: 'max-safe',
  };

  // Native Forge strategy: uses Alloyium, C2MEF, VMP Forge, without Sinytra/Nvidium/Fabric duplicates
  const nativeBuild = buildSmartAssembly({ ...serverHeavyBase, portStrategy: 'native-forge' });
  assert.ok(nativeBuild.modIds.includes('alloyium'));
  assert.ok(nativeBuild.modIds.includes('concurrent-chunk-management-engine-forge-c2me'));
  assert.ok(nativeBuild.modIds.includes('vmp-forge'));
  assert.ok(!nativeBuild.modIds.includes('nvidium'));
  assert.ok(!nativeBuild.modIds.includes('c2me-concurrent-chunk-management-engine'));
  assert.ok(!nativeBuild.modIds.includes('very-many-players-vmp'));
  assert.equal(analyzeSelection(nativeBuild.modIds).conflicts.length, 0);

  // Hybrid strategy: native VMP Forge + C2MEF, plus Nvidium via Sinytra on NVIDIA without shaders
  const hybridBuild = buildSmartAssembly({ ...serverHeavyBase, portStrategy: 'hybrid' });
  assert.ok(hybridBuild.modIds.includes('nvidium'));
  assert.ok(hybridBuild.modIds.includes('concurrent-chunk-management-engine-forge-c2me'));
  assert.ok(hybridBuild.modIds.includes('vmp-forge'));
  assert.ok(hybridBuild.modIds.includes('sinytra-connector'));
  assert.equal(analyzeSelection(hybridBuild.modIds).conflicts.length, 0);

  // Fabric + Sinytra strategy: switches Nvidium, C2ME Fabric, VMP Fabric via Sinytra Connector
  const fabricBuild = buildSmartAssembly({ ...serverHeavyBase, portStrategy: 'fabric-sinytra' });
  assert.ok(fabricBuild.modIds.includes('nvidium'));
  assert.ok(fabricBuild.modIds.includes('c2me-concurrent-chunk-management-engine'));
  assert.ok(fabricBuild.modIds.includes('very-many-players-vmp'));
  assert.ok(fabricBuild.modIds.includes('sinytra-connector'));
  assert.ok(fabricBuild.modIds.includes('forgified-fabric-api'));
  assert.ok(!fabricBuild.modIds.includes('concurrent-chunk-management-engine-forge-c2me'));
  assert.ok(!fabricBuild.modIds.includes('vmp-forge'));
  assert.equal(analyzeSelection(fabricBuild.modIds).conflicts.length, 0);

  // smartFixAssembly breaks port clashes according to portStrategy
  const mixedPorts = ['embeddium', 'sinytra-connector', 'forgified-fabric-api', 'vmp-forge', 'very-many-players-vmp', 'concurrent-chunk-management-engine-forge-c2me', 'c2me-concurrent-chunk-management-engine'];
  const fixedNative = smartFixAssembly(mixedPorts, { ...serverHeavyBase, portStrategy: 'native-forge' });
  assert.ok(fixedNative.includes('vmp-forge') && !fixedNative.includes('very-many-players-vmp'));
  assert.ok(fixedNative.includes('concurrent-chunk-management-engine-forge-c2me') && !fixedNative.includes('c2me-concurrent-chunk-management-engine'));

  const fixedFabric = smartFixAssembly(mixedPorts, { ...serverHeavyBase, portStrategy: 'fabric-sinytra' });
  assert.ok(fixedFabric.includes('very-many-players-vmp') && !fixedFabric.includes('vmp-forge'));
  assert.ok(fixedFabric.includes('c2me-concurrent-chunk-management-engine') && !fixedFabric.includes('concurrent-chunk-management-engine-forge-c2me'));
});

test('isModIncompatibleWithSelection hides conflicting, transitive-conflicting, and unsupported mods while keeping active ones visible', async () => {
  const { isModIncompatibleWithSelection } = await import('./modLogic.ts');
  const byId = new Map(MODS_DATABASE.map(m => [m.id, m]));

  const activeSet = new Set(['embeddium', 'nvidium', 'radium-re-reforged']);

  // Active mods must never be hidden
  assert.equal(isModIncompatibleWithSelection(byId.get('embeddium')!, activeSet), false);
  assert.equal(isModIncompatibleWithSelection(byId.get('nvidium')!, activeSet), false);

  // Direct conflict with Embeddium / Nvidium / Radium
  assert.equal(isModIncompatibleWithSelection(byId.get('xenon')!, activeSet), true);
  assert.equal(isModIncompatibleWithSelection(byId.get('optifine')!, activeSet), true);
  assert.equal(isModIncompatibleWithSelection(byId.get('oculus')!, activeSet), true);
  assert.equal(isModIncompatibleWithSelection(byId.get('alloyium')!, activeSet), true);

  // Transitive dependency conflict: Emberlens -> Emberbium conflicts with Embeddium; Faster Iris Shadow Mapper -> Oculus conflicts with Nvidium
  assert.equal(isModIncompatibleWithSelection(byId.get('emberlens')!, activeSet), true);
  assert.equal(isModIncompatibleWithSelection(byId.get('faster-iris-shadow-mapper')!, activeSet), true);

  // Unsupported Fabric-only original
  assert.equal(isModIncompatibleWithSelection(byId.get('lithium')!, activeSet), true);

  // Compatible addons remain visible
  assert.equal(isModIncompatibleWithSelection(byId.get('flerovium')!, activeSet), false);
  assert.equal(isModIncompatibleWithSelection(byId.get('embeddium-extras')!, activeSet), false);

  // When Sinytra is disabled in prefs, Sinytra mods are hidden
  assert.equal(
    isModIncompatibleWithSelection(byId.get('c2me-concurrent-chunk-management-engine')!, new Set(['embeddium']), {
      gpu: 'nvidia',
      mode: 'singleplayer',
      useShaders: false,
      useCreate: false,
      allowSinytra: false,
      goal: 'balanced',
    }),
    true
  );
});

test('Golden Standard resolves 100% via findModByDisplayName and GPUTape works with Emberbium cleanly', () => {
  for (const g of GOLDEN_STANDARD_MODS) {
    const found = findModByDisplayName(g.name);
    assert.ok(found, `Golden standard mod "${g.name}" could not be resolved by findModByDisplayName`);
  }

  const emberGputape = analyzeSelection(['emberbium', 'emberlens', 'gputape']);
  assert.equal(emberGputape.conflicts.length, 0);
  assert.equal(emberGputape.warnings.length, 0);
});

test('EMI / JEI recipe viewer modes and bridge-aware visibility behave accurately across TMRV Updated', () => {
  const byId = new Map(MODS_DATABASE.map(m => [m.id, m]));
  const basePrefs: AssemblyPreferences = {
    gpu: 'nvidia',
    mode: 'singleplayer',
    useShaders: false,
    useCreate: false,
    allowSinytra: true,
    recipeViewer: 'emi',
    goal: 'max-safe',
  };

  // Pure EMI build pulls EMI + TMRV Updated + native EMI plugins, skips JEI & JER/JEP/JEED
  const emiBuild = buildSmartAssembly(basePrefs);
  assert.ok(emiBuild.modIds.includes('emi'));
  assert.ok(emiBuild.modIds.includes('tmrv-updated'));
  assert.ok(emiBuild.modIds.includes('emi-loot'));
  assert.ok(!emiBuild.modIds.includes('just-enough-items-jei'));
  assert.ok(!emiBuild.modIds.includes('jeioptimizer'));
  assert.ok(!emiBuild.modIds.includes('just-enough-resources-jer'));
  assert.equal(analyzeSelection(emiBuild.modIds).conflicts.length, 0);
  assert.equal(analyzeSelection(emiBuild.modIds).warnings.length, 0);

  // In pure EMI WITH TMRV Updated active: JEI plugins (JEP, JER) are bridge-compatible!
  const withTmrvSet = new Set(['emi', 'tmrv-updated']);
  const jepBridge = getRecipeBridgeStatus(byId.get('just-enough-professions-jep')!, withTmrvSet, basePrefs);
  assert.equal(jepBridge.compatible, true);
  assert.ok(jepBridge.viaBridge?.includes('TMRV'));
  assert.equal(
    shouldHideMod(byId.get('just-enough-professions-jep')!, withTmrvSet, basePrefs, {
      hideIncompatible: true,
      hideUselessCovered: true,
    }),
    false
  );

  // In pure EMI WITHOUT TMRV Updated active: JEI plugins (JEP, JER) are hidden!
  const withoutTmrvSet = new Set(['emi']);
  const jepNoTmrv = getRecipeBridgeStatus(byId.get('just-enough-professions-jep')!, withoutTmrvSet, basePrefs);
  assert.equal(jepNoTmrv.compatible, false);
  assert.equal(
    shouldHideMod(byId.get('just-enough-professions-jep')!, withoutTmrvSet, basePrefs, {
      hideIncompatible: true,
      hideUselessCovered: true,
    }),
    true
  );

  // JEI engine mods (JEIOptimizer, [JEIR]) are NOT compatible in pure EMI even with TMRV Updated
  assert.equal(getRecipeBridgeStatus(byId.get('jeioptimizer')!, withTmrvSet, basePrefs).compatible, false);
  assert.equal(
    shouldHideMod(byId.get('jeioptimizer')!, withTmrvSet, basePrefs, {
      hideIncompatible: true,
      hideUselessCovered: true,
    }),
    true
  );

  // Removing TMRV Updated via toggleModSmart cascades orphan removal of JER
  const dropTmrv = toggleModSmart(['emi', 'tmrv-updated', 'just-enough-resources-jer'], 'tmrv-updated', { strict: true });
  assert.ok(!dropTmrv.nextIds.includes('tmrv-updated'));
  assert.ok(!dropTmrv.nextIds.includes('just-enough-resources-jer'));

  // EMI + JEI mode conflicts with TMRV Updated and detects redundant TMRV
  const clash = analyzeSelection(['emi', 'just-enough-items-jei', 'tmrv-updated']);
  assert.ok(clash.conflicts.length >= 1);
  assert.ok(clash.conflictingIdSet.has('tmrv-updated'));
  assert.ok(getModSuperseder(byId.get('tmrv-updated')!, new Set(['emi', 'just-enough-items-jei']), undefined, false)?.isActiveInSelection);
});

test('supersededBy and supersededWhenAll hide strictly overlapped mods and warn/clean in selection', () => {
  const byId = new Map(MODS_DATABASE.map(m => [m.id, m]));
  const emiPrefs: AssemblyPreferences = {
    gpu: 'nvidia',
    mode: 'singleplayer',
    useShaders: false,
    useCreate: false,
    allowSinytra: true,
    recipeViewer: 'emi',
    goal: 'balanced',
  };

  // Global superseder hides FastBoot and Rubidium even if not selected
  assert.equal(
    shouldHideMod(byId.get('fastboot')!, new Set(['embeddium']), emiPrefs, {
      hideIncompatible: false,
      hideUselessCovered: true,
    }),
    true
  );
  assert.equal(
    shouldHideMod(byId.get('rubidium')!, new Set(['embeddium']), emiPrefs, {
      hideIncompatible: false,
      hideUselessCovered: true,
    }),
    true
  );

  // Conditional supersededWhenAll: JER hidden when BOTH EMI Loot + EMI Ores are active, visible if only one is active
  const bothEmiSet = new Set(['emi', 'tmrv-updated', 'emi-loot', 'emi-ores']);
  assert.equal(
    shouldHideMod(byId.get('just-enough-resources-jer')!, bothEmiSet, emiPrefs, {
      hideIncompatible: true,
      hideUselessCovered: true,
    }),
    true
  );

  const partialEmiSet = new Set(['emi', 'tmrv-updated', 'emi-loot']);
  assert.equal(
    shouldHideMod(byId.get('just-enough-resources-jer')!, partialEmiSet, emiPrefs, {
      hideIncompatible: true,
      hideUselessCovered: true,
    }),
    false
  );

  // Active selected superseded mods never vanish silently and produce yellow warning; smartFixAssembly strips them
  const redundantPack = ['embeddium', 'modernfix', 'fastboot', 'emi', 'emi-professions', 'just-enough-professions-jep'];
  assert.equal(
    shouldHideMod(byId.get('fastboot')!, new Set(redundantPack), emiPrefs, {
      hideIncompatible: true,
      hideUselessCovered: true,
    }),
    false
  );
  const check = analyzeSelection(redundantPack);
  assert.ok(check.warnings.some(w => w.modId === 'fastboot' && w.severity === 'yellow'));
  assert.ok(check.warnings.some(w => w.modId === 'just-enough-professions-jep' && w.severity === 'yellow'));

  const fixed = smartFixAssembly(redundantPack, emiPrefs);
  assert.ok(!fixed.includes('fastboot'));
  assert.ok(!fixed.includes('just-enough-professions-jep'));
  assert.ok(fixed.includes('emi-professions'));
});

test('audit and leader harmonization: Spark is profiler leader, Clumps leads items, and tier classifications are accurate', () => {
  const byId = new Map(MODS_DATABASE.map(m => [m.id, m]));

  // Spark vs niche Java 25 fork
  const spark = byId.get('spark')!;
  const sparkFork = byId.get('spark-profiler-au-naturel-edit-java-25')!;
  assert.ok(spark, 'Official Spark must exist in database');
  assert.equal(spark.isGroupLeader, true);
  assert.equal(spark.healthTier, 'green');
  assert.equal(spark.status, 'diagnostic');
  assert.equal(getCheckerTier(spark).tier, 'green');
  assert.deepEqual(sparkFork.supersededBy, ['spark']);
  assert.equal(sparkFork.healthTier, 'yellow');

  // Core leaders vs demoted addons
  const clumps = byId.get('clumps')!;
  const itemmerge = byId.get('itemmerge')!;
  assert.equal(clumps.isGroupLeader, true);
  assert.equal(clumps.status, 'recommended');
  assert.equal(getCheckerTier(clumps).tier, 'green');
  assert.equal(itemmerge.status, 'useful');
  assert.equal(getCheckerTier(itemmerge).tier, 'lime');

  const entityCulling = byId.get('entity-culling')!;
  assert.equal(entityCulling.isGroupLeader, true);
  assert.equal(entityCulling.status, 'recommended');
  assert.equal(getCheckerTier(entityCulling).tier, 'green');

  const smoothBoot = byId.get('smooth-boot-reloaded')!;
  assert.equal(smoothBoot.isGroupLeader, true);
  assert.equal(smoothBoot.status, 'recommended');
  assert.equal(getCheckerTier(smoothBoot).tier, 'green');

  const jei = byId.get('just-enough-items-jei')!;
  assert.equal(jei.isGroupLeader, true);
  assert.equal(jei.status, 'recommended');
  assert.equal(getCheckerTier(jei).tier, 'green');

  const dynamicRender = byId.get('dynamicrenderdistance')!;
  const configSwitch = byId.get('config-preset-switch-low-medium-high-f10')!;
  assert.equal(dynamicRender.isGroupLeader, true);
  assert.equal(dynamicRender.status, 'useful');
  assert.equal(getCheckerTier(dynamicRender).tier, 'lime');
  assert.equal(configSwitch.status, 'useful');
  assert.equal(getCheckerTier(configSwitch).tier, 'lime');

  // Outdated Pluto & Capability Fix
  const pluto = byId.get('pluto')!;
  assert.equal(pluto.status, 'outdated');
  assert.equal(getCheckerTier(pluto).tier, 'yellow');
  assert.deepEqual(pluto.supersededBy, ['krypton-reno']);

  const capFix = byId.get('capability-fix')!;
  assert.equal(capFix.status, 'outdated');
  assert.equal(getCheckerTier(capFix).tier, 'yellow');
  assert.deepEqual(capFix.supersededBy, ['capability-fix-revived']);

  // Verified Sodium Chloride is recommended green
  const chloride = byId.get('sodium-chloride')!;
  assert.equal(chloride.status, 'recommended');
  assert.equal(getCheckerTier(chloride).tier, 'green');

  // Default buildSmartAssembly server mode includes spark
  const serverBuild = buildSmartAssembly({ ...INITIAL_BUILDER_PREFS, mode: 'server' });
  assert.ok(serverBuild.modIds.includes('spark'));
  assert.ok(!serverBuild.modIds.includes('spark-profiler-au-naturel-edit-java-25'));
});

test('freshness audit, 6 newly added mods, Emberbium+Nvidium stack, PartiCull overlap, and user presets behave accurately', () => {
  const byId = new Map(MODS_DATABASE.map(m => [m.id, m]));

  // All 6 newly added mods exist with direct CurseForge slugs
  for (const id of ['compact-f3-plus', 'resourceful-config', 'fzzy-config', 'kotlin-for-forge', 'matlib', 'cupboard']) {
    const mod = byId.get(id);
    assert.ok(mod, `Missing newly added mod "${id}"`);
    assert.ok(mod.curseforgeUrl.startsWith('https://www.curseforge.com/minecraft/mc-mods/'), `Unexpected URL for ${id}`);
  }

  // Freshness & accuracy statuses
  assert.equal(getBaseHealthTier(byId.get('emberbium')!), 'green');
  assert.equal(getBaseHealthTier(byId.get('compact-f3-plus')!), 'green');
  assert.equal(getBaseHealthTier(byId.get('sodium-embeddium-options-api')!), 'green');
  assert.equal(getBaseHealthTier(byId.get('sodium-embeddium-dynamic-lights')!), 'green');
  assert.equal(byId.get('async-advancement-toast')!.status, 'useful');
  assert.equal(byId.get('async-advancement-toast')!.healthTier, 'yellow');
  assert.equal(getBaseHealthTier(byId.get('async-advancement-toast')!), 'lime');
  assert.equal(byId.get('minimal-backup-zstd')!.status, 'useful');
  assert.equal(byId.get('minimal-backup-zstd')!.healthTier, 'yellow');
  assert.equal(getBaseHealthTier(byId.get('minimal-backup-zstd')!), 'lime');
  assert.equal(byId.get('optimized-recipe-book-orb')!.status, 'useful');
  assert.equal(byId.get('bobby-reforged')!.status, 'useful');

  // C2MEF has 'c2mey' search alias tag
  const c2mef = byId.get('concurrent-chunk-management-engine-forge-c2me')!;
  assert.ok((c2mef.tags ?? []).some(t => t.toLowerCase().includes('c2mey')));

  // Emberbium + Nvidium via Sinytra has 0 conflicts and 0 warnings
  const emberNvidium = analyzeSelection(['emberbium', 'nvidium', 'sinytra-connector', 'forgified-fabric-api', 'connector-extras']);
  assert.equal(emberNvidium.conflicts.length, 0);
  assert.equal(emberNvidium.warnings.length, 0);

  // Hard dependency checks: Particle Core -> Fzzy Config + Kotlin for Forge; EBER -> MatLib; Connectivity -> Cupboard
  const missingParticleDeps = analyzeSelection(['embeddium', 'particle-core']);
  assert.ok(missingParticleDeps.warnings.some(w => w.modId === 'particle-core' && w.severity === 'yellow' && w.fixModIds?.includes('kotlin-for-forge')));
  const fixedParticleDeps = toggleModSmart(['embeddium'], 'particle-core', { strict: true });
  assert.ok(fixedParticleDeps.nextIds.includes('kotlin-for-forge'));
  assert.ok(fixedParticleDeps.nextIds.includes('fzzy-config'));

  const missingMatlib = analyzeSelection(['embeddium', 'enhanced-block-entities-reloaded']);
  assert.ok(missingMatlib.warnings.some(w => w.modId === 'enhanced-block-entities-reloaded' && w.severity === 'yellow' && w.fixModIds?.includes('matlib')));

  const missingCupboard = analyzeSelection(['embeddium', 'connectivity']);
  assert.ok(missingCupboard.warnings.some(w => w.modId === 'connectivity' && w.severity === 'yellow' && w.fixModIds?.includes('cupboard')));

  // PartiCull is hidden/superseded when Particle Core is active
  const particull = byId.get('particull')!;
  assert.equal(
    shouldHideMod(particull, new Set(['embeddium', 'particle-core', 'fzzy-config', 'kotlin-for-forge']), INITIAL_BUILDER_PREFS, {
      hideIncompatible: true,
      hideUselessCovered: true,
    }),
    true
  );
  const overlapWarn = analyzeSelection(['embeddium', 'particle-core', 'fzzy-config', 'kotlin-for-forge', 'particull']);
  assert.ok(overlapWarn.warnings.some(w => w.modId === 'particull' && w.severity === 'yellow'));

  // Both user builds exist in MOD_PRESETS and are completely clean
  const nvidiumPreset = MOD_PRESETS.find(p => p.id === 'user-nvidium-emberbium');
  const alloyiumPreset = MOD_PRESETS.find(p => p.id === 'user-alloyium-embeddium');
  assert.ok(nvidiumPreset && alloyiumPreset);
  assert.ok(nvidiumPreset.modIds.includes('emberbium'));
  assert.ok(nvidiumPreset.modIds.includes('nvidium'));
  assert.ok(nvidiumPreset.modIds.includes('matlib'));
  assert.ok(!nvidiumPreset.modIds.includes('particull'));
  assert.ok(alloyiumPreset.modIds.includes('embeddium'));
  assert.ok(alloyiumPreset.modIds.includes('alloyium'));
  assert.equal(analyzeSelection(nvidiumPreset.modIds).conflicts.length, 0);
  assert.equal(analyzeSelection(nvidiumPreset.modIds).warnings.length, 0);
  assert.equal(analyzeSelection(alloyiumPreset.modIds).conflicts.length, 0);
  assert.equal(analyzeSelection(alloyiumPreset.modIds).warnings.length, 0);
});

test('DATABASE_UPDATED_AT, per-mod update labels, organizeAssemblyTree, and formatAssemblyTreeText work accurately', () => {
  assert.equal(DATABASE_UPDATED_AT, '16.11.2026');

  const byId = new Map(MODS_DATABASE.map(m => [m.id, m]));
  for (const id of [
    'emberbium',
    'embeddium',
    'nvidium',
    'alloyium',
    'compact-f3-plus',
    'matlib',
    'cupboard',
    'fzzy-config',
    'kotlin-for-forge',
  ]) {
    const mod = byId.get(id)!;
    const label = getModUpdatedLabel(mod);
    assert.ok(label && label.length > 0, `Expected non-empty update label for ${id}`);
  }

  // Every preset preserves exact unique mod count in organizeAssemblyTree with zero drops or duplicates
  for (const preset of MOD_PRESETS) {
    const uniqueIds = Array.from(new Set(preset.modIds));
    const tree = organizeAssemblyTree(preset.modIds);
    const flattenedIds: string[] = [];
    for (const node of tree) {
      flattenedIds.push(node.parent.id);
      for (const child of node.children) {
        flattenedIds.push(child.mod.id);
      }
    }
    assert.equal(
      flattenedIds.length,
      uniqueIds.length,
      `Preset "${preset.id}" tree count mismatch: got ${flattenedIds.length}, expected ${uniqueIds.length}`
    );
    assert.equal(
      new Set(flattenedIds).size,
      uniqueIds.length,
      `Preset "${preset.id}" tree has duplicate nodes`
    );
  }

  // Verify user-nvidium-emberbium tree nesting
  const nvidiumPreset = MOD_PRESETS.find(p => p.id === 'user-nvidium-emberbium')!;
  const nvidiumTree = organizeAssemblyTree(nvidiumPreset.modIds);
  const byParentId = new Map(nvidiumTree.map(n => [n.parent.id, n.children.map(c => c.mod.id)]));

  const emberKids = byParentId.get('emberbium') ?? [];
  for (const expected of ['nvidium', 'flerovium', 'immediatelyfast', 'sodium-embeddium-options-api', 'sodium-embeddium-dynamic-lights']) {
    assert.ok(emberKids.includes(expected), `Expected ${expected} nested under emberbium`);
  }

  const sinytraKids = byParentId.get('sinytra-connector') ?? [];
  assert.ok(sinytraKids.includes('forgified-fabric-api'));
  assert.ok(sinytraKids.includes('connector-extras'));

  const eberKids = byParentId.get('enhanced-block-entities-reloaded') ?? [];
  assert.ok(eberKids.includes('matlib'));

  const particleKids = byParentId.get('particle-core') ?? [];
  assert.ok(particleKids.includes('fzzy-config'));
  assert.ok(particleKids.includes('kotlin-for-forge'));

  const soundKids = byParentId.get('fast-sounds') ?? [];
  assert.ok(soundKids.includes('soundgc'));

  // Formatted export renders 1-indexed parent mods, indented child arrows, update labels, and CurseForge URLs
  const formattedWithUrls = formatAssemblyTreeText(nvidiumPreset.modIds, true);
  assert.ok(formattedWithUrls.includes('1. Emberbium'));
  assert.ok(formattedWithUrls.includes('   ↳ Nvidium'));
  assert.ok(formattedWithUrls.includes('[обн.'));
  assert.ok(formattedWithUrls.includes('https://www.curseforge.com/'));

  const formattedNoUrls = formatAssemblyTreeText(nvidiumPreset.modIds, false);
  assert.ok(!formattedNoUrls.includes('https://www.curseforge.com/'));

  const plainNames = formatModNamesListText(nvidiumPreset.modIds);
  const plainLines = plainNames.split('\n').filter(Boolean);
  assert.equal(plainLines.length, new Set(nvidiumPreset.modIds).size);
  assert.ok(plainLines.includes('Emberbium'));
  assert.ok(plainLines.includes('Nvidium'));
  assert.ok(!plainNames.includes('https://'));
  assert.ok(!plainNames.includes('↳'));
});

test('matchJarFilenamesToMods resolves Windows .jar filenames including dual-port C2ME and unknowns', async () => {
  const { matchJarFilenamesToMods } = await import('./jarMatcher.ts');
  const { matchedIds, unmatchedJars } = matchJarFilenamesToMods([
    'emberbium-1.20.1-1.0.4.jar',
    'nvidium-0.2.6-beta.jar',
    'Sinytra-Connector-1.0.0-beta.46+1.20.1.jar',
    'alltheleaks-1.20.1-1.1.4.jar',
    'c2mef-1.20.1-0.2.0.jar',
    'c2me-fabric-mc1.20.1-0.2.0.jar',
    'create-1.20.1-0.5.1.j.jar',
  ]);

  assert.ok(matchedIds.includes('emberbium'));
  assert.ok(matchedIds.includes('nvidium'));
  assert.ok(matchedIds.includes('sinytra-connector'));
  assert.ok(matchedIds.includes('alltheleaks-memory-leak-fix'));
  assert.ok(matchedIds.includes('concurrent-chunk-management-engine-forge-c2me'));
  assert.ok(matchedIds.includes('c2me-concurrent-chunk-management-engine'));
  assert.deepEqual(unmatchedJars, ['create-1.20.1-0.5.1.j.jar']);
});

test('persistence helpers sanitize saved tabs, dates, mod IDs, and builder preferences across restarts', async () => {
  const { parsePersistedState, formatRuDate } = await import('./persistence.ts');

  const dateStr = formatRuDate(new Date('2026-11-18T10:00:00Z'));
  assert.match(dateStr, /^\d{2}\.\d{2}\.2026$/);

  const parsed = parsePersistedState({
    schemaVersion: 2,
    dbUpdatedAt: '16.11.2026',
    lastSavedDate: '18.11.2026',
    activeTab: 'assembler',
    checkedModIds: ['embeddium', 'non-existent-mod', 'alloyium', 'embeddium'],
    builderModIds: ['emberbium', 'nvidium'],
    builderPrefs: {
      gpu: 'amd-intel',
      mode: 'server',
      goal: 'max-safe',
      useShaders: true,
      useCreate: false,
      allowSinytra: false,
      portStrategy: 'native-forge',
      recipeViewer: 'emi',
      focusModId: 'alloyium',
      packSize: 'heavy',
    },
    focusModId: 'alloyium',
  });

  assert.ok(parsed);
  assert.equal(parsed.dbUpdatedAt, '16.11.2026');
  assert.equal(parsed.lastSavedDate, '18.11.2026');
  assert.equal(parsed.activeTab, 'assembler');
  assert.deepEqual(parsed.checkedModIds, ['embeddium', 'alloyium']);
  assert.deepEqual(parsed.builderModIds, ['emberbium', 'nvidium']);
  assert.equal(parsed.builderPrefs?.recipeViewer, 'emi');
  assert.equal(parsed.builderPrefs?.gpu, 'amd-intel');
  assert.equal('packSize' in (parsed.builderPrefs || {}), false);

  const invalidTab = parsePersistedState({ activeTab: 'file' });
  assert.equal(invalidTab?.activeTab, undefined);
});

test('searchModsByQuery finds mods by Russian purpose and exact names', async () => {
  const { searchModsByQuery } = await import('./modLogic.ts');

  const light = searchModsByQuery('освещение', 15);
  assert.ok(light.some(m => m.id === 'solix' || m.id === 'lightstar'), 'Expected lighting mods for "освещение"');

  const memory = searchModsByQuery('память', 15);
  assert.ok(memory.some(m => m.id === 'ferritecore' || m.id === 'modernfix' || m.id === 'alltheleaks-memory-leak-fix'));

  const leaks = searchModsByQuery('утечки', 15);
  assert.ok(leaks.some(m => m.id === 'alltheleaks-memory-leak-fix'));

  const chunks = searchModsByQuery('чанки', 15);
  assert.ok(chunks.length >= 3);

  const particles = searchModsByQuery('частицы', 15);
  assert.ok(particles.some(m => m.id === 'particle-core' || m.id === 'particull'));

  const exact = searchModsByQuery('Embeddium', 5);
  assert.equal(exact[0]?.id, 'embeddium');

  const fler = searchModsByQuery('Flerovium', 5);
  assert.equal(fler[0]?.id, 'flerovium');
});

test('parseModNamesListText performs round-trip import of plain lists, tree exports, and .jar tokens', async () => {
  const { parseModNamesListText } = await import('./modLogic.ts');

  for (const preset of MOD_PRESETS) {
    const plainText = formatModNamesListText(preset.modIds);
    const parsed = parseModNamesListText(plainText);
    assert.deepEqual(parsed.unmatchedLines, [], `Unexpected unmatched lines in preset ${preset.id}`);
    assert.equal(
      new Set(parsed.matchedIds).size,
      new Set(preset.modIds).size,
      `Round-trip mismatch for preset ${preset.id}`
    );
  }

  const mixedInput = [
    '1. Emberbium [обн. 11.2026] — https://www.curseforge.com/minecraft/mc-mods/emberbium',
    '   ↳ Nvidium (Mesh Shaders, обн. 10.2025) — https://www.curseforge.com/minecraft/mc-mods/nvidium',
    'ferritecore-6.0.1-forge.jar',
    'TotallyUnknownCustomModXYZ',
  ].join('\n');

  const res = parseModNamesListText(mixedInput);
  assert.ok(res.matchedIds.includes('emberbium'));
  assert.ok(res.matchedIds.includes('nvidium'));
  assert.ok(res.matchedIds.includes('ferritecore'));
  assert.deepEqual(res.unmatchedLines, ['TotallyUnknownCustomModXYZ']);
});

test('purpose-based search handles Russian synonyms, ranks green leaders above outdated/libs, and prevents substring noise', async () => {
  const { searchModsByQuery, matchesModPurposeQuery } = await import('./modLogic.ts');

  const fps = searchModsByQuery('фпс', 10);
  assert.ok(fps.length >= 5, 'Expected multiple FPS mods for "фпс"');

  const ram = searchModsByQuery('озу', 10);
  assert.ok(ram.some(m => m.id === 'ferritecore' || m.id === 'modernfix'), 'Expected FerriteCore/ModernFix for "озу"');
  assert.notEqual(ram[0]?.id, 'memguard', 'Placebo MemGuard must not rank #1 for "озу"');
  assert.notEqual(ram[0]?.id, 'cloth-config', 'Library Cloth Config must not rank #1 for "озу"');

  const mem = searchModsByQuery('память', 5);
  assert.notEqual(mem[0]?.id, 'memory-leak-fix-modern-port', 'Outdated Memory Leak Fix should not outrank ModernFix/FerriteCore');

  const sound = searchModsByQuery('звук', 5);
  assert.equal(sound[0]?.id, 'fast-sounds', 'Fast Sounds should rank #1 for "звук"');

  const shadows = searchModsByQuery('тени', 10);
  assert.ok(!shadows.some(m => m.id === 'just-enough-resources-jer'), 'JER ("расТЕНИя") must not falsely match "тени"');

  const ai = searchModsByQuery('ии', 10);
  assert.ok(ai.some(m => m.id === 'radium-re-reforged'), 'Expected Radium for "ии"');
  assert.ok(!ai.slice(0, 3).some(m => m.id === 'geckolib'), 'Animation parent GeckoLib must not rank in top-3 for "ии"');

  const net = searchModsByQuery('сеть', 8);
  assert.ok(net.some(m => m.id === 'krypton-reno' || m.id === 'connectivity' || m.id === 'packet-fixer'));
  assert.notEqual(net[0]?.id, 'pluto', 'Outdated Pluto must not outrank active networking leaders');

  assert.equal(matchesModPurposeQuery('ferritecore', 'озу'), true);
  assert.equal(matchesModPurposeQuery('fast-sounds', 'звук'), true);
});

test('Oculus unchecking, Emberlens elevation, Nvidium+Emberlens orange diagnostics, dubious markers, and multiplayer stack work accurately', async () => {
  const { buildCheckerDiagnostics, getDubiousModReason } = await import('./modLogic.ts');
  const byId = new Map(MODS_DATABASE.map(m => [m.id, m]));

  // Both Embeddium and Emberbium default to green; Emberlens is recommended green
  const embeddium = byId.get('embeddium')!;
  const emberbium = byId.get('emberbium')!;
  const emberlens = byId.get('emberlens')!;
  const oculus = byId.get('oculus')!;
  assert.equal(getBaseHealthTier(embeddium), 'green');
  assert.equal(getBaseHealthTier(emberbium), 'green');
  assert.equal(emberlens.status, 'recommended');
  assert.equal(getBaseHealthTier(emberlens), 'green');

  // Selecting Oculus pulls Embeddium and toggling Oculus a second time unchecks Oculus cleanly
  const pickOculus = toggleModSmart([], 'oculus', { strict: true });
  assert.ok(pickOculus.nextIds.includes('oculus'));
  assert.ok(pickOculus.nextIds.includes('embeddium'));
  const uncheckOculus = toggleModSmart(pickOculus.nextIds, 'oculus', { strict: true });
  assert.equal(uncheckOculus.nextIds.includes('oculus'), false);

  // Toggling Emberlens twice selects then unchecks cleanly
  const pickEmberlens = toggleModSmart([], 'emberlens', { strict: true });
  assert.ok(pickEmberlens.nextIds.includes('emberlens'));
  const uncheckEmberlens = toggleModSmart(pickEmberlens.nextIds, 'emberlens', { strict: true });
  assert.equal(uncheckEmberlens.nextIds.includes('emberlens'), false);
  assert.equal(getBaseHealthTier(oculus), 'green');

  // Nvidium + Emberlens is classified as orange runtime mode conflict (not red crash) with structured diagnostics
  const stack = ['emberbium', 'sinytra-connector', 'forgified-fabric-api', 'nvidium', 'emberlens'];
  const analysis = analyzeSelection(stack);
  assert.ok(analysis.runtimeOnlyConflictIdSet.has('nvidium'));
  assert.ok(analysis.runtimeOnlyConflictIdSet.has('emberlens'));
  assert.equal(
    getCheckerTier(emberlens, analysis.conflictingIdSet, undefined, analysis.runtimeOnlyConflictIdSet).tier,
    'orange'
  );
  assert.equal(
    getCheckerTier(byId.get('nvidium')!, analysis.conflictingIdSet, undefined, analysis.runtimeOnlyConflictIdSet).tier,
    'orange'
  );

  const diagnostics = buildCheckerDiagnostics(stack);
  const nvEmberIssue = diagnostics.find(d => d.kind === 'runtime');
  assert.ok(nvEmberIssue, 'Expected runtime diagnostic issue for Nvidium + Emberlens');
  assert.equal(nvEmberIssue.severity, 'orange');
  assert.ok(nvEmberIssue.betweenNames.includes('Nvidium'));
  assert.ok(nvEmberIssue.betweenNames.includes('Emberlens'));
  assert.ok(nvEmberIssue.problem.length > 10);
  assert.ok(nvEmberIssue.bestSolution.length > 10);

  // Dubious mod markers flag questionable/experimental/redundant mods and stay clean on core green mods
  assert.ok(getDubiousModReason(byId.get('accelerated-rendering')!));
  assert.ok(getDubiousModReason(byId.get('optifine')!));
  assert.ok(getDubiousModReason(byId.get('fastchest-revived')!));
  assert.ok(getDubiousModReason(byId.get('soundgc')!));
  assert.equal(getDubiousModReason(embeddium), null);
  assert.equal(getDubiousModReason(emberbium), null);
  assert.equal(getDubiousModReason(emberlens), null);
  assert.equal(getDubiousModReason(byId.get('ferritecore')!), null);

  // Multiplayer server bundle has zero conflicts and zero warnings
  const multiplayerPack = analyzeSelection(['embeddium', 'connectivity', 'cupboard', 'krypton-reno', 'servercore']);
  assert.equal(multiplayerPack.conflicts.length, 0);
  assert.equal(multiplayerPack.warnings.length, 0);
});

