import { StudioPreset, BlurConfig, FilterGalleryConfig } from '../types';

export const DEFAULT_BLUR: BlurConfig = {
  enabled: true,
  gaussianRadius: 0,
  motionAngle: 0,
  motionDistance: 0,
  radialMode: 'spin',
  radialAmount: 0,
  radialCenterX: 0.5,
  radialCenterY: 0.5,
  surfaceRadius: 0,
  surfaceThreshold: 20
};

export const DEFAULT_FILTER_GALLERY: FilterGalleryConfig = {
  glassRipple: { enabled: false, distortion: 30, smoothness: 5 },
  plasticWrap: { enabled: false, shine: 50, detail: 5, depth: 30 },
  halftone: {
    enabled: false,
    pattern: 'dot',
    size: 10,
    maxRadius: 8,
    channel1Angle: 108,
    channel2Angle: 162,
    channel3Angle: 90,
    channel4Angle: 45,
    preset: 'cmyk_offset',
    contrast: 50,
    angle: 45,
    opacity: 100,
    blendMode: 'overlay',
    foreColor: '#ffffff',
    backColor: '#000000'
  },
  mosaicStainedGlass: { enabled: false, cellSize: 15, borderWidth: 2, lightIntensity: 60 },
  roughTexture: { enabled: false, graininess: 25, contrast: 40, highlightIntensity: 50 },
  grungyTexture: {
    enabled: false,
    textureType: 'scratches',
    intensity: 40,
    scale: 1.0,
    contrast: 50,
    invert: false,
    opacity: 80
  },
  volumetricLighting: {
    enabled: false,
    intensity: 60,
    angle: 45,
    ambientOcclusion: 35,
    rimLighting: 40,
    depthScale: 50
  }
};

export const BUILT_IN_PRESETS: StudioPreset[] = [
  {
    id: 'cyberpunk-mesh',
    name: 'Cyberpunk Mesh 8K',
    description: 'Electric violet, neon cyan, and hot magenta fluid mesh with 35mm film grain.',
    tag: 'Cyberpunk',
    gradient: {
      style: 'mesh',
      blurRadius: 15,
      angle: 135,
      flowSpeed: 1.2,
      seed: 101,
      seedCode: 'SEED-CYBERPUNK1',
      colors: [
        { id: '1', color: '#ff007f', position: { x: 0.2, y: 0.3 }, locked: false, radius: 0.5 },
        { id: '2', color: '#00f0ff', position: { x: 0.8, y: 0.2 }, locked: false, radius: 0.45 },
        { id: '3', color: '#7b00ff', position: { x: 0.5, y: 0.8 }, locked: false, radius: 0.55 },
        { id: '4', color: '#ffaa00', position: { x: 0.15, y: 0.75 }, locked: false, radius: 0.4 }
      ]
    },
    noise: {
      enabled: true,
      type: 'monochromatic',
      intensity: 35,
      scale: 1.2,
      opacity: 85,
      blendMode: 'overlay',
      antiBandingDither: true
    },
    cameraRaw: {
      exposure: 5,
      contrast: 20,
      highlights: 15,
      shadows: -10,
      clarity: 25,
      texture: 30,
      vibrance: 25,
      saturation: 15,
      vignetteAmount: 35,
      vignetteFeather: 60,
      vignetteRoundness: 80
    },
    blur: { ...DEFAULT_BLUR },
    filterGallery: { ...DEFAULT_FILTER_GALLERY },
    colorRules: {
      paletteMode: 'cyberpunk',
      allowColorReuse: false,
      enforceUniqueStyles: true,
      contrastThreshold: 45
    }
  },
  {
    id: 'nordic-fog',
    name: 'Nordic Fog Minimal',
    description: 'Subtle slate gray, pale icy blue, and warm ivory with Gaussian micro-grain.',
    tag: 'Minimal',
    gradient: {
      style: 'radial',
      blurRadius: 25,
      angle: 45,
      flowSpeed: 0.8,
      seed: 202,
      seedCode: 'SEED-NORDIC202',
      colors: [
        { id: '1', color: '#e2e8f0', position: { x: 0.5, y: 0.4 }, locked: false },
        { id: '2', color: '#94a3b8', position: { x: 0.2, y: 0.7 }, locked: false },
        { id: '3', color: '#475569', position: { x: 0.85, y: 0.85 }, locked: false },
        { id: '4', color: '#cbd5e1', position: { x: 0.1, y: 0.2 }, locked: false }
      ]
    },
    noise: {
      enabled: true,
      type: 'gaussian',
      intensity: 22,
      scale: 1.0,
      opacity: 70,
      blendMode: 'soft-light',
      antiBandingDither: true
    },
    cameraRaw: {
      exposure: -2,
      contrast: 8,
      highlights: -5,
      shadows: 5,
      clarity: 15,
      texture: 15,
      vibrance: -10,
      saturation: -15,
      vignetteAmount: 15,
      vignetteFeather: 50,
      vignetteRoundness: 90
    },
    blur: { ...DEFAULT_BLUR },
    filterGallery: { ...DEFAULT_FILTER_GALLERY },
    colorRules: {
      paletteMode: 'monochromatic',
      allowColorReuse: false,
      enforceUniqueStyles: false,
      contrastThreshold: 30
    }
  },
  {
    id: 'sunset-grain',
    name: 'Tuscan Sunset Film',
    description: 'Deep crimson, warm amber, coral peach, and twilight indigo with analogue dither.',
    tag: 'Retro Film',
    gradient: {
      style: 'blob',
      blurRadius: 20,
      angle: 90,
      flowSpeed: 1.0,
      seed: 303,
      seedCode: 'SEED-SUNSET303',
      colors: [
        { id: '1', color: '#ff4e50', position: { x: 0.3, y: 0.3 }, locked: false, radius: 0.45 },
        { id: '2', color: '#f9d423', position: { x: 0.7, y: 0.3 }, locked: false, radius: 0.5 },
        { id: '3', color: '#2b1055', position: { x: 0.5, y: 0.85 }, locked: false, radius: 0.6 },
        { id: '4', color: '#75225b', position: { x: 0.1, y: 0.6 }, locked: false, radius: 0.4 }
      ]
    },
    noise: {
      enabled: true,
      type: 'monochromatic',
      intensity: 45,
      scale: 1.5,
      opacity: 90,
      blendMode: 'overlay',
      antiBandingDither: true
    },
    cameraRaw: {
      exposure: 8,
      contrast: 25,
      highlights: 20,
      shadows: -15,
      clarity: 30,
      texture: 35,
      vibrance: 30,
      saturation: 20,
      vignetteAmount: 40,
      vignetteFeather: 70,
      vignetteRoundness: 75
    },
    blur: { ...DEFAULT_BLUR },
    filterGallery: { ...DEFAULT_FILTER_GALLERY },
    colorRules: {
      paletteMode: 'retro_film',
      allowColorReuse: false,
      enforceUniqueStyles: true,
      contrastThreshold: 50
    }
  },
  {
    id: 'acid-techno',
    name: 'Acid Techno 90s',
    description: 'High contrast electric lime, hot violet, and deep cobalt wave.',
    tag: 'Neon',
    gradient: {
      style: 'conic',
      blurRadius: 10,
      angle: 210,
      flowSpeed: 1.5,
      seed: 404,
      seedCode: 'SEED-TECHNO404',
      colors: [
        { id: '1', color: '#39ff14', position: { x: 0.5, y: 0.5 }, locked: false },
        { id: '2', color: '#ff00ff', position: { x: 0.2, y: 0.8 }, locked: false },
        { id: '3', color: '#00ffff', position: { x: 0.8, y: 0.2 }, locked: false },
        { id: '4', color: '#120036', position: { x: 0.1, y: 0.1 }, locked: false }
      ]
    },
    noise: {
      enabled: true,
      type: 'perlin',
      intensity: 50,
      scale: 2.0,
      opacity: 95,
      blendMode: 'overlay',
      antiBandingDither: true
    },
    cameraRaw: {
      exposure: 12,
      contrast: 35,
      highlights: 30,
      shadows: -20,
      clarity: 40,
      texture: 50,
      vibrance: 40,
      saturation: 30,
      vignetteAmount: 50,
      vignetteFeather: 60,
      vignetteRoundness: 70
    },
    blur: { ...DEFAULT_BLUR },
    filterGallery: { ...DEFAULT_FILTER_GALLERY },
    colorRules: {
      paletteMode: 'neon',
      allowColorReuse: false,
      enforceUniqueStyles: true,
      contrastThreshold: 60
    }
  },
  {
    id: 'pastel-dream',
    name: 'Pastel Dream Aura',
    description: 'Soft lavender, mint green, and cloud pink with gentle blue noise.',
    tag: 'Pastel',
    gradient: {
      style: 'mesh',
      blurRadius: 30,
      angle: 60,
      flowSpeed: 0.7,
      seed: 505,
      seedCode: 'SEED-PASTEL505',
      colors: [
        { id: '1', color: '#e0c3fc', position: { x: 0.25, y: 0.25 }, locked: false, radius: 0.5 },
        { id: '2', color: '#8ec5fc', position: { x: 0.75, y: 0.25 }, locked: false, radius: 0.5 },
        { id: '3', color: '#ffb7b2', position: { x: 0.3, y: 0.75 }, locked: false, radius: 0.45 },
        { id: '4', color: '#b5ead7', position: { x: 0.7, y: 0.8 }, locked: false, radius: 0.4 }
      ]
    },
    noise: {
      enabled: true,
      type: 'blue',
      intensity: 18,
      scale: 0.9,
      opacity: 65,
      blendMode: 'soft-light',
      antiBandingDither: true
    },
    cameraRaw: {
      exposure: 5,
      contrast: 5,
      highlights: -10,
      shadows: 10,
      clarity: 10,
      texture: 10,
      vibrance: 10,
      saturation: 5,
      vignetteAmount: 10,
      vignetteFeather: 80,
      vignetteRoundness: 95
    },
    blur: { ...DEFAULT_BLUR },
    filterGallery: { ...DEFAULT_FILTER_GALLERY },
    colorRules: {
      paletteMode: 'pastel',
      allowColorReuse: false,
      enforceUniqueStyles: false,
      contrastThreshold: 20
    }
  }
];
