import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_THEME_CONFIG,
  PRESET_THEMES,
  computeSurfaceAlphas,
  computeWaveEmitters,
  evaluateCollidingWaves,
  hexToRgb,
  samplePaletteColor,
  sanitizeThemeConfig,
} from './themeConfig';

test('sanitizeThemeConfig preserves legacy v1 configs while filling new effect defaults', () => {
  const legacy = {
    mode: 'dark' as const,
    colors: ['#112233', '#445566', '#778899', '#aabbcc', '#ddeeff'] as [
      string,
      string,
      string,
      string,
      string,
    ],
    angle: 90,
    saturation: 55,
    panelTransparency: 70,
    animate: false,
  };
  const next = sanitizeThemeConfig(legacy);
  assert.equal(next.mode, 'dark');
  assert.deepEqual(next.colors, ['#112233', '#445566', '#778899', '#AABBCC', '#DDEEFF']);
  assert.equal(next.angle, 90);
  assert.equal(next.saturation, 55);
  assert.equal(next.panelTransparency, 70);
  assert.equal(next.animate, false);
  assert.equal(next.effectMode, DEFAULT_THEME_CONFIG.effectMode);
  assert.equal(next.effectSpeed, DEFAULT_THEME_CONFIG.effectSpeed);
  assert.equal(next.effectIntensity, DEFAULT_THEME_CONFIG.effectIntensity);
  assert.equal(next.effectScale, DEFAULT_THEME_CONFIG.effectScale);
  assert.equal(next.waveCount, DEFAULT_THEME_CONFIG.waveCount);
  assert.equal(next.panelBlur, DEFAULT_THEME_CONFIG.panelBlur);
});

test('sanitizeThemeConfig clamps out-of-range effect parameters and rejects invalid modes', () => {
  const dirty = {
    mode: 'dark' as const,
    colors: ['#invalid', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'] as [
      string,
      string,
      string,
      string,
      string,
    ],
    angle: 999,
    saturation: -10,
    panelTransparency: 180,
    panelBlur: 99,
    effectMode: 'lasers' as unknown as 'waves',
    effectSpeed: 500,
    effectIntensity: -40,
    effectScale: 5,
    waveCount: 99,
  };
  const next = sanitizeThemeConfig(dirty);
  assert.equal(next.colors[0], DEFAULT_THEME_CONFIG.colors[0]);
  assert.equal(next.angle, 360);
  assert.equal(next.saturation, 0);
  assert.equal(next.panelTransparency, 100);
  assert.equal(next.panelBlur, 24);
  assert.equal(next.effectMode, 'waves');
  assert.equal(next.effectSpeed, 200);
  assert.equal(next.effectIntensity, 0);
  assert.equal(next.effectScale, 30);
  assert.equal(next.waveCount, 6);
});

test('computeSurfaceAlphas responds monotonically from 0% to 100% transparency', () => {
  const opaque = computeSurfaceAlphas('dark', 0);
  const mid = computeSurfaceAlphas('dark', 45);
  const clear = computeSurfaceAlphas('dark', 100);

  assert.ok(opaque.panelAlpha > mid.panelAlpha);
  assert.ok(mid.panelAlpha > clear.panelAlpha);
  assert.ok(opaque.vignetteEdgeAlpha > clear.vignetteEdgeAlpha);
  assert.equal(clear.panelAlpha, 0.02);
});

test('computeWaveEmitters spawns opposing pairs around center for head-on wave collision', () => {
  const two = computeWaveEmitters(2, 0, 0);
  assert.equal(two.length, 2);
  // Emitter 0 on right (+x), Emitter 1 on left (-x), opposing across center
  assert.ok(two[0].x > 0.5);
  assert.ok(two[1].x < 0.5);
  const dx0 = two[0].x - 0.5;
  const dy0 = two[0].y - 0.5;
  const dx1 = two[1].x - 0.5;
  const dy1 = two[1].y - 0.5;
  assert.ok(dx0 * dx1 + dy0 * dy1 < -0.3);

  const five = computeWaveEmitters(5, 45, 2.5);
  assert.equal(five.length, 5);
});

test('evaluateCollidingWaves produces bounded values and amplifies collision glow with higher intensity', () => {
  const emitters = computeWaveEmitters(3, 27, 1.2);
  const low = evaluateCollidingWaves(0.5, 0.5, 16 / 9, emitters, 22, 1.2, 0.1);
  const high = evaluateCollidingWaves(0.5, 0.5, 16 / 9, emitters, 22, 1.2, 1.0);

  assert.ok(low.amplitude >= -1 && low.amplitude <= 1);
  assert.ok(high.collisionGlow >= 0 && high.collisionGlow <= 1);
  assert.ok(high.collisionGlow >= low.collisionGlow);
});

test('palette sampling & presets are well-formed', () => {
  const palette = DEFAULT_THEME_CONFIG.colors.map(hexToRgb);
  const cStart = samplePaletteColor(palette, 0);
  const cMid = samplePaletteColor(palette, 0.35);
  assert.deepEqual(cStart, [0, 255, 82]);
  assert.ok(cMid.every(ch => ch >= 0 && ch <= 255));
  assert.ok(PRESET_THEMES.some(p => p.config.effectMode === 'waves'));
  assert.ok(PRESET_THEMES.some(p => p.config.effectMode === 'gradient'));
  assert.ok(PRESET_THEMES.some(p => p.config.effectMode === 'aurora'));
  assert.ok(PRESET_THEMES.some(p => p.config.effectMode === 'orbs'));
});
