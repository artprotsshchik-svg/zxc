import { useEffect, useRef } from 'react';
import {
  computeSurfaceAlphas,
  computeWaveEmitters,
  hexToRgb,
  samplePaletteColor,
  type RgbColor,
  type ThemeConfig,
} from '../utils/themeConfig.ts';

interface BackdropRendererProps {
  config: ThemeConfig;
}

const WAVE_FIELD_W = 200;
const WAVE_FIELD_H = 114;

export function BackdropRenderer({ config }: BackdropRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const imageDataRef = useRef<ImageData | null>(null);
  const configRef = useRef<ThemeConfig>(config);
  const phaseRef = useRef<number>(1.8);

  configRef.current = config;

  const isCanvasEffect = config.effectMode !== 'gradient';
  const alphas = computeSurfaceAlphas(config.mode, config.panelTransparency);

  useEffect(() => {
    if (!isCanvasEffect) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    if (!offscreenRef.current) {
      const off = document.createElement('canvas');
      off.width = WAVE_FIELD_W;
      off.height = WAVE_FIELD_H;
      offscreenRef.current = off;
    }

    const syncCanvasSize = () => {
      const maxW = 960;
      const vw = Math.max(320, window.innerWidth || 1280);
      const vh = Math.max(240, window.innerHeight || 720);
      const scale = Math.min(1, maxW / vw);
      const targetW = Math.round(vw * scale);
      const targetH = Math.round(vh * scale);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
    };

    syncCanvasSize();
    window.addEventListener('resize', syncCanvasSize);

    let rafId = 0;
    let lastNow = performance.now();
    let lastDraw = 0;

    const renderFrame = (now: number, force = false) => {
      const cfg = configRef.current;
      const dt = Math.min(0.1, Math.max(0, (now - lastNow) / 1000));
      lastNow = now;

      const isAnimated = cfg.animate && cfg.effectSpeed > 0;
      if (isAnimated) {
        phaseRef.current += dt * (cfg.effectSpeed / 100);
      }

      // Cap canvas redraws to ~30fps during animation for low CPU usage
      if (!force && isAnimated && now - lastDraw < 32) {
        rafId = requestAnimationFrame(t => renderFrame(t, false));
        return;
      }
      lastDraw = now;

      const w = canvas.width;
      const h = canvas.height;
      const aspect = w / Math.max(1, h);
      const t = phaseRef.current;
      const satNorm = Math.max(0, Math.min(1, cfg.saturation / 100));
      const intensityNorm = Math.max(0, Math.min(1, cfg.effectIntensity / 100));
      const scaleNorm = Math.max(0.3, Math.min(2, cfg.effectScale / 100));
      const palette: RgbColor[] = cfg.colors.map(hexToRgb);
      const isDark = cfg.mode === 'dark';
      const baseR = isDark ? 11 : 242;
      const baseG = isDark ? 10 : 242;
      const baseB = isDark ? 15 : 238;

      if (cfg.effectMode === 'waves') {
        const off = offscreenRef.current!;
        const offCtx = off.getContext('2d');
        if (offCtx) {
          if (!imageDataRef.current) {
            imageDataRef.current = offCtx.createImageData(WAVE_FIELD_W, WAVE_FIELD_H);
          }
          const img = imageDataRef.current;
          const data = img.data;
          const emitters = computeWaveEmitters(cfg.waveCount, cfg.angle, t);
          const n = emitters.length;
          const baseFreq = 16 * scaleNorm;
          const emitterPalette = emitters.map((_, idx) =>
            samplePaletteColor(palette, idx / Math.max(1, n))
          );

          const waveVals = new Float64Array(n);
          const crests = new Float64Array(n);

          for (let py = 0; py < WAVE_FIELD_H; py++) {
            const ny = py / (WAVE_FIELD_H - 1);
            for (let px = 0; px < WAVE_FIELD_W; px++) {
              const nx = px / (WAVE_FIELD_W - 1);

              let sumVal = 0;
              let colR = 0;
              let colG = 0;
              let colB = 0;
              let colW = 0;

              for (let i = 0; i < n; i++) {
                const em = emitters[i];
                const dx = (nx - em.x) * aspect;
                const dy = ny - em.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const freq = baseFreq * em.freqMul;
                const s = Math.sin(dist * freq - t * 2.35 + em.phase);
                const atten = 1 / (1 + dist * 0.42);
                const val = s * atten;
                waveVals[i] = val;
                sumVal += val;

                const crest = Math.pow(Math.max(0, s), 1.9) * atten;
                crests[i] = crest;

                const wgt = crest + 0.12;
                const ec = emitterPalette[i];
                colR += ec[0] * wgt;
                colG += ec[1] * wgt;
                colB += ec[2] * wgt;
                colW += wgt;
              }

              // Compute collision glow where two wave fronts intersect in phase
              let collision = 0;
              let pairs = 0;
              for (let i = 0; i < n; i++) {
                for (let j = i + 1; j < n; j++) {
                  const prod = crests[i] * crests[j];
                  if (prod > 0) {
                    collision += Math.sqrt(prod);
                  }
                  const overlap = waveVals[i] * waveVals[j];
                  if (overlap > 0.15) {
                    collision += (overlap - 0.15) * 0.65;
                  }
                  pairs++;
                }
              }

              const avgCollision = pairs > 0 ? Math.min(1, (collision / pairs) * 2.3) : 0;
              const normalizedRidge = Math.max(0, Math.min(1, (sumVal / Math.sqrt(n) + 0.55) * 0.68));
              const energy = Math.min(
                1,
                (0.14 + normalizedRidge * (0.38 + intensityNorm * 0.48) + avgCollision * (0.35 + intensityNorm * 0.95))
              );

              const rMix = colW > 0 ? colR / colW : palette[0][0];
              const gMix = colW > 0 ? colG / colW : palette[0][1];
              const bMix = colW > 0 ? colB / colW : palette[0][2];

              // Collision highlights slightly brighten toward cyan/white shimmer
              const highlight = avgCollision * intensityNorm * (isDark ? 0.36 : 0.18);
              const targetR = rMix + (255 - rMix) * highlight;
              const targetG = gMix + (255 - gMix) * highlight;
              const targetB = bMix + (255 - bMix) * highlight;

              const blend = Math.min(1, satNorm * energy);
              const idx4 = (py * WAVE_FIELD_W + px) * 4;
              data[idx4] = Math.round(baseR + (targetR - baseR) * blend);
              data[idx4 + 1] = Math.round(baseG + (targetG - baseG) * blend);
              data[idx4 + 2] = Math.round(baseB + (targetB - baseB) * blend);
              data[idx4 + 3] = 255;
            }
          }

          offCtx.putImageData(img, 0, 0);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(off, 0, 0, w, h);

          // Overlay crisp concentric collision-front rings on high intensity for crisp definition
          if (satNorm > 0.04 && intensityNorm > 0.18) {
            ctx.save();
            ctx.globalCompositeOperation = isDark ? 'screen' : 'multiply';
            const ringStep = Math.max(24, Math.round(78 / scaleNorm));
            const maxDim = Math.hypot(w, h);
            for (let i = 0; i < n; i++) {
              const em = emitters[i];
              const ex = em.x * w;
              const ey = em.y * h;
              const [r, g, b] = emitterPalette[i];
              const phaseShift = ((t * 36) % ringStep + ringStep) % ringStep;
              ctx.strokeStyle = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${+(
                satNorm *
                intensityNorm *
                (isDark ? 0.14 : 0.08)
              ).toFixed(3)})`;
              ctx.lineWidth = 1.25;
              for (let rad = phaseShift; rad < maxDim; rad += ringStep) {
                if (rad < 8) continue;
                ctx.beginPath();
                ctx.arc(ex, ey, rad, 0, Math.PI * 2);
                ctx.stroke();
              }
            }
            ctx.restore();
          }
        }
      } else if (cfg.effectMode === 'aurora') {
        ctx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
        ctx.fillRect(0, 0, w, h);

        if (satNorm > 0.01) {
          ctx.save();
          ctx.globalCompositeOperation = isDark ? 'screen' : 'multiply';
          const angleRad = ((cfg.angle - 90) * Math.PI) / 180;
          ctx.translate(w / 2, h / 2);
          ctx.rotate(angleRad * 0.35);
          ctx.translate(-w / 2, -h / 2);

          const bands = Math.max(2, Math.min(6, Math.round(cfg.waveCount)));
          for (let b = 0; b < bands; b++) {
            const [r, g, bl] = samplePaletteColor(palette, b / bands);
            const yBase = h * (0.18 + (b / Math.max(1, bands - 1)) * 0.64);
            const amp = h * (0.08 + intensityNorm * 0.14) / Math.sqrt(scaleNorm);
            const freq = (0.004 + b * 0.0012) * scaleNorm;
            const bandAlpha = satNorm * (0.28 + intensityNorm * 0.42);

            const grad = ctx.createLinearGradient(0, yBase - amp * 2, 0, yBase + amp * 2.4);
            grad.addColorStop(0, `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(bl)}, 0)`);
            grad.addColorStop(0.5, `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(bl)}, ${bandAlpha.toFixed(3)})`);
            grad.addColorStop(1, `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(bl)}, 0)`);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(-w * 0.2, h * 1.3);
            for (let x = -w * 0.2; x <= w * 1.2; x += 24) {
              const y =
                yBase +
                Math.sin(x * freq + t * (0.9 + b * 0.18) + b * 1.4) * amp +
                Math.cos(x * freq * 0.55 - t * 0.7 + b) * (amp * 0.45);
              ctx.lineTo(x, y);
            }
            ctx.lineTo(w * 1.2, h * 1.3);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        }
      } else if (cfg.effectMode === 'orbs') {
        ctx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
        ctx.fillRect(0, 0, w, h);

        if (satNorm > 0.01) {
          ctx.save();
          ctx.globalCompositeOperation = isDark ? 'screen' : 'multiply';
          const orbCount = Math.max(2, Math.min(6, Math.round(cfg.waveCount)));
          const angleRad = (cfg.angle * Math.PI) / 180;
          for (let i = 0; i < orbCount; i++) {
            const [r, g, b] = samplePaletteColor(palette, i / orbCount);
            const orbitR = 0.26 + (i % 2) * 0.08;
            const theta = angleRad + t * (0.42 + i * 0.11) * (i % 2 === 0 ? 1 : -1) + (i * Math.PI * 2) / orbCount;
            const cx = w * (0.5 + Math.cos(theta) * orbitR);
            const cy = h * (0.5 + Math.sin(theta * 1.15 + i) * (orbitR * 0.85));
            const radius = Math.max(w, h) * (0.28 + (i % 3) * 0.07) * (0.75 + 0.45 / scaleNorm);
            const alpha = satNorm * (0.34 + intensityNorm * 0.48);

            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            grad.addColorStop(0, `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha.toFixed(3)})`);
            grad.addColorStop(0.55, `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${(alpha * 0.35).toFixed(3)})`);
            grad.addColorStop(1, `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, 0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
          }
          ctx.restore();
        }
      }

      if (isAnimated) {
        rafId = requestAnimationFrame(nextNow => renderFrame(nextNow, false));
      }
    };

    renderFrame(performance.now(), true);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', syncCanvasSize);
    };
  }, [
    isCanvasEffect,
    config.mode,
    config.effectMode,
    config.colors,
    config.angle,
    config.saturation,
    config.animate,
    config.effectSpeed,
    config.effectIntensity,
    config.effectScale,
    config.waveCount,
  ]);

  const gradientStops = [...config.colors, config.colors[0]].join(', ');
  const gradientAnimSec = +(16 / Math.max(0.15, config.effectSpeed / 100)).toFixed(2);
  const gradientAnimated = config.effectMode === 'gradient' && config.animate && config.effectSpeed > 0;

  return (
    <div
      aria-hidden="true"
      data-testid="backdrop-container"
      data-effect={config.effectMode}
      data-animate={String(config.animate && config.effectSpeed > 0)}
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-[var(--surface-page)]"
    >
      {config.effectMode === 'gradient' ? (
        <div
          className={`absolute inset-0 transition-[opacity] duration-300 ${
            gradientAnimated ? 'iridescent-bg-animated' : ''
          }`}
          style={{
            backgroundImage: `linear-gradient(${config.angle}deg, ${gradientStops})`,
            opacity: Math.max(0, Math.min(1, config.saturation / 100)),
            animationDuration: gradientAnimated ? `${gradientAnimSec}s` : undefined,
          }}
        />
      ) : (
        <canvas
          ref={canvasRef}
          data-testid="backdrop-canvas"
          className="absolute inset-0 w-full h-full block"
        />
      )}

      {config.mode === 'dark' && (
        <div
          className="absolute inset-0 transition-opacity duration-200"
          style={{
            background: `radial-gradient(ellipse at 50% 25%, rgba(11,10,15,${alphas.vignetteCenterAlpha}) 0%, rgba(11,10,15,${alphas.vignetteEdgeAlpha}) 100%)`,
          }}
        />
      )}
    </div>
  );
}
