import { BatchItem, ItemMetadata } from '../types';
import { getPrimaryColorNames } from './color';

const MOOD_KEYWORDS: Record<string, string[]> = {
  mesh: ['abstract', 'fluid', 'mesh gradient', 'digital wave', 'modern background', 'liquid color', 'subtle glow'],
  blob: ['organic shapes', 'blob vector', 'soft atmosphere', 'pastel aura', 'floating lights', 'zen background'],
  radial: ['focal aura', 'cosmic radial', 'glowing center', 'luminous sphere', 'gradient burst', 'energy halo'],
  linear: ['smooth transition', 'color flow', 'spectrum stripe', 'minimalist band', 'sleek vector', 'modern banner'],
  conic: ['angular sweep', 'prism rainbow', 'rotational gradient', 'spectrum wheel', 'kaleidoscope noise']
};

const NOISE_KEYWORDS: Record<string, string[]> = {
  monochromatic: ['film grain', 'retro texture', 'vintage paper', 'noise overlay', 'analogue filter', 'grungy', 'raw photography'],
  perlin: ['perlin noise', 'procedural texture', 'marble wave', 'topographic flow', 'organic grain', 'macro detail'],
  gaussian: ['gaussian noise', 'digital grain', 'micro texture', 'dithered gradient', 'pixel noise', 'hi-res background'],
  blue: ['blue noise', 'anti banding', 'smooth dither', 'pristine gradient', 'stock quality', 'microstock wallpaper']
};

const GENERAL_MICROSTOCK_TAGS = [
  'abstract', 'background', 'texture', 'gradient', 'grainy', 'film grain',
  'wallpaper', 'banner', 'backdrop', 'graphic design', 'digital art', 'creative',
  'modern', 'minimalist', 'contemporary', 'vibrant', 'multicolor', 'soft lighting',
  'high resolution', '8k wallpaper', 'stock photo', 'microstock background',
  'copy space', 'clean design', 'web design asset', 'ui background', 'poster background',
  'album cover art', 'social media template', 'aesthetic', 'artistic', 'smooth blur',
  'depth', 'atmospheric', 'gradient mesh', 'noise texture', 'wallpaper 4k'
];

export function generateProceduralMetadata(item: {
  gradient: BatchItem['gradient'];
  noise: BatchItem['noise'];
  cameraRaw: BatchItem['cameraRaw'];
}): ItemMetadata {
  const colors = item.gradient.colors.map(c => c.color);
  const colorInfos = getPrimaryColorNames(colors);
  const colorNames = Array.from(new Set(colorInfos.map(c => c.name)));

  const mainColorStr = colorNames.slice(0, 3).join(', ');
  const styleCap = item.gradient.style.charAt(0).toUpperCase() + item.gradient.style.slice(1);
  const noiseTypeCap = item.noise.type.charAt(0).toUpperCase() + item.noise.type.slice(1);

  const title = `Abstract Grainy ${styleCap} Gradient Background in ${mainColorStr} with ${noiseTypeCap} Noise`;
  const description = `Enterprise-grade 8K high resolution procedural ${item.gradient.style} gradient background featuring ${mainColorStr} colors, fine film grain texture, and anti-banding dithering for microstock commercial use.`;

  // Build 30-50 Microstock Tags
  const tagSet = new Set<string>();

  // 1. Color tags
  colorNames.forEach(name => {
    tagSet.add(name.toLowerCase());
    tagSet.add(`${name.toLowerCase()} background`);
  });

  // 2. Style tags
  const styleTags = MOOD_KEYWORDS[item.gradient.style] || [];
  styleTags.forEach(t => tagSet.add(t));

  // 3. Noise tags
  const noiseTags = NOISE_KEYWORDS[item.noise.type] || [];
  noiseTags.forEach(t => tagSet.add(t));

  // 4. Palette & mood tags
  if (item.noise.intensity > 40) {
    tagSet.add('vintage film');
    tagSet.add('retro grain');
    tagSet.add('grungy texture');
  } else {
    tagSet.add('ultra smooth');
    tagSet.add('soft aura');
    tagSet.add('sleek blur');
  }

  if (item.cameraRaw.exposure > 15) tagSet.add('bright background');
  if (item.cameraRaw.exposure < -15) tagSet.add('dark mood');
  if (item.cameraRaw.vignetteAmount > 20) tagSet.add('vignette frame');

  // 5. General Stock Tags until 40-50 tags are reached
  for (const tag of GENERAL_MICROSTOCK_TAGS) {
    if (tagSet.size >= 45) break;
    tagSet.add(tag);
  }

  const keywords = Array.from(tagSet);

  return {
    title,
    description,
    keywords,
    category: 'Abstract & Backgrounds',
    primaryColors: colorNames,
    mood: `${styleCap} ${noiseTypeCap}`
  };
}

/**
 * Generate Microstock CSV string (Adobe Stock / Freepik format)
 * Columns: Filename, Title, Keywords, Category
 */
export function generateMicrostockCSV(items: BatchItem[]): string {
  const headers = ['Filename', 'Title', 'Keywords', 'Category'];
  const rows = items.map(item => {
    const filename = `${item.name.replace(/\s+/g, '_')}_${item.dimensions.width}x${item.dimensions.height}.jpg`;
    const titleEscaped = `"${item.metadata.title.replace(/"/g, '""')}"`;
    const keywordsEscaped = `"${item.metadata.keywords.join(', ').replace(/"/g, '""')}"`;
    const categoryEscaped = `"${item.metadata.category.replace(/"/g, '""')}"`;

    return [filename, titleEscaped, keywordsEscaped, categoryEscaped].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Export Responsive CSS code with inline SVG noise data URI
 */
export function generateCSSCode(item: BatchItem): string {
  const colors = item.gradient.colors.map(c => c.color);
  let backgroundGradient = '';

  switch (item.gradient.style) {
    case 'linear':
      backgroundGradient = `linear-gradient(${item.gradient.angle}deg, ${colors.join(', ')})`;
      break;
    case 'radial':
      backgroundGradient = `radial-gradient(circle at center, ${colors.join(', ')})`;
      break;
    case 'conic':
      backgroundGradient = `conic-gradient(from ${item.gradient.angle}deg at 50% 50%, ${colors.join(', ')})`;
      break;
    case 'blob':
    case 'mesh':
    default: {
      const stops = item.gradient.colors.map(c =>
        `radial-gradient(at ${Math.round(c.position.x * 100)}% ${Math.round(c.position.y * 100)}%, ${c.color} 0px, transparent 55%)`
      );
      backgroundGradient = stops.join(',\n    ') + `,\n    ${colors[0] || '#0d1117'}`;
      break;
    }
  }

  const svgNoise = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <filter id="noiseFilter">
    <feTurbulence type="fractalNoise" baseFrequency="${(0.6 / Math.max(0.5, item.noise.scale)).toFixed(2)}" numOctaves="3" stitchTiles="stitch"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#noiseFilter)" opacity="${(item.noise.intensity / 100 * 0.4).toFixed(2)}"/>
</svg>`;

  const encodedSVG = `data:image/svg+xml;utf8,${encodeURIComponent(svgNoise)}`;

  return `/* ChromaGrain Studio Responsive CSS */
.chroma-grain-bg {
  width: 100%;
  height: 100%;
  background-color: ${colors[0] || '#0d1117'};
  background-image:
    url("${encodedSVG}"),
    ${backgroundGradient};
  background-blend-mode: ${item.noise.blendMode}, normal;
  background-size: cover;
  filter: contrast(${100 + item.cameraRaw.contrast}%) brightness(${100 + item.cameraRaw.exposure}%) saturate(${100 + item.cameraRaw.saturation}%);
}`;
}
