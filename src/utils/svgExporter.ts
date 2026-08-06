import JSZip from 'jszip';
import { BatchItem, GradientConfig, NoiseConfig, BlurConfig, FilterGalleryConfig, CameraRawConfig } from '../types';
import { hexToRgb } from './color';
import { renderHighResBlob } from './worker';

/**
 * Checks if pixel-dependent features are enabled on an item.
 * Pixel-dependent features include: Grain/Noise, Photoshop Blur Suite,
 * Halftone, Grungy Texture, Volumetric Lighting, Camera Raw FX, or Float32 Procedural Engine.
 */
export function isPixelEffectActive(item: BatchItem): boolean {
  const { noise, blur, filterGallery, cameraRaw, gradient } = item;

  // Grain / Noise
  if (noise && noise.intensity > 0) return true;

  // Blur Suite
  if (blur && blur.enabled !== false) {
    if (
      blur.gaussianRadius > 0 ||
      blur.motionDistance > 0 ||
      blur.radialAmount > 0 ||
      blur.surfaceRadius > 0
    ) {
      return true;
    }
  }

  // Filter Gallery (Halftone, Texture, Glass, Plastic Wrap, Stained Glass, Volumetric Lighting)
  if (filterGallery) {
    if (filterGallery.halftone?.enabled) return true;
    if (filterGallery.grungyTexture?.enabled) return true;
    if (filterGallery.volumetricLighting?.enabled) return true;
    if (filterGallery.glassRipple?.enabled) return true;
    if (filterGallery.plasticWrap?.enabled) return true;
    if (filterGallery.mosaicStainedGlass?.enabled) return true;
    if (filterGallery.roughTexture?.enabled) return true;
  }

  // Camera Raw FX
  if (cameraRaw) {
    if (
      cameraRaw.vignetteAmount > 0 ||
      cameraRaw.clarity !== 0 ||
      cameraRaw.texture !== 0 ||
      cameraRaw.exposure !== 0 ||
      cameraRaw.contrast !== 0
    ) {
      return true;
    }
  }

  // Float32 Procedural Engine
  if (gradient.proceduralEnabled !== false && (gradient.style === 'freeform' || gradient.proceduralConfig)) {
    return true;
  }

  return false;
}

/**
 * Converts a Blob or Canvas to Base64 Data URL
 */
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert Blob to Data URL'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Generates pure native vector SVG elements for base gradient layers and color nodes.
 */
function generateNativeVectorBase(gradient: GradientConfig, width: number, height: number): { defs: string; body: string } {
  const colors = gradient.colors.map(c => c.color);
  const defs: string[] = [];
  const body: string[] = [];

  const style = gradient.style;
  const angle = gradient.angle || 45;

  switch (style) {
    case 'linear': {
      const rad = (angle * Math.PI) / 180;
      const x1 = Math.round(50 - Math.cos(rad) * 50);
      const y1 = Math.round(50 - Math.sin(rad) * 50);
      const x2 = Math.round(50 + Math.cos(rad) * 50);
      const y2 = Math.round(50 + Math.sin(rad) * 50);

      const gradId = 'svg_lin_grad';
      let stops = '';
      colors.forEach((color, i) => {
        const offset = Math.round((i / Math.max(1, colors.length - 1)) * 100);
        stops += `\n    <stop offset="${offset}%" stop-color="${color}" />`;
      });

      defs.push(`<linearGradient id="${gradId}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">${stops}\n  </linearGradient>`);
      body.push(`<rect width="${width}" height="${height}" fill="url(#${gradId})" />`);
      break;
    }

    case 'radial': {
      const gradId = 'svg_rad_grad';
      let stops = '';
      colors.forEach((color, i) => {
        const offset = Math.round((i / Math.max(1, colors.length - 1)) * 100);
        stops += `\n    <stop offset="${offset}%" stop-color="${color}" />`;
      });

      defs.push(`<radialGradient id="${gradId}" cx="50%" cy="50%" r="60%">${stops}\n  </radialGradient>`);
      body.push(`<rect width="${width}" height="${height}" fill="url(#${gradId})" />`);
      break;
    }

    case 'blob': {
      const baseColor = colors[0] || '#0d1117';
      body.push(`<rect width="${width}" height="${height}" fill="${baseColor}" />`);

      gradient.colors.forEach((node, idx) => {
        const cx = Math.round(node.position.x * width);
        const cy = Math.round(node.position.y * height);
        const radius = Math.round((node.radius || 0.4) * Math.max(width, height));
        const rgb = hexToRgb(node.color);

        const gradId = `blob_grad_${idx}`;
        defs.push(`
  <radialGradient id="${gradId}" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="rgb(${rgb.r},${rgb.g},${rgb.b})" stop-opacity="0.95" />
    <stop offset="50%" stop-color="rgb(${rgb.r},${rgb.g},${rgb.b})" stop-opacity="0.5" />
    <stop offset="100%" stop-color="rgb(${rgb.r},${rgb.g},${rgb.b})" stop-opacity="0" />
  </radialGradient>`);

        body.push(`<circle cx="${cx}" cy="${cy}" r="${radius}" fill="url(#${gradId})" />`);
      });
      break;
    }

    case 'fluid': {
      const baseColor = colors[0] || '#0d0d1a';
      body.push(`<rect width="${width}" height="${height}" fill="${baseColor}" />`);

      gradient.colors.forEach((node, idx) => {
        const cx = Math.round(node.position.x * width);
        const cy = Math.round(node.position.y * height);
        const radius = Math.round((node.radius || 0.5) * Math.max(width, height));
        const rgb = hexToRgb(node.color);
        const nodeAngle = angle + idx * 45;

        const gradId = `fluid_grad_${idx}`;
        defs.push(`
  <radialGradient id="${gradId}" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="rgb(${rgb.r},${rgb.g},${rgb.b})" stop-opacity="0.9" />
    <stop offset="60%" stop-color="rgb(${rgb.r},${rgb.g},${rgb.b})" stop-opacity="0.4" />
    <stop offset="100%" stop-color="rgb(${rgb.r},${rgb.g},${rgb.b})" stop-opacity="0" />
  </radialGradient>`);

        body.push(`
  <g transform="translate(${cx}, ${cy}) rotate(${nodeAngle}) scale(1.4, 0.7)">
    <circle cx="0" cy="0" r="${radius}" fill="url(#${gradId})" />
  </g>`);
      });
      break;
    }

    case 'aurora': {
      const baseColor = colors[0] || '#050b14';
      body.push(`<rect width="${width}" height="${height}" fill="${baseColor}" />`);

      gradient.colors.forEach((node, idx) => {
        const rgb = hexToRgb(node.color);
        const yOffset = Math.round(node.position.y * height);

        const gradId = `aurora_grad_${idx}`;
        defs.push(`
  <linearGradient id="${gradId}" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="rgb(${rgb.r},${rgb.g},${rgb.b})" stop-opacity="0" />
    <stop offset="50%" stop-color="rgb(${rgb.r},${rgb.g},${rgb.b})" stop-opacity="0.85" />
    <stop offset="100%" stop-color="rgb(${rgb.r},${rgb.g},${rgb.b})" stop-opacity="0" />
  </linearGradient>`);

        const freq = 0.003 + idx * 0.002;
        const amp = 40 + idx * 25;
        let pathD = `M 0 ${yOffset}`;
        for (let x = 0; x <= width; x += 20) {
          const waveY = Math.round(yOffset + Math.sin(x * freq + angle) * amp);
          pathD += ` L ${x} ${waveY}`;
        }
        pathD += ` L ${width} ${height} L 0 ${height} Z`;

        body.push(`<path d="${pathD}" fill="url(#${gradId})" />`);
      });
      break;
    }

    case 'glass_wave': {
      const baseColor = colors[0] || '#10121a';
      body.push(`<rect width="${width}" height="${height}" fill="${baseColor}" />`);

      gradient.colors.forEach((node, idx) => {
        const rgb = hexToRgb(node.color);
        const yPos = Math.round(node.position.y * height);

        const gradId = `glass_grad_${idx}`;
        defs.push(`
  <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="rgb(${rgb.r},${rgb.g},${rgb.b})" stop-opacity="0.1" />
    <stop offset="50%" stop-color="rgb(${rgb.r},${rgb.g},${rgb.b})" stop-opacity="0.8" />
    <stop offset="100%" stop-color="rgb(${rgb.r},${rgb.g},${rgb.b})" stop-opacity="0.05" />
  </linearGradient>`);

        const c1x = Math.round(width * 0.33);
        const c1y = yPos - 100;
        const c2x = Math.round(width * 0.66);
        const c2y = yPos + 100;
        const pathD = `M 0 ${yPos} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${width} ${yPos} L ${width} ${height} L 0 ${height} Z`;

        body.push(`<path d="${pathD}" fill="url(#${gradId})" />`);
      });
      break;
    }

    case 'prism': {
      const rad = (angle * Math.PI) / 180;
      const x1 = Math.round(50 - Math.cos(rad) * 50);
      const y1 = Math.round(50 - Math.sin(rad) * 50);
      const x2 = Math.round(50 + Math.cos(rad) * 50);
      const y2 = Math.round(50 + Math.sin(rad) * 50);

      const gradId = 'prism_lin_grad';
      let stops = '';
      colors.forEach((color, i) => {
        const offset = Math.round((i / Math.max(1, colors.length - 1)) * 100);
        stops += `\n    <stop offset="${offset}%" stop-color="${color}" />`;
      });

      defs.push(`<linearGradient id="${gradId}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">${stops}\n  </linearGradient>`);
      body.push(`<rect width="${width}" height="${height}" fill="url(#${gradId})" />`);

      // Chromatic Stripes
      const stripeW = Math.round(width / gradient.colors.length);
      gradient.colors.forEach((node, idx) => {
        body.push(`<rect x="${idx * stripeW}" y="0" width="${stripeW}" height="${height}" fill="${node.color}" fill-opacity="0.25" />`);
      });
      break;
    }

    case 'diamond': {
      const baseColor = colors[0] || '#0d1117';
      body.push(`<rect width="${width}" height="${height}" fill="${baseColor}" />`);

      gradient.colors.forEach((node, idx) => {
        const bx = Math.round(node.position.x * width);
        const by = Math.round(node.position.y * height);
        const size = Math.round((node.radius || 0.45) * Math.hypot(width, height));
        const rgb = hexToRgb(node.color);

        const gradId = `diamond_grad_${idx}`;
        defs.push(`
  <radialGradient id="${gradId}" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="rgb(${rgb.r},${rgb.g},${rgb.b})" stop-opacity="0.95" />
    <stop offset="60%" stop-color="rgb(${rgb.r},${rgb.g},${rgb.b})" stop-opacity="0.4" />
    <stop offset="100%" stop-color="rgb(${rgb.r},${rgb.g},${rgb.b})" stop-opacity="0" />
  </radialGradient>`);

        const nodeAngle = angle + idx * 45;
        body.push(`
  <g transform="translate(${bx}, ${by}) rotate(${nodeAngle})">
    <polygon points="0,${-size} ${size},0 0,${size} ${-size},0" fill="url(#${gradId})" />
  </g>`);
      });
      break;
    }

    default: {
      // Fallback Linear/Radial Combination
      const gradId = 'default_vector_grad';
      let stops = '';
      colors.forEach((color, i) => {
        const offset = Math.round((i / Math.max(1, colors.length - 1)) * 100);
        stops += `\n    <stop offset="${offset}%" stop-color="${color}" />`;
      });
      defs.push(`<linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">${stops}\n  </linearGradient>`);
      body.push(`<rect width="${width}" height="${height}" fill="url(#${gradId})" />`);
      break;
    }
  }

  return { defs: defs.join('\n'), body: body.join('\n  ') };
}

/**
 * Builds the complete SVG XML string for a given BatchItem.
 * Uses Hybrid Canvas-to-Vector rendering:
 * - If pixel effects are enabled, embeds a high-resolution Base64 PNG image overlay.
 * - If no pixel effects are active, outputs a 100% pure native mathematical vector SVG.
 */
export async function generateSVGForItem(item: BatchItem): Promise<string> {
  const w = item.dimensions.width;
  const h = item.dimensions.height;

  // 1. Native Vector Base Layer
  const vectorBase = generateNativeVectorBase(item.gradient, w, h);

  // 2. Check if Pixel Effects are Active
  const hasPixelEffects = isPixelEffectActive(item);

  let embeddedPixelLayer = '';

  if (hasPixelEffects) {
    try {
      // Render complete image with pixel effects to PNG Blob
      const blob = await renderHighResBlob(item, w, h, 'image/png', 0.98);
      const dataUrl = await blobToDataURL(blob);

      embeddedPixelLayer = `
  <!-- Smart Pixel-Effect Fallback Layer (Grain, Blur, Halftone, Texture, 3D Light) -->
  <g id="pixel-effect-fidelity-layer">
    <image href="${dataUrl}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" />
  </g>`;
    } catch (err) {
      console.warn('Failed to embed pixel effect canvas in SVG, falling back to pure vector:', err);
    }
  }

  // 3. Assemble Clean Microstock Compliant SVG XML
  const svgXml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- Generated by ChromaGrain Studio Pro 8K - Hybrid Multi-Select SVG Engine -->
<svg
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  version="1.1"
  viewBox="0 0 ${w} ${h}"
  width="${w}"
  height="${h}"
  xml:space="preserve"
>
  <defs>
${vectorBase.defs}
  </defs>

  <!-- Base Vector Layer -->
  <g id="native-vector-base-layer">
    ${vectorBase.body}
  </g>${embeddedPixelLayer}
</svg>`;

  return svgXml;
}

/**
 * Download a single item as an SVG file
 */
export async function downloadSingleSVG(item: BatchItem): Promise<void> {
  const svgContent = await generateSVGForItem(item);
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${item.name.replace(/\s+/g, '_')}_${item.dimensions.width}x${item.dimensions.height}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Batch export multiple BatchItems as a ZIP bundle containing individual SVG files.
 */
export async function exportBatchSVGsToZip(
  items: BatchItem[],
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  if (!items || items.length === 0) return;

  const zip = new JSZip();
  const folder = zip.folder('ChromaGrain_SVG_Vectors');

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (onProgress) onProgress(i + 1, items.length);

    const svgString = await generateSVGForItem(item);
    const filename = `${i + 1}_${item.name.replace(/\s+/g, '_')}_${item.dimensions.width}x${item.dimensions.height}.svg`;

    if (folder) {
      folder.file(filename, svgString);
    } else {
      zip.file(filename, svgString);
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const zipUrl = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = zipUrl;
  link.download = `ChromaGrain_SVG_Batch_${Date.now()}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(zipUrl);
}
