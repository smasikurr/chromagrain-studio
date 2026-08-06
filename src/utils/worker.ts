import { BatchItem, ResolutionPreset, AspectRatio } from '../types';
import { renderGradientToCanvas } from './renderer';

export function getDimensionsFromPreset(
  preset: ResolutionPreset,
  aspect: AspectRatio,
  customW = 3840,
  customH = 2160
): { width: number; height: number } {
  if (preset === 'custom') {
    return { width: customW, height: customH };
  }

  let baseWidth = 3840;
  let baseHeight = 2160;

  switch (preset) {
    case '1080p':
      baseWidth = 1920;
      baseHeight = 1080;
      break;
    case '2k':
      baseWidth = 2560;
      baseHeight = 1440;
      break;
    case '4k':
      baseWidth = 3840;
      baseHeight = 2160;
      break;
    case '8k':
      baseWidth = 7680;
      baseHeight = 4320;
      break;
  }

  // Adjust aspect ratio
  if (aspect === '1:1') {
    const side = Math.min(baseWidth, baseHeight);
    return { width: side, height: side };
  } else if (aspect === '9:16') {
    return { width: baseHeight, height: baseWidth };
  } else if (aspect === '4:5') {
    return { width: Math.round(baseHeight * (4 / 5)), height: baseHeight };
  } else if (aspect === '21:9') {
    return { width: Math.round(baseHeight * (21 / 9)), height: baseHeight };
  } else if (aspect === '32:9') {
    return { width: Math.round(baseHeight * (32 / 9)), height: baseHeight };
  } else if (aspect === '18:9') {
    return { width: Math.round(baseHeight * 2), height: baseHeight };
  } else if (aspect === '4:3') {
    return { width: Math.round(baseHeight * (4 / 3)), height: baseHeight };
  } else if (aspect === '5:4') {
    return { width: Math.round(baseHeight * (5 / 4)), height: baseHeight };
  } else if (aspect === '3:2') {
    return { width: Math.round(baseHeight * (3 / 2)), height: baseHeight };
  } else if (aspect === '2:3') {
    return { width: Math.round(baseHeight * (2 / 3)), height: baseHeight };
  } else if (aspect === '2:1') {
    return { width: Math.round(baseHeight * 2), height: baseHeight };
  } else if (aspect === '16:10') {
    return { width: Math.round(baseHeight * (16 / 10)), height: baseHeight };
  } else if (aspect === '3:4') {
    return { width: Math.round(baseHeight * (3 / 4)), height: baseHeight };
  }

  return { width: baseWidth, height: baseHeight };
}

/**
 * Offscreen rendering helper for 8K images.
 * Uses OffscreenCanvas where supported or off-DOM HTMLCanvasElement.
 */
export async function renderHighResBlob(
  item: BatchItem,
  width: number,
  height: number,
  format: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.98
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      if (typeof OffscreenCanvas !== 'undefined') {
        const offscreen = new OffscreenCanvas(width, height);
        renderGradientToCanvas({
          canvas: offscreen,
          gradient: item.gradient,
          noise: item.noise,
          cameraRaw: item.cameraRaw,
          blur: item.blur,
          filterGallery: item.filterGallery
        });

        offscreen.convertToBlob({ type: format, quality }).then(blob => {
          if (blob) resolve(blob);
          else reject(new Error('OffscreenCanvas blob conversion failed'));
        }).catch(() => {
          // Fallback to HTMLCanvasElement
          fallbackCanvasRender(item, width, height, format, quality).then(resolve).catch(reject);
        });
      } else {
        fallbackCanvasRender(item, width, height, format, quality).then(resolve).catch(reject);
      }
    } catch (err) {
      fallbackCanvasRender(item, width, height, format, quality).then(resolve).catch(reject);
    }
  });
}

function fallbackCanvasRender(
  item: BatchItem,
  width: number,
  height: number,
  format: 'image/jpeg' | 'image/png',
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    renderGradientToCanvas({
      canvas,
      gradient: item.gradient,
      noise: item.noise,
      cameraRaw: item.cameraRaw,
      blur: item.blur,
      filterGallery: item.filterGallery
    });

    canvas.toBlob(
      blob => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas blob failed'));
      },
      format,
      quality
    );
  });
}
