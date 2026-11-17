import { useEffect, useRef } from 'react';
import type { FractalType, ThemeConfig } from '../utils/builderTheme.ts';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const n = parseInt(clean, 16);
  if (Number.isNaN(n)) return [60, 200, 140];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function buildColorLut(palette: Array<[number, number, number]>): Uint8Array {
  const lut = new Uint8Array(256 * 3);
  const lastIdx = palette.length - 1;
  for (let i = 0; i < 256; i++) {
    const pos = (i / 255) * lastIdx;
    const idx = Math.floor(pos);
    const f = pos - idx;
    const a = palette[idx];
    const b = palette[Math.min(lastIdx, idx + 1)];
    const off = i * 3;
    lut[off] = (a[0] + (b[0] - a[0]) * f + 0.5) | 0;
    lut[off + 1] = (a[1] + (b[1] - a[1]) * f + 0.5) | 0;
    lut[off + 2] = (a[2] + (b[2] - a[2]) * f + 0.5) | 0;
  }
  return lut;
}

function hash2D(ix: number, iy: number): number {
  let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) * 2.3283064365386963e-10;
}

function valueNoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2D(xi, yi);
  const b = hash2D(xi + 1, yi);
  const c = hash2D(xi, yi + 1);
  const d = hash2D(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbmNoise(x: number, y: number): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let o = 0; o < 4; o++) {
    val += amp * valueNoise(x * freq, y * freq);
    freq *= 2.02;
    amp *= 0.5;
  }
  return val;
}

// Smooth irrational-ratio stochastic wander in [-1, 1]
function stochasticDrift(t: number, seed: number): number {
  return (
    Math.sin(t * 0.73 + seed * 1.9) * 0.45 +
    Math.cos(t * 1.37 + seed * 3.1) * 0.35 +
    Math.sin(t * 2.29 + seed * 5.3) * 0.2
  );
}

interface ActiveLayer {
  type: Exclude<FractalType, 'none'>;
  alphaWeight: number;
  scaleMul: number;
  seed: number;
  offsetX: number;
  offsetY: number;
  colorShift: number;
}

export function FractalBackground({ config }: { config: ThemeConfig }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const imageDataRef = useRef<{ width: number; height: number; img: ImageData } | null>(null);

  const hasAnyLayer =
    config.fractal !== 'none' ||
    (config.multiFractal &&
      (config.fractalSecondary !== 'none' || config.fractalTertiary !== 'none'));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasAnyLayer || config.fractalOpacity <= 0) {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const layers: ActiveLayer[] = [];
    if (config.fractal !== 'none') {
      layers.push({
        type: config.fractal,
        alphaWeight: 1,
        scaleMul: 1,
        seed: 1.1,
        offsetX: 0,
        offsetY: 0,
        colorShift: 0,
      });
    }
    if (config.multiFractal) {
      if (config.fractalSecondary !== 'none') {
        layers.push({
          type: config.fractalSecondary,
          alphaWeight: 0.68,
          scaleMul: 0.84,
          seed: 7.4,
          offsetX: -0.14,
          offsetY: 0.08,
          colorShift: 1,
        });
      }
      if (config.fractalTertiary !== 'none') {
        layers.push({
          type: config.fractalTertiary,
          alphaWeight: 0.52,
          scaleMul: 0.72,
          seed: 15.9,
          offsetX: 0.16,
          offsetY: -0.09,
          colorShift: 2,
        });
      }
    }

    const palette = config.colors.map(hexToRgb);
    const colorLut = buildColorLut(palette);
    const paletteStroke = (alpha: number, shift = 0) =>
      palette.map((_, idx) => {
        const [r, g, b] = palette[(idx + shift) % palette.length];
        return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
      });

    const baseScaleFactor = 0.45 + (config.fractalScale / 100) * 1.15;
    const uncertainty = Math.max(0, Math.min(1, (config.fractalUncertainty ?? 44) / 100));
    const speedFactor = Math.max(0.25, Math.min(2, (config.animationSpeed || 100) / 100));
    const blendOp: GlobalCompositeOperation = config.mode === 'light' ? 'multiply' : 'screen';

    const motionMedia =
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    let shouldAnimate = config.animate && !(motionMedia?.matches ?? false);

    let rafId = 0;
    let timerId = 0;
    let cancelled = false;

    const syncSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const w = Math.max(320, Math.floor(window.innerWidth * dpr));
      const h = Math.max(200, Math.floor(window.innerHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    syncSize();

    const getOffscreenBuffer = (ow: number, oh: number) => {
      let off = offscreenRef.current;
      if (!off) {
        off = document.createElement('canvas');
        offscreenRef.current = off;
      }
      if (off.width !== ow || off.height !== oh) {
        off.width = ow;
        off.height = oh;
        imageDataRef.current = null;
      }
      const octx = off.getContext('2d');
      if (!octx) return null;
      if (!imageDataRef.current || imageDataRef.current.width !== ow || imageDataRef.current.height !== oh) {
        imageDataRef.current = { width: ow, height: oh, img: octx.createImageData(ow, oh) };
      }
      return { off, octx, img: imageDataRef.current.img };
    };

    const compositeOffscreen = (
      off: HTMLCanvasElement,
      octx: CanvasRenderingContext2D,
      img: ImageData,
      layer: ActiveLayer,
      timeSec: number
    ) => {
      octx.putImageData(img, 0, 0);
      ctx.save();
      ctx.globalAlpha = layer.alphaWeight;
      ctx.globalCompositeOperation = layer.seed > 2 ? blendOp : 'source-over';
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      const dx = (layer.offsetX + stochasticDrift(timeSec * 0.4, layer.seed) * 0.06 * uncertainty) * canvas.width;
      const dy = (layer.offsetY + stochasticDrift(timeSec * 0.35, layer.seed + 3.2) * 0.06 * uncertainty) * canvas.height;
      ctx.drawImage(off, dx, dy, canvas.width, canvas.height);
      ctx.restore();
    };

    const drawPixelFractal = (
      timeSec: number,
      type: 'julia' | 'mandelbrot' | 'fbm',
      layer: ActiveLayer
    ) => {
      const ow = layers.length > 1 ? 156 : 180;
      const oh = layers.length > 1 ? 94 : 108;
      const buf = getOffscreenBuffer(ow, oh);
      if (!buf) return;
      const { off, octx, img } = buf;
      const data = img.data;
      const aspect = canvas.width / Math.max(1, canvas.height);
      const scaleFactor = baseScaleFactor * layer.scaleMul;
      const tL = timeSec + layer.seed * 2.1;
      const ux = stochasticDrift(tL, layer.seed) * uncertainty;
      const uy = stochasticDrift(tL * 0.9, layer.seed + 4.7) * uncertainty;

      if (type === 'julia') {
        const cx = -0.745 + Math.cos(tL * 0.22) * 0.045 + ux * 0.055;
        const cy = 0.186 + Math.sin(tL * 0.17) * 0.045 + uy * 0.055;
        const zoom = (1.45 / scaleFactor) * (1 + ux * 0.12);
        const maxIter = 24;
        const invOw = 1 / ow;
        const invOh = 1 / oh;

        for (let py = 0; py < oh; py++) {
          const zy0 = (py * invOh - 0.5) * 2 * zoom;
          const rowOff = py * ow;
          for (let px = 0; px < ow; px++) {
            let zx = (px * invOw - 0.5) * 2 * aspect * zoom;
            let zy = zy0;
            let iter = 0;
            while (zx * zx + zy * zy < 4 && iter < maxIter) {
              const tmp = zx * zx - zy * zy + cx;
              zy = 2 * zx * zy + cy;
              zx = tmp;
              iter++;
            }
            const idx = (rowOff + px) * 4;
            if (iter === maxIter) {
              data[idx] = palette[layer.colorShift % palette.length][0];
              data[idx + 1] = palette[layer.colorShift % palette.length][1];
              data[idx + 2] = palette[layer.colorShift % palette.length][2];
              data[idx + 3] = 24;
            } else {
              const t = iter / maxIter;
              const lutIdx = (((t + layer.colorShift * 0.2) % 1) * 255 | 0) * 3;
              data[idx] = colorLut[lutIdx];
              data[idx + 1] = colorLut[lutIdx + 1];
              data[idx + 2] = colorLut[lutIdx + 2];
              data[idx + 3] = (46 + t * 208) | 0;
            }
          }
        }
      } else if (type === 'mandelbrot') {
        const targetX = -0.7436 + Math.sin(tL * 0.12) * 0.06 + ux * 0.09;
        const targetY = 0.1318 + Math.cos(tL * 0.1) * 0.05 + uy * 0.08;
        const zoom = (1.15 / scaleFactor) * (0.85 + 0.25 * Math.sin(tL * 0.18) + ux * 0.15);
        const maxIter = 30;
        const invOw = 1 / ow;
        const invOh = 1 / oh;

        for (let py = 0; py < oh; py++) {
          const cy = targetY + (py * invOh - 0.5) * 2 * zoom;
          const rowOff = py * ow;
          for (let px = 0; px < ow; px++) {
            const cx = targetX + (px * invOw - 0.5) * 2 * aspect * zoom;
            let zx = 0;
            let zy = 0;
            let iter = 0;
            while (zx * zx + zy * zy < 4 && iter < maxIter) {
              const tmp = zx * zx - zy * zy + cx;
              zy = 2 * zx * zy + cy;
              zx = tmp;
              iter++;
            }
            const idx = (rowOff + px) * 4;
            if (iter === maxIter) {
              data[idx] = palette[(4 + layer.colorShift) % palette.length][0];
              data[idx + 1] = palette[(4 + layer.colorShift) % palette.length][1];
              data[idx + 2] = palette[(4 + layer.colorShift) % palette.length][2];
              data[idx + 3] = 20;
            } else {
              const t = iter / maxIter;
              const lutIdx = (((t + layer.colorShift * 0.2) % 1) * 255 | 0) * 3;
              data[idx] = colorLut[lutIdx];
              data[idx + 1] = colorLut[lutIdx + 1];
              data[idx + 2] = colorLut[lutIdx + 2];
              data[idx + 3] = (40 + t * 212) | 0;
            }
          }
        }
      } else {
        const shiftX = tL * 0.12 + ux * 0.8;
        const shiftY = tL * 0.08 + uy * 0.8;
        const zoom = 2.6 / scaleFactor;
        const invOw = 1 / ow;
        const invOh = 1 / oh;

        for (let py = 0; py < oh; py++) {
          const ny = py * invOh * zoom;
          const rowOff = py * ow;
          for (let px = 0; px < ow; px++) {
            const nx = px * invOw * aspect * zoom;
            const qx = fbmNoise(nx + shiftX, ny + shiftY);
            const qy = fbmNoise(nx + 5.2 - shiftY, ny + 1.3 + shiftX);
            const val = Math.max(0, Math.min(1, fbmNoise(nx + (2.3 + ux * 0.9) * qx, ny + (2.3 + uy * 0.9) * qy)));
            const lutIdx = (((val + layer.colorShift * 0.2) % 1) * 255 | 0) * 3;
            const idx = (rowOff + px) * 4;
            data[idx] = colorLut[lutIdx];
            data[idx + 1] = colorLut[lutIdx + 1];
            data[idx + 2] = colorLut[lutIdx + 2];
            data[idx + 3] = (val * 255) | 0;
          }
        }
      }

      compositeOffscreen(off, octx, img, layer, timeSec);
    };

    const drawFern = (timeSec: number, layer: ActiveLayer) => {
      const ow = 280;
      const oh = 200;
      const buf = getOffscreenBuffer(ow, oh);
      if (!buf) return;
      const { off, octx, img } = buf;
      const data = img.data;
      data.fill(0);

      const tL = timeSec + layer.seed;
      const scaleFactor = baseScaleFactor * layer.scaleMul;
      const drift = stochasticDrift(tL, layer.seed) * uncertainty;
      const sway = Math.sin(tL * 0.45) * 0.018 + drift * 0.032;
      const count = 16000;
      const halfW = ow * 0.5;
      const scaleY = (oh * 0.088) * Math.min(1.25, Math.max(0.55, scaleFactor * 0.92));
      const scaleX = scaleY * 1.1;

      const plotFern = (ox: number, mirror: number, colorOffset: number) => {
        let x = 0;
        let y = 0;
        for (let i = 0; i < count; i++) {
          const r = (i * 0.6180339887 + (x * 0.13 + y * 0.07) + drift * 0.004) % 1;
          const p = r < 0 ? r + 1 : r;
          let nx = 0;
          let ny = 0;
          if (p < 0.01) {
            nx = 0;
            ny = 0.16 * y;
          } else if (p < 0.86) {
            nx = (0.85 + sway * 0.25) * x + (0.04 + sway) * y;
            ny = (-0.04 + drift * 0.01) * x + 0.85 * y + 1.6;
          } else if (p < 0.93) {
            nx = 0.2 * x - 0.26 * y;
            ny = 0.23 * x + 0.22 * y + 1.6;
          } else {
            nx = -0.15 * x + 0.28 * y;
            ny = 0.26 * x + 0.24 * y + 0.44;
          }
          x = nx;
          y = ny;

          const px = (ox + mirror * x * scaleX) | 0;
          const py = (oh - 6 - y * scaleY) | 0;
          if (px >= 0 && px < ow && py >= 0 && py < oh) {
            const idx = (py * ow + px) * 4;
            const lutIdx = (((Math.min(1, y / 10 + colorOffset + layer.colorShift * 0.2) * 255) | 0) % 256) * 3;
            data[idx] = colorLut[lutIdx];
            data[idx + 1] = colorLut[lutIdx + 1];
            data[idx + 2] = colorLut[lutIdx + 2];
            data[idx + 3] = Math.min(255, data[idx + 3] + 135);
          }
        }
      };

      plotFern(halfW * 0.52, 1, 0);
      plotFern(halfW * 1.48, -1, 0.35);
      compositeOffscreen(off, octx, img, layer, timeSec);
    };

    const withLayerCtx = (layer: ActiveLayer, timeSec: number, render: () => void) => {
      ctx.save();
      ctx.globalAlpha = layer.alphaWeight;
      ctx.globalCompositeOperation = layer.seed > 2 ? blendOp : 'source-over';
      const jx = stochasticDrift(timeSec * 0.5, layer.seed) * uncertainty * canvas.width * 0.035;
      const jy = stochasticDrift(timeSec * 0.45, layer.seed + 5.1) * uncertainty * canvas.height * 0.035;
      ctx.translate(layer.offsetX * canvas.width + jx, layer.offsetY * canvas.height + jy);
      render();
      ctx.restore();
    };

    const drawTree = (timeSec: number, layer: ActiveLayer) => {
      const w = canvas.width;
      const h = canvas.height;
      const tL = timeSec + layer.seed;
      const scaleFactor = baseScaleFactor * layer.scaleMul;
      const driftA = stochasticDrift(tL, layer.seed) * uncertainty * 0.085;
      const driftB = stochasticDrift(tL * 1.1, layer.seed + 2.7) * uncertainty * 0.085;
      const sway = Math.sin(tL * 0.5) * 0.04 + driftA;
      const strokesByDepth = Array.from({ length: 9 }, (_, d) =>
        paletteStroke(Math.min(0.95, 0.24 + d * 0.08), layer.colorShift)
      );

      const branch = (
        x: number,
        y: number,
        len: number,
        angle: number,
        depth: number,
        colorIdx: number
      ) => {
        if (depth <= 0 || len < 4) return;
        const x2 = x + Math.cos(angle) * len;
        const y2 = y + Math.sin(angle) * len;
        ctx.strokeStyle = strokesByDepth[depth][colorIdx % palette.length];
        ctx.lineWidth = Math.max(0.8, depth * 0.55);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        const nextLen = len * (0.72 + (depth % 2 === 0 ? driftB * 0.15 : -driftB * 0.1));
        const spread = 0.42 + (scaleFactor - 0.8) * 0.1 + driftB * 0.4;
        branch(x2, y2, nextLen, angle - spread + sway, depth - 1, colorIdx + 1);
        branch(x2, y2, nextLen, angle + spread + sway, depth - 1, colorIdx + 2);
      };

      const baseLen = Math.min(w, h) * 0.18 * scaleFactor;
      withLayerCtx(layer, timeSec, () => {
        branch(w * 0.14, h * 0.96, baseLen, -Math.PI * 0.44 + driftA, 8, 0);
        branch(w * 0.86, h * 0.96, baseLen * 0.95, -Math.PI * 0.56 - driftB, 8, 2);
      });
    };

    const drawKoch = (timeSec: number, layer: ActiveLayer) => {
      const w = canvas.width;
      const h = canvas.height;
      const tL = timeSec + layer.seed;
      const scaleFactor = baseScaleFactor * layer.scaleMul;
      const drift = stochasticDrift(tL, layer.seed) * uncertainty;

      const kochSegment = (
        ax: number,
        ay: number,
        bx: number,
        by: number,
        depth: number,
        pts: Array<[number, number]>
      ) => {
        if (depth === 0) {
          pts.push([bx, by]);
          return;
        }
        const dx = (bx - ax) / 3;
        const dy = (by - ay) / 3;
        const x1 = ax + dx;
        const y1 = ay + dy;
        const x3 = ax + 2 * dx;
        const y3 = ay + 2 * dy;
        const hFactor = 0.8660254 * (1 + drift * 0.22);
        const px = x1 + (dx * 0.5 - dy * hFactor);
        const py = y1 + (dx * hFactor + dy * 0.5);
        kochSegment(ax, ay, x1, y1, depth - 1, pts);
        kochSegment(x1, y1, px, py, depth - 1, pts);
        kochSegment(px, py, x3, y3, depth - 1, pts);
        kochSegment(x3, y3, bx, by, depth - 1, pts);
      };

      const rot = tL * 0.08 + drift * 0.28;
      const rings = [
        { cx: w * 0.5, cy: h * 0.52, r: Math.min(w, h) * 0.36 * scaleFactor, color: palette[(3 + layer.colorShift) % palette.length], depth: 3 },
        { cx: w * 0.2, cy: h * 0.25, r: Math.min(w, h) * 0.19 * scaleFactor, color: palette[(0 + layer.colorShift) % palette.length], depth: 3 },
        { cx: w * 0.82, cy: h * 0.78, r: Math.min(w, h) * 0.21 * scaleFactor, color: palette[(1 + layer.colorShift) % palette.length], depth: 3 },
      ];

      withLayerCtx(layer, timeSec, () => {
        ctx.lineWidth = 1.25;
        for (let idx = 0; idx < rings.length; idx++) {
          const ring = rings[idx];
          const v: Array<[number, number]> = [0, 1, 2].map(k => {
            const a = rot * (idx % 2 === 0 ? 1 : -1) + (k * Math.PI * 2) / 3;
            return [ring.cx + Math.cos(a) * ring.r, ring.cy + Math.sin(a) * ring.r];
          });
          const pts: Array<[number, number]> = [v[0]];
          kochSegment(v[0][0], v[0][1], v[1][0], v[1][1], ring.depth, pts);
          kochSegment(v[1][0], v[1][1], v[2][0], v[2][1], ring.depth, pts);
          kochSegment(v[2][0], v[2][1], v[0][0], v[0][1], ring.depth, pts);

          const [r, g, b] = ring.color;
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.65)`;
          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i][0], pts[i][1]);
          }
          ctx.closePath();
          ctx.stroke();
        }
      });
    };

    const drawSierpinski = (timeSec: number, layer: ActiveLayer) => {
      const w = canvas.width;
      const h = canvas.height;
      const tL = timeSec + layer.seed;
      const scaleFactor = baseScaleFactor * layer.scaleMul;
      const drift = stochasticDrift(tL, layer.seed) * uncertainty;
      const strokes = paletteStroke(0.65, layer.colorShift);

      const drawTri = (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        x3: number,
        y3: number,
        depth: number,
        colorIdx: number
      ) => {
        if (depth <= 0) {
          ctx.strokeStyle = strokes[colorIdx % strokes.length];
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x3, y3);
          ctx.closePath();
          ctx.stroke();
          return;
        }
        const skew = drift * 0.04;
        const mx12 = (x1 + x2) * (0.5 + skew);
        const my12 = (y1 + y2) * 0.5;
        const mx23 = (x2 + x3) * 0.5;
        const my23 = (y2 + y3) * (0.5 - skew);
        const mx31 = (x3 + x1) * 0.5;
        const my31 = (y3 + y1) * 0.5;
        drawTri(x1, y1, mx12, my12, mx31, my31, depth - 1, colorIdx);
        drawTri(mx12, my12, x2, y2, mx23, my23, depth - 1, colorIdx + 1);
        drawTri(mx31, my31, mx23, my23, x3, y3, depth - 1, colorIdx + 2);
      };

      const size = Math.min(w, h) * 0.44 * scaleFactor * (1 + drift * 0.08);
      const rot = tL * 0.05 + drift * 0.25;
      const cx = w * 0.5;
      const cy = h * 0.53;
      const pts: Array<[number, number]> = [0, 1, 2].map(k => {
        const a = rot - Math.PI / 2 + (k * Math.PI * 2) / 3;
        return [cx + Math.cos(a) * size, cy + Math.sin(a) * size];
      });

      withLayerCtx(layer, timeSec, () => {
        ctx.lineWidth = 1;
        drawTri(pts[0][0], pts[0][1], pts[1][0], pts[1][1], pts[2][0], pts[2][1], 5, 0);
      });
    };

    const drawDragon = (timeSec: number, layer: ActiveLayer) => {
      const w = canvas.width;
      const h = canvas.height;
      const tL = timeSec + layer.seed;
      const scaleFactor = baseScaleFactor * layer.scaleMul;
      const drift = stochasticDrift(tL, layer.seed) * uncertainty;

      const iter = 11;
      let pts: number[] = [0, 0, 1, 0];
      const skew = 0.5 + drift * 0.035;
      for (let d = 0; d < iter; d++) {
        const next: number[] = [pts[0], pts[1]];
        const n = pts.length / 2;
        for (let i = 0; i < n - 1; i++) {
          const ax = pts[i * 2];
          const ay = pts[i * 2 + 1];
          const bx = pts[(i + 1) * 2];
          const by = pts[(i + 1) * 2 + 1];
          const dx = bx - ax;
          const dy = by - ay;
          const sign = i % 2 === 0 ? 1 : -1;
          const mx = ax + skew * (dx - sign * dy);
          const my = ay + skew * (dy + sign * dx);
          next.push(mx, my, bx, by);
        }
        pts = next;
      }

      const len = Math.min(w, h) * 0.42 * scaleFactor;
      const rot = tL * 0.07 + drift * 0.3;
      const cosR = Math.cos(rot);
      const sinR = Math.sin(rot);
      const cx = w * 0.5;
      const cy = h * 0.52;
      const strokes = paletteStroke(0.7, layer.colorShift);
      const segs = pts.length / 2 - 1;
      const batch = Math.max(1, Math.floor(segs / palette.length));

      withLayerCtx(layer, timeSec, () => {
        ctx.lineWidth = 1.3;
        for (const armSign of [1, -1]) {
          for (let b = 0; b < palette.length; b++) {
            const start = b * batch;
            const end = b === palette.length - 1 ? segs : (b + 1) * batch;
            ctx.strokeStyle = strokes[(b + (armSign === -1 ? 2 : 0)) % strokes.length];
            ctx.beginPath();
            for (let i = start; i <= end; i++) {
              const rx = (pts[i * 2] - 0.5) * len * armSign;
              const ry = (pts[i * 2 + 1] - 0.15) * len * armSign;
              const sx = cx + (rx * cosR - ry * sinR);
              const sy = cy + (rx * sinR + ry * cosR);
              if (i === start) ctx.moveTo(sx, sy);
              else ctx.lineTo(sx, sy);
            }
            ctx.stroke();
          }
        }
      });
    };

    const drawLorenz = (timeSec: number, layer: ActiveLayer) => {
      const w = canvas.width;
      const h = canvas.height;
      const tL = timeSec + layer.seed;
      const scaleFactor = baseScaleFactor * layer.scaleMul;
      const driftA = stochasticDrift(tL, layer.seed) * uncertainty;
      const driftB = stochasticDrift(tL * 1.15, layer.seed + 3.4) * uncertainty;

      const dt = 0.008;
      const sigma = 10 + driftA * 1.6;
      const rho = 28 + driftB * 3.2;
      const beta = 8 / 3;
      const steps = 2100;

      let x = 0.1 + driftA * 0.4;
      let y = 0;
      let z = 0;

      for (let i = 0; i < 160; i++) {
        const dx = sigma * (y - x);
        const dy = x * (rho - z) - y;
        const dz = x * y - beta * z;
        x += dx * dt;
        y += dy * dt;
        z += dz * dt;
      }

      const rotY = tL * 0.18 + driftA * 0.32;
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const scale = Math.min(w, h) * 0.0155 * scaleFactor;
      const cx = w * 0.5;
      const cy = h * 0.54;

      const strokes = paletteStroke(0.68, layer.colorShift);
      const chunk = Math.floor(steps / palette.length);

      withLayerCtx(layer, timeSec, () => {
        ctx.lineWidth = 1.25;
        for (let c = 0; c < palette.length; c++) {
          ctx.strokeStyle = strokes[c];
          ctx.beginPath();
          const limit = c === palette.length - 1 ? steps - c * chunk : chunk;
          for (let i = 0; i <= limit; i++) {
            const px = x * cosY - (z - 25) * sinY;
            const py = y * 0.72 + (z - 25) * 0.55;
            const sx = cx + px * scale;
            const sy = cy - py * scale;
            if (i === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);

            if (i < limit) {
              const dx = sigma * (y - x);
              const dy = x * (rho - z) - y;
              const dz = x * y - beta * z;
              x += dx * dt;
              y += dy * dt;
              z += dz * dt;
            }
          }
          ctx.stroke();
        }
      });
    };

    const drawAt = (timeMs: number) => {
      if (cancelled) return;
      if (document.hidden && shouldAnimate) {
        timerId = window.setTimeout(() => {
          rafId = requestAnimationFrame(drawAt);
        }, 400);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = (timeMs / 1000) * speedFactor;

      for (const layer of layers) {
        switch (layer.type) {
          case 'julia':
          case 'mandelbrot':
          case 'fbm':
            drawPixelFractal(t, layer.type, layer);
            break;
          case 'tree':
            drawTree(t, layer);
            break;
          case 'koch':
            drawKoch(t, layer);
            break;
          case 'sierpinski':
            drawSierpinski(t, layer);
            break;
          case 'dragon':
            drawDragon(t, layer);
            break;
          case 'fern':
            drawFern(t, layer);
            break;
          case 'lorenz':
            drawLorenz(t, layer);
            break;
        }
      }

      if (shouldAnimate) {
        timerId = window.setTimeout(() => {
          rafId = requestAnimationFrame(drawAt);
        }, 75);
      }
    };

    const onResize = () => {
      syncSize();
      drawAt(performance.now());
    };

    const onVisibilityChange = () => {
      if (!document.hidden && shouldAnimate) {
        drawAt(performance.now());
      }
    };

    const onMotionChange = (e: MediaQueryListEvent) => {
      shouldAnimate = config.animate && !e.matches;
      if (!shouldAnimate) {
        if (timerId) {
          window.clearTimeout(timerId);
          timerId = 0;
        }
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
      } else if (!document.hidden) {
        drawAt(performance.now());
      }
    };

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibilityChange);
    motionMedia?.addEventListener?.('change', onMotionChange);
    drawAt(0);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      motionMedia?.removeEventListener?.('change', onMotionChange);
      if (timerId) window.clearTimeout(timerId);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [
    hasAnyLayer,
    config.fractal,
    config.multiFractal,
    config.fractalSecondary,
    config.fractalTertiary,
    config.fractalUncertainty,
    config.fractalOpacity,
    config.fractalScale,
    config.colors,
    config.mode,
    config.animate,
    config.animationSpeed,
  ]);

  if (!hasAnyLayer || config.fractalOpacity <= 0) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{
        opacity: +(Math.max(0, Math.min(100, config.fractalOpacity)) / 100).toFixed(2),
      }}
    />
  );
}
