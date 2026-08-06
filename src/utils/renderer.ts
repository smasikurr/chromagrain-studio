import { GradientConfig, NoiseConfig, CameraRawConfig, BlurConfig, FilterGalleryConfig, GrainBlendMode, VolumetricLightingConfig } from '../types';
import { hexToRgb, rgbToHsl, hslToRgb } from './color';
import { simplex2D, gaussianRandom, spatialDitherValue } from './noise';
import { generateProceduralPattern, renderFloat32ProceduralBuffer, convertFloat32ToImageData } from './proceduralEngine';

export interface RenderOptions {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  gradient: GradientConfig;
  noise: NoiseConfig;
  cameraRaw: CameraRawConfig;
  blur?: BlurConfig;
  filterGallery?: FilterGalleryConfig;
  scaleFactor?: number;
}

export function logWebGLMemoryUsage(cardCount: number, width: number, height: number): void {
  const bytesPerPixel = 4;
  const frameBufferBytes = width * height * bytesPerPixel;
  const totalMB = ((frameBufferBytes * cardCount) / (1024 * 1024)).toFixed(2);
  const perCardMB = (frameBufferBytes / (1024 * 1024)).toFixed(2);
  console.log(
    `[ChromaGrain Memory & WebGL Tracker]\n` +
    ` • Target batch size: ${cardCount} cards (${width}x${height}px)\n` +
    ` • Framebuffer allocation per card: ${perCardMB} MB\n` +
    ` • Total estimated RAM/VRAM footprint: ${totalMB} MB\n` +
    ` • Hardware Threads: ${navigator.hardwareConcurrency || 4} threads available.`
  );
}

export function renderGradientToCanvas(options: RenderOptions): void {
  const { canvas, gradient, noise, cameraRaw, blur, filterGallery } = options;
  const ctx = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // STEP 1: Render Base Procedural Gradient
  renderBaseGradient(ctx, width, height, gradient);

  // STEP 2: Comprehensive Blur Suite (Bypassed if blur.enabled is false)
  if (blur && blur.enabled !== false) {
    applyBlurSuite(ctx, width, height, blur);
  }

  // STEP 3: Photoshop Filter Gallery & Volumetric 3D Lighting
  if (filterGallery) {
    applyFilterGallery(ctx, width, height, filterGallery);
  }

  // STEP 4: Anti-Banding Dithering + Noise Overlay + Camera Raw Post Processing
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  applyPixelManipulations(data, width, height, noise, cameraRaw);

  ctx.putImageData(imageData, 0, 0);

  // STEP 5: Apply Vignette Overlay if active
  if (cameraRaw.vignetteAmount > 0) {
    applyVignetteOverlay(ctx, width, height, cameraRaw);
  }
}

function renderBaseGradient(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  w: number,
  h: number,
  config: GradientConfig
): void {
  const colors = config.colors.map(c => c.color);

  // Master Toggle: Use 16-Bit Precision Float32 Procedural Engine if enabled and present
  if (config.proceduralEnabled !== false && (config.style === 'freeform' || config.proceduralConfig)) {
    const procConfig = config.proceduralConfig || generateProceduralPattern(config.seed || Date.now(), config.colors.length);
    const floatBuffer = renderFloat32ProceduralBuffer(w, h, config.colors, procConfig);
    const imgData = ctx.createImageData(w, h);
    convertFloat32ToImageData(floatBuffer, w, h, imgData);
    ctx.putImageData(imgData, 0, 0);
    return;
  }

  switch (config.style) {
    case 'linear': {
      const rad = (config.angle * Math.PI) / 180;
      const x1 = w / 2 - Math.cos(rad) * w * 0.5;
      const y1 = h / 2 - Math.sin(rad) * h * 0.5;
      const x2 = w / 2 + Math.cos(rad) * w * 0.5;
      const y2 = h / 2 + Math.sin(rad) * h * 0.5;

      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      colors.forEach((color, i) => {
        grad.addColorStop(i / Math.max(1, colors.length - 1), color);
      });
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case 'radial': {
      const cx = w * 0.5;
      const cy = h * 0.5;
      const maxR = Math.hypot(w, h) * 0.6;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      colors.forEach((color, i) => {
        grad.addColorStop(i / Math.max(1, colors.length - 1), color);
      });
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case 'conic': {
      const cx = w * 0.5;
      const cy = h * 0.5;
      const rad = (config.angle * Math.PI) / 180;
      if (typeof ctx.createConicGradient === 'function') {
        const grad = ctx.createConicGradient(rad, cx, cy);
        colors.forEach((color, i) => {
          grad.addColorStop(i / Math.max(1, colors.length - 1), color);
        });
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      } else {
        const grad = ctx.createLinearGradient(0, 0, w, h);
        colors.forEach((color, i) => {
          grad.addColorStop(i / Math.max(1, colors.length - 1), color);
        });
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }
      break;
    }
    case 'blob': {
      ctx.fillStyle = colors[0] || '#0d1117';
      ctx.fillRect(0, 0, w, h);

      config.colors.forEach((node, i) => {
        const bx = node.position.x * w;
        const by = node.position.y * h;
        const radius = (node.radius || 0.4) * Math.max(w, h);

        const grad = ctx.createRadialGradient(bx, by, 0, bx, by, radius);
        const rgb = hexToRgb(node.color);
        grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.95)`);
        grad.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`);
        grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bx, by, radius, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }
    case 'aurora': {
      ctx.fillStyle = colors[0] || '#050b14';
      ctx.fillRect(0, 0, w, h);

      config.colors.forEach((node, idx) => {
        const rgb = hexToRgb(node.color);
        const yOffset = node.position.y * h;
        const grad = ctx.createLinearGradient(0, yOffset - h * 0.3, 0, yOffset + h * 0.3);
        grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
        grad.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.85)`);
        grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        const freq = 0.003 + idx * 0.002;
        const amp = 40 + idx * 25;
        ctx.moveTo(0, yOffset);
        for (let x = 0; x <= w; x += 10) {
          const waveY = yOffset + Math.sin(x * freq + config.angle) * amp;
          ctx.lineTo(x, waveY);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();
      });
      break;
    }
    case 'fluid': {
      ctx.fillStyle = colors[0] || '#0d0d1a';
      ctx.fillRect(0, 0, w, h);

      config.colors.forEach((node, idx) => {
        const cx = node.position.x * w;
        const cy = node.position.y * h;
        const radius = (node.radius || 0.5) * Math.max(w, h);
        const rgb = hexToRgb(node.color);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(((config.angle + idx * 45) * Math.PI) / 180);
        ctx.scale(1.4, 0.7);

        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.9)`);
        grad.addColorStop(0.6, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`);
        grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      break;
    }
    case 'spiral': {
      const cx = w * 0.5;
      const cy = h * 0.5;
      ctx.fillStyle = colors[0] || '#0a0a0f';
      ctx.fillRect(0, 0, w, h);

      const maxR = Math.hypot(w, h) * 0.75;
      config.colors.forEach((node, idx) => {
        const rgb = hexToRgb(node.color);
        const startAngle = (config.angle * Math.PI) / 180 + (idx * Math.PI * 2) / config.colors.length;
        const endAngle = startAngle + Math.PI * 1.5;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
        grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.85)`);
        grad.addColorStop(0.7, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
        grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, maxR, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();
      });
      break;
    }
    case 'glass_wave': {
      ctx.fillStyle = colors[0] || '#10121a';
      ctx.fillRect(0, 0, w, h);

      config.colors.forEach((node, idx) => {
        const rgb = hexToRgb(node.color);
        const yPos = node.position.y * h;
        const grad = ctx.createLinearGradient(0, yPos - 120, w, yPos + 120);
        grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`);
        grad.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`);
        grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, yPos);
        ctx.bezierCurveTo(w * 0.33, yPos - 100, w * 0.66, yPos + 100, w, yPos);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();
      });
      break;
    }
    case 'prism': {
      const rad = (config.angle * Math.PI) / 180;
      const grad = ctx.createLinearGradient(
        w / 2 - Math.cos(rad) * w * 0.5,
        h / 2 - Math.sin(rad) * h * 0.5,
        w / 2 + Math.cos(rad) * w * 0.5,
        h / 2 + Math.sin(rad) * h * 0.5
      );
      config.colors.forEach((node, i) => {
        grad.addColorStop(i / Math.max(1, config.colors.length - 1), node.color);
      });
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Chromatic Overlay Waves
      config.colors.forEach((node, idx) => {
        const rgb = hexToRgb(node.color);
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`;
        ctx.fillRect((idx * w) / config.colors.length, 0, w / config.colors.length, h);
      });
      break;
    }
    case 'diamond': {
      const cx = w * 0.5;
      const cy = h * 0.5;
      ctx.fillStyle = colors[0] || '#0d1117';
      ctx.fillRect(0, 0, w, h);

      config.colors.forEach((node, i) => {
        const bx = node.position.x * w;
        const by = node.position.y * h;
        const size = (node.radius || 0.45) * Math.hypot(w, h);

        const grad = ctx.createRadialGradient(bx, by, 0, bx, by, size);
        const rgb = hexToRgb(node.color);
        grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.95)`);
        grad.addColorStop(0.6, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`);
        grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(((config.angle + i * 45) * Math.PI) / 180);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size, 0);
        ctx.moveTo(0, size);
        ctx.lineTo(-size, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
      break;
    }
    case 'angular': {
      const cx = w * 0.5;
      const cy = h * 0.5;
      const radOffset = (config.angle * Math.PI) / 180;
      if (typeof ctx.createConicGradient === 'function') {
        const grad = ctx.createConicGradient(radOffset, cx, cy);
        colors.forEach((color, i) => {
          grad.addColorStop(i / Math.max(1, colors.length - 1), color);
        });
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      } else {
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(w, h) * 0.6);
        colors.forEach((color, i) => {
          grad.addColorStop(i / Math.max(1, colors.length - 1), color);
        });
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }
      break;
    }
    case 'mesh':
    default: {
      ctx.fillStyle = colors[0] || '#000000';
      ctx.fillRect(0, 0, w, h);

      config.colors.forEach((node, idx) => {
        const mx = node.position.x * w;
        const my = node.position.y * h;
        const meshRadius = (0.45 + (idx % 2 === 0 ? 0.15 : 0)) * Math.hypot(w, h);

        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, meshRadius);
        const rgb = hexToRgb(node.color);
        grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.9)`);
        grad.addColorStop(0.4, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.55)`);
        grad.addColorStop(0.85, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`);
        grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      });
      break;
    }
  }

  // Fluid Blur Radius
  if (config.blurRadius > 0 && typeof ctx.filter === 'string') {
    ctx.save();
    ctx.filter = `blur(${Math.min(50, config.blurRadius)}px)`;
    ctx.drawImage(ctx.canvas, 0, 0);
    ctx.restore();
  }
}

/**
 * Applies Gaussian, Motion, Radial, and Surface Blurs to the canvas.
 */
function applyBlurSuite(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  w: number,
  h: number,
  blur: BlurConfig
): void {
  if (
    !blur ||
    blur.enabled === false ||
    (!blur.gaussianRadius &&
      !blur.motionDistance &&
      !blur.radialAmount &&
      !blur.surfaceRadius)
  ) {
    return;
  }

  // 1. Gaussian Blur
  if (blur.gaussianRadius > 0 && typeof ctx.filter === 'string') {
    ctx.save();
    ctx.filter = `blur(${Math.min(200, blur.gaussianRadius)}px)`;
    ctx.drawImage(ctx.canvas, 0, 0);
    ctx.restore();
  }

  // 2. Motion Blur
  if (blur.motionDistance > 0) {
    const rad = (blur.motionAngle * Math.PI) / 180;
    const steps = 8;
    const dx = (Math.cos(rad) * blur.motionDistance) / steps;
    const dy = (Math.sin(rad) * blur.motionDistance) / steps;

    if (typeof OffscreenCanvas !== 'undefined') {
      const tempCanvas = new OffscreenCanvas(w, h);
      const tempCtx = tempCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D | null;
      if (tempCtx) {
        tempCtx.drawImage(ctx.canvas, 0, 0);
        ctx.clearRect(0, 0, w, h);
        ctx.globalAlpha = 1 / steps;
        for (let i = 0; i < steps; i++) {
          ctx.drawImage(tempCanvas, i * dx - (steps * dx) / 2, i * dy - (steps * dy) / 2);
        }
        ctx.globalAlpha = 1.0;
      }
    } else {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = w;
      tempCanvas.height = h;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(ctx.canvas, 0, 0);
        ctx.clearRect(0, 0, w, h);
        ctx.globalAlpha = 1 / steps;
        for (let i = 0; i < steps; i++) {
          ctx.drawImage(tempCanvas, i * dx - (steps * dx) / 2, i * dy - (steps * dy) / 2);
        }
        ctx.globalAlpha = 1.0;
      }
    }
  }

  // 3. Radial Blur (Spin or Zoom)
  if (blur.radialAmount > 0) {
    const cx = blur.radialCenterX * w;
    const cy = blur.radialCenterY * h;
    const steps = 10;
    const amount = blur.radialAmount / 100;

    let temp: HTMLCanvasElement | OffscreenCanvas;
    if (typeof OffscreenCanvas !== 'undefined') {
      temp = new OffscreenCanvas(w, h);
    } else {
      temp = document.createElement('canvas');
      temp.width = w;
      temp.height = h;
    }
    const tempCtx = temp.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    if (tempCtx) {
      tempCtx.drawImage(ctx.canvas, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = 1 / steps;

      for (let i = 0; i < steps; i++) {
        ctx.save();
        ctx.translate(cx, cy);
        if (blur.radialMode === 'zoom') {
          const scale = 1 + (i / steps) * amount * 0.2;
          ctx.scale(scale, scale);
        } else {
          // Spin mode
          const rot = ((i - steps / 2) / steps) * amount * 0.15;
          ctx.rotate(rot);
        }
        ctx.translate(-cx, -cy);
        ctx.drawImage(temp, 0, 0);
        ctx.restore();
      }
      ctx.globalAlpha = 1.0;
    }
  }

  // 4. Surface Blur
  if (blur.surfaceRadius > 0) {
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const radius = Math.min(20, Math.round(blur.surfaceRadius));
    const thresh = blur.surfaceThreshold;

    const copy = new Uint8ClampedArray(data);

    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const idx = (y * w + x) * 4;
        const cr = copy[idx];
        const cg = copy[idx + 1];
        const cb = copy[idx + 2];

        let sumR = 0, sumG = 0, sumB = 0, count = 0;

        for (let dy = -radius; dy <= radius; dy += 2) {
          const ny = y + dy;
          if (ny < 0 || ny >= h) continue;
          for (let dx = -radius; dx <= radius; dx += 2) {
            const nx = x + dx;
            if (nx < 0 || nx >= w) continue;
            const nIdx = (ny * w + nx) * 4;
            const nr = copy[nIdx];
            const ng = copy[nIdx + 1];
            const nb = copy[nIdx + 2];

            const diff = Math.abs(cr - nr) + Math.abs(cg - ng) + Math.abs(cb - nb);
            if (diff <= thresh * 3) {
              sumR += nr;
              sumG += ng;
              sumB += nb;
              count++;
            }
          }
        }

        if (count > 0) {
          data[idx] = sumR / count;
          data[idx + 1] = sumG / count;
          data[idx + 2] = sumB / count;
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }
}

/**
 * Applies procedural Photoshop Filter Gallery effects.
 */
function applyFilterGallery(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  w: number,
  h: number,
  fg: FilterGalleryConfig
): void {
  if (
    !fg ||
    (!fg.glassRipple?.enabled &&
      !fg.halftone?.enabled &&
      !fg.grungyTexture?.enabled &&
      !fg.mosaicStainedGlass?.enabled &&
      !fg.plasticWrap?.enabled &&
      !fg.roughTexture?.enabled &&
      !fg.volumetricLighting?.enabled)
  ) {
    return;
  }

  // 1. Glass / Ripple Effect
  if (fg.glassRipple.enabled) {
    const imageData = ctx.getImageData(0, 0, w, h);
    const src = new Uint8ClampedArray(imageData.data);
    const dst = imageData.data;
    const dist = fg.glassRipple.distortion;
    const smooth = Math.max(1, fg.glassRipple.smoothness);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const offX = Math.round(Math.sin(y / (smooth * 5)) * dist * 0.3);
        const offY = Math.round(Math.cos(x / (smooth * 5)) * dist * 0.3);

        const nx = Math.max(0, Math.min(w - 1, x + offX));
        const ny = Math.max(0, Math.min(h - 1, y + offY));

        const srcIdx = (ny * w + nx) * 4;
        const dstIdx = (y * w + x) * 4;

        dst[dstIdx] = src[srcIdx];
        dst[dstIdx + 1] = src[srcIdx + 1];
        dst[dstIdx + 2] = src[srcIdx + 2];
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  // 2. Adobe Illustrator Authentic CMYK Color Halftone Engine
  if (fg.halftone && fg.halftone.enabled) {
    const maxRadius = Math.max(2, fg.halftone.maxRadius || fg.halftone.size || 8);
    const gridStep = maxRadius * 2;
    const opacity = (fg.halftone.opacity ?? 100) / 100;
    const contrastVal = (fg.halftone.contrast ?? 50) / 50;
    const pattern = fg.halftone.pattern || 'dot';

    // Channel Screen Angles (0 to 360 deg)
    const c1Deg = fg.halftone.channel1Angle ?? 108; // Cyan
    const c2Deg = fg.halftone.channel2Angle ?? 162; // Magenta
    const c3Deg = fg.halftone.channel3Angle ?? 90;  // Yellow
    const c4Deg = fg.halftone.channel4Angle ?? 45;  // Black / Key

    const angles = [c1Deg, c2Deg, c3Deg, c4Deg].map(a => (a * Math.PI) / 180);
    const trig = angles.map(a => ({ cos: Math.cos(a), sin: Math.sin(a) }));

    const imageData = ctx.getImageData(0, 0, w, h);
    const srcData = new Uint8ClampedArray(imageData.data);
    const dstData = imageData.data;

    // Fast CMYK Lookup cache for grid centers
    const sampleCMYKAt = (cx: number, cy: number) => {
      const clampX = Math.max(0, Math.min(w - 1, Math.round(cx)));
      const clampY = Math.max(0, Math.min(h - 1, Math.round(cy)));
      const idx = (clampY * w + clampX) * 4;
      const r = srcData[idx] / 255;
      const g = srcData[idx + 1] / 255;
      const b = srcData[idx + 2] / 255;

      const k = 1 - Math.max(r, g, b);
      if (k >= 0.999) return [0, 0, 0, 1];
      const c = (1 - r - k) / (1 - k);
      const m = (1 - g - k) / (1 - k);
      const y = (1 - b - k) / (1 - k);
      return [c, m, y, k];
    };

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const cmykDots = [false, false, false, false];

        for (let ch = 0; ch < 4; ch++) {
          const { cos, sin } = trig[ch];
          const xr = x * cos - y * sin;
          const yr = x * sin + y * cos;

          const cxr = Math.floor(xr / gridStep + 0.5) * gridStep;
          const cyr = Math.floor(yr / gridStep + 0.5) * gridStep;

          const cx = cxr * cos + cyr * sin;
          const cy = -cxr * sin + cyr * cos;

          const cmykSample = sampleCMYKAt(cx, cy);
          const channelVal = Math.pow(Math.max(0, Math.min(1, cmykSample[ch])), contrastVal);

          const dist = Math.hypot(x - cx, y - cy);
          const dotRadius = channelVal * maxRadius;

          let isInside = false;
          if (pattern === 'dot' || pattern === 'circle') {
            isInside = dist <= dotRadius;
          } else if (pattern === 'line') {
            const dy = Math.abs((x - cx) * sin + (y - cy) * cos);
            isInside = dy <= dotRadius;
          } else if (pattern === 'ellipse') {
            const dx = (x - cx) * cos - (y - cy) * sin;
            const dy = (x - cx) * sin + (y - cy) * cos;
            isInside = Math.hypot(dx * 1.5, dy * 0.75) <= dotRadius;
          } else if (pattern === 'diamond') {
            const dx = Math.abs(x - cx);
            const dy = Math.abs(y - cy);
            isInside = (dx + dy) <= dotRadius * 1.3;
          } else if (pattern === 'cross') {
            const dx = Math.abs(x - cx);
            const dy = Math.abs(y - cy);
            isInside = (dx <= dotRadius * 0.4 || dy <= dotRadius * 0.4) && Math.hypot(dx, dy) <= maxRadius;
          }

          cmykDots[ch] = isInside;
        }

        // Subtractive CMYK Overprint Simulation
        let r = 1.0;
        let g = 1.0;
        let b = 1.0;

        if (cmykDots[0]) r *= 0.08; // Cyan
        if (cmykDots[1]) g *= 0.08; // Magenta
        if (cmykDots[2]) b *= 0.05; // Yellow
        if (cmykDots[3]) {          // Black / Key
          r *= 0.08;
          g *= 0.08;
          b *= 0.08;
        }

        const origR = srcData[idx];
        const origG = srcData[idx + 1];
        const origB = srcData[idx + 2];

        const halftonedR = r * 255;
        const halftonedG = g * 255;
        const halftonedB = b * 255;

        dstData[idx] = Math.round(origR * (1 - opacity) + halftonedR * opacity);
        dstData[idx + 1] = Math.round(origG * (1 - opacity) + halftonedG * opacity);
        dstData[idx + 2] = Math.round(origB * (1 - opacity) + halftonedB * opacity);
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  // 3. Grungy Procedural Texture Generator
  if (fg.grungyTexture && fg.grungyTexture.enabled) {
    const { textureType, intensity, scale, contrast, invert, opacity } = fg.grungyTexture;
    const intFactor = (intensity / 100) * (opacity / 100);
    const scaleVal = Math.max(0.2, scale);

    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        let gVal = 0;
        const nx = (x / scaleVal) * 0.015;
        const ny = (y / scaleVal) * 0.015;

        if (textureType === 'scratches') {
          const lineVal = Math.abs(Math.sin((x * 0.7 + y * 0.7) * 0.15 / scaleVal));
          const n = simplex2D(nx * 0.5, ny * 0.5);
          gVal = lineVal > 0.975 && n > 0.1 ? 1.5 : 0;
        } else if (textureType === 'vintage_paper') {
          const p1 = simplex2D(nx, ny);
          const p2 = simplex2D(nx * 3, ny * 3) * 0.5;
          gVal = (p1 + p2) * 0.6;
        } else if (textureType === 'film_spots') {
          const spot = Math.pow(Math.max(0, simplex2D(nx * 2, ny * 2)), 7);
          gVal = spot > 0.35 ? spot * 2.5 : 0;
        } else if (textureType === 'distressed') {
          const p = simplex2D(nx * 2.5, ny * 2.5);
          gVal = p > (1 - contrast / 150) ? 1.2 : -0.6;
        }

        if (invert) gVal = -gVal;
        const delta = gVal * 160 * intFactor;

        const idx = (y * w + x) * 4;
        data[idx] = Math.max(0, Math.min(255, data[idx] + delta));
        data[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] + delta));
        data[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] + delta));

        if (x + 1 < w) {
          data[idx + 4] = data[idx];
          data[idx + 5] = data[idx + 1];
          data[idx + 6] = data[idx + 2];
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  // 4. Mosaic / Stained Glass
  if (fg.mosaicStainedGlass.enabled) {
    const cellSize = Math.max(2, fg.mosaicStainedGlass.cellSize);
    const borderWidth = fg.mosaicStainedGlass.borderWidth;
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    for (let y = 0; y < h; y += cellSize) {
      for (let x = 0; x < w; x += cellSize) {
        let sumR = 0, sumG = 0, sumB = 0, count = 0;

        for (let dy = 0; dy < cellSize && y + dy < h; dy++) {
          for (let dx = 0; dx < cellSize && x + dx < w; dx++) {
            const idx = ((y + dy) * w + (x + dx)) * 4;
            sumR += data[idx];
            sumG += data[idx + 1];
            sumB += data[idx + 2];
            count++;
          }
        }

        const avgR = count > 0 ? sumR / count : 0;
        const avgG = count > 0 ? sumG / count : 0;
        const avgB = count > 0 ? sumB / count : 0;

        for (let dy = 0; dy < cellSize && y + dy < h; dy++) {
          for (let dx = 0; dx < cellSize && x + dx < w; dx++) {
            const idx = ((y + dy) * w + (x + dx)) * 4;
            const isBorder = borderWidth > 0 && (dx < borderWidth || dy < borderWidth);

            if (isBorder) {
              data[idx] = 20;
              data[idx + 1] = 20;
              data[idx + 2] = 20;
            } else {
              data[idx] = avgR;
              data[idx + 1] = avgG;
              data[idx + 2] = avgB;
            }
          }
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  // 4. Plastic Wrap
  if (fg.plasticWrap.enabled) {
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const shine = fg.plasticWrap.shine / 100;
    const depth = fg.plasticWrap.depth / 100;

    for (let y = 1; y < h - 1; y += 2) {
      for (let x = 1; x < w - 1; x += 2) {
        const idx = (y * w + x) * 4;
        const leftIdx = (y * w + (x - 1)) * 4;
        const topIdx = ((y - 1) * w + x) * 4;

        const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        const leftLum = 0.299 * data[leftIdx] + 0.587 * data[leftIdx + 1] + 0.114 * data[leftIdx + 2];
        const topLum = 0.299 * data[topIdx] + 0.587 * data[topIdx + 1] + 0.114 * data[topIdx + 2];

        const gradX = Math.abs(lum - leftLum);
        const gradY = Math.abs(lum - topLum);
        const edge = Math.hypot(gradX, gradY);

        if (edge > 15) {
          const highlight = Math.min(255, edge * shine * 3 * (1 + depth));
          data[idx] = Math.min(255, data[idx] + highlight);
          data[idx + 1] = Math.min(255, data[idx + 1] + highlight);
          data[idx + 2] = Math.min(255, data[idx + 2] + highlight);
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  // 5. Rough Texture
  if (fg.roughTexture.enabled) {
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const grain = fg.roughTexture.graininess / 100;
    const contrast = fg.roughTexture.contrast / 100;
    const hl = fg.roughTexture.highlightIntensity / 100;

    for (let i = 0; i < data.length; i += 4) {
      if (grain > 0) {
        const rnd = (Math.random() - 0.5) * 50 * grain;
        data[i] = Math.max(0, Math.min(255, data[i] + rnd));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + rnd));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + rnd));
      }

      if (hl > 0) {
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        if (lum > 180) {
          const boost = (lum - 180) * hl * 0.5;
          data[i] = Math.min(255, data[i] + boost);
          data[i + 1] = Math.min(255, data[i + 1] + boost);
          data[i + 2] = Math.min(255, data[i + 2] + boost);
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  // 6. Volumetric Lighting & 3D Depth Map Pass
  if (fg.volumetricLighting && fg.volumetricLighting.enabled) {
    applyVolumetricLighting(ctx, w, h, fg.volumetricLighting);
  }
}

/**
 * Volumetric Lighting Simulation & Pseudo-Normal 3D Depth Mapping
 */
function applyVolumetricLighting(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  w: number,
  h: number,
  vl: VolumetricLightingConfig
): void {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const rad = ((vl.angle || 45) * Math.PI) / 180;
  const lx = Math.cos(rad);
  const ly = Math.sin(rad);
  const lz = 0.8;
  const intensity = (vl.intensity || 60) / 100;
  const ao = (vl.ambientOcclusion || 35) / 100;
  const rim = (vl.rimLighting || 40) / 100;
  const depth = (vl.depthScale || 50) / 25;

  const copy = new Uint8ClampedArray(data);

  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const idx = (y * w + x) * 4;

      const hC = (copy[idx] + copy[idx + 1] + copy[idx + 2]) / 3;
      const hR = (copy[idx + 4] + copy[idx + 5] + copy[idx + 6]) / 3;
      const hL = (copy[idx - 4] + copy[idx - 3] + copy[idx - 2]) / 3;
      const hD = (copy[idx + w * 4] + copy[idx + w * 4 + 1] + copy[idx + w * 4 + 2]) / 3;
      const hU = (copy[idx - w * 4] + copy[idx - w * 4 + 1] + copy[idx - w * 4 + 2]) / 3;

      const dx = (hL - hR) * depth;
      const dy = (hU - hD) * depth;
      const len = Math.hypot(dx, dy, 255.0);
      const nx = dx / len;
      const ny = dy / len;
      const nz = 255.0 / len;

      const dot = Math.max(0, nx * lx + ny * ly + nz * lz);
      const diff = dot * intensity;

      const curvature = Math.abs(hL + hR + hU + hD - 4 * hC);
      const shadow = Math.max(0, 1 - curvature * ao * 0.005);
      const rimFactor = Math.pow(1 - nz, 3) * rim * 1.5;

      const lightFactor = (0.6 + diff * 0.8 + rimFactor) * shadow;

      data[idx] = Math.max(0, Math.min(255, data[idx] * lightFactor));
      data[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] * lightFactor));
      data[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] * lightFactor));
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

function applyPixelManipulations(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  noise: NoiseConfig,
  raw: CameraRawConfig
): void {
  const len = data.length;
  const grainInt = (noise.enabled !== false && noise.intensity > 0) ? (noise.intensity / 100) * (noise.opacity / 100) : 0;
  const grainScale = Math.max(0.1, noise.scale);
  const antiBanding = noise.antiBandingDither;

  const hasCameraRaw =
    raw.exposure !== 0 ||
    raw.contrast !== 0 ||
    raw.saturation !== 0 ||
    raw.vibrance !== 0 ||
    raw.highlights !== 0 ||
    raw.shadows !== 0 ||
    raw.clarity !== 0 ||
    raw.texture !== 0;

  if (grainInt === 0 && !antiBanding && !hasCameraRaw) {
    return;
  }

  const exposureFactor = Math.pow(2, raw.exposure / 50);
  const contrastFactor = (255 + raw.contrast * 2.55) / (255.01 - raw.contrast * 2.55);
  const saturationFactor = 1 + raw.saturation / 100;
  const vibranceFactor = raw.vibrance / 100;
  const highlightsFactor = 1 + raw.highlights / 100;
  const shadowsFactor = 1 + raw.shadows / 100;
  const clarityFactor = raw.clarity / 100;
  const textureFactor = raw.texture / 100;

  for (let i = 0; i < len; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    const pixelIndex = i / 4;
    const x = pixelIndex % w;
    const y = Math.floor(pixelIndex / w);

    // 1. Exposure
    r *= exposureFactor;
    g *= exposureFactor;
    b *= exposureFactor;

    // 2. Highlights & Shadows
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum > 128) {
      const hWeight = (lum - 128) / 127;
      r += r * (highlightsFactor - 1) * hWeight;
      g += g * (highlightsFactor - 1) * hWeight;
      b += b * (highlightsFactor - 1) * hWeight;
    } else {
      const sWeight = (128 - lum) / 128;
      r += r * (shadowsFactor - 1) * sWeight;
      g += g * (shadowsFactor - 1) * sWeight;
      b += b * (shadowsFactor - 1) * sWeight;
    }

    // 3. Contrast
    r = (r - 128) * contrastFactor + 128;
    g = (g - 128) * contrastFactor + 128;
    b = (b - 128) * contrastFactor + 128;

    // 4. Clarity (Midtone Micro-contrast)
    if (clarityFactor !== 0) {
      const midWeight = 1 - Math.abs(lum - 128) / 128;
      const cDiff = (lum - 128) * clarityFactor * midWeight * 0.4;
      r += cDiff;
      g += cDiff;
      b += cDiff;
    }

    // 5. Anti-Banding Dithering Engine
    if (antiBanding) {
      const dither = spatialDitherValue(x, y);
      r += dither * 255;
      g += dither * 255;
      b += dither * 255;
    }

    // 6. Procedural Grain & Noise Engine
    if (grainInt > 0) {
      let noiseVal = 0;
      switch (noise.type) {
        case 'gaussian':
          noiseVal = gaussianRandom(0, 1) * 35 * grainInt;
          break;
        case 'perlin': {
          const nx = (x / grainScale) * 0.05;
          const ny = (y / grainScale) * 0.05;
          noiseVal = simplex2D(nx, ny) * 50 * grainInt;
          break;
        }
        case 'blue': {
          // Spatial high-frequency blue noise dithering
          const bNoise = (spatialDitherValue(x * 2, y * 2) - 0.5) * 55 * grainInt;
          noiseVal = bNoise;
          break;
        }
        case 'monochromatic':
        default:
          noiseVal = (Math.random() - 0.5) * 60 * grainInt;
          break;
      }

      if (textureFactor !== 0) {
        noiseVal *= 1 + textureFactor * 0.8;
      }

      // Blend grain with pixel using full Photoshop Blend Modes
      const bm: GrainBlendMode = noise.blendMode || 'overlay';
      switch (bm) {
        case 'normal':
          r += noiseVal;
          g += noiseVal;
          b += noiseVal;
          break;
        case 'soft-light':
          r += (noiseVal * r) / 255;
          g += (noiseVal * g) / 255;
          b += (noiseVal * b) / 255;
          break;
        case 'hard-light':
          r = r > 128 ? r + noiseVal * 1.5 : r - noiseVal * 1.5;
          g = g > 128 ? g + noiseVal * 1.5 : g - noiseVal * 1.5;
          b = b > 128 ? b + noiseVal * 1.5 : b - noiseVal * 1.5;
          break;
        case 'multiply':
          r *= 1 + noiseVal / 255;
          g *= 1 + noiseVal / 255;
          b *= 1 + noiseVal / 255;
          break;
        case 'screen':
          r = 255 - (255 - r) * (1 - noiseVal / 255);
          g = 255 - (255 - g) * (1 - noiseVal / 255);
          b = 255 - (255 - b) * (1 - noiseVal / 255);
          break;
        case 'color-dodge':
          r = Math.min(255, r + noiseVal * 1.8);
          g = Math.min(255, g + noiseVal * 1.8);
          b = Math.min(255, b + noiseVal * 1.8);
          break;
        case 'linear-burn':
          r = Math.max(0, r - noiseVal * 1.8);
          g = Math.max(0, g - noiseVal * 1.8);
          b = Math.max(0, b - noiseVal * 1.8);
          break;
        case 'overlay':
        default:
          r += noiseVal;
          g += noiseVal;
          b += noiseVal;
          break;
      }
    }

    // 7. Vibrance & Saturation
    if (saturationFactor !== 1 || vibranceFactor !== 0) {
      const maxC = Math.max(r, g, b);
      const avgC = (r + g + b) / 3;
      const amtS = saturationFactor + vibranceFactor * (1 - (maxC - avgC) / 255);

      r = avgC + (r - avgC) * amtS;
      g = avgC + (g - avgC) * amtS;
      b = avgC + (b - avgC) * amtS;
    }

    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }
}

function applyVignetteOverlay(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  w: number,
  h: number,
  raw: CameraRawConfig
): void {
  const cx = w / 2;
  const cy = h / 2;
  const maxRadius = Math.hypot(cx, cy) * (raw.vignetteRoundness / 100 || 0.8);
  const innerRadius = maxRadius * (1 - raw.vignetteFeather / 100);

  const grad = ctx.createRadialGradient(cx, cy, Math.max(0, innerRadius), cx, cy, maxRadius);
  const opacity = (raw.vignetteAmount / 100) * 0.85;
  grad.addColorStop(0, `rgba(0, 0, 0, 0)`);
  grad.addColorStop(1, `rgba(0, 0, 0, ${opacity})`);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}
