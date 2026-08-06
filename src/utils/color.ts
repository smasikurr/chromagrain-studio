import { PaletteMode, ColorNode } from '../types';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export function hexToRgb(hex: string): RGB {
  let cleaned = hex.replace('#', '');
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleaned, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const clamp = Math.max(0, Math.min(255, Math.round(n)));
    return clamp.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  h = (h % 360 + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

export function hslToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

// Color distance (CIE76 / Euclidian RGB)
export function colorDistance(hex1: string, hex2: string): number {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

// Check if set of colors is distinct from previously generated color sets
export function isPaletteUnique(newColors: string[], existingPalettes: string[][], threshold = 40): boolean {
  for (const palette of existingPalettes) {
    if (palette.length !== newColors.length) continue;
    let totalDiff = 0;
    for (let i = 0; i < newColors.length; i++) {
      totalDiff += colorDistance(newColors[i], palette[i] || '#000000');
    }
    const avgDiff = totalDiff / newColors.length;
    if (avgDiff < threshold) return false;
  }
  return true;
}

// Golden Ratio & Rule of Thirds Aesthetic Focal Coordinates
export const GOLDEN_FOCAL_POINTS = [
  { x: 0.382, y: 0.382 }, // Golden Top-Left
  { x: 0.618, y: 0.382 }, // Golden Top-Right
  { x: 0.382, y: 0.618 }, // Golden Bottom-Left
  { x: 0.618, y: 0.618 }, // Golden Bottom-Right
  { x: 0.333, y: 0.333 }, // Thirds Top-Left
  { x: 0.666, y: 0.333 }, // Thirds Top-Right
  { x: 0.333, y: 0.666 }, // Thirds Bottom-Left
  { x: 0.666, y: 0.666 }, // Thirds Bottom-Right
  { x: 0.5, y: 0.382 },   // Upper Golden Center
  { x: 0.5, y: 0.618 },   // Lower Golden Center
  { x: 0.382, y: 0.5 },   // Left Golden Center
  { x: 0.618, y: 0.5 }    // Right Golden Center
];

// Relative Luminance for WCAG Contrast Calculation
export function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Calculate WCAG Contrast Ratio between 2 hex colors
export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const max = Math.max(l1, l2);
  const min = Math.min(l1, l2);
  return (max + 0.05) / (min + 0.05);
}

// Evaluate Aesthetic Quality Score (0 - 100)
export function calculateAestheticScore(colors: ColorNode[]): number {
  if (!colors || colors.length === 0) return 0;
  const hexes = colors.map(c => c.color);

  // 1. Dynamic Contrast Ratio (0 to 40 pts)
  let maxContrast = 1;
  for (let i = 0; i < hexes.length; i++) {
    for (let j = i + 1; j < hexes.length; j++) {
      const cr = getContrastRatio(hexes[i], hexes[j]);
      if (cr > maxContrast) maxContrast = cr;
    }
  }
  const contrastScore = Math.min(40, (maxContrast / 7.0) * 40);

  // 2. Saturation & Vibrance Balance (0 to 30 pts)
  let totalSat = 0;
  let totalLum = 0;
  hexes.forEach(hex => {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    totalSat += hsl.s;
    totalLum += hsl.l;
  });
  const avgSat = totalSat / hexes.length;
  const avgLum = totalLum / hexes.length;

  // Reward non-muddy saturation (30-85%) and good lightness balance
  const satScore = avgSat < 20 ? (avgSat / 20) * 15 : Math.min(30, 15 + ((avgSat - 20) / 60) * 15);
  const lumPenalty = (avgLum < 10 || avgLum > 90) ? 10 : 0;

  // 3. Color Variance & Hue Diversity (0 to 30 pts)
  let totalDist = 0;
  let pairs = 0;
  for (let i = 0; i < hexes.length; i++) {
    for (let j = i + 1; j < hexes.length; j++) {
      totalDist += colorDistance(hexes[i], hexes[j]);
      pairs++;
    }
  }
  const avgDist = pairs > 0 ? totalDist / pairs : 0;
  const varianceScore = Math.min(30, (avgDist / 200.0) * 30);

  const finalScore = Math.max(0, Math.min(100, contrastScore + satScore + varianceScore - lumPenalty));
  return Math.round(finalScore);
}

// Generate Palette based on mode, enforcing 60-30-10 Rule & Golden Ratio Coordinates
export function generatePalette(
  mode: PaletteMode,
  count: number,
  existingNodes: ColorNode[] = []
): ColorNode[] {
  const result: ColorNode[] = [];
  const baseHue = Math.floor(Math.random() * 360);

  for (let i = 0; i < count; i++) {
    const existing = existingNodes[i];
    if (existing && existing.locked) {
      result.push({ ...existing });
      continue;
    }

    let colorHex = '#000000';
    switch (mode) {
      case 'all_random':
      case 'strictly_unique': {
        const h = (baseHue + (i * 360) / count + Math.random() * 30 - 15 + Math.random() * 360) % 360;
        const s = 60 + Math.random() * 40;
        const l = 35 + Math.random() * 45;
        colorHex = hslToHex(h, s, l);
        break;
      }
      case 'vintage_retro': {
        const retroHues = [20, 35, 45, 180, 210, 340, 140];
        const baseH = retroHues[Math.floor(Math.random() * retroHues.length)];
        const h = (baseH + (i * 40) + Math.random() * 25 - 12) % 360;
        const s = 35 + Math.random() * 30; // Muted
        const l = 35 + Math.random() * 30; // Earthy
        colorHex = hslToHex(h, s, l);
        break;
      }
      case 'neon_cyberpunk': {
        const cyberHues = [300, 180, 270, 50, 330, 190];
        const baseH = cyberHues[Math.floor(Math.random() * cyberHues.length)];
        const h = (baseH + (i * 60) + Math.random() * 30 - 15) % 360;
        const s = 85 + Math.random() * 15; // High saturation
        const l = 50 + Math.random() * 20; // Electric glow
        colorHex = hslToHex(h, s, l);
        break;
      }
      case 'pastel_soft': {
        const h = (baseHue + i * 50 + Math.random() * 40) % 360;
        const s = 30 + Math.random() * 25; // Soft low sat
        const l = 72 + Math.random() * 18; // Light soothing
        colorHex = hslToHex(h, s, l);
        break;
      }
      case 'deep_dark': {
        const h = (baseHue + i * 70 + Math.random() * 40) % 360;
        const s = 50 + Math.random() * 40;
        const l = 15 + Math.random() * 23; // Moody rich dark
        colorHex = hslToHex(h, s, l);
        break;
      }
      case 'analogous': {
        const h = (baseHue + i * 25 + Math.random() * 10) % 360;
        const s = 70 + Math.random() * 25;
        const l = 45 + Math.random() * 25;
        colorHex = hslToHex(h, s, l);
        break;
      }
      case 'triadic': {
        const h = (baseHue + i * 120 + Math.random() * 15) % 360;
        const s = 75 + Math.random() * 20;
        const l = 50 + Math.random() * 20;
        colorHex = hslToHex(h, s, l);
        break;
      }
      case 'neon': {
        const h = (baseHue + i * 75 + Math.random() * 30) % 360;
        const s = 85 + Math.random() * 15;
        const l = 55 + Math.random() * 15;
        colorHex = hslToHex(h, s, l);
        break;
      }
      case 'pastel': {
        const h = (baseHue + i * 60 + Math.random() * 20) % 360;
        const s = 40 + Math.random() * 30;
        const l = 75 + Math.random() * 15;
        colorHex = hslToHex(h, s, l);
        break;
      }
      case 'monochromatic': {
        const h = baseHue;
        const s = 50 + Math.random() * 40;
        const l = 20 + (i * 65) / count + Math.random() * 10;
        colorHex = hslToHex(h, s, l);
        break;
      }
      case 'cyberpunk': {
        const cyberHues = [300, 180, 270, 45, 330];
        const h = (cyberHues[i % cyberHues.length] + Math.random() * 20 - 10) % 360;
        const s = 80 + Math.random() * 20;
        const l = 50 + Math.random() * 20;
        colorHex = hslToHex(h, s, l);
        break;
      }
      case 'retro_film': {
        const retroHues = [25, 45, 190, 340, 140];
        const h = (retroHues[i % retroHues.length] + Math.random() * 15) % 360;
        const s = 50 + Math.random() * 30;
        const l = 45 + Math.random() * 30;
        colorHex = hslToHex(h, s, l);
        break;
      }
    }

    // 60-30-10 Rule Weighting & Golden Ratio Placement
    // i = 0: Dominant tone (60% weight, radius ~0.65)
    // i = 1: Secondary transition tone (30% weight, radius ~0.45, Golden Ratio coordinate)
    // i >= 2: Accent focal node (10% total weight, radius ~0.25, Rule of Thirds coordinate, high contrast)
    let radius = 0.45;
    let focalPoint = GOLDEN_FOCAL_POINTS[i % GOLDEN_FOCAL_POINTS.length];

    if (i === 0) {
      radius = 0.65; // 60% area coverage
      focalPoint = { x: 0.5, y: 0.5 };
    } else if (i === 1) {
      radius = 0.45; // 30% area coverage
    } else {
      radius = 0.25; // 10% accent coverage
      // Boost saturation & lightness contrast for accent nodes
      const rgb = hexToRgb(colorHex);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      colorHex = hslToHex(hsl.h, Math.min(100, hsl.s + 20), hsl.l > 50 ? Math.min(95, hsl.l + 15) : Math.max(10, hsl.l - 15));
    }

    let x = focalPoint.x + (Math.random() - 0.5) * 0.1;
    let y = focalPoint.y + (Math.random() - 0.5) * 0.1;
    if (existing) {
      x = existing.position.x;
      y = existing.position.y;
    }

    result.push({
      id: existing?.id || `node-${i}-${Date.now()}`,
      color: colorHex,
      position: { x, y },
      locked: false,
      radius: existing?.radius || radius
    });
  }

  // Auto-Contrast Ratio Verification: Ensure palette isn't muddy
  let maxCR = 1;
  for (let a = 0; a < result.length; a++) {
    for (let b = a + 1; b < result.length; b++) {
      const cr = getContrastRatio(result[a].color, result[b].color);
      if (cr > maxCR) maxCR = cr;
    }
  }

  if (maxCR < 2.0 && result.length >= 2 && !result[result.length - 1].locked) {
    // Punch up contrast on last node
    const lastRgb = hexToRgb(result[result.length - 1].color);
    const lastHsl = rgbToHsl(lastRgb.r, lastRgb.g, lastRgb.b);
    result[result.length - 1].color = hslToHex((lastHsl.h + 180) % 360, 90, 80);
  }

  return result;
}

// Calculate visual similarity between two BatchItems (0% to 100%)
export function calculateVisualSimilarity(item1: { gradient: { colors: ColorNode[]; style: string; angle: number }; noise: { intensity: number; type: string; blendMode: string } }, item2: { gradient: { colors: ColorNode[]; style: string; angle: number }; noise: { intensity: number; type: string; blendMode: string } }): number {
  // 1. Color Palette Similarity (0-100)
  const colors1 = item1.gradient.colors.map(c => c.color);
  const colors2 = item2.gradient.colors.map(c => c.color);
  let totalColorDiff = 0;
  const maxLen = Math.max(colors1.length, colors2.length);

  for (let i = 0; i < maxLen; i++) {
    const c1 = colors1[i] || '#000000';
    const c2 = colors2[i] || '#000000';
    totalColorDiff += colorDistance(c1, c2); // max color dist ~ 441
  }
  const avgColorDiff = maxLen > 0 ? totalColorDiff / maxLen : 441;
  const paletteSim = Math.max(0, 100 - (avgColorDiff / 441) * 100);

  // 2. Node Position Similarity (0-100)
  let posDiff = 0;
  for (let i = 0; i < maxLen; i++) {
    const p1 = item1.gradient.colors[i]?.position || { x: 0.5, y: 0.5 };
    const p2 = item2.gradient.colors[i]?.position || { x: 0.5, y: 0.5 };
    posDiff += Math.hypot(p1.x - p2.x, p1.y - p2.y); // max hypot ~ 1.414
  }
  const avgPosDiff = maxLen > 0 ? posDiff / maxLen : 1.414;
  const posSim = Math.max(0, 100 - (avgPosDiff / 1.414) * 100);

  // 3. Style and Noise Mode Match
  const styleMatch = item1.gradient.style === item2.gradient.style ? 100 : 0;
  const noiseTypeMatch = item1.noise.type === item2.noise.type ? 100 : 0;
  const blendModeMatch = item1.noise.blendMode === item2.noise.blendMode ? 100 : 0;
  const noiseIntDiff = Math.abs(item1.noise.intensity - item2.noise.intensity);
  const noiseSim = Math.max(0, 100 - noiseIntDiff);

  // Weighted Total Similarity Score
  const totalSimilarity =
    paletteSim * 0.45 +
    posSim * 0.15 +
    styleMatch * 0.15 +
    noiseTypeMatch * 0.10 +
    blendModeMatch * 0.05 +
    noiseSim * 0.10;

  return totalSimilarity;
}

// Check if new item is at least 70% unique (similarity <= 30%) relative to existing batch
export function isBatchItem70PercentUnique<
  T extends {
    gradient: { colors: ColorNode[]; style: string; angle: number };
    noise: { intensity: number; type: string; blendMode: string };
  }
>(newItem: T, existingBatch: T[], maxSimilarityPercent = 30): boolean {
  for (const existing of existingBatch) {
    const sim = calculateVisualSimilarity(newItem, existing);
    if (sim > maxSimilarityPercent) {
      return false; // Violates >70% uniqueness rule (too similar)
    }
  }
  return true;
}

// Check if a generated palette has at least 3 colors distinct (minimum 60% HSL variation) from an existing palette
export function hasAtLeast3DistinctColors(newColors: ColorNode[], existingColors: ColorNode[]): boolean {
  let distinctCount = 0;
  for (let i = 0; i < newColors.length; i++) {
    const c1 = hexToRgb(newColors[i].color);
    const hsl1 = rgbToHsl(c1.r, c1.g, c1.b);
    let minDiff = 100;

    for (let j = 0; j < existingColors.length; j++) {
      const c2 = hexToRgb(existingColors[j].color);
      const hsl2 = rgbToHsl(c2.r, c2.g, c2.b);
      const hDiff = Math.min(Math.abs(hsl1.h - hsl2.h), 360 - Math.abs(hsl1.h - hsl2.h)) / 180;
      const sDiff = Math.abs(hsl1.s - hsl2.s) / 100;
      const lDiff = Math.abs(hsl1.l - hsl2.l) / 100;
      const dist = Math.hypot(hDiff, sDiff, lDiff);
      if (dist < minDiff) minDiff = dist;
    }

    if (minDiff >= 0.25) {
      distinctCount++;
    }
  }
  return distinctCount >= Math.min(3, newColors.length);
}

// Color Name Taxonomy for Microstock Keyword Generation
export function getPrimaryColorNames(colors: string[]): { name: string; hex: string }[] {
  return colors.map(hex => {
    const { r, g, b } = hexToRgb(hex);
    const { h, s, l } = rgbToHsl(r, g, b);
    let name = 'Multicolor';

    if (l < 15) name = 'Dark Black';
    else if (l > 85 && s < 20) name = 'Pastel White';
    else if (s < 15) name = 'Monochrome Gray';
    else if (h >= 345 || h < 15) name = l > 65 ? 'Coral Pink' : 'Crimson Red';
    else if (h >= 15 && h < 45) name = 'Amber Orange';
    else if (h >= 45 && h < 70) name = 'Golden Yellow';
    else if (h >= 70 && h < 165) name = 'Emerald Green';
    else if (h >= 165 && h < 260) name = 'Cyan Blue';
    else if (h >= 260 && h < 315) name = 'Electric Violet';
    else if (h >= 315 && h < 345) name = 'Magenta Pink';

    return { name, hex };
  });
}
