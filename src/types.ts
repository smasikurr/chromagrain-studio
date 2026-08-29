export type GradientStyle =
  | 'mesh'
  | 'blob'
  | 'radial'
  | 'linear'
  | 'conic'
  | 'aurora'
  | 'fluid'
  | 'spiral'
  | 'glass_wave'
  | 'prism'
  | 'diamond'
  | 'angular'
  | 'freeform';

export type NoiseType = 'gaussian' | 'perlin' | 'monochromatic' | 'blue';

export type PaletteMode =
  | 'all_random'
  | 'vintage_retro'
  | 'neon_cyberpunk'
  | 'pastel_soft'
  | 'deep_dark'
  | 'strictly_unique'
  | 'analogous'
  | 'triadic'
  | 'neon'
  | 'pastel'
  | 'monochromatic'
  | 'cyberpunk'
  | 'retro_film';

export type ResolutionPreset = '1080p' | '2k' | '4k' | '8k' | 'custom';

export type AspectRatio =
  | '16:9'
  | '1:1'
  | '9:16'
  | '4:5'
  | '21:9'
  | '32:9'
  | '18:9'
  | '4:3'
  | '5:4'
  | '3:2'
  | '2:1'
  | '2:3'
  | '16:10'
  | '3:4'
  | 'all_mix';

export type GrainBlendMode =
  | 'normal'
  | 'overlay'
  | 'soft-light'
  | 'hard-light'
  | 'multiply'
  | 'screen'
  | 'color-dodge'
  | 'linear-burn';

export interface ColorNode {
  id: string;
  color: string;
  opacity?: number; // 0 to 1, default 1
  position: { x: number; y: number }; // 0-1 percentage
  locked: boolean;
  radius?: number; // for blob/radial
}

export interface VolumetricLightingConfig {
  enabled: boolean;
  intensity: number; // 0 to 100%
  angle: number; // 0 to 360 deg
  ambientOcclusion: number; // 0 to 100%
  rimLighting: number; // 0 to 100%
  depthScale: number; // 0 to 100%
}

export interface BlurConfig {
  enabled: boolean;
  gaussianRadius: number; // 0 to 200px
  motionAngle: number; // 0 to 360 deg
  motionDistance: number; // 0 to 100px
  radialMode: 'spin' | 'zoom';
  radialAmount: number; // 0 to 100
  radialCenterX: number; // 0-1 percentage
  radialCenterY: number; // 0-1 percentage
  surfaceRadius: number; // 0 to 50px
  surfaceThreshold: number; // 0 to 255
}

export interface HalftoneConfig {
  enabled: boolean;
  pattern: 'dot' | 'line' | 'circle' | 'ellipse' | 'cross' | 'diamond';
  size: number;
  maxRadius?: number; // 4 to 250px (Illustrator Max Radius)
  channel1Angle?: number; // Cyan angle (default 108)
  channel2Angle?: number; // Magenta angle (default 162)
  channel3Angle?: number; // Yellow angle (default 90)
  channel4Angle?: number; // Black/Key angle (default 45)
  preset?: 'custom' | 'cmyk_offset' | 'vintage_comic' | 'newspaper' | 'pop_art';
  contrast: number;
  angle: number;
  opacity: number;
  blendMode: GrainBlendMode;
  foreColor?: string;
  backColor?: string;
  transparentBackground?: boolean; // When true: Background is 100% transparent PNG with alpha=0
  colorMode?: 'cmyk' | 'source_gradient' | 'monochrome';
  dotInvert?: boolean;
}

export interface GrungyTextureConfig {
  enabled: boolean;
  textureType: 'scratches' | 'vintage_paper' | 'film_spots' | 'distressed';
  intensity: number; // 0-100
  scale: number; // 0.5-3x
  contrast: number; // 0-100
  invert: boolean;
  opacity: number; // 0-100
}

export interface FilterGalleryConfig {
  glassRipple: { enabled: boolean; distortion: number; smoothness: number };
  plasticWrap: { enabled: boolean; shine: number; detail: number; depth: number };
  halftone: HalftoneConfig;
  mosaicStainedGlass: { enabled: boolean; cellSize: number; borderWidth: number; lightIntensity: number };
  roughTexture: {
    enabled: boolean;
    graininess: number;
    contrast: number;
    highlightIntensity: number;
    textureType?: 'paper' | 'linen' | 'canvas' | 'rough' | 'marble';
  };
  grungyTexture?: GrungyTextureConfig;
  volumetricLighting?: VolumetricLightingConfig;
}

export interface GradientConfig {
  style: GradientStyle;
  colors: ColorNode[];
  blurRadius: number; // 0 to 100px
  angle: number; // 0 to 360 deg for linear/conic
  flowSpeed: number; // for animated/mesh variation
  seed: number;
  seedCode?: string; // Alphanumeric Seed Code e.g. "SEED-9A4F72B"
  proceduralConfig?: any;
  proceduralEnabled?: boolean; // Master Toggle for Procedural Pattern Layer
}

export interface NoiseConfig {
  enabled: boolean;
  type: NoiseType;
  intensity: number; // 0 to 100%
  scale: number; // 0.5x to 4x
  opacity: number; // 0 to 100%
  blendMode: GrainBlendMode;
  antiBandingDither: boolean; // Anti-Banding Dithering Engine
}

export interface CameraRawConfig {
  exposure: number; // -100 to 100
  contrast: number; // -100 to 100
  highlights: number; // -100 to 100
  shadows: number; // -100 to 100
  clarity: number; // -100 to 100 (mid-tone micro-contrast)
  texture: number; // -100 to 100 (high-frequency detail)
  vibrance: number; // -100 to 100
  saturation: number; // -100 to 100
  vignetteAmount: number; // 0 to 100
  vignetteFeather: number; // 0 to 100
  vignetteRoundness: number; // 0 to 100
}

export interface ColorRulesConfig {
  paletteMode: PaletteMode;
  allowColorReuse: boolean;
  enforceUniqueStyles: boolean;
  contrastThreshold: number; // 0-100
}

export interface BatchSettings {
  count: number; // 1 to 500+
  resolution: ResolutionPreset;
  customWidth: number;
  customHeight: number;
  aspectRatio: AspectRatio;
}

export interface ItemMetadata {
  title: string;
  description: string;
  keywords: string[];
  category: string;
  primaryColors: string[];
  mood: string;
}

export interface BatchItem {
  id: string;
  name: string;
  seedCode: string;
  timestamp: number;
  gradient: GradientConfig;
  noise: NoiseConfig;
  cameraRaw: CameraRawConfig;
  blur: BlurConfig;
  filterGallery: FilterGalleryConfig;
  colorRules: ColorRulesConfig;
  metadata: ItemMetadata;
  thumbnailUrl?: string; // Data URL of low-res preview
  favorite: boolean;
  dimensions: { width: number; height: number };
}

export interface StudioPreset {
  id: string;
  name: string;
  description: string;
  gradient: GradientConfig;
  noise: NoiseConfig;
  cameraRaw: CameraRawConfig;
  blur: BlurConfig;
  filterGallery: FilterGalleryConfig;
  colorRules: ColorRulesConfig;
  tag: string;
  isCustom?: boolean;
}

