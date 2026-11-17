import { useMemo } from 'react';
import {
  MODS_DATABASE,
  type ModItem,
} from '../data/modsData.ts';
import {
  getBaseHealthTier,
  getDualPortPairForMod,
  getGroupMembersByRole,
  getModSuperseder,
  getModUpdatedLabel,
  getRecipeBridgeStatus,
  isUnsupportedOnForge,
  type AssemblyPreferences,
} from '../utils/modLogic.ts';
import {
  ExternalLink,
  X,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Layers,
  Plus,
  Check,
  ArrowRight,
  PackageCheck,
  ArrowLeftRight,
} from 'lucide-react';

interface ModDetailModalProps {
  mod: ModItem | null;
  onClose: () => void;
  onSelectMod: (mod: ModItem) => void;
  checkedModIds: string[];
  onToggleCheckMod: (id: string) => void;
  activeModIds?: string[];
  builderPrefs?: AssemblyPreferences;
  onChooseVariantInBuilder?: (mod: ModItem) => void;
}

export function ModDetailModal({
  mod,
  onClose,
  onSelectMod,
  checkedModIds,
  onToggleCheckMod,
  activeModIds,
  builderPrefs,
  onChooseVariantInBuilder,
}: ModDetailModalProps) {
  const groupInfo = useMemo(() => {
    if (!mod?.groupId) return null;
    return getGroupMembersByRole(mod.groupId);
  }, [mod]);

  const dualPair = useMemo(() => {
    if (!mod) return null;
    return getDualPortPairForMod(mod.id);
  }, [mod]);

  const dualPairMods = useMemo(() => {
    if (!dualPair) return null;
    const forgeMod = MODS_DATABASE.find(m => m.id === dualPair.forgeModId) || null;
    const fabricMod = MODS_DATABASE.find(m => m.id === dualPair.fabricModId) || null;
    return { pair: dualPair, forgeMod, fabricMod };
  }, [dualPair]);

  const builtInCoveredMods = useMemo(() => {
    if (!mod) return [];
    return MODS_DATABASE.filter(
      item =>
        item.id !== mod.id &&
        item.coveredBy &&
        (item.coveredBy === mod.name || item.coveredBy.toLowerCase().includes(mod.name.toLowerCase()))
    );
  }, [mod]);

  const contextSet = useMemo(
    () => new Set(activeModIds ?? checkedModIds),
    [activeModIds, checkedModIds]
  );

  const supersederInfo = useMemo(() => {
    if (!mod) return null;
    return getModSuperseder(mod, contextSet, builderPrefs, true);
  }, [mod, contextSet, builderPrefs]);

  const bridgeInfo = useMemo(() => {
    if (!mod) return null;
    return getRecipeBridgeStatus(mod, contextSet, builderPrefs);
  }, [mod, contextSet, builderPrefs]);

  if (!mod) return null;

  const baseTier = getBaseHealthTier(mod);
  const tierStyle =
    baseTier === 'red'
      ? {
          badge: 'bg-[var(--hl-red-pill)] text-[var(--hl-red-text)] border-[var(--hl-red-border)]',
          label: 'Конфликт / плацебо',
        }
      : baseTier === 'green'
        ? {
            badge: 'bg-[var(--hl-green-bg)] text-[var(--hl-green-text)] border-[var(--hl-green-border)]',
            label: 'Стабильно',
          }
        : baseTier === 'lime'
          ? {
              badge: 'bg-[var(--hl-lime-bg)] text-[var(--hl-lime-text)] border-[var(--hl-lime-border)]',
              label: 'Сносно / подходит',
            }
          : {
              badge: 'bg-[var(--hl-yellow-pill)] text-[var(--hl-yellow-text)] border-[var(--hl-yellow-border)]',
              label: 'Условно / так себе',
            };

  const isSelectedInChecker = checkedModIds.includes(mod.id);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[88vh] overflow-y-auto bg-[var(--surface-solid)] border border-[var(--border-line)] rounded-lg shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-[var(--surface-solid)] px-6 py-4 border-b border-[var(--border-soft)] flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs mb-1.5">
              <span className={`px-2 py-0.5 rounded font-semibold border ${tierStyle.badge}`}>
                {mod.statusLabel}
              </span>
              <span className="text-[var(--ink-2)]">
                {mod.platform}
                {mod.isGroupLeader ? ' · Лидер группы' : mod.isGroupAddon ? ' · Аддон' : ''}
                {(() => {
                  const updated = getModUpdatedLabel(mod);
                  return updated ? ` · Обновл.: ${updated}` : '';
                })()}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[var(--ink-1)] leading-tight break-words tracking-tight">
              {mod.name}
            </h2>
            <p className="text-xs text-[var(--ink-2)] mt-0.5">
              {mod.category}
              {mod.groupTitle ? ` · ${mod.groupTitle}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[var(--ink-2)] hover:text-[var(--ink-1)] hover:bg-[var(--surface-hover)] transition-colors shrink-0"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={mod.curseforgeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#E05327] hover:bg-[#C9441B] text-white text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Открыть на CurseForge
            </a>

            <button
              onClick={() => onToggleCheckMod(mod.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold border transition-colors whitespace-nowrap ${
                isSelectedInChecker
                  ? 'bg-[var(--hl-green-bg)] border-[var(--hl-green-border)] text-[var(--hl-green-text)]'
                  : 'bg-[var(--surface-sub)] border-[var(--border-line)] text-[var(--ink-1)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              {isSelectedInChecker ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {isSelectedInChecker ? 'В сборке (Чекер)' : 'Добавить в Чекер'}
            </button>

            {onChooseVariantInBuilder && baseTier !== 'red' && !mod.coveredBy && (
              <button
                onClick={() => onChooseVariantInBuilder(mod)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold transition-colors whitespace-nowrap"
              >
                Выбрать в Клипании
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {groupInfo?.leader && groupInfo.leader.id !== mod.id && (
              <button
                onClick={() => onSelectMod(groupInfo.leader!)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-[var(--surface-sub)] border border-[var(--border-line)] text-[var(--ink-1)] hover:bg-[var(--surface-hover)] transition-colors whitespace-nowrap"
              >
                К лидеру: {groupInfo.leader.name}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="bg-[var(--surface-sub)] border border-[var(--border-soft)] rounded-lg p-4 space-y-3">
            <p className="text-sm text-[var(--ink-1)] leading-relaxed">{mod.description}</p>

            {mod.coveredBy && (
              <div className="flex items-start gap-2.5 p-3 rounded-md bg-[var(--hl-yellow-bg)] border border-[var(--hl-yellow-border)] text-xs text-[var(--hl-yellow-text)]">
                <PackageCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Бесполезен как отдельный мод:</span> функционал уже встроен в{' '}
                  <span className="font-semibold">{mod.coveredBy}</span>.
                </div>
              </div>
            )}

            {!mod.coveredBy && supersederInfo && (
              <div className="flex items-start gap-2.5 p-3 rounded-md bg-[var(--hl-yellow-bg)] border border-[var(--hl-yellow-border)] text-xs text-[var(--hl-yellow-text)]">
                <PackageCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">
                    {supersederInfo.isActiveInSelection ? 'Перекрыт активной связкой:' : 'Перекрывается более лучшим модом:'}
                  </span>{' '}
                  {supersederInfo.reason}.
                </div>
              </div>
            )}

            {(mod.recipeEcosystem || bridgeInfo?.viaBridge || (bridgeInfo && !bridgeInfo.compatible)) && (
              <div
                className={`flex items-start gap-2.5 p-3 rounded-md border text-xs ${
                  bridgeInfo && !bridgeInfo.compatible
                    ? 'bg-[var(--hl-red-bg)] border-[var(--hl-red-border)] text-[var(--hl-red-text)]'
                    : 'bg-[var(--hl-blue-bg)] border-[var(--hl-blue-border)] text-[var(--hl-blue-text)]'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Совместимость / рецепты:</span>{' '}
                  {bridgeInfo && !bridgeInfo.compatible
                    ? bridgeInfo.reason
                    : bridgeInfo?.viaBridge
                      ? `${bridgeInfo.viaBridge} — работает в текущей конфигурации.`
                      : mod.recipeEcosystem === 'emi-only'
                        ? 'Требует EMI (нативный аддон EMI).'
                        : mod.recipeEcosystem === 'tmrv-bridge'
                          ? 'Мост JEI-плагинов для чистого EMI (конфликтует с самим JEI).'
                          : mod.recipeEcosystem === 'jei-engine'
                            ? 'Работает только с установленным JEI (не работает через TMRV в чистом EMI).'
                            : mod.recipeEcosystem === 'jei-plugin'
                              ? 'JEI-плагин: работает с JEI напрямую либо в чистом EMI через прослойку TMRV Updated.'
                              : 'Универсально работает с EMI и JEI.'}
                </div>
              </div>
            )}

            {mod.bestAlternative && (
              <div className="flex items-start gap-2.5 p-3 rounded-md bg-[var(--hl-green-bg)] border border-[var(--hl-green-border)] text-xs text-[var(--hl-green-text)]">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Рекомендация:</span> {mod.bestAlternative}
                </div>
              </div>
            )}

            {mod.warning && (
              <div
                className={`flex items-start gap-2.5 p-3 rounded-md border text-xs ${
                  mod.status === 'danger' || baseTier === 'red'
                    ? 'bg-[var(--hl-red-bg)] border-[var(--hl-red-border)] text-[var(--hl-red-text)]'
                    : 'bg-[var(--hl-yellow-bg)] border-[var(--hl-yellow-border)] text-[var(--hl-yellow-text)]'
                }`}
              >
                {mod.status === 'danger' || baseTier === 'red' ? (
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold">Важно:</span> {mod.warning}
                </div>
              </div>
            )}
          </div>

          {dualPairMods && dualPairMods.forgeMod && dualPairMods.fabricMod && (
            <div className="bg-[var(--surface-sub)] border border-[var(--border-line)] rounded-lg p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[var(--ink-1)] flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-[var(--accent-text)]" />
                  Выбор реализации: {dualPairMods.pair.title}
                </h3>
                <span className="text-[11px] text-[var(--ink-2)]">
                  {dualPairMods.pair.switchableOnForge
                    ? 'Оба варианта работают на Forge 1.20.1'
                    : 'На Forge работает только нативный порт'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    role: 'Нативный Forge-порт',
                    target: dualPairMods.forgeMod,
                    summary: dualPairMods.pair.forgeSummary,
                    tone: 'emerald' as const,
                    canPick: true,
                  },
                  {
                    role: dualPairMods.pair.switchableOnForge ? 'Fabric + Sinytra Connector' : 'Fabric-оригинал (справка)',
                    target: dualPairMods.fabricMod,
                    summary: dualPairMods.pair.fabricSummary,
                    tone: isUnsupportedOnForge(dualPairMods.fabricMod) ? ('rose' as const) : ('amber' as const),
                    canPick: dualPairMods.pair.switchableOnForge && !isUnsupportedOnForge(dualPairMods.fabricMod),
                  },
                ].map(item => {
                  const isCurrent = item.target.id === mod.id;
                  const borderCls =
                    item.tone === 'emerald'
                      ? isCurrent
                        ? 'border-[var(--hl-green-border)] bg-[var(--hl-green-bg)]'
                        : 'border-[var(--border-line)] bg-[var(--surface-solid)]'
                      : item.tone === 'amber'
                        ? isCurrent
                          ? 'border-[var(--hl-yellow-border)] bg-[var(--hl-yellow-bg)]'
                          : 'border-[var(--border-line)] bg-[var(--surface-solid)]'
                        : 'border-[var(--hl-red-border)] bg-[var(--hl-red-bg)]';
                  return (
                    <div key={item.target.id} className={`rounded-md border p-3 flex flex-col justify-between gap-2.5 ${borderCls}`}>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-medium text-[var(--ink-2)]">{item.role}</span>
                          <a
                            href={item.target.curseforgeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-[var(--ink-2)] hover:text-[#E05327] inline-flex items-center gap-1"
                          >
                            CF <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="text-xs font-semibold text-[var(--ink-1)]">{item.target.name}</div>
                        <p className="text-[11px] text-[var(--ink-2)] leading-snug">{item.summary}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {!isCurrent && (
                          <button
                            onClick={() => onSelectMod(item.target)}
                            className="px-2.5 py-1 rounded bg-[var(--surface-sub)] hover:bg-[var(--surface-hover)] border border-[var(--border-line)] text-[11px] text-[var(--ink-1)] font-medium"
                          >
                            Открыть
                          </button>
                        )}
                        {onChooseVariantInBuilder && item.canPick && (
                          <button
                            onClick={() => onChooseVariantInBuilder(item.target)}
                            className="px-2.5 py-1 rounded text-[11px] font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-colors"
                          >
                            Выбрать в Клипании
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {groupInfo && groupInfo.addons.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--ink-1)]">
                  Совместимые аддоны ({groupInfo.addons.length})
                </h3>
                <span className="text-[11px] text-[var(--ink-2)]">Дополняют лидера, не заменяя его</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {groupInfo.addons.map(addon => {
                  const addonTier = getBaseHealthTier(addon);
                  const cardTone =
                    addonTier === 'red'
                      ? 'bg-[var(--hl-red-bg)] border-[var(--hl-red-border)]'
                      : addonTier === 'yellow'
                        ? 'bg-[var(--hl-yellow-bg)] border-[var(--hl-yellow-border)]'
                        : 'bg-[var(--surface-sub)] border-[var(--border-line)] hover:border-[var(--accent-text)]';
                  const statusTone =
                    addonTier === 'red'
                      ? 'text-[var(--hl-red-text)] font-semibold'
                      : addonTier === 'green'
                        ? 'text-[var(--hl-green-text)]'
                        : addonTier === 'lime'
                          ? 'text-[var(--hl-lime-text)]'
                          : 'text-[var(--hl-yellow-text)] font-semibold';
                  return (
                    <div
                      key={addon.id}
                      onClick={() => onSelectMod(addon)}
                      className={`p-3 rounded-md border cursor-pointer transition-colors flex flex-col justify-between gap-2 ${cardTone}`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[var(--ink-1)] truncate">
                            {addon.name}
                          </span>
                          <a
                            href={addon.curseforgeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-[var(--ink-2)] hover:text-[#E05327] p-1 rounded shrink-0"
                            title="Открыть на CurseForge"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <p className="text-[11px] text-[var(--ink-2)] mt-1 line-clamp-2">{addon.description}</p>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[var(--ink-2)]">
                        <span>{addon.platform}</span>
                        <span className={statusTone}>{addon.statusLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {groupInfo && groupInfo.removedAnalogs.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--ink-1)] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[var(--ink-2)]" />
                  Скрытые аналоги в группе ({groupInfo.removedAnalogs.length})
                </h3>
                <span className="text-[11px] text-[var(--ink-2)]">
                  {groupInfo.group.exclusive ? 'Конфликтуют или слабее лидера' : 'Дополнительные варианты'}
                </span>
              </div>
              {groupInfo.group.conflictReason && (
                <p className="text-xs text-[var(--ink-2)] bg-[var(--surface-sub)] border border-[var(--border-line)] rounded-md px-3 py-2">
                  {groupInfo.group.conflictReason}
                </p>
              )}
              <div className="divide-y divide-[var(--border-soft)] border border-[var(--border-line)] rounded-lg overflow-hidden bg-[var(--surface-solid)]">
                {groupInfo.removedAnalogs.map(alt => {
                  const altTier = getBaseHealthTier(alt);
                  const rowTone =
                    altTier === 'red'
                      ? 'bg-[var(--hl-red-bg)] hover:bg-[var(--hl-red-hover)]'
                      : altTier === 'yellow'
                        ? 'bg-[var(--hl-yellow-bg)] hover:bg-[var(--hl-yellow-hover)]'
                        : 'hover:bg-[var(--surface-hover)]';
                  const pillCls =
                    altTier === 'red'
                      ? 'bg-[var(--hl-red-pill)] text-[var(--hl-red-text)] border-[var(--hl-red-border)]'
                      : altTier === 'green'
                        ? 'bg-[var(--hl-green-bg)] text-[var(--hl-green-text)] border-[var(--hl-green-border)]'
                        : altTier === 'lime'
                          ? 'bg-[var(--hl-lime-bg)] text-[var(--hl-lime-text)] border-[var(--hl-lime-border)]'
                          : 'bg-[var(--hl-yellow-pill)] text-[var(--hl-yellow-text)] border-[var(--hl-yellow-border)]';
                  return (
                    <div
                      key={alt.id}
                      onClick={() => onSelectMod(alt)}
                      className={`px-3.5 py-2.5 cursor-pointer transition-colors flex items-start justify-between gap-3 ${rowTone}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-[var(--ink-1)]">{alt.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${pillCls}`}>
                            {alt.statusLabel}
                          </span>
                          {alt.coveredBy && (
                            <span className="text-[11px] text-[var(--ink-2)]">
                              Встроено в {alt.coveredBy}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--ink-2)] mt-1 leading-snug">{alt.description}</p>
                        {(alt.bestAlternative || alt.warning) && (
                          <p className="text-[11px] text-[var(--ink-1)] mt-1">
                            <span className="text-[var(--ink-2)]">Причина:</span>{' '}
                            {alt.bestAlternative || alt.warning}
                          </p>
                        )}
                      </div>
                      <a
                        href={alt.curseforgeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded bg-[var(--surface-sub)] hover:bg-[#E05327] border border-[var(--border-line)] hover:border-[#E05327] text-[var(--ink-1)] hover:text-white text-[11px] transition-colors"
                      >
                        CF
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {builtInCoveredMods.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-sm font-semibold text-[var(--ink-1)] flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-[var(--hl-green-text)]" />
                Моды, уже включённые в {mod.name} ({builtInCoveredMods.length})
              </h3>
              <div className="divide-y divide-[var(--border-soft)] border border-[var(--border-line)] rounded-lg overflow-hidden bg-[var(--surface-solid)]">
                {builtInCoveredMods.map(sub => (
                  <div
                    key={sub.id}
                    onClick={() => onSelectMod(sub)}
                    className="px-3.5 py-2 hover:bg-[var(--surface-hover)] cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[var(--ink-1)]">{sub.name}</div>
                      <div className="text-[11px] text-[var(--ink-2)] truncate">{sub.description}</div>
                    </div>
                    <a
                      href={sub.curseforgeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="shrink-0 text-[var(--ink-2)] hover:text-[#E05327] p-1"
                      title="CurseForge"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
