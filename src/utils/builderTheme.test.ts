import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_THEME_CONFIG, sanitizeBuilderThemeConfig } from './builderTheme';

test('sanitizeBuilderThemeConfig preserves multi-fractal and uncertainty defaults and clamps bounds', () => {
  const defaults = sanitizeBuilderThemeConfig(undefined);
  assert.equal(defaults.multiFractal, true);
  assert.equal(defaults.fractal, DEFAULT_THEME_CONFIG.fractal);
  assert.equal(defaults.fractalSecondary, DEFAULT_THEME_CONFIG.fractalSecondary);
  assert.equal(defaults.fractalTertiary, DEFAULT_THEME_CONFIG.fractalTertiary);
  assert.equal(defaults.fractalUncertainty, DEFAULT_THEME_CONFIG.fractalUncertainty);

  const clamped = sanitizeBuilderThemeConfig({
    multiFractal: false,
    fractal: 'unknown-fractal' as unknown as 'julia',
    fractalSecondary: 'dragon',
    fractalTertiary: 'fern',
    fractalUncertainty: 250,
    animationSpeed: 10,
  });
  assert.equal(clamped.multiFractal, false);
  assert.equal(clamped.fractal, DEFAULT_THEME_CONFIG.fractal);
  assert.equal(clamped.fractalSecondary, 'dragon');
  assert.equal(clamped.fractalTertiary, 'fern');
  assert.equal(clamped.fractalUncertainty, 100);
  assert.equal(clamped.animationSpeed, 25);

  const negative = sanitizeBuilderThemeConfig({
    fractalUncertainty: -30,
    fractalOpacity: 150,
  });
  assert.equal(negative.fractalUncertainty, 0);
  assert.equal(negative.fractalOpacity, 100);
});
