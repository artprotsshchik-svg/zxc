import { useState } from 'react';
import {
  MOD_PRESETS,
  type ModItem,
  type ModPreset,
} from '../data/modsData.ts';
import {
  MOD_BY_ID,
  evaluateAssemblyHealth,
  getCheckerTier,
  getDubiousModReason,
  getModUpdatedLabel,
  type CheckerTier,
} from '../utils/modLogic.ts';
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  List,
  Wrench,
} from 'lucide-react';

interface PresetsTabProps {
  dbUpdatedAt: string;
  lastSavedDate: string;
  onLoadToChecker: (preset: ModPreset) => void;
  onLoadToBuilder: (preset: ModPreset) => void;
}

export function PresetsTab({
  onLoadToChecker,
  onLoadToBuilder,
}: PresetsTabProps) {
  const [expandedPresets, setExpandedPresets] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-4">
      <div className="ui-block p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[var(--ink-1)] tracking-tight">
            Основные сборки ({MOD_PRESETS.length})
          </h2>
          <p className="text-xs text-[var(--ink-2)] mt-0.5">
            Готовые связки под Forge 1.20.1. Копирование и импорт списком — в «Чекере».
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {MOD_PRESETS.map(preset => {
          const presetHealth = evaluateAssemblyHealth(preset.modIds);
          const presetRedCount =
            presetHealth.conflicts.length +
            presetHealth.warnings.filter(w => w.severity === 'red').length;
          const presetYellowCount = presetHealth.warnings.filter(
            w => w.severity === 'yellow' || w.severity === 'orange'
          ).length;

          const badgeCls =
            preset.badgeColor === 'emerald'
              ? 'bg-[var(--hl-green-bg)] text-[var(--hl-green-text)] border-[var(--hl-green-border)]'
              : 'bg-[var(--hl-blue-bg)] text-[var(--hl-blue-text)] border-[var(--hl-blue-border)]';

          const isListOpen = Boolean(expandedPresets[preset.id]);
          const presetSet = new Set(preset.modIds);
          const presetMods = preset.modIds
            .map(id => MOD_BY_ID.get(id))
            .filter((m): m is ModItem => Boolean(m))
            .sort((a, b) => a.name.localeCompare(b.name, 'ru'));

          return (
            <div key={preset.id} className="ui-block p-5 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-[var(--ink-1)] leading-snug">{preset.name}</h3>
                  <span className={`px-2 py-0.5 ui-control text-[11px] font-semibold border whitespace-nowrap ${badgeCls}`}>
                    {preset.badge}
                  </span>
                </div>

                <p className="text-xs text-[var(--ink-2)] leading-relaxed">{preset.description}</p>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--ink-2)] bg-[var(--surface-sub)] border border-[var(--border-soft)] ui-control px-3 py-2">
                  <span>
                    <strong className="text-[var(--ink-1)]">Условия:</strong> {preset.crashRisk}
                  </span>
                  <span
                    className={`font-semibold tabular-nums ${
                      presetRedCount > 0
                        ? 'text-[var(--hl-red-text)]'
                        : presetYellowCount > 0
                          ? 'text-[var(--hl-yellow-text)]'
                          : 'text-[var(--hl-green-text)]'
                    }`}
                  >
                    · {preset.modIds.length} модов ({presetRedCount} конфл.)
                  </span>
                </div>

                {/* Expandable Preset Mod List Viewer */}
                <div className="border border-[var(--border-line)] ui-control overflow-hidden">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedPresets(prev => ({ ...prev, [preset.id]: !isListOpen }))
                    }
                    aria-expanded={isListOpen}
                    className="w-full px-3 py-2 bg-[var(--surface-sub)] hover:bg-[var(--surface-hover)] flex items-center justify-between gap-2 text-xs font-medium text-[var(--ink-1)] transition-colors"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <List className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                      <span>Состав сборки ({presetMods.length})</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-[var(--ink-2)]">
                      {isListOpen ? 'Свернуть' : 'Просмотр модов'}
                      {isListOpen ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </span>
                  </button>

                  {isListOpen && (
                    <div className="max-h-72 overflow-y-auto divide-y divide-[var(--border-soft)] border-t border-[var(--border-soft)]">
                      {presetMods.map((mod, idx) => {
                        const tier: CheckerTier = getCheckerTier(
                          mod,
                          presetHealth.conflictingIdSet,
                          undefined,
                          presetHealth.runtimeOnlyConflictIdSet
                        ).tier;
                        const dubiousReason = getDubiousModReason(mod, presetSet);
                        const updated = getModUpdatedLabel(mod);

                        return (
                          <div
                            key={mod.id}
                            data-active="true"
                            data-status={tier}
                            className="mod-row px-3 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="text-[10px] font-mono text-[var(--ink-3)] w-5 text-right shrink-0 tabular-nums">
                                {idx + 1}.
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="font-semibold text-[var(--ink-1)] truncate">
                                    {mod.name}
                                  </span>
                                  {dubiousReason && (
                                    <span
                                      className={`shrink-0 inline-flex items-center ${
                                        tier === 'orange' || tier === 'red'
                                          ? 'text-[var(--hl-orange-text)]'
                                          : 'text-[var(--hl-yellow-text)]'
                                      }`}
                                      title={dubiousReason}
                                      aria-label={`Сомнительный мод: ${dubiousReason}`}
                                    >
                                      {tier === 'orange' || tier === 'red' ? (
                                        <AlertTriangle className="w-3 h-3" />
                                      ) : (
                                        <HelpCircle className="w-3 h-3" />
                                      )}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-[var(--ink-3)] truncate">
                                  {mod.groupTitle || mod.category}
                                  {updated ? ` · ${updated}` : ''}
                                </div>
                              </div>
                            </div>

                            <a
                              href={mod.curseforgeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 ui-control text-[var(--ink-3)] hover:text-[#E05327] shrink-0"
                              title="CurseForge"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-soft)] flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onLoadToBuilder(preset)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 ui-control bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  Загрузить в Клипание
                </button>

                <button
                  type="button"
                  onClick={() => onLoadToChecker(preset)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 ui-control bg-[var(--surface-sub)] hover:bg-[var(--surface-hover)] border border-[var(--border-line)] text-[var(--ink-1)] text-xs font-medium transition-colors whitespace-nowrap ml-auto"
                >
                  Открыть в Чекере
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
