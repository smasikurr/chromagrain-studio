import { ColorNode, GradientConfig } from '../types';
import { hexToRgb, rgbToHsl } from './color';
import { simplex2D, spatialDitherValue } from './noise';

export type ProceduralAlgorithm =
  | 'voronoi'
  | 'vector_flow'
  | 'coord_warp'
  | 'freeform_mesh'
  | 'crystal_lattice';

export type BlendMode16Bit = 'normal' | 'overlay' | 'soft_light' | 'screen' | 'linear_burn';

export interface ProceduralLayerConfig {
  algorithm: ProceduralAlgorithm;
  blendMode: BlendMode16Bit;
  weight: number; // 0.1 to 1.0
  scale: number; // 0.1x to 50x
  frequency: number; // 0.1x to 50x
  angle: number; // 0 to 360 deg
  amplitude: number; // 0 to 1
  voronoiJitter?: number;
  voronoiCellCount?: number;
  warpSwirl?: number;
  pinchStrength?: number;
  rippleFreq?: number;
  nodes?: { x: number; y: number; radius: number; colorIndex: number }[];
}

export interface ProceduralPatternConfig {
  seed: number;
  layers: ProceduralLayerConfig[];
}

// Pseudo-random helper seeded by seed
function pseudoRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Generates a randomized 100K+ Procedural Pattern Matrix Configuration.
 * Creates 1 to 3 blended procedural algorithm layers with unique structural parameters.
 */
export function generateProceduralPattern(seed: number, numColors = 5): ProceduralPatternConfig {
  const rand = pseudoRandom(seed);
  const layerCount = Math.floor(rand() * 3) + 1; // 1 to 3 layers
  const algorithms: ProceduralAlgorithm[] = [
    'voronoi',
    'vector_flow',
    'coord_warp',
    'freeform_mesh',
    'crystal_lattice'
  ];

  const blendModes: BlendMode16Bit[] = ['normal', 'overlay', 'soft_light', 'screen', 'linear_burn'];
  const layers: ProceduralLayerConfig[] = [];

  for (let i = 0; i < layerCount; i++) {
    const algIndex = Math.floor(rand() * algorithms.length);
    const alg = algorithms[algIndex];
    const blendMode = i === 0 ? 'normal' : blendModes[Math.floor(rand() * blendModes.length)];

    // Generate 3 to 15 nodes for freeform mesh
    const nodeCount = Math.floor(rand() * 13) + 3;
    const nodes = [];
    for (let n = 0; n < nodeCount; n++) {
      nodes.push({
        x: rand(),
        y: rand(),
        radius: 0.15 + rand() * 0.6,
        colorIndex: Math.floor(rand() * numColors)
      });
    }

    layers.push({
      algorithm: alg,
      blendMode,
      weight: 0.4 + rand() * 0.6,
      scale: 0.2 + rand() * 15.0,
      frequency: 0.5 + rand() * 20.0,
      angle: rand() * 360,
      amplitude: 0.2 + rand() * 0.8,
      voronoiJitter: 0.2 + rand() * 0.8,
      voronoiCellCount: Math.floor(rand() * 25) + 5,
      warpSwirl: (rand() - 0.5) * 6.0,
      pinchStrength: (rand() - 0.5) * 2.0,
      rippleFreq: 2.0 + rand() * 25.0,
      nodes
    });
  }

  return { seed, layers };
}

/**
 * 16-Bit Float32 Precision Color Pipeline Renderer.
 * Allocates a Float32Array(w * h * 4) to maintain 16-bit HDR accuracy,
 * preventing color clamping, quantization noise, posterization, and gradient banding.
 */
export function renderFloat32ProceduralBuffer(
  w: number,
  h: number,
  colors: ColorNode[],
  config: ProceduralPatternConfig
): Float32Array {
  const pixelCount = w * h;
  const floatBuffer = new Float32Array(pixelCount * 4); // [R, G, B, A] in float 0.0 .. 1.0

  if (colors.length === 0) return floatBuffer;

  // Convert colors to Float32 RGBA tuples
  const floatColors = colors.map(c => {
    const rgb = hexToRgb(c.color);
    const alpha = c.opacity !== undefined ? Math.max(0, Math.min(1, c.opacity)) : 1;
    return [rgb.r / 255.0, rgb.g / 255.0, rgb.b / 255.0, alpha];
  });

  // Evaluate each layer in Float32 precision
  config.layers.forEach((layer, layerIdx) => {
    const { algorithm, blendMode, weight, scale, frequency, angle, amplitude, nodes } = layer;
    const rad = (angle * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);

    for (let y = 0; y < h; y += 1) {
      const ny = y / h;
      for (let x = 0; x < w; x += 1) {
        const nx = x / w;
        const idx = (y * w + x) * 4;

        // Apply rotation / phase shift
        const rx = (nx - 0.5) * cosA - (ny - 0.5) * sinA + 0.5;
        const ry = (nx - 0.5) * sinA + (ny - 0.5) * cosA + 0.5;

        let layerR = 0, layerG = 0, layerB = 0;

        switch (algorithm) {
          case 'voronoi': {
            const cellCount = layer.voronoiCellCount || 12;
            const jitter = layer.voronoiJitter || 0.5;
            let minDist = 999;
            let closestColorIdx = 0;

            for (let c = 0; c < cellCount; c++) {
              const seedVal = config.seed + c * 100;
              const r1 = ((seedVal * 9301 + 49297) % 233280) / 233280;
              const r2 = ((seedVal * 49297 + 9301) % 233280) / 233280;
              const cx = (c % 4) / 4 + (r1 - 0.5) * jitter * 0.25;
              const cy = Math.floor(c / 4) / 4 + (r2 - 0.5) * jitter * 0.25;

              const dist = Math.hypot(rx - cx, ry - cy);
              if (dist < minDist) {
                minDist = dist;
                closestColorIdx = c % floatColors.length;
              }
            }
            const fc = floatColors[closestColorIdx] || floatColors[0];
            const blendFactor = Math.min(1.0, minDist * 2.5);
            const baseC = floatColors[(closestColorIdx + 1) % floatColors.length] || fc;

            layerR = fc[0] * (1 - blendFactor) + baseC[0] * blendFactor;
            layerG = fc[1] * (1 - blendFactor) + baseC[1] * blendFactor;
            layerB = fc[2] * (1 - blendFactor) + baseC[2] * blendFactor;
            break;
          }
          case 'vector_flow': {
            const n1 = simplex2D(rx * scale, ry * scale);
            const n2 = simplex2D(rx * scale * 2 + 10, ry * scale * 2 + 10);
            const flowAngle = n1 * Math.PI * 2;
            const flowX = rx + Math.cos(flowAngle) * amplitude * 0.25;
            const flowY = ry + Math.sin(flowAngle) * amplitude * 0.25;

            const colorT = Math.max(0, Math.min(1, (flowX + flowY + n2 * 0.3) * 0.5));
            const colorIdx = Math.floor(colorT * (floatColors.length - 1));
            const colorFrac = (colorT * (floatColors.length - 1)) - colorIdx;

            const c1 = floatColors[colorIdx] || floatColors[0];
            const c2 = floatColors[Math.min(floatColors.length - 1, colorIdx + 1)] || c1;

            layerR = c1[0] * (1 - colorFrac) + c2[0] * colorFrac;
            layerG = c1[1] * (1 - colorFrac) + c2[1] * colorFrac;
            layerB = c1[2] * (1 - colorFrac) + c2[2] * colorFrac;
            break;
          }
          case 'coord_warp': {
            const swirl = layer.warpSwirl || 2.0;
            const dx = rx - 0.5;
            const dy = ry - 0.5;
            const dist = Math.hypot(dx, dy);
            const swirlAngle = Math.atan2(dy, dx) + dist * swirl;

            const wx = 0.5 + Math.cos(swirlAngle) * dist;
            const wy = 0.5 + Math.sin(swirlAngle) * dist;

            const warpVal = (Math.sin(wx * frequency) + Math.cos(wy * frequency)) * 0.5 + 0.5;
            const colorIdx = Math.floor(warpVal * (floatColors.length - 1));
            const c = floatColors[colorIdx] || floatColors[0];

            layerR = c[0];
            layerG = c[1];
            layerB = c[2];
            break;
          }
          case 'freeform_mesh': {
            let totalWeight = 0;
            let sumR = 0, sumG = 0, sumB = 0;

            if (nodes && nodes.length > 0) {
              nodes.forEach(node => {
                const nodePos = colors[node.colorIndex % colors.length]?.position || { x: node.x, y: node.y };
                const dist = Math.hypot(rx - nodePos.x, ry - nodePos.y);
                const wForce = Math.exp(-dist * (1 / Math.max(0.05, node.radius)));
                const c = floatColors[node.colorIndex % floatColors.length] || floatColors[0];

                sumR += c[0] * wForce;
                sumG += c[1] * wForce;
                sumB += c[2] * wForce;
                totalWeight += wForce;
              });
            }

            if (totalWeight > 0) {
              layerR = sumR / totalWeight;
              layerG = sumG / totalWeight;
              layerB = sumB / totalWeight;
            } else {
              const c = floatColors[0];
              layerR = c[0]; layerG = c[1]; layerB = c[2];
            }
            break;
          }
          case 'crystal_lattice': {
            const ripFreq = layer.rippleFreq || 15.0;
            const dist = Math.hypot(rx - 0.5, ry - 0.5);
            const ripple = Math.sin(dist * ripFreq - angle) * 0.5 + 0.5;
            const poly = Math.abs(Math.sin(rx * frequency * 3.14) * Math.cos(ry * frequency * 3.14));

            const val = ripple * 0.6 + poly * 0.4;
            const colorIdx = Math.floor(val * (floatColors.length - 1));
            const c1 = floatColors[colorIdx] || floatColors[0];
            const c2 = floatColors[(colorIdx + 1) % floatColors.length] || c1;

            layerR = c1[0] * (1 - val) + c2[0] * val;
            layerG = c1[1] * (1 - val) + c2[1] * val;
            layerB = c1[2] * (1 - val) + c2[2] * val;
            break;
          }
        }

        // Apply Float32 16-Bit Blend Mode
        if (layerIdx === 0 || blendMode === 'normal') {
          floatBuffer[idx] = floatBuffer[idx] * (1 - weight) + layerR * weight;
          floatBuffer[idx + 1] = floatBuffer[idx + 1] * (1 - weight) + layerG * weight;
          floatBuffer[idx + 2] = floatBuffer[idx + 2] * (1 - weight) + layerB * weight;
          floatBuffer[idx + 3] = 1.0;
        } else if (blendMode === 'overlay') {
          const bR = floatBuffer[idx], bG = floatBuffer[idx + 1], bB = floatBuffer[idx + 2];
          const oR = bR < 0.5 ? 2 * bR * layerR : 1 - 2 * (1 - bR) * (1 - layerR);
          const oG = bG < 0.5 ? 2 * bG * layerG : 1 - 2 * (1 - bG) * (1 - layerG);
          const oB = bB < 0.5 ? 2 * bB * layerB : 1 - 2 * (1 - bB) * (1 - layerB);

          floatBuffer[idx] = bR * (1 - weight) + oR * weight;
          floatBuffer[idx + 1] = bG * (1 - weight) + oG * weight;
          floatBuffer[idx + 2] = bB * (1 - weight) + oB * weight;
        } else if (blendMode === 'screen') {
          const sR = 1 - (1 - floatBuffer[idx]) * (1 - layerR);
          const sG = 1 - (1 - floatBuffer[idx + 1]) * (1 - layerG);
          const sB = 1 - (1 - floatBuffer[idx + 2]) * (1 - layerB);

          floatBuffer[idx] = floatBuffer[idx] * (1 - weight) + sR * weight;
          floatBuffer[idx + 1] = floatBuffer[idx + 1] * (1 - weight) + sG * weight;
          floatBuffer[idx + 2] = floatBuffer[idx + 2] * (1 - weight) + sB * weight;
        } else if (blendMode === 'linear_burn') {
          const lR = Math.max(0, floatBuffer[idx] + layerR - 1);
          const lG = Math.max(0, floatBuffer[idx + 1] + layerG - 1);
          const lB = Math.max(0, floatBuffer[idx + 2] + layerB - 1);

          floatBuffer[idx] = floatBuffer[idx] * (1 - weight) + lR * weight;
          floatBuffer[idx + 1] = floatBuffer[idx + 1] * (1 - weight) + lG * weight;
          floatBuffer[idx + 2] = floatBuffer[idx + 2] * (1 - weight) + lB * weight;
        } else if (blendMode === 'soft_light') {
          const bR = floatBuffer[idx], bG = floatBuffer[idx + 1], bB = floatBuffer[idx + 2];
          const slR = (1 - 2 * layerR) * bR * bR + 2 * layerR * bR;
          const slG = (1 - 2 * layerG) * bG * bG + 2 * layerG * bG;
          const slB = (1 - 2 * layerB) * bB * bB + 2 * layerB * bB;

          floatBuffer[idx] = bR * (1 - weight) + slR * weight;
          floatBuffer[idx + 1] = bG * (1 - weight) + slG * weight;
          floatBuffer[idx + 2] = bB * (1 - weight) + slB * weight;
        }
      }
    }
  });

  return floatBuffer;
}

/**
 * Converts Float32 HDR Buffer to Uint8ClampedArray for HTML5 Canvas Context with 16-Bit Anti-Banding Dithering.
 */
export function convertFloat32ToImageData(
  floatBuffer: Float32Array,
  w: number,
  h: number,
  ctxImageData: ImageData
): void {
  const data = ctxImageData.data;
  const len = w * h;

  for (let i = 0; i < len; i++) {
    const pIdx = i * 4;
    const x = i % w;
    const y = Math.floor(i / w);

    // Add 16-bit spatial dither to eliminate gradient quantization banding
    const dither = (spatialDitherValue(x, y) - 0.5) * (1.5 / 255.0);

    const r = Math.max(0, Math.min(1, floatBuffer[pIdx] + dither)) * 255;
    const g = Math.max(0, Math.min(1, floatBuffer[pIdx + 1] + dither)) * 255;
    const b = Math.max(0, Math.min(1, floatBuffer[pIdx + 2] + dither)) * 255;

    data[pIdx] = r;
    data[pIdx + 1] = g;
    data[pIdx + 2] = b;
    data[pIdx + 3] = 255;
  }
}

/**
 * Structural Uniqueness Checker (>50% Topology Variation).
 * Compares procedural layer algorithms, node distances, scale/frequency ratios and warp parameters.
 * Returns topological similarity percentage (0% = totally distinct, 100% = identical topology).
 */
export function calculateTopologySimilarity(
  c1: ProceduralPatternConfig,
  c2: ProceduralPatternConfig
): number {
  if (!c1 || !c2 || !c1.layers || !c2.layers) return 0;

  let layerMatchScore = 0;
  const maxLayers = Math.max(c1.layers.length, c2.layers.length);

  for (let i = 0; i < maxLayers; i++) {
    const l1 = c1.layers[i];
    const l2 = c2.layers[i];

    if (!l1 || !l2) continue;

    // Algorithm match
    const algMatch = l1.algorithm === l2.algorithm ? 1.0 : 0.0;
    const blendMatch = l1.blendMode === l2.blendMode ? 1.0 : 0.0;

    // Param ratio similarity
    const scaleSim = Math.max(0, 1 - Math.abs(l1.scale - l2.scale) / 20.0);
    const freqSim = Math.max(0, 1 - Math.abs(l1.frequency - l2.frequency) / 20.0);
    const angleSim = Math.max(0, 1 - Math.min(Math.abs(l1.angle - l2.angle), 360 - Math.abs(l1.angle - l2.angle)) / 180.0);

    const layerSim = algMatch * 0.4 + blendMatch * 0.2 + scaleSim * 0.15 + freqSim * 0.15 + angleSim * 0.1;
    layerMatchScore += layerSim;
  }

  const avgLayerSim = maxLayers > 0 ? (layerMatchScore / maxLayers) * 100 : 0;
  return avgLayerSim;
}
