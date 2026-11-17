export type FractalType =
  | 'none'
  | 'julia'
  | 'mandelbrot'
  | 'fbm'
  | 'tree'
  | 'koch'
  | 'sierpinski'
  | 'dragon'
  | 'fern'
  | 'lorenz';

export type BlockStyle = 'glass' | 'flat' | 'bordered' | 'elevated' | 'minimal';
export type BlockRadius = 'sharp' | 'medium' | 'soft';
export type RowDensity = 'compact' | 'normal' | 'comfortable';
export type EdgeHighlightMode = 'both' | 'edges' | 'soft';
export type ContainerWidthMode = 'narrow' | 'standard' | 'wide' | 'full';
export type FontScale = 90 | 100 | 110;

export interface ThemeConfig {
  mode: 'dark' | 'light';
  colors: [string, string, string, string, string];
  angle: number;
  saturation: number;
  panelTransparency: number;
  panelBlur: number;
  animate: boolean;
  animationSpeed: number;
  fractal: FractalType;
  multiFractal: boolean;
  fractalSecondary: FractalType;
  fractalTertiary: FractalType;
  fractalUncertainty: number;
  fractalOpacity: number;
  fractalScale: number;
  blockStyle: BlockStyle;
  blockRadius: BlockRadius;
  rowDensity: RowDensity;
  edgeHighlight: EdgeHighlightMode;
  containerWidth: ContainerWidthMode;
  fontScale: FontScale;
  accentColor: string;
  showDescriptions: boolean;
  showRowMeta: boolean;
  showRowNumbers: boolean;
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  mode: 'dark',
  colors: ['#00FF52', '#FF5CA8', '#FF6B8A', '#3ED0FF', '#45F5C8'],
  angle: 42,
  saturation: 22,
  panelTransparency: 26,
  panelBlur: 12,
  animate: true,
  animationSpeed: 100,
  fractal: 'julia',
  multiFractal: true,
  fractalSecondary: 'lorenz',
  fractalTertiary: 'fern',
  fractalUncertainty: 44,
  fractalOpacity: 24,
  fractalScale: 52,
  blockStyle: 'glass',
  blockRadius: 'medium',
  rowDensity: 'normal',
  edgeHighlight: 'both',
  containerWidth: 'standard',
  fontScale: 100,
  accentColor: 'auto',
  showDescriptions: false,
  showRowMeta: true,
  showRowNumbers: true,
};

const THEME_STORAGE_KEY = 'mod_optimizer_theme_v3';

const VALID_FRACTALS = new Set<FractalType>([
  'none',
  'julia',
  'mandelbrot',
  'fbm',
  'tree',
  'koch',
  'sierpinski',
  'dragon',
  'fern',
  'lorenz',
]);
const VALID_BLOCK_STYLES = new Set<BlockStyle>(['glass', 'flat', 'bordered', 'elevated', 'minimal']);
const VALID_RADII = new Set<BlockRadius>(['sharp', 'medium', 'soft']);
const VALID_DENSITIES = new Set<RowDensity>(['compact', 'normal', 'comfortable']);
const VALID_EDGES = new Set<EdgeHighlightMode>(['both', 'edges', 'soft']);
const VALID_WIDTHS = new Set<ContainerWidthMode>(['narrow', 'standard', 'wide', 'full']);
const VALID_FONT_SCALES = new Set<FontScale>([90, 100, 110]);

function clamp(n: unknown, min: number, max: number, fallback: number): number {
  return typeof n === 'number' && Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
}

export function sanitizeBuilderThemeConfig(parsed: Partial<ThemeConfig> | null | undefined): ThemeConfig {
  if (!parsed || typeof parsed !== 'object') return DEFAULT_THEME_CONFIG;

  const colors: ThemeConfig['colors'] =
    Array.isArray(parsed.colors) && parsed.colors.length === 5
      ? (parsed.colors.map((c, idx) =>
          typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c) ? c.toUpperCase() : DEFAULT_THEME_CONFIG.colors[idx]
        ) as ThemeConfig['colors'])
      : DEFAULT_THEME_CONFIG.colors;

  const accentColor =
    parsed.accentColor === 'auto' ||
    (typeof parsed.accentColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(parsed.accentColor))
      ? parsed.accentColor === 'auto'
        ? 'auto'
        : parsed.accentColor.toUpperCase()
      : DEFAULT_THEME_CONFIG.accentColor;

  return {
    mode: parsed.mode === 'light' ? 'light' : 'dark',
    colors,
    angle: clamp(parsed.angle, 0, 360, DEFAULT_THEME_CONFIG.angle),
    saturation: clamp(parsed.saturation, 0, 100, DEFAULT_THEME_CONFIG.saturation),
    panelTransparency: clamp(parsed.panelTransparency, 0, 100, DEFAULT_THEME_CONFIG.panelTransparency),
    panelBlur: clamp(parsed.panelBlur, 0, 24, DEFAULT_THEME_CONFIG.panelBlur),
    animate: typeof parsed.animate === 'boolean' ? parsed.animate : DEFAULT_THEME_CONFIG.animate,
    animationSpeed: clamp(parsed.animationSpeed, 25, 200, DEFAULT_THEME_CONFIG.animationSpeed),
    fractal: VALID_FRACTALS.has(parsed.fractal as FractalType)
      ? (parsed.fractal as FractalType)
      : DEFAULT_THEME_CONFIG.fractal,
    multiFractal:
      typeof parsed.multiFractal === 'boolean' ? parsed.multiFractal : DEFAULT_THEME_CONFIG.multiFractal,
    fractalSecondary: VALID_FRACTALS.has(parsed.fractalSecondary as FractalType)
      ? (parsed.fractalSecondary as FractalType)
      : DEFAULT_THEME_CONFIG.fractalSecondary,
    fractalTertiary: VALID_FRACTALS.has(parsed.fractalTertiary as FractalType)
      ? (parsed.fractalTertiary as FractalType)
      : DEFAULT_THEME_CONFIG.fractalTertiary,
    fractalUncertainty: clamp(parsed.fractalUncertainty, 0, 100, DEFAULT_THEME_CONFIG.fractalUncertainty),
    fractalOpacity: clamp(parsed.fractalOpacity, 0, 100, DEFAULT_THEME_CONFIG.fractalOpacity),
    fractalScale: clamp(parsed.fractalScale, 10, 100, DEFAULT_THEME_CONFIG.fractalScale),
    blockStyle: VALID_BLOCK_STYLES.has(parsed.blockStyle as BlockStyle)
      ? (parsed.blockStyle as BlockStyle)
      : DEFAULT_THEME_CONFIG.blockStyle,
    blockRadius: VALID_RADII.has(parsed.blockRadius as BlockRadius)
      ? (parsed.blockRadius as BlockRadius)
      : DEFAULT_THEME_CONFIG.blockRadius,
    rowDensity: VALID_DENSITIES.has(parsed.rowDensity as RowDensity)
      ? (parsed.rowDensity as RowDensity)
      : DEFAULT_THEME_CONFIG.rowDensity,
    edgeHighlight: VALID_EDGES.has(parsed.edgeHighlight as EdgeHighlightMode)
      ? (parsed.edgeHighlight as EdgeHighlightMode)
      : DEFAULT_THEME_CONFIG.edgeHighlight,
    containerWidth: VALID_WIDTHS.has(parsed.containerWidth as ContainerWidthMode)
      ? (parsed.containerWidth as ContainerWidthMode)
      : DEFAULT_THEME_CONFIG.containerWidth,
    fontScale: VALID_FONT_SCALES.has(parsed.fontScale as FontScale)
      ? (parsed.fontScale as FontScale)
      : DEFAULT_THEME_CONFIG.fontScale,
    accentColor,
    showDescriptions:
      typeof parsed.showDescriptions === 'boolean'
        ? parsed.showDescriptions
        : DEFAULT_THEME_CONFIG.showDescriptions,
    showRowMeta:
      typeof parsed.showRowMeta === 'boolean' ? parsed.showRowMeta : DEFAULT_THEME_CONFIG.showRowMeta,
    showRowNumbers:
      typeof parsed.showRowNumbers === 'boolean'
        ? parsed.showRowNumbers
        : DEFAULT_THEME_CONFIG.showRowNumbers,
  };
}

export function loadThemeConfig(): ThemeConfig {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem('mod_optimizer_theme_v2');
    if (!raw) return DEFAULT_THEME_CONFIG;
    return sanitizeBuilderThemeConfig(JSON.parse(raw) as Partial<ThemeConfig>);
  } catch {
    return DEFAULT_THEME_CONFIG;
  }
}

export function saveThemeConfig(config: ThemeConfig): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage quota errors
  }
}
