import { useMemo, useState } from 'react';
import {
  MODS_DATABASE,
  MOD_GROUPS,
  MOD_PRESETS,
  type ModItem,
} from '../data/modsData.ts';

type ModGroup = (typeof MOD_GROUPS)[number];
import {
  INITIAL_BUILDER_PREFS,
  MOD_BY_ID,
  buildCheckerDiagnostics,
  evaluateAssemblyHealth,
  getCheckerTier,
  getDubiousModReason,
  getModEffectivenessScore,
  getModRestrictionBadge,
  getModSuperseder,
  isModIncompatibleWithSelection,
  isUnsupportedOnForge,
  matchesModPurposeQuery,
  removeModsCascade,
  smartFixAssembly,
  toggleModSmart,
  type AssemblyPreferences,
  type CheckerTier,
} from '../utils/modLogic.ts';
import {
  AlertTriangle,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Lock,
  RotateCcw,
  Search,
  ShieldAlert,
  Unlock,
  Users,
  Wand2,
  X,
} from 'lucide-react';

interface AssemblyBuilderTabProps {
  selectedIds: string[];
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  prefs: AssemblyPreferences;
  setPrefs: (updater: AssemblyPreferences | ((prev: AssemblyPreferences) => AssemblyPreferences)) => void;
  showDescriptions: boolean;
  showRowMeta?: boolean;
}

type BuilderSort = 'smart' | 'green-first' | 'alpha';
type BuilderSection = 'all' | 'optimization_emi' | 'other';

const OTHER_GROUP_IDS = new Set(['animations-compat', 'potato-tweaks', 'profilers']);
const MULTIPLAYER_MOD_IDS = ['connectivity', 'cupboard', 'krypton-reno', 'servercore'] as const;

interface ModHighlightInfo {
  status: CheckerTier;
  reason: string;
  isIncompatible: boolean;
  isSupersededOrDanger: boolean;
}

interface PreparedGroupBucket {
  group: ModGroup;
  addonSet: Set<string>;
  primaryCoreMods: ModItem[];
  compatibleAddons: ModItem[];
  hiddenOrIncompatibleMods: ModItem[];
  selectedInGroupCount: number;
  selectedInCore: string[];
  hasExclusiveConflict: boolean;
  isMissingCore: boolean;
  addonsOpen: boolean;
  hiddenOpen: boolean;
  activeAddonCount: number;
  mainModAnchorId: string | null;
}

export function AssemblyBuilderTab({
  selectedIds,
  setSelectedIds,
  prefs,
  setPrefs,
  showDescriptions,
  showRowMeta = true,
}: AssemblyBuilderTabProps) {
  const [actionNotice, setActionNotice] = useState<{ text: string; tone: 'info' | 'warn' } | null>(null);
  const [sortMode, setSortMode] = useState<BuilderSort>('smart');
  const [builderSection, setBuilderSection] = useState<BuilderSection>('all');
  const [slotSearch, setSlotSearch] = useState('');
  const [strictExclusive, setStrictExclusive] = useState(true);
  const [expandedAddons, setExpandedAddons] = useState<Record<string, boolean>>({});
  const [expandedHidden, setExpandedHidden] = useState<Record<string, boolean>>({});
  const [multiplayerOpen, setMultiplayerOpen] = useState(true);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const analysis = useMemo(() => evaluateAssemblyHealth(selectedIds), [selectedIds]);
  const diagnostics = useMemo(() => buildCheckerDiagnostics(selectedIds), [selectedIds]);

  const warningByMod = useMemo(() => {
    const map = new Map<string, { severity: 'red' | 'orange' | 'yellow'; messages: string[] }>();
    for (const w of analysis.warnings) {
      const prev = map.get(w.modId);
      const severity =
        prev?.severity === 'red' || w.severity === 'red'
          ? 'red'
          : prev?.severity === 'orange' || w.severity === 'orange'
            ? 'orange'
            : 'yellow';
      map.set(w.modId, { severity, messages: prev ? [...prev.messages, w.message] : [w.message] });
    }
    return map;
  }, [analysis.warnings]);

  const highlightByModId = useMemo(() => {
    const map = new Map<string, ModHighlightInfo>();
    for (const mod of MODS_DATABASE) {
      const w = warningByMod.get(mod.id);
      const checker = getCheckerTier(
        mod,
        analysis.conflictingIdSet,
        w?.severity,
        analysis.runtimeOnlyConflictIdSet
      );
      const restriction = getModRestrictionBadge(mod, selectedSet, prefs);
      const superseder = getModSuperseder(mod, selectedSet, prefs, true);
      const isIncompatible = isModIncompatibleWithSelection(mod, selectedSet, prefs);
      const isSupersededOrDanger =
        mod.status === 'danger' || isUnsupportedOnForge(mod) || superseder !== null;

      let status: CheckerTier = checker.tier;
      let reason = mod.description;

      if (checker.tier === 'red' || isIncompatible || isUnsupportedOnForge(mod) || restriction?.tone === 'red') {
        const isRuntimeOnlyEmberlensNvidium =
          checker.tier === 'orange' &&
          (mod.id === 'emberlens' || mod.id === 'nvidium');
        if (isRuntimeOnlyEmberlensNvidium) {
          status = 'orange';
          reason = checker.reason;
        } else {
          status = 'red';
          reason =
            w?.messages[0] ||
            (restriction?.tone === 'red' ? restriction.text : null) ||
            (isIncompatible ? 'Конфликт или не работает на Forge.' : null) ||
            checker.reason;
        }
      } else if (checker.tier === 'orange') {
        status = 'orange';
        reason =
          w?.messages[0] ||
          (mod.coveredBy ? `Встроено в ${mod.coveredBy}` : null) ||
          (superseder ? superseder.reason : null) ||
          checker.reason;
      } else if (
        checker.tier === 'yellow' ||
        Boolean(mod.coveredBy) ||
        superseder !== null ||
        restriction?.tone === 'amber'
      ) {
        status = 'yellow';
        reason =
          w?.messages[0] ||
          (mod.coveredBy ? `Встроено в ${mod.coveredBy}` : null) ||
          (superseder ? superseder.reason : null) ||
          (restriction?.tone === 'amber' ? restriction.text : null) ||
          checker.reason;
      } else if (restriction?.tone === 'sky') {
        reason = restriction.text;
      }

      map.set(mod.id, {
        status,
        reason,
        isIncompatible,
        isSupersededOrDanger,
      });
    }
    return map;
  }, [analysis.conflictingIdSet, analysis.runtimeOnlyConflictIdSet, warningByMod, selectedSet, prefs]);

  const missingSlotGroupIds = useMemo(
    () => new Set(analysis.missingCoreSlots.map(s => s.groupId)),
    [analysis.missingCoreSlots]
  );

  const multiplayerMods = useMemo(
    () =>
      MULTIPLAYER_MOD_IDS.map(id => MOD_BY_ID.get(id)).filter((m): m is ModItem => Boolean(m)),
    []
  );
  const activeMultiplayerCount = useMemo(
    () => multiplayerMods.filter(m => selectedSet.has(m.id)).length,
    [multiplayerMods, selectedSet]
  );

  const handleToggleMultiplayerPack = () => {
    if (activeMultiplayerCount === multiplayerMods.length) {
      const mpSet = new Set<string>(MULTIPLAYER_MOD_IDS);
      setSelectedIds(prev => prev.filter(id => !mpSet.has(id)));
      setActionNotice({ text: 'Убраны моды мультиплеера (4)', tone: 'info' });
      return;
    }
    let next = [...selectedIds];
    for (const mpMod of multiplayerMods) {
      if (!next.includes(mpMod.id)) {
        const res = toggleModSmart(next, mpMod.id, { strict: strictExclusive, prefs });
        next = res.nextIds;
      }
    }
    setSelectedIds(next);
    setActionNotice({
      text: 'Добавлен стек для мультиплеера: Connectivity, Cupboard, Krypton Reno, ServerCore',
      tone: 'info',
    });
  };

  const handleLoadCorePreset = (presetId: string) => {
    const preset = MOD_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setSelectedIds([...preset.modIds]);
    setActionNotice({
      text: `${preset.name.split('(')[0].trim()} (${preset.modIds.length})`,
      tone: 'info',
    });
  };

  const handleFullReset = () => {
    setSelectedIds([]);
    setPrefs({ ...INITIAL_BUILDER_PREFS, focusModId: null });
    setSlotSearch('');
    setBuilderSection('all');
    setSortMode('smart');
    setExpandedAddons({});
    setExpandedHidden({});
    setActionNotice(null);
  };

  const handleToggleMod = (mod: ModItem) => {
    const res = toggleModSmart(selectedIds, mod.id, { strict: strictExclusive, prefs });
    setSelectedIds(res.nextIds);
    setActionNotice(res.notice ? { text: res.notice, tone: res.noticeTone } : null);
  };

  const handleFixIssues = () => {
    const fixed = smartFixAssembly(selectedIds, prefs);
    setSelectedIds(fixed);
    setActionNotice({ text: 'Исправлено', tone: 'info' });
  };

  const handleQuickSelectSlotLeader = (leaderId: string, memberIds: string[]) => {
    let next = selectedIds;
    if (strictExclusive) {
      const res = toggleModSmart(
        selectedIds.includes(leaderId) ? selectedIds : selectedIds.filter(id => !memberIds.includes(id)),
        leaderId,
        { strict: true, prefs }
      );
      next = res.nextIds;
    } else if (!selectedIds.includes(leaderId)) {
      next = [...selectedIds, leaderId];
    }
    setSelectedIds(next);
  };

  const handleClearSlot = (memberIds: string[]) => {
    if (!strictExclusive) {
      setSelectedIds(selectedIds.filter(id => !memberIds.includes(id)));
      return;
    }
    const res = removeModsCascade(selectedIds, memberIds);
    setSelectedIds(res.nextIds);
  };

  const q = slotSearch.trim().toLowerCase();

  const visibleGroups = useMemo(() => {
    return MOD_GROUPS.filter(group => {
      const isOtherGroup = OTHER_GROUP_IDS.has(group.id);
      if (builderSection === 'optimization_emi' && isOtherGroup) return false;
      if (builderSection === 'other' && !isOtherGroup) return false;
      if (!q) return true;
      if (group.title.toLowerCase().includes(q) || group.description.toLowerCase().includes(q)) return true;
      return group.memberIds.some(id => matchesModPurposeQuery(id, q));
    });
  }, [q, builderSection]);

  const preparedBuckets = useMemo(() => {
    const tierScore: Record<CheckerTier, number> = { green: 30, lime: 20, yellow: 10, orange: 5, red: -100 };

    const sortGroupMods = (mods: ModItem[], leaderId: string, addonSet: Set<string>) =>
      [...mods].sort((a, b) => {
        if (sortMode === 'alpha') return a.name.localeCompare(b.name, 'ru');
        if (sortMode === 'green-first') {
          const hlA = highlightByModId.get(a.id)?.status ?? 'yellow';
          const hlB = highlightByModId.get(b.id)?.status ?? 'yellow';
          return tierScore[hlB] - tierScore[hlA] || getModEffectivenessScore(b) - getModEffectivenessScore(a);
        }
        const rank = (m: ModItem) => (m.id === leaderId ? 2000 : addonSet.has(m.id) ? 1200 : 0);
        return rank(b) + getModEffectivenessScore(b) - (rank(a) + getModEffectivenessScore(a));
      });

    return visibleGroups.map((group): PreparedGroupBucket => {
      const addonSet = new Set(group.addonIds);
      const allMembers = group.memberIds
        .map(id => MOD_BY_ID.get(id))
        .filter((m): m is ModItem => Boolean(m));
      const sortedMembers = sortGroupMods(allMembers, group.leaderId, addonSet);

      const corePool = sortedMembers.filter(m => !addonSet.has(m.id));
      const addonPool = sortedMembers.filter(m => addonSet.has(m.id));

      const isHiddenItem = (m: ModItem) => {
        if (selectedSet.has(m.id)) return false;
        const hl = highlightByModId.get(m.id);
        return Boolean(hl?.isIncompatible || hl?.isSupersededOrDanger);
      };

      const primaryCoreMods = corePool.filter(m => {
        if (selectedSet.has(m.id) || m.id === group.leaderId) return true;
        if (isHiddenItem(m)) return false;
        if (q && matchesModPurposeQuery(m, q)) return true;
        const hl = highlightByModId.get(m.id);
        return hl?.status === 'green' || hl?.status === 'lime';
      });

      const primaryCoreIdSet = new Set(primaryCoreMods.map(m => m.id));
      const compatibleAddons = addonPool.filter(m => !isHiddenItem(m));
      const compatAddonSet = new Set(compatibleAddons.map(a => a.id));

      const hiddenOrIncompatibleMods = sortedMembers.filter(
        m => !primaryCoreIdSet.has(m.id) && !compatAddonSet.has(m.id)
      );

      let selectedInGroupCount = 0;
      const selectedInCore: string[] = [];
      for (const id of group.memberIds) {
        if (selectedSet.has(id)) {
          selectedInGroupCount++;
          if (!addonSet.has(id)) selectedInCore.push(id);
        }
      }

      const hasExclusiveConflict = group.exclusive && selectedInCore.length > 1;
      const isMissingCore = missingSlotGroupIds.has(group.id);

      const addonsOpen =
        Boolean(expandedAddons[group.id]) ||
        (q.length > 0 && compatibleAddons.some(a => matchesModPurposeQuery(a, q)));
      const hiddenOpen = Boolean(expandedHidden[group.id]);
      const activeAddonCount = compatibleAddons.filter(a => selectedSet.has(a.id)).length;

      const mainModAnchorId =
        primaryCoreMods.find(m => m.id === group.leaderId)?.id ??
        primaryCoreMods.find(m => selectedSet.has(m.id))?.id ??
        primaryCoreMods[0]?.id ??
        null;

      return {
        group,
        addonSet,
        primaryCoreMods,
        compatibleAddons,
        hiddenOrIncompatibleMods,
        selectedInGroupCount,
        selectedInCore,
        hasExclusiveConflict,
        isMissingCore,
        addonsOpen,
        hiddenOpen,
        activeAddonCount,
        mainModAnchorId,
      };
    });
  }, [
    visibleGroups,
    sortMode,
    highlightByModId,
    selectedSet,
    q,
    missingSlotGroupIds,
    expandedAddons,
    expandedHidden,
  ]);

  const mainOptimizationEmiBuckets = useMemo(
    () => preparedBuckets.filter(b => !OTHER_GROUP_IDS.has(b.group.id)),
    [preparedBuckets]
  );
  const otherBuckets = useMemo(
    () => preparedBuckets.filter(b => OTHER_GROUP_IDS.has(b.group.id)),
    [preparedBuckets]
  );

  const issueCount = diagnostics.length;

  const renderModRow = (
    mod: ModItem,
    group: ModGroup | null,
    options: {
      isAddonChild?: boolean;
      isHiddenChild?: boolean;
      isCoreExclusive?: boolean;
      hasExclusiveConflict?: boolean;
      addonsToggle?: { count: number; activeCount: number; open: boolean; onToggle: () => void };
      hiddenInlineToggle?: { count: number; open: boolean; onToggle: () => void };
    }
  ) => {
    const isSelected = selectedSet.has(mod.id);
    const hl = highlightByModId.get(mod.id);
    const status: CheckerTier =
      options.hasExclusiveConflict && options.isCoreExclusive && isSelected
        ? 'red'
        : hl?.status ?? 'green';

    const dubiousReason = getDubiousModReason(mod, selectedSet, prefs);
    const showEmbeddiumSelectedNote = isSelected && mod.id === 'embeddium';

    const showReasonLine =
      (isSelected && (status === 'red' || status === 'orange' || status === 'yellow')) ||
      showEmbeddiumSelectedNote ||
      options.isHiddenChild ||
      showDescriptions;

    const reasonText = showEmbeddiumSelectedNote
      ? 'Заметка: возможно лучше для Alloyium (под Nvidium / Emberlens быстрее Emberbium)'
      : hl?.reason;

    return (
      <div
        key={`${group?.id ?? 'mp'}-${mod.id}`}
        data-active={isSelected ? 'true' : 'false'}
        data-status={status}
        className={`mod-row flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-2 gap-y-1.5 ${
          options.isAddonChild || options.isHiddenChild
            ? 'pl-9 pr-4 bg-[var(--surface-sub)]/60'
            : 'px-4'
        }`}
      >
        <div className="flex items-start gap-2.5 min-w-[160px] flex-1">
          {(options.isAddonChild || options.isHiddenChild) && (
            <span className="text-xs font-mono text-[var(--ink-3)] mt-0.5 shrink-0 select-none">↳</span>
          )}
          <label className="flex items-start gap-2.5 min-w-0 flex-1 cursor-pointer">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleToggleMod(mod)}
              aria-label={`Выбрать ${mod.name}`}
              className="accent-[var(--accent)] w-3.5 h-3.5 shrink-0 mt-1"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span className="text-[13px] font-semibold text-[var(--ink-1)] break-words">{mod.name}</span>
                {dubiousReason && (
                  <span
                    className={`inline-flex items-center shrink-0 ${
                      status === 'red'
                        ? 'text-[var(--hl-red-text)]'
                        : status === 'orange'
                          ? 'text-[var(--hl-orange-text)]'
                          : 'text-[var(--hl-yellow-text)]'
                    }`}
                    title={dubiousReason}
                    aria-label={`Сомнительный мод: ${dubiousReason}`}
                  >
                    {status === 'red' || status === 'orange' ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      <HelpCircle className="w-3.5 h-3.5" />
                    )}
                  </span>
                )}
                {options.isCoreExclusive && strictExclusive && (
                  <span className="text-[10px] text-[var(--ink-3)]">· 1 в слоте</span>
                )}
                {showRowMeta && mod.platform.includes('Sinytra') && (
                  <span className="text-[10px] font-mono text-[var(--ink-3)]">Sinytra</span>
                )}
              </div>
              {showReasonLine && reasonText && (
                <p
                  className={`text-[11px] truncate mt-0.5 ${
                    status === 'red'
                      ? 'text-[var(--hl-red-text)] font-medium'
                      : status === 'orange'
                        ? 'text-[var(--hl-orange-text)] font-medium'
                        : status === 'yellow'
                          ? 'text-[var(--hl-yellow-text)]'
                          : showEmbeddiumSelectedNote
                            ? 'text-[var(--accent-text)] font-medium'
                            : 'text-[var(--ink-2)]'
                  }`}
                  title={reasonText}
                >
                  {reasonText}
                </p>
              )}
            </div>
          </label>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {options.addonsToggle && (
            <button
              type="button"
              onClick={options.addonsToggle.onToggle}
              aria-expanded={options.addonsToggle.open}
              className={`inline-flex items-center gap-1 px-2 py-1 ui-control border text-[11px] font-medium transition-colors whitespace-nowrap tabular-nums ${
                options.addonsToggle.open
                  ? 'bg-[var(--hl-blue-bg)] border-[var(--hl-blue-border)] text-[var(--hl-blue-text)]'
                  : 'bg-[var(--surface-control)] hover:bg-[var(--surface-hover)] border-[var(--border-line)] text-[var(--ink-2)] hover:text-[var(--ink-1)]'
              }`}
              title="Раскрыть или скрыть аддоны"
            >
              {options.addonsToggle.open ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              <span>
                Аддоны ({options.addonsToggle.activeCount > 0 ? `${options.addonsToggle.activeCount}/` : ''}
                {options.addonsToggle.count})
              </span>
            </button>
          )}

          {options.hiddenInlineToggle && (
            <button
              type="button"
              onClick={options.hiddenInlineToggle.onToggle}
              aria-expanded={options.hiddenInlineToggle.open}
              className={`inline-flex items-center gap-1 px-2 py-1 ui-control border text-[11px] font-medium transition-colors whitespace-nowrap tabular-nums ${
                options.hiddenInlineToggle.open
                  ? 'bg-[var(--hl-yellow-bg)] border-[var(--hl-yellow-border)] text-[var(--hl-yellow-text)]'
                  : 'bg-[var(--surface-sub)] hover:bg-[var(--surface-hover)] border-[var(--border-line)] text-[var(--ink-3)] hover:text-[var(--ink-1)]'
              }`}
              title="Раскрыть или скрыть несовместимые и скрытые варианты"
            >
              {options.hiddenInlineToggle.open ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              <span>
                {options.hiddenInlineToggle.open ? 'Скрыть' : `Скрытые (${options.hiddenInlineToggle.count})`}
              </span>
            </button>
          )}

          <a
            href={mod.curseforgeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 ui-control text-[var(--ink-3)] hover:text-[#E05327] hover:bg-[var(--surface-hover)] transition-colors"
            title="CurseForge"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  };

  const renderSectionBuckets = (buckets: PreparedGroupBucket[]) => (
    <div className="space-y-2">
      {buckets.map(bucket => {
        const {
          group,
          addonSet,
          primaryCoreMods,
          compatibleAddons,
          hiddenOrIncompatibleMods,
          selectedInGroupCount,
          selectedInCore,
          hasExclusiveConflict,
          isMissingCore,
          addonsOpen,
          hiddenOpen,
          activeAddonCount,
          mainModAnchorId,
        } = bucket;

        return (
          <div
            key={group.id}
            className={`ui-block overflow-hidden ${
              hasExclusiveConflict
                ? 'border-[var(--hl-red-border)]'
                : isMissingCore
                  ? 'border-[var(--hl-yellow-border)]'
                  : ''
            }`}
          >
            <div className="px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-soft)] bg-[var(--surface-sub)]">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h4 className="text-sm font-semibold text-[var(--ink-1)]">{group.title}</h4>
                  {selectedInGroupCount > 0 && (
                    <span className="text-[11px] font-mono text-[var(--accent-text)] font-semibold tabular-nums">
                      ({selectedInGroupCount})
                    </span>
                  )}
                </div>
                {showDescriptions && (
                  <p className="text-[11px] text-[var(--ink-2)] mt-0.5">{group.description}</p>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {!selectedSet.has(group.leaderId) && (
                  <button
                    type="button"
                    onClick={() => handleQuickSelectSlotLeader(group.leaderId, group.memberIds)}
                    className="text-[11px] px-2 py-0.5 ui-control bg-[var(--surface-control)] hover:bg-[var(--hl-blue-bg)] border border-[var(--border-line)] text-[var(--accent-text)] font-semibold transition-colors whitespace-nowrap"
                  >
                    + Лидер
                  </button>
                )}
                {selectedInGroupCount > 0 && (
                  <button
                    type="button"
                    onClick={() => handleClearSlot(group.memberIds)}
                    className="text-[11px] px-2 py-0.5 ui-control bg-[var(--surface-control)] hover:bg-[var(--surface-hover)] border border-[var(--border-line)] text-[var(--ink-2)] hover:text-[var(--ink-1)] transition-colors whitespace-nowrap"
                  >
                    Очистить
                  </button>
                )}
              </div>
            </div>

            {hasExclusiveConflict && (
              <div className="px-4 py-1.5 bg-[var(--hl-red-bg)] border-b border-[var(--hl-red-border)] text-xs text-[var(--hl-red-text)] flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Конфликт: {selectedInCore.map(id => MOD_BY_ID.get(id)?.name).join(' + ')}
                </span>
              </div>
            )}

            <div className="divide-y divide-[var(--border-soft)]">
              {primaryCoreMods.map(mod => {
                const isMainMod = mod.id === mainModAnchorId;
                const hasAddonsOnMain = isMainMod && compatibleAddons.length > 0;
                const hasHiddenOnMain = isMainMod && hiddenOrIncompatibleMods.length > 0;

                return (
                  <div key={mod.id}>
                    {renderModRow(mod, group, {
                      isCoreExclusive: group.exclusive,
                      hasExclusiveConflict,
                      addonsToggle: hasAddonsOnMain
                        ? {
                            count: compatibleAddons.length,
                            activeCount: activeAddonCount,
                            open: addonsOpen,
                            onToggle: () =>
                              setExpandedAddons(prev => ({
                                ...prev,
                                [group.id]: !addonsOpen,
                              })),
                          }
                        : undefined,
                      hiddenInlineToggle: hasHiddenOnMain
                        ? {
                            count: hiddenOrIncompatibleMods.length,
                            open: hiddenOpen,
                            onToggle: () =>
                              setExpandedHidden(prev => ({
                                ...prev,
                                [group.id]: !hiddenOpen,
                              })),
                          }
                        : undefined,
                    })}

                    {hasAddonsOnMain && addonsOpen && (
                      <div className="divide-y divide-[var(--border-soft)] border-t border-[var(--border-soft)]">
                        {compatibleAddons.map(addon =>
                          renderModRow(addon, group, {
                            isAddonChild: true,
                            isCoreExclusive: false,
                            hasExclusiveConflict,
                          })
                        )}
                      </div>
                    )}

                    {hasHiddenOnMain && hiddenOpen && (
                      <div className="divide-y divide-[var(--border-soft)] border-t border-[var(--border-soft)] bg-[var(--surface-sub)]/40">
                        {hiddenOrIncompatibleMods.map(hm =>
                          renderModRow(hm, group, {
                            isHiddenChild: true,
                            isCoreExclusive: group.exclusive && !addonSet.has(hm.id),
                            hasExclusiveConflict,
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {primaryCoreMods.length === 0 && compatibleAddons.length > 0 && (
                <div className="divide-y divide-[var(--border-soft)]">
                  {compatibleAddons.map(addon =>
                    renderModRow(addon, group, {
                      isAddonChild: true,
                      isCoreExclusive: false,
                      hasExclusiveConflict,
                    })
                  )}
                </div>
              )}

              {primaryCoreMods.length === 0 && hiddenOrIncompatibleMods.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedHidden(prev => ({ ...prev, [group.id]: !hiddenOpen }))
                    }
                    className="w-full px-4 py-1.5 bg-[var(--surface-sub)] hover:bg-[var(--surface-hover)] text-xs text-[var(--ink-2)] flex items-center gap-1.5 transition-colors"
                  >
                    {hiddenOpen ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {hiddenOpen
                        ? 'Скрыть несовместимые'
                        : `Скрытые и несовместимые (${hiddenOrIncompatibleMods.length})`}
                    </span>
                  </button>
                  {hiddenOpen && (
                    <div className="divide-y divide-[var(--border-soft)] bg-[var(--surface-sub)]/40">
                      {hiddenOrIncompatibleMods.map(hm =>
                        renderModRow(hm, group, {
                          isHiddenChild: true,
                          isCoreExclusive: group.exclusive && !addonSet.has(hm.id),
                          hasExclusiveConflict,
                        })
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Laconic Workbench Header */}
      <div className="ui-block relative z-20 p-3.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base font-bold text-[var(--ink-1)] tracking-tight">Клипание сборок</h2>
            <span className="text-xs font-mono text-[var(--ink-2)] tabular-nums">
              {selectedIds.length} модов
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {MOD_PRESETS.map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleLoadCorePreset(preset.id)}
                className="px-2.5 py-1 ui-control bg-[var(--surface-sub)] hover:bg-[var(--hl-blue-bg)] border border-[var(--border-line)] hover:border-[var(--hl-blue-border)] text-[var(--ink-1)] text-xs font-medium transition-colors whitespace-nowrap"
              >
                {preset.name.split('(')[0].trim()}
              </button>
            ))}

            {issueCount > 0 && (
              <button
                type="button"
                onClick={handleFixIssues}
                className="inline-flex items-center gap-1 px-2.5 py-1 ui-control bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold transition-colors whitespace-nowrap"
              >
                <Wand2 className="w-3.5 h-3.5" />
                Исправить ({issueCount})
              </button>
            )}

            <button
              type="button"
              onClick={handleFullReset}
              className="inline-flex items-center gap-1 px-2.5 py-1 ui-control bg-[var(--surface-sub)] hover:bg-[var(--hl-red-bg)] border border-[var(--border-line)] hover:border-[var(--hl-red-border)] text-[var(--ink-2)] hover:text-[var(--hl-red-text)] text-xs font-medium transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Сброс
            </button>
          </div>
        </div>

        {/* Compact Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-soft)]">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-[var(--surface-sub)] border border-[var(--border-line)] ui-control p-0.5 text-xs">
              {[
                { k: 'all', label: 'Все' },
                { k: 'optimization_emi', label: 'Оптимизация и EMI' },
                { k: 'other', label: 'Другое' },
              ].map(sec => (
                <button
                  key={sec.k}
                  type="button"
                  onClick={() => setBuilderSection(sec.k as BuilderSection)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap ${
                    builderSection === sec.k
                      ? 'bg-[var(--accent)] text-white font-semibold'
                      : 'text-[var(--ink-2)] hover:text-[var(--ink-1)]'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            <div className="relative w-56 max-w-full">
              <Search className="w-3.5 h-3.5 text-[var(--ink-3)] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={slotSearch}
                onChange={e => setSlotSearch(e.target.value)}
                placeholder="Слот, мод или назначение..."
                className="w-full pl-8 pr-7 py-1 bg-[var(--surface-sub)] border border-[var(--border-line)] ui-control text-xs text-[var(--ink-1)] placeholder:text-[var(--ink-3)] focus:border-[var(--accent-text)]"
              />
              {slotSearch && (
                <button
                  type="button"
                  onClick={() => setSlotSearch('')}
                  aria-label="Очистить фильтр"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[var(--ink-3)] hover:text-[var(--ink-1)]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-0.5 bg-[var(--surface-sub)] border border-[var(--border-line)] ui-control px-1 py-0.5">
              <ArrowUpDown className="w-3 h-3 text-[var(--ink-3)] mx-1" />
              {[
                { k: 'smart', label: 'Порядок' },
                { k: 'green-first', label: 'Надёжные' },
                { k: 'alpha', label: 'А–Я' },
              ].map(s => (
                <button
                  key={s.k}
                  type="button"
                  onClick={() => setSortMode(s.k as BuilderSort)}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                    sortMode === s.k
                      ? 'bg-[var(--surface-control)] text-[var(--ink-1)] font-semibold'
                      : 'text-[var(--ink-2)] hover:text-[var(--ink-1)]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setStrictExclusive(v => !v)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 ui-control text-xs font-medium border transition-colors whitespace-nowrap ${
                strictExclusive
                  ? 'bg-[var(--hl-green-bg)] border-[var(--hl-green-border)] text-[var(--hl-green-text)]'
                  : 'bg-[var(--hl-yellow-bg)] border-[var(--hl-yellow-border)] text-[var(--hl-yellow-text)]'
              }`}
            >
              {strictExclusive ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              {strictExclusive ? '1 мод на слот' : 'Свободно'}
            </button>
          </div>
        </div>

        {actionNotice && (
          <div
            className={`ui-control px-3 py-1.5 text-xs flex items-center justify-between gap-2 border ${
              actionNotice.tone === 'warn'
                ? 'bg-[var(--hl-yellow-bg)] border-[var(--hl-yellow-border)] text-[var(--hl-yellow-text)]'
                : 'bg-[var(--hl-blue-bg)] border-[var(--hl-blue-border)] text-[var(--hl-blue-text)]'
            }`}
          >
            <span>{actionNotice.text}</span>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="p-0.5 rounded hover:bg-[var(--surface-hover)] shrink-0"
              aria-label="Скрыть уведомление"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Dedicated Multiplayer Quick-Add Block */}
      {builderSection !== 'other' && !q && multiplayerMods.length > 0 && (
        <div className="ui-block overflow-hidden">
          <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-soft)] bg-[var(--surface-sub)]">
            <button
              type="button"
              onClick={() => setMultiplayerOpen(v => !v)}
              aria-expanded={multiplayerOpen}
              className="inline-flex items-center gap-2 text-left min-w-0"
            >
              {multiplayerOpen ? (
                <ChevronDown className="w-4 h-4 text-[var(--accent-text)] shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[var(--ink-3)] shrink-0" />
              )}
              <Users className="w-4 h-4 text-[var(--accent-text)] shrink-0" />
              <span className="text-sm font-semibold text-[var(--ink-1)]">Для мультиплеера и серверов</span>
              <span className="text-[11px] font-mono text-[var(--ink-2)] tabular-nums">
                ({activeMultiplayerCount}/{multiplayerMods.length})
              </span>
            </button>

            <button
              type="button"
              onClick={handleToggleMultiplayerPack}
              className={`px-2.5 py-1 ui-control text-xs font-semibold border transition-colors whitespace-nowrap ${
                activeMultiplayerCount === multiplayerMods.length
                  ? 'bg-[var(--hl-blue-bg)] border-[var(--hl-blue-border)] text-[var(--hl-blue-text)]'
                  : 'bg-[var(--accent)] border-[var(--accent)] hover:bg-[var(--accent-hover)] text-white'
              }`}
            >
              {activeMultiplayerCount === multiplayerMods.length
                ? 'Убрать для мультиплеера'
                : 'Добавить для мультиплеера (4)'}
            </button>
          </div>
          {multiplayerOpen && (
            <div className="divide-y divide-[var(--border-soft)]">
              {multiplayerMods.map(mpMod =>
                renderModRow(mpMod, null, {
                  isCoreExclusive: mpMod.id === 'krypton-reno',
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* Unified Optimization + EMI and Other Sections */}
      {preparedBuckets.length === 0 ? (
        <div className="ui-block p-8 text-center text-xs text-[var(--ink-2)]">
          Ничего не найдено.
        </div>
      ) : (
        <div className="space-y-4">
          {mainOptimizationEmiBuckets.length > 0 && (
            <section className="space-y-2.5" data-slot-section="optimization_emi">
              <div className="flex items-baseline gap-2 px-0.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-2)]">
                  Оптимизация и EMI
                </h3>
                <span className="text-xs font-mono text-[var(--ink-3)] tabular-nums">
                  ({mainOptimizationEmiBuckets.length})
                </span>
              </div>
              {renderSectionBuckets(mainOptimizationEmiBuckets)}
            </section>
          )}

          {otherBuckets.length > 0 && (
            <section className="space-y-2.5" data-slot-section="other">
              <div className="flex items-baseline gap-2 px-0.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-2)]">
                  Другое · Частные моды (GeckoLib, Create, фиксы и диагностика)
                </h3>
                <span className="text-xs font-mono text-[var(--ink-3)] tabular-nums">
                  ({otherBuckets.length})
                </span>
              </div>
              {renderSectionBuckets(otherBuckets)}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
