import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MOD_PRESETS,
  type ModItem,
} from '../data/modsData.ts';
import {
  MOD_BY_ID,
  analyzeSelection,
  buildCheckerDiagnostics,
  formatModNamesListText,
  getCheckerTier,
  getDubiousModReason,
  getModRestrictionBadge,
  getModUpdatedLabel,
  getRecipeBridgeStatus,
  isModIncompatibleWithSelection,
  organizeAssemblyTree,
  parseModNamesListText,
  searchModsByQuery,
  shouldHideMod,
  smartFixAssembly,
  toggleModSmart,
  type CheckerTier,
  type DiagnosticIssue,
} from '../utils/modLogic.ts';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  FolderOpen,
  HelpCircle,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  Upload,
  Wand2,
  X,
} from 'lucide-react';
import { matchJarFilenamesToMods } from '../utils/jarMatcher.ts';

interface CheckerTabProps {
  checkedModIds: string[];
  setCheckedModIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  showDescriptions: boolean;
  showRowMeta?: boolean;
  showRowNumbers?: boolean;
}

export function CheckerTab({
  checkedModIds,
  setCheckedModIds,
  showDescriptions,
  showRowMeta = true,
  showRowNumbers = true,
}: CheckerTabProps) {
  const [tierFilter, setTierFilter] = useState<'all' | CheckerTier>('all');
  const [viewMode, setViewMode] = useState<'tree' | 'status'>('tree');
  const [addSearch, setAddSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [includeIncompatibleSearch, setIncludeIncompatibleSearch] = useState(false);
  const [addFeedback, setAddFeedback] = useState<string | null>(null);
  const [copiedList, setCopiedList] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const [expandedDetailId, setExpandedDetailId] = useState<string | null>(null);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIncludeIncompatibleSearch(false);
  }, [addSearch]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const checkedSet = useMemo(() => new Set(checkedModIds), [checkedModIds]);
  const analysis = useMemo(() => analyzeSelection(checkedModIds), [checkedModIds]);
  const diagnostics = useMemo(() => buildCheckerDiagnostics(checkedModIds), [checkedModIds]);

  const warningMap = useMemo(() => {
    const map = new Map<string, { severity: 'red' | 'orange' | 'yellow'; messages: string[] }>();
    for (const w of analysis.warnings) {
      const prev = map.get(w.modId);
      const sev =
        prev?.severity === 'red' || w.severity === 'red'
          ? 'red'
          : prev?.severity === 'orange' || w.severity === 'orange'
            ? 'orange'
            : 'yellow';
      const msgs = prev ? [...prev.messages, w.message] : [w.message];
      map.set(w.modId, { severity: sev, messages: msgs });
    }
    return map;
  }, [analysis.warnings]);

  const rows = useMemo(() => {
    return analysis.selectedMods
      .map(mod => {
        const w = warningMap.get(mod.id);
        const checker = getCheckerTier(
          mod,
          analysis.conflictingIdSet,
          w?.severity,
          analysis.runtimeOnlyConflictIdSet
        );
        const bridge = getRecipeBridgeStatus(mod, checkedSet);
        const dubiousReason = getDubiousModReason(mod, checkedSet);
        return {
          mod,
          tier: checker.tier,
          reason: w?.messages[0] || checker.reason,
          viaBridge: bridge.compatible ? bridge.viaBridge : undefined,
          dubiousReason,
        };
      })
      .sort((a, b) => {
        const order: Record<CheckerTier, number> = {
          red: 0,
          orange: 1,
          yellow: 2,
          lime: 3,
          green: 4,
        };
        return order[a.tier] - order[b.tier] || a.mod.name.localeCompare(b.mod.name, 'ru');
      });
  }, [analysis.selectedMods, analysis.conflictingIdSet, analysis.runtimeOnlyConflictIdSet, warningMap, checkedSet]);

  const counts = useMemo(() => {
    let green = 0;
    let lime = 0;
    let yellow = 0;
    let orange = 0;
    let red = 0;
    for (const r of rows) {
      if (r.tier === 'green') green++;
      else if (r.tier === 'lime') lime++;
      else if (r.tier === 'yellow') yellow++;
      else if (r.tier === 'orange') orange++;
      else red++;
    }
    return { green, lime, yellow, orange, red, total: rows.length };
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (tierFilter === 'all') return rows;
    return rows.filter(r => r.tier === tierFilter);
  }, [rows, tierFilter]);

  const searchMatches = useMemo(() => {
    const q = addSearch.trim();
    if (!q) return { visible: [] as ModItem[], hiddenCount: 0 };
    const candidates = searchModsByQuery(q, 32);
    const compatible: ModItem[] = [];
    const incompatible: ModItem[] = [];

    for (const m of candidates) {
      const hidden = shouldHideMod(m, checkedSet, undefined, {
        hideIncompatible: true,
        hideUselessCovered: true,
      });
      if (hidden) {
        incompatible.push(m);
      } else {
        compatible.push(m);
      }
    }

    if (includeIncompatibleSearch || compatible.length === 0) {
      return {
        visible: [...compatible, ...incompatible].slice(0, 14),
        hiddenCount: 0,
      };
    }
    return {
      visible: compatible.slice(0, 14),
      hiddenCount: incompatible.length,
    };
  }, [addSearch, checkedSet, includeIncompatibleSearch]);

  const rowByModId = useMemo(() => new Map(rows.map(r => [r.mod.id, r])), [rows]);

  const treeNodes = useMemo(() => {
    const filteredIds = filteredRows.map(r => r.mod.id);
    return organizeAssemblyTree(filteredIds);
  }, [filteredRows]);

  const parsedImport = useMemo(() => {
    if (!importText.trim()) return { matchedIds: [], unmatchedLines: [] };
    return parseModNamesListText(importText);
  }, [importText]);

  const handleAddFromPurposeSearch = (mod: ModItem, isIncompatibleItem: boolean) => {
    const inBuild = checkedSet.has(mod.id);
    if (inBuild) {
      setCheckedModIds(prev => prev.filter(x => x !== mod.id));
      setAddFeedback(`Удалён: ${mod.name}`);
      return;
    }

    if (isIncompatibleItem) {
      setCheckedModIds(prev => (prev.includes(mod.id) ? prev : [...prev, mod.id]));
      if (tierFilter !== 'all') setTierFilter('all');
      setAddFeedback(`Добавлен (есть конфликт/риск): ${mod.name}`);
      return;
    }

    const res = toggleModSmart(checkedModIds, mod.id, { strict: true });
    if (res.nextIds.includes(mod.id)) {
      setCheckedModIds(res.nextIds);
      setAddFeedback(res.notice || `Добавлен: ${mod.name}`);
    } else {
      setCheckedModIds(prev => (prev.includes(mod.id) ? prev : [...prev, mod.id]));
      setAddFeedback(res.notice || `Добавлен: ${mod.name}`);
    }

    if (tierFilter !== 'all') {
      setTierFilter('all');
    }
  };

  const handleCopyPlainNamesList = () => {
    const text = formatModNamesListText(checkedModIds);
    navigator.clipboard.writeText(text);
    setCopiedList(true);
    setTimeout(() => setCopiedList(false), 1800);
  };

  const handleApplyImport = (mode: 'replace' | 'merge') => {
    if (parsedImport.matchedIds.length === 0) return;
    if (mode === 'replace') {
      setCheckedModIds(parsedImport.matchedIds);
      setAddFeedback(`Сборка заменена: импортировано модов (${parsedImport.matchedIds.length})`);
    } else {
      setCheckedModIds(prev => Array.from(new Set([...prev, ...parsedImport.matchedIds])));
      setAddFeedback(`Добавлено из списка: ${parsedImport.matchedIds.length}`);
    }
    setImportText('');
    setImportOpen(false);
  };

  const handleScanDesktopFolder = async () => {
    if (!window.desktopAPI?.scanModsFolder) return;
    const res = await window.desktopAPI.scanModsFolder();
    if (res.canceled) return;
    const { matchedIds } = matchJarFilenamesToMods(res.jarFiles);
    if (matchedIds.length > 0) {
      setCheckedModIds(matchedIds);
    }
  };

  const handleApplyDiagnosticFix = (issue: DiagnosticIssue, keepId?: string) => {
    if (issue.kind === 'conflict' || issue.kind === 'runtime') {
      const winnerId = keepId || issue.keepPreferredId;
      const toRemove = winnerId
        ? issue.betweenIds.filter(id => id !== winnerId)
        : issue.removeIds || [];
      const removeSet = new Set(toRemove);
      setCheckedModIds(prev => prev.filter(id => !removeSet.has(id)));
      const winnerName = winnerId ? MOD_BY_ID.get(winnerId)?.name || winnerId : 'конфликтные моды';
      setAddFeedback(`Применено решение: оставлен ${winnerName}`);
      return;
    }

    if (issue.addIds && issue.addIds.length > 0 && !keepId) {
      setCheckedModIds(prev => Array.from(new Set([...prev, ...issue.addIds!])));
      setAddFeedback(
        `Добавлены зависимости: ${issue.addIds.map(id => MOD_BY_ID.get(id)?.name || id).join(', ')}`
      );
      return;
    }

    if (issue.removeIds && issue.removeIds.length > 0) {
      const removeSet = new Set(issue.removeIds);
      setCheckedModIds(prev => prev.filter(id => !removeSet.has(id)));
      setAddFeedback(`Удалено: ${issue.removeIds.map(id => MOD_BY_ID.get(id)?.name || id).join(', ')}`);
    }
  };

  const hasAnyIssues = diagnostics.length > 0;
  const criticalCount = diagnostics.filter(d => d.severity === 'red').length;
  const runtimeOrOrangeCount = diagnostics.filter(d => d.severity === 'orange').length;
  const noticeCount = diagnostics.filter(d => d.severity === 'yellow').length;

  const renderCheckerRow = (
    r: (typeof rows)[number],
    opts: {
      isChild?: boolean;
      relationLabel?: string;
      rootIndex?: number;
      childCount?: number;
      isCollapsed?: boolean;
      onToggleCollapse?: () => void;
    }
  ) => {
    const { mod, tier, reason, viaBridge, dubiousReason } = r;
    const updatedLabel = getModUpdatedLabel(mod);
    const showLine = tier === 'red' || tier === 'orange' || tier === 'yellow' || showDescriptions;
    const isDetailOpen = expandedDetailId === mod.id;

    return (
      <div key={mod.id}>
        <div
          data-active="true"
          data-status={tier}
          className={`mod-row flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-3 gap-y-1.5 ${
            opts.isChild ? 'pl-10 pr-4 bg-[var(--surface-sub)]/60' : 'px-4'
          }`}
        >
          <div className="flex items-start gap-2.5 min-w-[160px] flex-1">
            {showRowNumbers && !opts.isChild && opts.rootIndex !== undefined && (
              <span className="text-[11px] font-mono text-[var(--ink-3)] w-5 text-right shrink-0 tabular-nums mt-0.5">
                {opts.rootIndex}.
              </span>
            )}
            {opts.isChild && (
              <span className="text-xs font-mono text-[var(--accent-text)] w-5 text-right shrink-0 mt-0.5">
                ↳
              </span>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <button
                  type="button"
                  onClick={() => setExpandedDetailId(isDetailOpen ? null : mod.id)}
                  aria-expanded={isDetailOpen}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--ink-1)] hover:text-[var(--accent-text)] text-left truncate"
                >
                  {isDetailOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[var(--accent-text)] shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--ink-3)] shrink-0" />
                  )}
                  <span className="truncate">{mod.name}</span>
                </button>
                {dubiousReason && (
                  <span
                    className={`inline-flex items-center shrink-0 ${
                      tier === 'red'
                        ? 'text-[var(--hl-red-text)]'
                        : tier === 'orange'
                          ? 'text-[var(--hl-orange-text)]'
                          : 'text-[var(--hl-yellow-text)]'
                    }`}
                    title={dubiousReason}
                    aria-label={`Сомнительный мод: ${dubiousReason}`}
                  >
                    {tier === 'red' || tier === 'orange' ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      <HelpCircle className="w-3.5 h-3.5" />
                    )}
                  </span>
                )}
                {opts.isChild && opts.relationLabel && (
                  <span className="text-[11px] text-[var(--accent-text)]">{opts.relationLabel}</span>
                )}
                {showRowMeta && (
                  <>
                    <span className="text-[11px] text-[var(--ink-3)]">{mod.platform}</span>
                    {updatedLabel && (
                      <span className="text-[11px] text-[var(--ink-3)] font-mono">· {updatedLabel}</span>
                    )}
                  </>
                )}
                {viaBridge && (
                  <span className="text-[11px] text-[var(--accent-text)]">{viaBridge}</span>
                )}
              </div>
              {showLine && (
                <p
                  className={`text-xs truncate mt-0.5 ${
                    tier === 'red'
                      ? 'text-[var(--hl-red-text)] font-medium'
                      : tier === 'orange'
                        ? 'text-[var(--hl-orange-text)] font-medium'
                        : tier === 'yellow'
                          ? 'text-[var(--hl-yellow-text)] font-medium'
                          : 'text-[var(--ink-2)]'
                  }`}
                >
                  {tier === 'green' || tier === 'lime' ? mod.description : reason}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!opts.isChild && opts.childCount !== undefined && opts.childCount > 0 && opts.onToggleCollapse && (
              <button
                type="button"
                onClick={opts.onToggleCollapse}
                aria-expanded={!opts.isCollapsed}
                className="inline-flex items-center gap-1 px-2 py-1 ui-control bg-[var(--surface-control)] hover:bg-[var(--surface-hover)] border border-[var(--border-line)] text-[var(--ink-2)] hover:text-[var(--ink-1)] text-[11px] font-medium tabular-nums"
              >
                {opts.isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>Аддоны ({opts.childCount})</span>
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
            <button
              type="button"
              onClick={() => setCheckedModIds(prev => prev.filter(id => id !== mod.id))}
              className="p-1.5 ui-control text-[var(--ink-3)] hover:text-[var(--hl-red-text)] hover:bg-[var(--hl-red-bg)] transition-colors"
              title="Убрать"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Inline expandable mod details */}
        {isDetailOpen && (
          <div className={`${opts.isChild ? 'pl-14' : 'pl-11'} pr-4 py-2.5 bg-[var(--surface-sub)]/80 border-t border-[var(--border-soft)] text-xs space-y-1.5`}>
            <p className="text-[var(--ink-1)] leading-relaxed">{mod.description}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--ink-2)]">
              <span>Группа: <strong className="text-[var(--ink-1)]">{mod.groupTitle || mod.category}</strong></span>
              <span>Платформа: <strong className="text-[var(--ink-1)]">{mod.platform}</strong></span>
              {updatedLabel && <span className="font-mono">{updatedLabel}</span>}
            </div>
            {(mod.warning || dubiousReason) && (
              <div className="text-[11px] text-[var(--hl-orange-text)]">
                Возможная проблема: {mod.warning || dubiousReason}
              </div>
            )}
            {mod.bestAlternative && (
              <div className="text-[11px] text-[var(--hl-green-text)]">
                Лучшее решение: {mod.bestAlternative}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const dropdownVisible = searchFocused && addSearch.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* Redesigned Single-Elevation Diagnostic Header */}
      <div className="ui-block relative z-20 overflow-hidden">
        <div className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-baseline gap-2.5">
                <h2 className="text-base font-bold text-[var(--ink-1)] tracking-tight">Чекер сборки</h2>
                <span className="text-xs font-mono text-[var(--ink-2)] tabular-nums">
                  {counts.total} модов
                </span>
                <span className="text-xs text-[var(--ink-3)]">·</span>
                {counts.total === 0 ? (
                  <span className="text-xs text-[var(--ink-3)]">Добавьте моды для проверки</span>
                ) : hasAnyIssues ? (
                  <span className="text-xs font-medium text-[var(--hl-orange-text)] tabular-nums">
                    Найдено проблем: {diagnostics.length}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--hl-green-text)]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Конфликтов нет
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {window.desktopAPI?.isDesktop && (
                <button
                  type="button"
                  onClick={handleScanDesktopFolder}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 ui-control text-xs font-medium bg-[var(--hl-blue-bg)] hover:bg-[var(--surface-hover)] border border-[var(--hl-blue-border)] text-[var(--hl-blue-text)] transition-colors whitespace-nowrap"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  Папка mods
                </button>
              )}
              {hasAnyIssues && (
                <button
                  type="button"
                  onClick={() => setCheckedModIds(smartFixAssembly(checkedModIds))}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 ui-control text-xs font-semibold bg-[#059669] hover:bg-[#047857] text-white transition-colors whitespace-nowrap"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Исправить всё ({diagnostics.length})
                </button>
              )}
              <button
                type="button"
                onClick={handleCopyPlainNamesList}
                disabled={rows.length === 0}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 ui-control text-xs font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white disabled:opacity-40 transition-colors whitespace-nowrap"
              >
                {copiedList ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedList ? 'Скопировано' : 'Скопировать списком'}
              </button>
              <button
                type="button"
                onClick={() => setImportOpen(v => !v)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 ui-control text-xs font-semibold border transition-colors whitespace-nowrap ${
                  importOpen
                    ? 'bg-[var(--hl-blue-bg)] border-[var(--hl-blue-border)] text-[var(--hl-blue-text)]'
                    : 'bg-[var(--surface-sub)] hover:bg-[var(--surface-hover)] border-[var(--border-line)] text-[var(--ink-1)]'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Импортировать списком
              </button>
              <button
                type="button"
                onClick={() => setCheckedModIds([])}
                disabled={rows.length === 0}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 ui-control text-xs font-medium bg-[var(--surface-sub)] hover:bg-[var(--hl-red-bg)] border border-[var(--border-line)] hover:border-[var(--hl-red-border)] text-[var(--ink-2)] hover:text-[var(--hl-red-text)] disabled:opacity-40 transition-colors whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Очистить
              </button>
            </div>
          </div>

          {/* Inline Import Panel */}
          {importOpen && (
            <div className="p-3 bg-[var(--surface-sub)] border border-[var(--border-line)] ui-control space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--ink-1)]">
                  Вставьте список модов (по строкам, через запятую или .jar имена)
                </span>
                <button
                  type="button"
                  onClick={() => setImportOpen(false)}
                  className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--ink-2)]"
                  aria-label="Закрыть импорт"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                rows={5}
                placeholder={'Emberbium\nNvidium\nFerriteCore\nModernFix'}
                aria-label="Список модов для импорта"
                className="w-full p-2.5 bg-[var(--surface-solid)] border border-[var(--border-line)] ui-control text-xs font-mono text-[var(--ink-1)] placeholder:text-[var(--ink-3)] focus:border-[var(--accent-text)] resize-y"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-[var(--ink-2)]">
                  Распознано: <strong className="text-[var(--hl-green-text)] font-mono">{parsedImport.matchedIds.length}</strong>
                  {parsedImport.unmatchedLines.length > 0 && (
                    <span className="ml-2 text-[var(--hl-yellow-text)]">
                      · не найдено ({parsedImport.unmatchedLines.length}): {parsedImport.unmatchedLines.slice(0, 3).join(', ')}
                      {parsedImport.unmatchedLines.length > 3 ? '…' : ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={parsedImport.matchedIds.length === 0}
                    onClick={() => handleApplyImport('merge')}
                    className="px-3 py-1.5 ui-control bg-[var(--surface-control)] hover:bg-[var(--surface-hover)] border border-[var(--border-line)] text-xs font-medium text-[var(--ink-1)] disabled:opacity-40"
                  >
                    Добавить к текущей
                  </button>
                  <button
                    type="button"
                    disabled={parsedImport.matchedIds.length === 0}
                    onClick={() => handleApplyImport('replace')}
                    className="px-3 py-1.5 ui-control bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold disabled:opacity-40"
                  >
                    Заменить сборку
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filter Counters & Purpose-Aware Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pt-2.5 border-t border-[var(--border-soft)]">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { k: 'all', label: `Все (${counts.total})` },
                { k: 'green', label: `Зелёные (${counts.green})` },
                { k: 'lime', label: `Светло-зелёные (${counts.lime})` },
                { k: 'yellow', label: `Жёлтые (${counts.yellow})` },
                { k: 'orange', label: `Оранжевые (${counts.orange})` },
                { k: 'red', label: `Красные (${counts.red})` },
              ].map(btn => (
                <button
                  key={btn.k}
                  type="button"
                  onClick={() => setTierFilter(btn.k as 'all' | CheckerTier)}
                  className={`px-2.5 py-1 ui-control text-xs font-medium tabular-nums border transition-colors whitespace-nowrap ${
                    tierFilter === btn.k
                      ? 'bg-[var(--accent)] border-[var(--accent)] text-white font-semibold'
                      : 'bg-[var(--surface-sub)] border-[var(--border-line)] text-[var(--ink-2)] hover:text-[var(--ink-1)]'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-[var(--surface-sub)] border border-[var(--border-line)] ui-control p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('tree')}
                  className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                    viewMode === 'tree'
                      ? 'bg-[var(--surface-control)] text-[var(--ink-1)] font-semibold'
                      : 'text-[var(--ink-2)] hover:text-[var(--ink-1)]'
                  }`}
                >
                  Мод → Аддоны
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('status')}
                  className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                    viewMode === 'status'
                      ? 'bg-[var(--surface-control)] text-[var(--ink-1)] font-semibold'
                      : 'text-[var(--ink-2)] hover:text-[var(--ink-1)]'
                  }`}
                >
                  По статусу
                </button>
              </div>

              <div className="relative w-full sm:w-80" ref={searchBoxRef}>
                <Search className="w-3.5 h-3.5 text-[var(--ink-3)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={addSearch}
                  onFocus={() => setSearchFocused(true)}
                  onChange={e => {
                    setAddSearch(e.target.value);
                    setSearchFocused(true);
                  }}
                  placeholder="Добавить мод по названию или назначению..."
                  aria-label="Добавить мод по названию или назначению"
                  className="w-full pl-8 pr-7 py-1.5 bg-[var(--surface-sub)] border border-[var(--border-line)] ui-control text-xs text-[var(--ink-1)] placeholder:text-[var(--ink-3)] focus:border-[var(--accent-text)]"
                />
                {addSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setAddSearch('');
                      setSearchFocused(false);
                    }}
                    aria-label="Очистить поиск модов"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[var(--ink-3)] hover:text-[var(--ink-1)]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                {dropdownVisible && (
                  <div className="absolute right-0 left-0 top-full mt-1 z-30 bg-[var(--surface-solid)] border border-[var(--border-line)] ui-control shadow-2xl divide-y divide-[var(--border-soft)] max-h-80 overflow-y-auto">
                    {searchMatches.visible.length === 0 ? (
                      <div className="px-3 py-2.5 text-xs text-[var(--ink-2)]">Ничего не найдено</div>
                    ) : (
                      searchMatches.visible.map(s => {
                        const inBuild = checkedSet.has(s.id);
                        const restriction = getModRestrictionBadge(s, checkedSet);
                        const incompatible = isModIncompatibleWithSelection(s, checkedSet);
                        const baseTier = getCheckerTier(s, analysis.conflictingIdSet).tier;
                        const statusTier: CheckerTier =
                          baseTier === 'red' || incompatible || restriction?.tone === 'red'
                            ? 'red'
                            : baseTier === 'orange'
                              ? 'orange'
                              : baseTier === 'yellow' || restriction?.tone === 'amber'
                                ? 'yellow'
                                : baseTier;

                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleAddFromPurposeSearch(s, incompatible)}
                            data-active={inBuild ? 'true' : 'false'}
                            data-status={statusTier}
                            className="mod-row w-full px-3 text-left flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-[var(--ink-1)] truncate">
                                  {s.name}
                                </span>
                                <span className="text-[10px] text-[var(--ink-3)] truncate">
                                  {s.groupTitle || s.category}
                                </span>
                              </div>
                              <div className="text-[11px] text-[var(--ink-2)] truncate">
                                {restriction ? restriction.text : s.description}
                              </div>
                            </div>
                            {inBuild ? (
                              <Check className="w-3.5 h-3.5 text-[var(--accent-text)] shrink-0" />
                            ) : (
                              <Plus className="w-3.5 h-3.5 text-[var(--hl-green-text)] shrink-0" />
                            )}
                          </button>
                        );
                      })
                    )}
                    {searchMatches.hiddenCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setIncludeIncompatibleSearch(true)}
                        className="w-full px-3 py-1.5 text-[11px] text-[var(--accent-text)] hover:bg-[var(--surface-hover)] text-left font-medium"
                      >
                        Показать также скрытые / несовместимые ({searchMatches.hiddenCount})
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {addFeedback && (
            <div className="ui-control px-3 py-1.5 bg-[var(--hl-blue-bg)] border border-[var(--hl-blue-border)] text-[var(--hl-blue-text)] text-xs flex items-center justify-between gap-2">
              <span>{addFeedback}</span>
              <button
                type="button"
                onClick={() => setAddFeedback(null)}
                className="p-0.5 rounded hover:bg-[var(--surface-hover)] shrink-0"
                aria-label="Скрыть уведомление"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Presets quick strip */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-[var(--ink-3)] mr-0.5">Сборки:</span>
            {MOD_PRESETS.map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setCheckedModIds([...preset.modIds])}
                className="px-2 py-0.5 ui-control border bg-[var(--surface-sub)] border-[var(--border-line)] text-[var(--ink-2)] hover:text-[var(--ink-1)] hover:border-[var(--hl-blue-border)] transition-colors whitespace-nowrap"
              >
                {preset.name.split('(')[0].trim()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Redesigned Structured Diagnostics Panel: Problem + Between + Best Solution */}
      {hasAnyIssues && (
        <section className="ui-block overflow-hidden" aria-label="Диагностика проблем и решений">
          <div className="px-4 py-2.5 bg-[var(--surface-sub)] border-b border-[var(--border-line)] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert
                className={`w-4 h-4 shrink-0 ${
                  criticalCount > 0
                    ? 'text-[var(--hl-red-text)]'
                    : runtimeOrOrangeCount > 0
                      ? 'text-[var(--hl-orange-text)]'
                      : 'text-[var(--hl-yellow-text)]'
                }`}
              />
              <h3 className="text-sm font-semibold text-[var(--ink-1)]">
                Возможные проблемы и лучшие решения
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums">
              {criticalCount > 0 && (
                <span className="text-[var(--hl-red-text)]">Критично: {criticalCount}</span>
              )}
              {runtimeOrOrangeCount > 0 && (
                <span className="text-[var(--hl-orange-text)]">Риск режима: {runtimeOrOrangeCount}</span>
              )}
              {noticeCount > 0 && (
                <span className="text-[var(--hl-yellow-text)]">Замечания: {noticeCount}</span>
              )}
            </div>
          </div>

          <div className="divide-y divide-[var(--border-soft)]">
            {diagnostics.map(issue => {
              const sevColor =
                issue.severity === 'red'
                  ? 'text-[var(--hl-red-text)]'
                  : issue.severity === 'orange'
                    ? 'text-[var(--hl-orange-text)]'
                    : 'text-[var(--hl-yellow-text)]';
              const sevLabel =
                issue.kind === 'runtime'
                  ? 'Конфликт режима'
                  : issue.kind === 'conflict'
                    ? 'Конфликт'
                    : issue.kind === 'dependency'
                      ? 'Зависимость'
                      : issue.kind === 'redundant'
                        ? 'Дубль'
                        : 'Платформа';

              const isChoiceConflict =
                (issue.kind === 'conflict' || issue.kind === 'runtime') &&
                issue.betweenIds.length === 2;

              return (
                <div
                  key={issue.id}
                  data-active="true"
                  data-status={issue.severity}
                  className="mod-row px-4 py-3 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 min-w-0">
                      <span className={`text-xs font-semibold ${sevColor}`}>{sevLabel}</span>
                      <span className="text-[var(--ink-3)]">·</span>
                      <span className="text-sm font-semibold text-[var(--ink-1)]">{issue.title}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      {isChoiceConflict ? (
                        issue.betweenIds.map(choiceId => {
                          const choiceName = MOD_BY_ID.get(choiceId)?.name || choiceId;
                          const isPreferred = choiceId === issue.keepPreferredId;
                          return (
                            <button
                              key={choiceId}
                              type="button"
                              onClick={() => handleApplyDiagnosticFix(issue, choiceId)}
                              className={`px-2.5 py-1 ui-control text-xs font-medium border transition-colors whitespace-nowrap ${
                                isPreferred
                                  ? 'bg-[#059669] hover:bg-[#047857] border-[#059669] text-white font-semibold'
                                  : 'bg-[var(--surface-control)] hover:bg-[var(--surface-hover)] border-[var(--border-line)] text-[var(--ink-1)]'
                              }`}
                            >
                              Оставить {choiceName}
                            </button>
                          );
                        })
                      ) : issue.addIds && issue.addIds.length > 0 ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApplyDiagnosticFix(issue)}
                            className="px-2.5 py-1 ui-control text-xs font-semibold bg-[#059669] hover:bg-[#047857] text-white transition-colors whitespace-nowrap"
                          >
                            Добавить {issue.addIds.map(id => MOD_BY_ID.get(id)?.name || id).join(' + ')}
                          </button>
                          {issue.removeIds && issue.removeIds.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleApplyDiagnosticFix(issue, 'remove')}
                              className="px-2.5 py-1 ui-control text-xs font-medium bg-[var(--surface-control)] hover:bg-[var(--surface-hover)] border border-[var(--border-line)] text-[var(--ink-2)] hover:text-[var(--ink-1)] transition-colors whitespace-nowrap"
                            >
                              Убрать {issue.removeIds.map(id => MOD_BY_ID.get(id)?.name || id).join(', ')}
                            </button>
                          )}
                        </>
                      ) : issue.removeIds && issue.removeIds.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleApplyDiagnosticFix(issue)}
                          className="px-2.5 py-1 ui-control text-xs font-semibold bg-[var(--surface-control)] hover:bg-[var(--hl-red-bg)] border border-[var(--border-line)] hover:border-[var(--hl-red-border)] text-[var(--ink-1)] hover:text-[var(--hl-red-text)] transition-colors whitespace-nowrap"
                        >
                          Убрать {issue.removeIds.map(id => MOD_BY_ID.get(id)?.name || id).join(', ')}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-2 text-xs">
                    <div>
                      <div className="text-[11px] font-medium text-[var(--ink-3)]">Между чем и чем</div>
                      <div className="text-[var(--ink-1)] font-medium mt-0.5">
                        {issue.betweenNames.join(' ↔ ')}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-[var(--ink-3)]">Возможная проблема</div>
                      <div className="text-[var(--ink-2)] leading-relaxed mt-0.5">{issue.problem}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-[var(--ink-3)]">Лучшее решение</div>
                      <div className="text-[var(--hl-green-text)] leading-relaxed mt-0.5">{issue.bestSolution}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* List */}
      <div className="ui-block overflow-hidden">
        {filteredRows.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--ink-2)]">
            Список пуст. Добавьте моды в «Клипание сборок», через поиск или импортом списком.
          </div>
        ) : viewMode === 'tree' ? (
          <div className="divide-y divide-[var(--border-soft)]">
            {treeNodes.map((node, idx) => {
              const parentRow = rowByModId.get(node.parent.id);
              if (!parentRow) return null;
              const isCollapsed = Boolean(collapsedNodes[node.parent.id]);
              return (
                <div key={node.parent.id}>
                  {renderCheckerRow(parentRow, {
                    rootIndex: idx + 1,
                    childCount: node.children.length,
                    isCollapsed,
                    onToggleCollapse:
                      node.children.length > 0
                        ? () =>
                            setCollapsedNodes(prev => ({
                              ...prev,
                              [node.parent.id]: !isCollapsed,
                            }))
                        : undefined,
                  })}
                  {node.children.length > 0 && !isCollapsed && (
                    <div className="divide-y divide-[var(--border-soft)] border-t border-[var(--border-soft)]">
                      {node.children.map(ch => {
                        const childRow = rowByModId.get(ch.mod.id);
                        if (!childRow) return null;
                        return renderCheckerRow(childRow, {
                          isChild: true,
                          relationLabel: ch.relationLabel,
                        });
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-soft)]">
            {filteredRows.map((r, idx) => renderCheckerRow(r, { rootIndex: idx + 1 }))}
          </div>
        )}
      </div>
    </div>
  );
}
