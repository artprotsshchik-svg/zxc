import { useState } from 'react';
import { Moon, RotateCcw, SlidersHorizontal, Sparkles, Sun, X } from 'lucide-react';
import {
  DEFAULT_THEME_CONFIG,
  loadThemeConfig,
  saveThemeConfig,
  type BlockRadius,
  type BlockStyle,
  type ContainerWidthMode,
  type EdgeHighlightMode,
  type FontScale,
  type FractalType,
  type RowDensity,
  type ThemeConfig,
} from '../utils/builderTheme.ts';

export {
  DEFAULT_THEME_CONFIG,
  loadThemeConfig,
  saveThemeConfig,
  type BlockRadius,
  type BlockStyle,
  type ContainerWidthMode,
  type EdgeHighlightMode,
  type FontScale,
  type FractalType,
  type RowDensity,
  type ThemeConfig,
};

const FRACTAL_OPTIONS: Array<{ id: FractalType; label: string }> = [
  { id: 'none', label: 'Нет' },
  { id: 'julia', label: 'Жюлиа' },
  { id: 'mandelbrot', label: 'Мандельброт' },
  { id: 'fbm', label: 'Туман FBM' },
  { id: 'tree', label: 'Дерево' },
  { id: 'koch', label: 'Кох' },
  { id: 'sierpinski', label: 'Серпинский' },
  { id: 'dragon', label: 'Дракон' },
  { id: 'fern', label: 'Папоротник' },
  { id: 'lorenz', label: 'Лоренц' },
];

const ACCENT_PRESETS = [
  { label: 'Авто', value: 'auto' },
  { label: 'Синий', value: '#2563EB' },
  { label: 'Изумруд', value: '#059669' },
  { label: 'Янтарь', value: '#D97706' },
  { label: 'Фиолет', value: '#7C3AED' },
  { label: 'Роза', value: '#E11D48' },
];

const PRESET_THEMES: Array<{ label: string; config: ThemeConfig }> = [
  {
    label: 'Жюлиа · Стекло',
    config: DEFAULT_THEME_CONFIG,
  },
  {
    label: 'Мандельброт · Объём',
    config: {
      ...DEFAULT_THEME_CONFIG,
      colors: ['#00FF87', '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6'],
      angle: 135,
      saturation: 24,
      panelTransparency: 28,
      panelBlur: 14,
      fractal: 'mandelbrot',
      fractalOpacity: 28,
      blockStyle: 'elevated',
    },
  },
  {
    label: 'Лоренц · Минимал',
    config: {
      ...DEFAULT_THEME_CONFIG,
      colors: ['#38BDF8', '#818CF8', '#C084FC', '#F472B6', '#2DD4BF'],
      fractal: 'lorenz',
      fractalOpacity: 32,
      blockStyle: 'minimal',
      blockRadius: 'sharp',
      rowDensity: 'compact',
      panelTransparency: 20,
      accentColor: '#7C3AED',
    },
  },
  {
    label: 'Дракон · Контур',
    config: {
      ...DEFAULT_THEME_CONFIG,
      colors: ['#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#3B82F6'],
      fractal: 'dragon',
      multiFractal: true,
      fractalSecondary: 'sierpinski',
      fractalTertiary: 'none',
      fractalUncertainty: 38,
      fractalOpacity: 28,
      blockStyle: 'bordered',
      blockRadius: 'sharp',
      rowDensity: 'compact',
      panelTransparency: 14,
    },
  },
  {
    label: 'Строгий плоский',
    config: {
      ...DEFAULT_THEME_CONFIG,
      colors: ['#334155', '#1E293B', '#475569', '#1E293B', '#0F172A'],
      saturation: 0,
      panelTransparency: 0,
      panelBlur: 0,
      animate: false,
      fractal: 'none',
      multiFractal: false,
      fractalSecondary: 'none',
      fractalTertiary: 'none',
      fractalOpacity: 0,
      blockStyle: 'flat',
      blockRadius: 'medium',
      edgeHighlight: 'edges',
    },
  },
  {
    label: 'Светлый папоротник',
    config: {
      ...DEFAULT_THEME_CONFIG,
      mode: 'light',
      colors: ['#059669', '#10B981', '#0D9488', '#2563EB', '#84CC16'],
      saturation: 12,
      panelTransparency: 12,
      animate: true,
      fractal: 'fern',
      multiFractal: true,
      fractalSecondary: 'tree',
      fractalTertiary: 'none',
      fractalUncertainty: 48,
      fractalOpacity: 22,
      blockStyle: 'bordered',
      accentColor: '#059669',
    },
  },
];

interface ThemeConfiguratorProps {
  config: ThemeConfig;
  onChange: (next: ThemeConfig) => void;
}

export function ThemeConfigurator({ config, onChange }: ThemeConfiguratorProps) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<'blocks' | 'display' | 'fractals'>('blocks');
  const [activeStop, setActiveStop] = useState<number>(0);

  const updateColor = (idx: number, hex: string) => {
    const nextColors = [...config.colors] as ThemeConfig['colors'];
    nextColors[idx] = hex.toUpperCase();
    onChange({ ...config, colors: nextColors });
  };

  const gradientBarCss = `linear-gradient(90deg, ${config.colors.join(', ')})`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 ui-control bg-[var(--surface-sub)] hover:bg-[var(--surface-hover)] border border-[var(--border-line)] text-[var(--ink-1)] text-xs font-medium whitespace-nowrap shrink-0 transition-colors"
        title="Настроить отображение, блоки, строки и фракталы"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--accent-text)]" />
        <span className="hidden sm:inline">Вид и фон</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-label="Конфигуратор отображения и фона"
            className="fixed sm:absolute right-3 sm:right-0 top-14 sm:top-full sm:mt-2 z-50 w-[min(390px,calc(100vw-24px))] max-h-[84vh] overflow-y-auto rounded-[var(--radius-block)] bg-[var(--surface-solid)] border border-[var(--border-line)] shadow-2xl p-4 space-y-3.5 text-[var(--ink-1)]"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-bold tracking-tight">Конфигуратор отображения</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--ink-2)] hover:text-[var(--ink-1)]"
                aria-label="Закрыть настройки"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3-tab section switcher */}
            <div className="grid grid-cols-3 gap-1 bg-[var(--surface-sub)] border border-[var(--border-line)] ui-control p-1 text-xs">
              {[
                { id: 'blocks', label: 'Блоки' },
                { id: 'display', label: 'Строки и макет' },
                { id: 'fractals', label: 'Фракталы' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSection(tab.id as typeof section)}
                  className={`py-1 px-1.5 rounded font-medium transition-colors truncate ${
                    section === tab.id
                      ? 'bg-[var(--accent)] text-white font-semibold'
                      : 'text-[var(--ink-2)] hover:text-[var(--ink-1)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {section === 'blocks' && (
              <div className="space-y-3">
                {/* Dark / Light switch */}
                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-[var(--ink-2)]">Тема</div>
                  <div className="grid grid-cols-2 gap-1 bg-[var(--surface-sub)] border border-[var(--border-line)] ui-control p-1">
                    <button
                      type="button"
                      onClick={() => onChange({ ...config, mode: 'dark' })}
                      className={`flex items-center justify-center gap-1.5 py-1 rounded text-xs font-medium transition-colors ${
                        config.mode === 'dark'
                          ? 'bg-[var(--accent)] text-white font-semibold'
                          : 'text-[var(--ink-2)] hover:text-[var(--ink-1)]'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      Тёмная
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange({ ...config, mode: 'light' })}
                      className={`flex items-center justify-center gap-1.5 py-1 rounded text-xs font-medium transition-colors ${
                        config.mode === 'light'
                          ? 'bg-[var(--accent)] text-white font-semibold'
                          : 'text-[var(--ink-2)] hover:text-[var(--ink-1)]'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      Светлая
                    </button>
                  </div>
                </div>

                {/* Block Style */}
                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-[var(--ink-2)]">Стиль блоков</div>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'glass', label: 'Стекло' },
                      { id: 'elevated', label: 'Объёмный' },
                      { id: 'bordered', label: 'Контур' },
                      { id: 'flat', label: 'Плоский' },
                      { id: 'minimal', label: 'Минимал' },
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onChange({ ...config, blockStyle: item.id as BlockStyle })}
                        className={`py-1.5 px-2 ui-control border text-xs font-medium transition-colors ${
                          config.blockStyle === item.id
                            ? 'bg-[var(--hl-blue-bg)] border-[var(--hl-blue-border)] text-[var(--hl-blue-text)] font-semibold'
                            : 'bg-[var(--surface-sub)] border-[var(--border-line)] text-[var(--ink-2)] hover:text-[var(--ink-1)]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Radius */}
                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-[var(--ink-2)]">Скругление углов</div>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'sharp', label: 'Острое' },
                      { id: 'medium', label: 'Среднее' },
                      { id: 'soft', label: 'Мягкое' },
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onChange({ ...config, blockRadius: item.id as BlockRadius })}
                        className={`py-1 px-2 ui-control border text-xs font-medium transition-colors ${
                          config.blockRadius === item.id
                            ? 'bg-[var(--hl-blue-bg)] border-[var(--hl-blue-border)] text-[var(--hl-blue-text)] font-semibold'
                            : 'bg-[var(--surface-sub)] border-[var(--border-line)] text-[var(--ink-2)] hover:text-[var(--ink-1)]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transparency + Blur */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--ink-2)]">Прозрачность</span>
                      <span className="font-mono font-semibold tabular-nums">{config.panelTransparency}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={config.panelTransparency}
                      onChange={e => onChange({ ...config, panelTransparency: Number(e.target.value) })}
                      aria-label="Прозрачность блоков"
                      className="w-full accent-[var(--accent)] cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--ink-2)]">Размытие</span>
                      <span className="font-mono font-semibold tabular-nums">{config.panelBlur}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={24}
                      value={config.panelBlur}
                      onChange={e => onChange({ ...config, panelBlur: Number(e.target.value) })}
                      aria-label="Размытие стекла блоков"
                      className="w-full accent-[var(--accent)] cursor-pointer"
                    />
                  </div>
                </div>

                {/* Accent color */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-medium text-[var(--ink-2)]">Акцентный цвет</div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {ACCENT_PRESETS.map(p => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => onChange({ ...config, accentColor: p.value })}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 ui-control border text-[11px] font-medium transition-colors ${
                          config.accentColor === p.value
                            ? 'bg-[var(--hl-blue-bg)] border-[var(--hl-blue-border)] text-[var(--hl-blue-text)] font-semibold'
                            : 'bg-[var(--surface-sub)] border-[var(--border-line)] text-[var(--ink-2)] hover:text-[var(--ink-1)]'
                        }`}
                      >
                        {p.value !== 'auto' && (
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: p.value }}
                          />
                        )}
                        {p.label}
                      </button>
                    ))}
                    <input
                      type="color"
                      value={config.accentColor === 'auto' ? '#2563EB' : config.accentColor}
                      onChange={e => onChange({ ...config, accentColor: e.target.value.toUpperCase() })}
                      aria-label="Свой акцентный цвет"
                      className="w-7 h-7 rounded border border-[var(--border-line)] bg-transparent cursor-pointer p-0.5"
                    />
                  </div>
                </div>
              </div>
            )}

            {section === 'display' && (
              <div className="space-y-3">
                {/* Density */}
                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-[var(--ink-2)]">Плотность строк</div>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'compact', label: 'Плотно' },
                      { id: 'normal', label: 'Норма' },
                      { id: 'comfortable', label: 'Просторно' },
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onChange({ ...config, rowDensity: item.id as RowDensity })}
                        className={`py-1 px-2 ui-control border text-xs font-medium transition-colors ${
                          config.rowDensity === item.id
                            ? 'bg-[var(--hl-blue-bg)] border-[var(--hl-blue-border)] text-[var(--hl-blue-text)] font-semibold'
                            : 'bg-[var(--surface-sub)] border-[var(--border-line)] text-[var(--ink-2)] hover:text-[var(--ink-1)]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Container width */}
                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-[var(--ink-2)]">Ширина области</div>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { id: 'narrow', label: 'Узкая' },
                      { id: 'standard', label: 'Норма' },
                      { id: 'wide', label: 'Широкая' },
                      { id: 'full', label: '100%' },
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onChange({ ...config, containerWidth: item.id as ContainerWidthMode })}
                        className={`py-1 px-1.5 ui-control border text-[11px] font-medium transition-colors ${
                          config.containerWidth === item.id
                            ? 'bg-[var(--hl-blue-bg)] border-[var(--hl-blue-border)] text-[var(--hl-blue-text)] font-semibold'
                            : 'bg-[var(--surface-sub)] border-[var(--border-line)] text-[var(--ink-2)] hover:text-[var(--ink-1)]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font scale */}
                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-[var(--ink-2)]">Масштаб текста</div>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 90, label: '90% Компакт' },
                      { id: 100, label: '100% Стандарт' },
                      { id: 110, label: '110% Крупно' },
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onChange({ ...config, fontScale: item.id as FontScale })}
                        className={`py-1 px-1.5 ui-control border text-[11px] font-medium transition-colors ${
                          config.fontScale === item.id
                            ? 'bg-[var(--hl-blue-bg)] border-[var(--hl-blue-border)] text-[var(--hl-blue-text)] font-semibold'
                            : 'bg-[var(--surface-sub)] border-[var(--border-line)] text-[var(--ink-2)] hover:text-[var(--ink-1)]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Edge highlight */}
                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-[var(--ink-2)]">Цветовые края строк (слева / справа)</div>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'both', label: 'Край + градиент' },
                      { id: 'edges', label: 'Полосы' },
                      { id: 'soft', label: 'Заливка' },
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onChange({ ...config, edgeHighlight: item.id as EdgeHighlightMode })}
                        className={`py-1 px-1.5 ui-control border text-[11px] font-medium transition-colors whitespace-nowrap ${
                          config.edgeHighlight === item.id
                            ? 'bg-[var(--hl-blue-bg)] border-[var(--hl-blue-border)] text-[var(--hl-blue-text)] font-semibold'
                            : 'bg-[var(--surface-sub)] border-[var(--border-line)] text-[var(--ink-2)] hover:text-[var(--ink-1)]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visibility toggles */}
                <div className="space-y-2 pt-1 border-t border-[var(--border-soft)]">
                  <label className="flex items-center justify-between gap-2 cursor-pointer text-xs">
                    <span className="text-[var(--ink-1)]">Описания модов и слотов</span>
                    <input
                      type="checkbox"
                      checked={config.showDescriptions}
                      onChange={e => onChange({ ...config, showDescriptions: e.target.checked })}
                      className="accent-[var(--accent)] w-4 h-4"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2 cursor-pointer text-xs">
                    <span className="text-[var(--ink-1)]">Платформа и даты в строках</span>
                    <input
                      type="checkbox"
                      checked={config.showRowMeta}
                      onChange={e => onChange({ ...config, showRowMeta: e.target.checked })}
                      className="accent-[var(--accent)] w-4 h-4"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2 cursor-pointer text-xs">
                    <span className="text-[var(--ink-1)]">Нумерация строк</span>
                    <input
                      type="checkbox"
                      checked={config.showRowNumbers}
                      onChange={e => onChange({ ...config, showRowNumbers: e.target.checked })}
                      className="accent-[var(--accent)] w-4 h-4"
                    />
                  </label>
                </div>
              </div>
            )}

            {section === 'fractals' && (
              <div className="space-y-3">
                {/* Fractal Selector (10 types incl. none) */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-medium text-[var(--ink-2)]">Основной фрактал на фоне</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                    {FRACTAL_OPTIONS.map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => onChange({ ...config, fractal: f.id })}
                        className={`py-1.5 px-2 ui-control border text-[11px] font-medium transition-colors truncate ${
                          config.fractal === f.id
                            ? 'bg-[var(--accent)] border-[var(--accent)] text-white font-semibold'
                            : 'bg-[var(--surface-sub)] border-[var(--border-line)] text-[var(--ink-2)] hover:text-[var(--ink-1)]'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Multi-fractal toggle + secondary/tertiary layers */}
                <div className="space-y-2 p-2.5 ui-control bg-[var(--surface-sub)] border border-[var(--border-line)]">
                  <label className="flex items-center justify-between gap-2 cursor-pointer text-xs">
                    <span className="font-medium text-[var(--ink-1)]">Мультифрактал (несколько на фоне)</span>
                    <input
                      type="checkbox"
                      checked={config.multiFractal}
                      onChange={e => onChange({ ...config, multiFractal: e.target.checked })}
                      className="accent-[var(--accent)] w-4 h-4"
                    />
                  </label>
                  {config.multiFractal && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <label className="space-y-1">
                        <span className="block text-[10px] text-[var(--ink-2)]">Слой 2</span>
                        <select
                          aria-label="Второй фрактал"
                          value={config.fractalSecondary}
                          onChange={e => onChange({ ...config, fractalSecondary: e.target.value as FractalType })}
                          className="w-full px-2 py-1 ui-control bg-[var(--surface-solid)] border border-[var(--border-line)] text-[11px] text-[var(--ink-1)]"
                        >
                          {FRACTAL_OPTIONS.map(f => (
                            <option key={f.id} value={f.id}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-1">
                        <span className="block text-[10px] text-[var(--ink-2)]">Слой 3</span>
                        <select
                          aria-label="Третий фрактал"
                          value={config.fractalTertiary}
                          onChange={e => onChange({ ...config, fractalTertiary: e.target.value as FractalType })}
                          className="w-full px-2 py-1 ui-control bg-[var(--surface-solid)] border border-[var(--border-line)] text-[11px] text-[var(--ink-1)]"
                        >
                          {FRACTAL_OPTIONS.map(f => (
                            <option key={f.id} value={f.id}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}
                </div>

                {(config.fractal !== 'none' || (config.multiFractal && (config.fractalSecondary !== 'none' || config.fractalTertiary !== 'none'))) && (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[var(--ink-2)]">Яркость</span>
                          <span className="font-mono font-semibold tabular-nums">{config.fractalOpacity}%</span>
                        </div>
                        <input
                          type="range"
                          min={5}
                          max={85}
                          value={config.fractalOpacity}
                          onChange={e => onChange({ ...config, fractalOpacity: Number(e.target.value) })}
                          aria-label="Яркость фрактала"
                          className="w-full accent-[var(--accent)] cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[var(--ink-2)]">Масштаб</span>
                          <span className="font-mono font-semibold tabular-nums">{config.fractalScale}%</span>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={100}
                          value={config.fractalScale}
                          onChange={e => onChange({ ...config, fractalScale: Number(e.target.value) })}
                          aria-label="Масштаб фрактала"
                          className="w-full accent-[var(--accent)] cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[var(--ink-2)]">Неопределённость (дрейф / хаос)</span>
                        <span className="font-mono font-semibold tabular-nums">{config.fractalUncertainty}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={config.fractalUncertainty}
                        onChange={e => onChange({ ...config, fractalUncertainty: Number(e.target.value) })}
                        aria-label="Неопределённость фракталов"
                        className="w-full accent-[var(--accent)] cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* 5-color stops */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-[var(--ink-2)]">Палитра (5 цветов)</span>
                    <span className="font-mono text-[var(--ink-2)]">{config.colors[activeStop]}</span>
                  </div>

                  <div
                    className="ui-control p-1 border border-[var(--border-line)] flex items-center justify-between gap-1"
                    style={{ backgroundImage: gradientBarCss }}
                  >
                    {config.colors.map((c, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveStop(idx)}
                        aria-label={`Цвет ${idx + 1}: ${c}`}
                        className={`w-10 h-6 rounded border-2 transition-transform ${
                          activeStop === idx
                            ? 'border-white scale-105 shadow-md'
                            : 'border-white/70 opacity-90 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.colors[activeStop]}
                      onChange={e => updateColor(activeStop, e.target.value)}
                      aria-label="Выбрать цвет палитры"
                      className="w-9 h-7 rounded border border-[var(--border-line)] bg-transparent cursor-pointer shrink-0 p-0.5"
                    />
                    <input
                      type="text"
                      value={config.colors[activeStop]}
                      onChange={e => {
                        const val = e.target.value;
                        if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                          updateColor(activeStop, val);
                        }
                      }}
                      maxLength={7}
                      aria-label="HEX код цвета"
                      className="flex-1 px-2.5 py-1 rounded bg-[var(--surface-sub)] border border-[var(--border-line)] text-xs font-mono text-[var(--ink-1)]"
                    />
                  </div>
                </div>

                {/* Glow sliders */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--ink-2)]">Угол свечения</span>
                      <span className="font-mono font-semibold tabular-nums">{config.angle}°</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={config.angle}
                      onChange={e => onChange({ ...config, angle: Number(e.target.value) })}
                      aria-label="Угол свечения"
                      className="w-full accent-[var(--accent)] cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--ink-2)]">Свечение</span>
                      <span className="font-mono font-semibold tabular-nums">{config.saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={config.saturation}
                      onChange={e => onChange({ ...config, saturation: Number(e.target.value) })}
                      aria-label="Насыщенность свечения"
                      className="w-full accent-[var(--accent)] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-0.5">
                  <label className="flex items-center justify-between gap-2 cursor-pointer text-xs">
                    <span className="inline-flex items-center gap-1.5 text-[var(--ink-1)]">
                      <Sparkles className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                      Анимация фона и фрактала
                    </span>
                    <input
                      type="checkbox"
                      checked={config.animate}
                      onChange={e => onChange({ ...config, animate: e.target.checked })}
                      className="accent-[var(--accent)] w-4 h-4"
                    />
                  </label>

                  {config.animate && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[var(--ink-2)]">Скорость анимации</span>
                        <span className="font-mono font-semibold tabular-nums">{config.animationSpeed}%</span>
                      </div>
                      <input
                        type="range"
                        min={25}
                        max={200}
                        step={5}
                        value={config.animationSpeed}
                        onChange={e => onChange({ ...config, animationSpeed: Number(e.target.value) })}
                        aria-label="Скорость анимации"
                        className="w-full accent-[var(--accent)] cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Presets */}
            <div className="space-y-1.5 pt-2.5 border-t border-[var(--border-soft)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-[var(--ink-2)]">Готовые профили</span>
                <button
                  type="button"
                  onClick={() => onChange(DEFAULT_THEME_CONFIG)}
                  className="inline-flex items-center gap-1 text-[11px] text-[var(--accent-text)] hover:underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  Сбросить
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {PRESET_THEMES.map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => onChange(preset.config)}
                    className="px-2 py-1 ui-control bg-[var(--surface-sub)] hover:bg-[var(--surface-hover)] border border-[var(--border-line)] text-[11px] text-[var(--ink-1)] transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
