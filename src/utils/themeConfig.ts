export type BackdropEffectMode = 'waves' | 'gradient' | 'aurora' | 'orbs';

export interface ThemeConfig {
  mode: 'dark' | 'light';
  colors: [string, string, string, string, string];
  angle: number;
  saturation: number;
  panelTransparency: number;
  panelBlur: number;
  animate: boolean;
  effectMode: BackdropEffectMode;
  effectSpeed: number;
  effectIntensity: number;
  effectScale: number;
  waveCount: number;
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  mode: 'dark',
  colors: ['#00FF52', '#FF5CA8', '#FF6B8A', '#3ED0FF', '#45F5C8'],
  angle: 27,
  saturation: 38,
  panelTransparency: 45,
  panelBlur: 12,
  animate: true,
  effectMode: 'waves',
  effectSpeed: 100,
  effectIntensity: 78,
  effectScale: 100,
  waveCount: 3,
};

export const THEME_STORAGE_KEY = 'mod_optimizer_theme_v1';

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

const VALID_EFFECT_MODES: BackdropEffectMode[] = ['waves', 'gradient', 'aurora', 'orbs'];

export function sanitizeThemeConfig(parsed: Partial<ThemeConfig> | null | undefined): ThemeConfig {
  if (!parsed || typeof parsed !== 'object') return DEFAULT_THEME_CONFIG;

  const mode: 'dark' | 'light' = parsed.mode === 'light' ? 'light' : 'dark';
  const colorsValid = Array.isArray(parsed.colors) && parsed.colors.length === 5;
  const colors = (
    colorsValid
      ? parsed.colors!.map((c, idx) =>
          typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c)
            ? c.toUpperCase()
            : DEFAULT_THEME_CONFIG.colors[idx]
        )
      : [...DEFAULT_THEME_CONFIG.colors]
  ) as ThemeConfig['colors'];

  const effectMode: BackdropEffectMode = VALID_EFFECT_MODES.includes(
    parsed.effectMode as BackdropEffectMode
  )
    ? (parsed.effectMode as BackdropEffectMode)
    : DEFAULT_THEME_CONFIG.effectMode;

  return {
    mode,
    colors,
    angle: typeof parsed.angle === 'number' ? Math.round(clamp(parsed.angle, 0, 360)) : DEFAULT_THEME_CONFIG.angle,
    saturation:
      typeof parsed.saturation === 'number'
        ? Math.round(clamp(parsed.saturation, 0, 100))
        : DEFAULT_THEME_CONFIG.saturation,
    panelTransparency:
      typeof parsed.panelTransparency === 'number'
        ? Math.round(clamp(parsed.panelTransparency, 0, 100))
        : DEFAULT_THEME_CONFIG.panelTransparency,
    panelBlur:
      typeof parsed.panelBlur === 'number'
        ? Math.round(clamp(parsed.panelBlur, 0, 24))
        : DEFAULT_THEME_CONFIG.panelBlur,
    animate: typeof parsed.animate === 'boolean' ? parsed.animate : DEFAULT_THEME_CONFIG.animate,
    effectMode,
    effectSpeed:
      typeof parsed.effectSpeed === 'number'
        ? Math.round(clamp(parsed.effectSpeed, 0, 200))
        : DEFAULT_THEME_CONFIG.effectSpeed,
    effectIntensity:
      typeof parsed.effectIntensity === 'number'
        ? Math.round(clamp(parsed.effectIntensity, 0, 100))
        : DEFAULT_THEME_CONFIG.effectIntensity,
    effectScale:
      typeof parsed.effectScale === 'number'
        ? Math.round(clamp(parsed.effectScale, 30, 200))
        : DEFAULT_THEME_CONFIG.effectScale,
    waveCount:
      typeof parsed.waveCount === 'number'
        ? Math.round(clamp(parsed.waveCount, 2, 6))
        : DEFAULT_THEME_CONFIG.waveCount,
  };
}

export function loadThemeConfig(): ThemeConfig {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return DEFAULT_THEME_CONFIG;
    return sanitizeThemeConfig(JSON.parse(raw) as Partial<ThemeConfig>);
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

export const PRESET_THEMES: Array<{ label: string; config: ThemeConfig }> = [
  {
    label: 'Столкновение волн',
    config: DEFAULT_THEME_CONFIG,
  },
  {
    label: 'Встречный шторм (5 волн)',
    config: {
      mode: 'dark',
      colors: ['#00FF87', '#38BDF8', '#818CF8', '#F472B6', '#22D3EE'],
      angle: 34,
      saturation: 48,
      panelTransparency: 55,
      panelBlur: 10,
      animate: true,
      effectMode: 'waves',
      effectSpeed: 125,
      effectIntensity: 92,
      effectScale: 115,
      waveCount: 5,
    },
  },
  {
    label: 'Как на скрине (перелив)',
    config: {
      ...DEFAULT_THEME_CONFIG,
      saturation: 30,
      panelTransparency: 45,
      effectMode: 'gradient',
      effectSpeed: 100,
    },
  },
  {
    label: 'Северные ленты',
    config: {
      mode: 'dark',
      colors: ['#00FF87', '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6'],
      angle: 135,
      saturation: 42,
      panelTransparency: 48,
      panelBlur: 12,
      animate: true,
      effectMode: 'aurora',
      effectSpeed: 95,
      effectIntensity: 84,
      effectScale: 105,
      waveCount: 4,
    },
  },
  {
    label: 'Световые сферы',
    config: {
      mode: 'dark',
      colors: ['#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#3B82F6'],
      angle: 45,
      saturation: 44,
      panelTransparency: 50,
      panelBlur: 14,
      animate: true,
      effectMode: 'orbs',
      effectSpeed: 85,
      effectIntensity: 80,
      effectScale: 115,
      waveCount: 4,
    },
  },
  {
    label: 'Чистый тёмный',
    config: {
      ...DEFAULT_THEME_CONFIG,
      mode: 'dark',
      colors: ['#1E293B', '#1E293B', '#334155', '#1E293B', '#0F172A'],
      saturation: 0,
      panelTransparency: 0,
      panelBlur: 12,
      animate: false,
      effectMode: 'gradient',
    },
  },
  {
    label: 'Светлая тема',
    config: {
      ...DEFAULT_THEME_CONFIG,
      mode: 'light',
      saturation: 18,
      panelTransparency: 20,
      panelBlur: 10,
      animate: true,
      effectMode: 'waves',
      effectIntensity: 60,
      effectSpeed: 85,
    },
  },
];

export interface SurfaceAlphas {
  panelAlpha: number;
  headerAlpha: number;
  vignetteCenterAlpha: number;
  vignetteEdgeAlpha: number;
}

export function computeSurfaceAlphas(mode: 'dark' | 'light', panelTransparency: number): SurfaceAlphas {
  const t = clamp(panelTransparency, 0, 100) / 100;
  if (mode === 'dark') {
    const panelAlpha = +(Math.pow(1 - t, 1.15) * 0.96 + 0.02).toFixed(3);
    const headerAlpha = +Math.min(0.98, panelAlpha + 0.07).toFixed(3);
    return {
      panelAlpha,
      headerAlpha,
      vignetteCenterAlpha: +(0.04 * (1 - t)).toFixed(3),
      vignetteEdgeAlpha: +(0.34 * (1 - t * 0.65)).toFixed(3),
    };
  }
  const panelAlpha = +(Math.pow(1 - t, 1.1) * 0.94 + 0.04).toFixed(3);
  const headerAlpha = +Math.min(0.98, panelAlpha + 0.05).toFixed(3);
  return {
    panelAlpha,
    headerAlpha,
    vignetteCenterAlpha: 0,
    vignetteEdgeAlpha: 0,
  };
}

export type RgbColor = [number, number, number];

export function hexToRgb(hex: string): RgbColor {
  const clean = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return [0, 255, 82];
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

export function samplePaletteColor(palette: RgbColor[], t: number): RgbColor {
  const n = palette.length;
  if (n === 0) return [0, 255, 82];
  if (n === 1) return palette[0];
  const wrapped = ((t % 1) + 1) % 1;
  const scaled = wrapped * n;
  const i0 = Math.floor(scaled) % n;
  const i1 = (i0 + 1) % n;
  const frac = scaled - Math.floor(scaled);
  const smooth = frac * frac * (3 - 2 * frac);
  const c0 = palette[i0];
  const c1 = palette[i1];
  return [
    c0[0] + (c1[0] - c0[0]) * smooth,
    c0[1] + (c1[1] - c0[1]) * smooth,
    c0[2] + (c1[2] - c0[2]) * smooth,
  ];
}

export interface WaveEmitter {
  x: number;
  y: number;
  phase: number;
  colorIndex: number;
  freqMul: number;
}

/**
 * Generates opposing & angled wave emitters around the viewport perimeter so
 * wave fronts propagate inward and collide across the canvas.
 */
export function computeWaveEmitters(
  count: number,
  angleDeg: number,
  timeSec: number
): WaveEmitter[] {
  const safeCount = Math.round(clamp(count, 2, 6));
  const baseRad = (angleDeg * Math.PI) / 180;
  const emitters: WaveEmitter[] = [];

  for (let i = 0; i < safeCount; i++) {
    // Pairwise opposing angles for strong head-on collisions, plus oblique spread for 3+ emitters
    let theta: number;
    if (safeCount === 2) {
      theta = baseRad + i * Math.PI;
    } else if (safeCount % 2 === 0) {
      const pairIdx = Math.floor(i / 2);
      const side = i % 2;
      const spread = (pairIdx / (safeCount / 2)) * (Math.PI * 0.65);
      theta = baseRad + spread + side * Math.PI;
    } else {
      // Odd count: ensure first two are directly opposing, remaining angled around
      if (i < 2) {
        theta = baseRad + i * Math.PI;
      } else {
        const extraIdx = i - 1;
        const extraTotal = safeCount - 1;
        theta = baseRad + (extraIdx / extraTotal) * Math.PI * 2;
      }
    }

    // Gentle orbital sway so collision fronts breathe over time
    const sway = Math.sin(timeSec * 0.35 + i * 1.9) * 0.14;
    const radius = 0.72 + Math.cos(timeSec * 0.28 + i * 1.3) * 0.08;
    const x = 0.5 + Math.cos(theta + sway) * radius;
    const y = 0.5 + Math.sin(theta + sway) * radius;

    emitters.push({
      x,
      y,
      phase: i * 1.15,
      colorIndex: i / safeCount,
      freqMul: 1 + (i % 3) * 0.07,
    });
  }

  return emitters;
}

export interface WaveCollisionSample {
  /** Normalized constructive/destructive wave amplitude [-1..1] */
  amplitude: number;
  /** Collision crest intensity where multiple opposing waves coincide [0..1] */
  collisionGlow: number;
  /** Weighted palette color index [0..1) */
  colorWeight: number;
}

/**
 * Evaluates colliding circular wave fronts at normalized coordinates (nx, ny in [0..1]).
 */
export function evaluateCollidingWaves(
  nx: number,
  ny: number,
  aspectRatio: number,
  emitters: WaveEmitter[],
  baseFrequency: number,
  timeSec: number,
  intensityNorm: number
): WaveCollisionSample {
  const n = emitters.length;
  if (n === 0) {
    return { amplitude: 0, collisionGlow: 0, colorWeight: 0 };
  }

  let waveSum = 0;
  let positiveEnergy = 0;
  let colorAccum = 0;
  let colorWeightSum = 0;

  const waveVals: number[] = new Array(n);

  for (let i = 0; i < n; i++) {
    const e = emitters[i];
    const dx = (nx - e.x) * aspectRatio;
    const dy = ny - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const freq = baseFrequency * e.freqMul;
    const raw = Math.sin(dist * freq - timeSec * 2.35 + e.phase);
    // Gentle distance falloff so waves stay strong through the collision zone
    const atten = 1 / (1 + dist * 0.45);
    const val = raw * atten;
    waveVals[i] = val;
    waveSum += val;

    const crest = Math.max(0, raw) * atten;
    positiveEnergy += crest;
    const w = crest + 0.08;
    colorAccum += e.colorIndex * w;
    colorWeightSum += w;
  }

  // Pairwise collision boosts sharply where two or more wave crests meet head-on
  let pairCollision = 0;
  let pairCount = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const prod = waveVals[i] * waveVals[j];
      if (prod > 0) {
        pairCollision += Math.pow(prod, 0.75);
      }
      pairCount++;
    }
  }

  const avgAmplitude = clamp(waveSum / Math.sqrt(n), -1, 1);
  const rawCollision = pairCount > 0 ? pairCollision / pairCount : 0;
  const interferenceCrest = Math.pow(clamp(positiveEnergy / (n * 0.68), 0, 1), 1.45);
  const collisionGlow = clamp(
    (rawCollision * 2.2 + interferenceCrest * 0.75) * (0.35 + intensityNorm * 0.95),
    0,
    1
  );

  const colorWeight = colorWeightSum > 0 ? colorAccum / colorWeightSum : 0;
  return {
    amplitude: avgAmplitude,
    collisionGlow,
    colorWeight,
  };
}
