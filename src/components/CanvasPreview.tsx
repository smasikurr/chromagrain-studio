import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Eye,
  Move,
  Sparkles,
  Trash2,
  Lock,
  Unlock,
  Plus,
  X,
  Download,
  CheckCircle2,
  Grid,
  Crosshair,
  Layers,
  Shuffle,
  RotateCw,
  Copy,
  Check,
  FileCode,
  FileImage,
  Sun,
  Sliders,
  ChevronDown,
  Monitor,
  Smartphone,
  Square,
  BookmarkPlus
} from 'lucide-react';
import {
  GradientConfig,
  NoiseConfig,
  CameraRawConfig,
  BlurConfig,
  FilterGalleryConfig,
  BatchSettings,
  BatchItem,
  AspectRatio,
  ResolutionPreset
} from '../types';
import { renderGradientToCanvas } from '../utils/renderer';
import { getDimensionsFromPreset, renderHighResBlob } from '../utils/worker';
import { downloadSingleSVG } from '../utils/svgExporter';
import { generateCSSCode } from '../utils/metadata';
import { rgbToHsl, hslToRgb, hexToRgb } from '../utils/color';

interface CanvasPreviewProps {
  gradient: GradientConfig;
  setGradient: React.Dispatch<React.SetStateAction<GradientConfig>>;
  noise: NoiseConfig;
  setNoise?: React.Dispatch<React.SetStateAction<NoiseConfig>>;
  cameraRaw: CameraRawConfig;
  setCameraRaw?: React.Dispatch<React.SetStateAction<CameraRawConfig>>;
  blur?: BlurConfig;
  setBlur?: React.Dispatch<React.SetStateAction<BlurConfig>>;
  filterGallery?: FilterGalleryConfig;
  setFilterGallery?: React.Dispatch<React.SetStateAction<FilterGalleryConfig>>;
  batchSettings: BatchSettings;
  setBatchSettings?: React.Dispatch<React.SetStateAction<BatchSettings>>;
  activeItemName?: string;
  onRandomizeCurrent?: () => void;
  onSaveCurrentToBatch?: () => void;
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  gradient,
  setGradient,
  noise,
  setNoise,
  cameraRaw,
  setCameraRaw,
  blur,
  setBlur,
  filterGallery,
  setFilterGallery,
  batchSettings,
  setBatchSettings,
  activeItemName,
  onRandomizeCurrent,
  onSaveCurrentToBatch
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDraggingNode, setIsDraggingNode] = useState<number | null>(null);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(null);

  // Live Inspection States
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [showGrayscale, setShowGrayscale] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [showCrosshair, setShowCrosshair] = useState<boolean>(false);
  const [showNodeLines, setShowNodeLines] = useState<boolean>(false);
  const [showCheckerboard, setShowCheckerboard] = useState<boolean>(true);

  // Dropdown states
  const [isDownloadOpen, setIsDownloadOpen] = useState<boolean>(false);
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [copiedCSS, setCopiedCSS] = useState<boolean>(false);
  const [savedToBatchFeedback, setSavedToBatchFeedback] = useState<boolean>(false);

  // Target aspect ratio dimensions
  const dims = getDimensionsFromPreset(
    batchSettings.resolution,
    batchSettings.aspectRatio,
    batchSettings.customWidth,
    batchSettings.customHeight
  );

  // Render loop
  const triggerRender = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Fixed preview resolution for 60fps interaction
    const previewWidth = Math.min(1920, dims.width);
    const previewHeight = Math.round(previewWidth * (dims.height / dims.width));

    if (canvas.width !== previewWidth || canvas.height !== previewHeight) {
      canvas.width = previewWidth;
      canvas.height = previewHeight;
    }

    const effectiveNoise = showOriginal
      ? { ...noise, intensity: 0, opacity: 0 }
      : noise;
    const effectiveRaw = showOriginal
      ? {
          exposure: 0,
          contrast: 0,
          highlights: 0,
          shadows: 0,
          clarity: 0,
          texture: 0,
          vibrance: 0,
          saturation: 0,
          vignetteAmount: 0,
          vignetteFeather: 50,
          vignetteRoundness: 80
        }
      : showGrayscale
      ? { ...cameraRaw, saturation: -100 }
      : cameraRaw;

    renderGradientToCanvas({
      canvas,
      gradient,
      noise: effectiveNoise,
      cameraRaw: effectiveRaw,
      blur,
      filterGallery
    });
  }, [gradient, noise, cameraRaw, blur, filterGallery, dims.width, dims.height, showOriginal, showGrayscale]);

  useEffect(() => {
    triggerRender();
  }, [triggerRender]);

  // Handle Canvas Click to Add or Select Node
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.node-toolbar-action') || (e.target as HTMLElement).closest('.canvas-ui-control')) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    // Find closest node within threshold
    let closestIndex = -1;
    let minDistance = 0.08;

    gradient.colors.forEach((node, i) => {
      const dist = Math.hypot(node.position.x - clickX, node.position.y - clickY);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    });

    if (closestIndex !== -1) {
      setIsDraggingNode(closestIndex);
      setSelectedNodeIndex(closestIndex);
    } else {
      // Click on canvas adds a new color node
      const newColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
      const newNode = {
        id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        color: newColor,
        opacity: 1,
        position: { x: Math.max(0.05, Math.min(0.95, clickX)), y: Math.max(0.05, Math.min(0.95, clickY)) },
        locked: false,
        radius: 0.4
      };

      setGradient(prev => ({
        ...prev,
        colors: [...prev.colors, newNode]
      }));
      setSelectedNodeIndex(gradient.colors.length);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingNode === null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    setGradient(prev => {
      const updated = [...prev.colors];
      if (updated[isDraggingNode]) {
        updated[isDraggingNode] = {
          ...updated[isDraggingNode],
          position: { x, y }
        };
      }
      return { ...prev, colors: updated };
    });
  };

  const handleMouseUp = () => {
    setIsDraggingNode(null);
  };

  // Create temporary BatchItem for export tools
  const createCurrentBatchItem = (): BatchItem => {
    return {
      id: 'current_live_canvas_' + Date.now(),
      name: activeItemName || `Chroma_${gradient.style.toUpperCase()}_Art`,
      seedCode: 'CHROMA-EXP-' + Date.now(),
      timestamp: Date.now(),
      gradient,
      noise,
      cameraRaw,
      blur: blur || { enabled: false, type: 'gaussian', radius: 0, passes: 1 },
      filterGallery: filterGallery || {
        glassRipple: { enabled: false, distortion: 30, smoothness: 50 },
        plasticWrap: { enabled: false, shine: 50, detail: 50, depth: 50 },
        halftone: { enabled: false, pattern: 'dot', size: 8, contrast: 50, angle: 45, opacity: 100, blendMode: 'normal', transparentBackground: false },
        mosaicStainedGlass: { enabled: false, cellSize: 20, borderWidth: 2, lightIntensity: 40 },
        roughTexture: { enabled: false, graininess: 30, contrast: 50, highlightIntensity: 40 }
      },
      colorRules: { paletteMode: 'all_random', allowColorReuse: true, enforceUniqueStyles: false, contrastThreshold: 30 },
      metadata: {
        title: activeItemName || `${gradient.style.toUpperCase()} Background Artwork`,
        description: `High-resolution procedural ${gradient.style} background ready for commercial use.`,
        keywords: ['gradient', gradient.style, 'abstract', 'background', 'texture', 'high resolution', 'commercial', 'adobe stock'],
        category: 'Backgrounds',
        primaryColors: gradient.colors.map(c => c.color),
        mood: 'Modern'
      },
      dimensions: dims,
      favorite: false
    };
  };

  // Instant Single Download Handlers
  const handleSingleDownload = async (format: 'png' | 'jpeg' | 'webp' | 'svg' | 'css') => {
    try {
      setDownloadingFormat(format);
      const item = createCurrentBatchItem();

      if (format === 'svg') {
        await downloadSingleSVG(item);
      } else if (format === 'css') {
        const css = generateCSSCode(item);
        await navigator.clipboard.writeText(css);
        setCopiedCSS(true);
        setTimeout(() => setCopiedCSS(false), 2500);
      } else {
        const mimeType = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
        const quality = format === 'jpeg' ? 0.98 : 1.0;
        const blob = await renderHighResBlob(item, dims.width, dims.height, mimeType, quality);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = format === 'jpeg' ? 'jpg' : format;
        a.download = `${item.name.replace(/\s+/g, '_')}_${dims.width}x${dims.height}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(`Single ${format} download failed:`, err);
    } finally {
      setDownloadingFormat(null);
      setIsDownloadOpen(false);
    }
  };

  // Rotate / Shift Hue
  const handleShiftHue = (degrees: number) => {
    setGradient(prev => ({
      ...prev,
      colors: prev.colors.map(node => {
        if (node.locked) return node;
        const rgb = hexToRgb(node.color);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        hsl.h = (hsl.h + degrees + 360) % 360;
        const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
        const toHex = (n: number) => n.toString(16).padStart(2, '0');
        const newColor = `#${toHex(newRgb.r)}${toHex(newRgb.g)}${toHex(newRgb.b)}`;
        return { ...node, color: newColor };
      })
    }));
  };

  // Invert Colors
  const handleInvertColors = () => {
    setGradient(prev => ({
      ...prev,
      colors: prev.colors.map(node => {
        if (node.locked) return node;
        const rgb = hexToRgb(node.color);
        const invR = 255 - rgb.r;
        const invG = 255 - rgb.g;
        const invB = 255 - rgb.b;
        const toHex = (n: number) => n.toString(16).padStart(2, '0');
        return { ...node, color: `#${toHex(invR)}${toHex(invG)}${toHex(invB)}` };
      })
    }));
  };

  const isHalftoneActive = filterGallery?.halftone?.enabled ?? false;
  const isTransparentBg = filterGallery?.halftone?.transparentBackground ?? false;

  return (
    <div
      ref={containerRef}
      id="chroma-canvas-preview"
      className={`relative flex-1 bg-neutral-950 flex flex-col overflow-hidden select-none ${
        isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''
      }`}
    >
      {/* Top Preview Status & Quick Toolbar */}
      <div className="h-11 px-3 sm:px-4 border-b border-neutral-900 bg-neutral-950/90 backdrop-blur-md flex items-center justify-between text-xs z-20 shrink-0 gap-2 overflow-x-auto">
        {/* Left: Resolution, Style, & Aspect Ratio Quick Selectors */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="font-semibold text-white truncate max-w-[140px] sm:max-w-[200px]">
            {activeItemName || 'Live Studio Canvas'}
          </span>

          {/* Aspect Ratio Quick Toggle */}
          {setBatchSettings && (
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 text-[11px] font-mono">
              {(['16:9', '1:1', '9:16', '4:5', '3:2'] as AspectRatio[]).map(ratio => (
                <button
                  key={ratio}
                  onClick={() => setBatchSettings(prev => ({ ...prev, aspectRatio: ratio }))}
                  className={`px-1.5 py-0.5 rounded transition-all ${
                    batchSettings.aspectRatio === ratio
                      ? 'bg-violet-600 text-white font-bold shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title={`Switch to ${ratio} Aspect Ratio`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          )}

          {/* Resolution Badge / Selector */}
          {setBatchSettings ? (
            <select
              value={batchSettings.resolution}
              onChange={(e) => setBatchSettings(prev => ({ ...prev, resolution: e.target.value as ResolutionPreset }))}
              className="bg-neutral-900 border border-neutral-800 text-neutral-300 text-[10px] font-mono rounded px-2 py-0.5 focus:outline-none focus:border-violet-500 cursor-pointer"
            >
              <option value="8k">8K (7680×4320)</option>
              <option value="4k">4K (3840×2160)</option>
              <option value="2k">2K (2560×1440)</option>
              <option value="1080p">1080p (1920×1080)</option>
            </select>
          ) : (
            <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
              {dims.width} × {dims.height} px
            </span>
          )}

          {isHalftoneActive && isTransparentBg && (
            <span className="text-[10px] font-mono font-medium text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-700/50 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="hidden sm:inline">Alpha Transparent Halftone</span>
              <span className="sm:hidden">Alpha PNG</span>
            </span>
          )}
        </div>

        {/* Right: Inspection, Overlays & Instant Single Export Controls */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Quick Save to Batch Gallery */}
          {onSaveCurrentToBatch && (
            <button
              onClick={() => {
                onSaveCurrentToBatch();
                setSavedToBatchFeedback(true);
                setTimeout(() => setSavedToBatchFeedback(false), 2000);
              }}
              className={`px-2.5 py-1 rounded border text-[11px] font-medium flex items-center space-x-1.5 transition-all active:scale-95 ${
                savedToBatchFeedback
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-800'
              }`}
              title="Save current live artwork to bottom batch gallery"
            >
              {savedToBatchFeedback ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <BookmarkPlus className="w-3.5 h-3.5 text-violet-400" />}
              <span className="hidden sm:inline">{savedToBatchFeedback ? 'Saved!' : 'Save to Batch'}</span>
            </button>
          )}

          {/* SINGLE DOWNLOAD DROPDOWN BUTTON */}
          <div className="relative">
            <button
              onClick={() => setIsDownloadOpen(!isDownloadOpen)}
              className="px-3 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-[11px] rounded-lg flex items-center space-x-1.5 shadow-sm shadow-violet-600/30 transition-all active:scale-95"
              title="Download Single Canvas Image"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingFormat ? `Exporting ${downloadingFormat.toUpperCase()}...` : 'Download Single'}</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {isDownloadOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-neutral-900 border border-neutral-700/80 rounded-xl shadow-2xl p-1.5 z-50 text-xs text-neutral-200 animate-in fade-in zoom-in duration-100">
                <div className="px-2.5 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                  Export Single Artwork ({dims.width}×{dims.height})
                </div>

                {/* Download PNG */}
                <button
                  onClick={() => handleSingleDownload('png')}
                  className="w-full text-left px-2.5 py-2 hover:bg-neutral-800 rounded-lg flex items-center justify-between text-neutral-200 hover:text-white transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <FileImage className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="font-semibold">Download PNG</div>
                      <div className="text-[9px] text-neutral-400">
                        {isTransparentBg ? '100% Transparent Background' : 'Full 32-bit Lossless'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-purple-950/60 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800/40">
                    PNG
                  </span>
                </button>

                {/* Download Ultra JPG */}
                <button
                  onClick={() => handleSingleDownload('jpeg')}
                  className="w-full text-left px-2.5 py-2 hover:bg-neutral-800 rounded-lg flex items-center justify-between text-neutral-200 hover:text-white transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Download className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-semibold">Download JPG (8K/4K)</div>
                      <div className="text-[9px] text-neutral-400">Adobe Stock / Microstock Ready</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-amber-950/60 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800/40">
                    JPG
                  </span>
                </button>

                {/* Download WebP */}
                <button
                  onClick={() => handleSingleDownload('webp')}
                  className="w-full text-left px-2.5 py-2 hover:bg-neutral-800 rounded-lg flex items-center justify-between text-neutral-200 hover:text-white transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <FileImage className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-semibold">Download WebP</div>
                      <div className="text-[9px] text-neutral-400">Web-Optimized Lightweight</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-950/60 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800/40">
                    WebP
                  </span>
                </button>

                {/* Download Vector SVG */}
                <button
                  onClick={() => handleSingleDownload('svg')}
                  className="w-full text-left px-2.5 py-2 hover:bg-neutral-800 rounded-lg flex items-center justify-between text-neutral-200 hover:text-white transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <FileCode className="w-4 h-4 text-pink-400" />
                    <div>
                      <div className="font-semibold">Download Vector SVG</div>
                      <div className="text-[9px] text-neutral-400">Scalable vector definition</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-pink-950/60 text-pink-300 px-1.5 py-0.5 rounded border border-pink-800/40">
                    SVG
                  </span>
                </button>

                {/* Copy CSS Code */}
                <button
                  onClick={() => handleSingleDownload('css')}
                  className="w-full text-left px-2.5 py-2 hover:bg-neutral-800 rounded-lg flex items-center justify-between text-neutral-200 hover:text-white transition-colors border-t border-neutral-800"
                >
                  <div className="flex items-center space-x-2">
                    <Copy className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="font-semibold">{copiedCSS ? 'Copied!' : 'Copy CSS Code'}</div>
                      <div className="text-[9px] text-neutral-400">CSS radial gradients + noise</div>
                    </div>
                  </div>
                  {copiedCSS && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              </div>
            )}
          </div>

          <div className="h-4 w-[1px] bg-neutral-800 mx-0.5" />

          {/* Hold for Raw compare */}
          <button
            onMouseDown={() => setShowOriginal(true)}
            onMouseUp={() => setShowOriginal(false)}
            onMouseLeave={() => setShowOriginal(false)}
            className={`px-2 py-1 rounded border text-[10px] font-mono flex items-center space-x-1 transition-all ${
              showOriginal
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
            }`}
            title="Hold to preview raw base gradient without effects"
          >
            <Eye className="w-3 h-3" />
            <span className="hidden sm:inline">Raw</span>
          </button>

          {/* Grayscale Check */}
          <button
            onClick={() => setShowGrayscale(!showGrayscale)}
            className={`p-1.5 rounded border text-[10px] transition-all ${
              showGrayscale
                ? 'bg-neutral-200 text-neutral-950 border-white'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
            }`}
            title="Toggle Grayscale to check luminance & contrast balance"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>

          {/* Grid Overlay Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded border text-[10px] transition-all ${
              showGrid
                ? 'bg-violet-500/20 text-violet-300 border-violet-500/50'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
            }`}
            title="Toggle Rule-of-Thirds Grid Guides"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          {/* Crosshair Toggle */}
          <button
            onClick={() => setShowCrosshair(!showCrosshair)}
            className={`p-1.5 rounded border text-[10px] transition-all ${
              showCrosshair
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
            }`}
            title="Toggle Center Alignment Crosshair"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>

          {/* Zoom controls */}
          <button
            onClick={() => setZoomLevel(prev => Math.max(0.25, prev - 0.25))}
            className="p-1.5 text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 rounded border border-neutral-800"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="font-mono text-[10px] text-neutral-400 w-10 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>

          <button
            onClick={() => setZoomLevel(prev => Math.min(3.0, prev + 0.25))}
            className="p-1.5 text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 rounded border border-neutral-800"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setZoomLevel(1)}
            className="px-1.5 py-1 text-[10px] font-mono text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 rounded border border-neutral-800"
            title="Reset Zoom to 100%"
          >
            1:1
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 rounded border border-neutral-800"
            title="Toggle Fullscreen Canvas"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-auto bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] relative">
        <div
          className={`relative transition-transform duration-100 ease-out shadow-2xl shadow-black/90 rounded-xl overflow-hidden border border-neutral-800 group ${
            showCheckerboard
              ? 'bg-[linear-gradient(45deg,#1c1c1f_25%,transparent_25%),linear-gradient(-45deg,#1c1c1f_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1c1c1f_75%),linear-gradient(-45deg,transparent_75%,#1c1c1f_75%)] bg-[size:16px_16px] bg-[#0c0c0e]'
              : 'bg-black'
          }`}
          style={{
            transform: `scale(${zoomLevel})`,
            aspectRatio: `${dims.width} / ${dims.height}`,
            maxHeight: isFullscreen ? '90vh' : 'calc(100vh - 13rem)',
            maxWidth: '100%'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Main 2D Render Canvas */}
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain block bg-transparent"
          />

          {/* Rule of Thirds Composition Grid */}
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10">
              <div className="border-r border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-b border-white/25" />
              <div className="border-r border-white/25" />
              <div className="border-r border-white/25" />
              <div />
            </div>
          )}

          {/* Center Alignment Crosshair */}
          {showCrosshair && (
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
              <div className="w-full h-[1px] bg-cyan-400/40 absolute" />
              <div className="h-full w-[1px] bg-cyan-400/40 absolute" />
              <div className="w-6 h-6 rounded-full border border-cyan-400/60" />
            </div>
          )}

          {/* Optional Vector Connection Lines */}
          {showNodeLines && gradient.colors.length > 1 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              {gradient.colors.map((node, i) => {
                const nextNode = gradient.colors[(i + 1) % gradient.colors.length];
                return (
                  <line
                    key={`line-${i}`}
                    x1={`${node.position.x * 100}%`}
                    y1={`${node.position.y * 100}%`}
                    x2={`${nextNode.position.x * 100}%`}
                    y2={`${nextNode.position.y * 100}%`}
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                );
              })}
            </svg>
          )}

          {/* Interactive Node Control Handles for all gradient styles */}
          {gradient.colors.map((node, index) => {
            const nodeOpacity = node.opacity !== undefined ? node.opacity : 1;
            return (
              <div
                key={node.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNodeIndex(index);
                }}
                className={`absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded-full border-2 cursor-grab active:cursor-grabbing flex items-center justify-center shadow-lg transition-transform hover:scale-125 ${
                  selectedNodeIndex === index ? 'scale-125 border-cyan-400 ring-4 ring-cyan-500/50 z-20' : 'border-white/90 z-10'
                }`}
                style={{
                  left: `${node.position.x * 100}%`,
                  top: `${node.position.y * 100}%`,
                  backgroundColor: node.color,
                  opacity: Math.max(0.35, nodeOpacity)
                }}
                title={`Node ${index + 1}: ${node.color} (${Math.round(nodeOpacity * 100)}% opacity)`}
              >
                <Move className="w-3 h-3 text-white drop-shadow" />
              </div>
            );
          })}

          {/* Selected Node Floating Action Toolbar */}
          {selectedNodeIndex !== null && gradient.colors[selectedNodeIndex] && (
            <div
              className="absolute node-toolbar-action p-3 bg-neutral-900/95 backdrop-blur-md border border-neutral-700/80 rounded-2xl shadow-2xl flex flex-col space-y-2.5 text-xs z-30 transform -translate-x-1/2 -translate-y-full mb-3 min-w-[240px]"
              style={{
                left: `${Math.max(0.18, Math.min(0.82, gradient.colors[selectedNodeIndex].position.x)) * 100}%`,
                top: `${Math.max(0.14, gradient.colors[selectedNodeIndex].position.y) * 100}%`
              }}
            >
              {/* Header row: title, node badge, close button */}
              <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800 text-neutral-300">
                <div className="flex items-center space-x-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: gradient.colors[selectedNodeIndex].color }} />
                  <span className="text-[11px] font-semibold text-white">Color Node #{selectedNodeIndex + 1}</span>
                </div>
                <button
                  onClick={() => setSelectedNodeIndex(null)}
                  className="text-neutral-400 hover:text-white p-0.5 rounded-lg hover:bg-neutral-800 transition-colors"
                  title="Close Toolbar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Color Selection & Lock / Delete Row */}
              <div className="flex items-center space-x-2">
                <div className="relative flex items-center">
                  <input
                    type="color"
                    value={gradient.colors[selectedNodeIndex].color}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGradient(prev => {
                        const colors = [...prev.colors];
                        if (colors[selectedNodeIndex]) {
                          colors[selectedNodeIndex] = { ...colors[selectedNodeIndex], color: val };
                        }
                        return { ...prev, colors };
                      });
                    }}
                    className="w-7 h-7 rounded-lg border border-neutral-700 bg-neutral-800 cursor-pointer p-0.5"
                    title="Change Color"
                  />
                </div>
                <input
                  type="text"
                  value={gradient.colors[selectedNodeIndex].color.toUpperCase()}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                      setGradient(prev => {
                        const colors = [...prev.colors];
                        if (colors[selectedNodeIndex]) {
                          colors[selectedNodeIndex] = { ...colors[selectedNodeIndex], color: val };
                        }
                        return { ...prev, colors };
                      });
                    }
                  }}
                  className="w-20 px-2 py-1 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-[11px] text-neutral-200 uppercase focus:outline-none focus:border-cyan-500"
                />

                <div className="flex items-center space-x-1 ml-auto">
                  {/* Lock toggle */}
                  <button
                    onClick={() => {
                      setGradient(prev => {
                        const colors = [...prev.colors];
                        if (colors[selectedNodeIndex]) {
                          colors[selectedNodeIndex] = {
                            ...colors[selectedNodeIndex],
                            locked: !colors[selectedNodeIndex].locked
                          };
                        }
                        return { ...prev, colors };
                      });
                    }}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      gradient.colors[selectedNodeIndex].locked
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-neutral-800/80 text-neutral-400 hover:text-white border-neutral-700'
                    }`}
                    title={gradient.colors[selectedNodeIndex].locked ? 'Unlock Node' : 'Lock Node'}
                  >
                    {gradient.colors[selectedNodeIndex].locked ? (
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Delete node if > 2 */}
                  {gradient.colors.length > 2 && (
                    <button
                      onClick={() => {
                        setGradient(prev => ({
                          ...prev,
                          colors: prev.colors.filter((_, idx) => idx !== selectedNodeIndex)
                        }));
                        setSelectedNodeIndex(null);
                      }}
                      className="p-1.5 text-red-400 hover:text-red-300 rounded-lg bg-red-950/40 border border-red-800/40 hover:bg-red-900/50 transition-colors"
                      title="Delete Color Node"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Opacity Slider Row (under color) */}
              <div className="pt-1 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400 font-medium">Node Opacity</span>
                  <span className="font-mono text-cyan-400 font-semibold">
                    {Math.round((gradient.colors[selectedNodeIndex].opacity ?? 1) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={Math.round((gradient.colors[selectedNodeIndex].opacity ?? 1) * 100)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) / 100;
                    setGradient(prev => {
                      const colors = [...prev.colors];
                      if (colors[selectedNodeIndex]) {
                        colors[selectedNodeIndex] = {
                          ...colors[selectedNodeIndex],
                          opacity: val
                        };
                      }
                      return { ...prev, colors };
                    });
                  }}
                  className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                />
                {/* Quick Opacity Presets */}
                <div className="grid grid-cols-4 gap-1 pt-0.5">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => {
                        setGradient(prev => {
                          const colors = [...prev.colors];
                          if (colors[selectedNodeIndex]) {
                            colors[selectedNodeIndex] = {
                              ...colors[selectedNodeIndex],
                              opacity: pct / 100
                            };
                          }
                          return { ...prev, colors };
                        });
                      }}
                      className={`py-0.5 text-[9px] font-mono rounded border transition-colors ${
                        Math.round((gradient.colors[selectedNodeIndex].opacity ?? 1) * 100) === pct
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                          : 'bg-neutral-800/60 text-neutral-400 hover:text-white border-neutral-800'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Canvas Interactive Overlay Banner */}
          <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur rounded-lg border border-white/10 text-[10px] text-neutral-300 flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <Plus className="w-3 h-3 text-violet-400" />
            <span>Click canvas to add node • Drag nodes to move</span>
          </div>
        </div>

        {/* Floating Live Quick Modifiers Tray */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-3 py-1.5 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-full flex items-center space-x-2 shadow-2xl z-20 text-xs">
          {onRandomizeCurrent && (
            <button
              onClick={onRandomizeCurrent}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-full flex items-center space-x-1 transition-colors"
              title="Shuffle Color Palette"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Shuffle</span>
            </button>
          )}

          <button
            onClick={() => handleShiftHue(45)}
            className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-full flex items-center space-x-1 transition-colors"
            title="Shift Hue +45 degrees"
          >
            <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>+45° Hue</span>
          </button>

          <button
            onClick={handleInvertColors}
            className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-full flex items-center space-x-1 transition-colors"
            title="Invert Palette Colors"
          >
            <Sun className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden sm:inline">Invert</span>
          </button>

          <button
            onClick={() => setShowNodeLines(!showNodeLines)}
            className={`px-2 py-1 rounded-full flex items-center space-x-1 transition-colors ${
              showNodeLines ? 'bg-violet-600/40 text-violet-200 border border-violet-500' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
            }`}
            title="Show/Hide Node Connection Lines"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Vectors</span>
          </button>
        </div>
      </div>

      {/* Floating Canvas Footer Info Pill */}
      <div className="absolute bottom-4 right-6 px-3 py-1.5 bg-neutral-900/90 backdrop-blur border border-neutral-800 rounded-full text-[10px] font-mono text-neutral-400 flex items-center space-x-3 shadow-xl z-20">
        <div className="flex items-center space-x-1 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time Engine</span>
        </div>
        <span>•</span>
        <span>Dither: {noise.antiBandingDither ? 'ON (Triangular)' : 'OFF'}</span>
        <span>•</span>
        <span>Format: 8K Ready</span>
      </div>
    </div>
  );
};
