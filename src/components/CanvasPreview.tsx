import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RefreshCw,
  Eye,
  Sliders,
  Move,
  Info,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Lock,
  Unlock,
  Plus
} from 'lucide-react';
import {
  GradientConfig,
  NoiseConfig,
  CameraRawConfig,
  BlurConfig,
  FilterGalleryConfig,
  BatchSettings
} from '../types';
import { renderGradientToCanvas } from '../utils/renderer';
import { getDimensionsFromPreset } from '../utils/worker';

interface CanvasPreviewProps {
  gradient: GradientConfig;
  setGradient: React.Dispatch<React.SetStateAction<GradientConfig>>;
  noise: NoiseConfig;
  cameraRaw: CameraRawConfig;
  blur?: BlurConfig;
  filterGallery?: FilterGalleryConfig;
  batchSettings: BatchSettings;
  activeItemName?: string;
  onRandomizeCurrent: () => void;
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  gradient,
  setGradient,
  noise,
  cameraRaw,
  blur,
  filterGallery,
  batchSettings,
  activeItemName,
  onRandomizeCurrent
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDraggingNode, setIsDraggingNode] = useState<number | null>(null);
  const [showOriginal, setShowOriginal] = useState<boolean>(false); // Before/After compare

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

    // Use a fixed preview resolution for 60fps interaction (e.g. 1920x1080 scaled)
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
      : cameraRaw;

    renderGradientToCanvas({
      canvas,
      gradient,
      noise: effectiveNoise,
      cameraRaw: effectiveRaw,
      blur,
      filterGallery
    });
  }, [gradient, noise, cameraRaw, blur, filterGallery, dims.width, dims.height, showOriginal]);

  useEffect(() => {
    triggerRender();
  }, [triggerRender]);

  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(null);

  // Handle Canvas Click to Add or Select Node
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // If clicked on action toolbar, ignore
    if ((e.target as HTMLElement).closest('.node-toolbar-action')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    // Find closest node within threshold
    let closestIndex = -1;
    let minDistance = 0.08; // Threshold radius

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
      // Click on canvas adds a new color node at clicked position
      const newColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
      const newNode = {
        id: `node-${Date.now()}-${Math.random()}`,
        color: newColor,
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

  return (
    <div
      ref={containerRef}
      id="chroma-canvas-preview"
      className={`relative flex-1 bg-neutral-950 flex flex-col overflow-hidden select-none ${
        isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''
      }`}
    >
      {/* Top Preview Status Bar */}
      <div className="h-10 px-4 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur flex items-center justify-between text-xs z-20">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-neutral-300">
            {activeItemName || 'Live Canvas Preview'}
          </span>
          <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
            {dims.width} × {dims.height} px ({batchSettings.aspectRatio})
          </span>
          <span className="text-[10px] font-mono text-violet-400 bg-violet-950/40 px-2 py-0.5 rounded border border-violet-800/40 uppercase">
            {gradient.style}
          </span>
        </div>

        {/* View Controls */}
        <div className="flex items-center space-x-2">
          {/* Before / After toggle */}
          <button
            onMouseDown={() => setShowOriginal(true)}
            onMouseUp={() => setShowOriginal(false)}
            onMouseLeave={() => setShowOriginal(false)}
            className={`px-2.5 py-1 rounded border text-[10px] font-mono flex items-center space-x-1 transition-all ${
              showOriginal
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
            }`}
            title="Press and hold to compare raw gradient without noise/Camera Raw"
          >
            <Eye className="w-3 h-3" />
            <span>Hold for Raw</span>
          </button>

          <div className="h-4 w-[1px] bg-neutral-800 mx-1" />

          <button
            onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
            className="p-1.5 text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 rounded border border-neutral-800"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="font-mono text-[11px] text-neutral-400 w-12 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>

          <button
            onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.25))}
            className="p-1.5 text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 rounded border border-neutral-800"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setZoomLevel(1)}
            className="px-2 py-1 text-[10px] font-mono text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 rounded border border-neutral-800"
          >
            Reset
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 rounded border border-neutral-800"
            title="Toggle Fullscreen Preview"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport Area */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
        <div
          className="relative transition-transform duration-100 ease-out shadow-2xl shadow-black/80 rounded-xl overflow-hidden border border-neutral-800 group"
          style={{
            transform: `scale(${zoomLevel})`,
            aspectRatio: `${dims.width} / ${dims.height}`,
            maxHeight: isFullscreen ? '90vh' : 'calc(100vh - 12rem)',
            maxWidth: '100%'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain block bg-black"
          />

          {/* Interactive Node Control Handles for all gradient styles */}
          {gradient.colors.map((node, index) => (
            <div
              key={node.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNodeIndex(index);
              }}
              className={`absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded-full border-2 cursor-grab active:cursor-grabbing flex items-center justify-center shadow-lg transition-transform hover:scale-125 ${
                selectedNodeIndex === index ? 'scale-125 border-violet-400 ring-4 ring-violet-500/50' : 'border-white/80'
              }`}
              style={{
                left: `${node.position.x * 100}%`,
                top: `${node.position.y * 100}%`,
                backgroundColor: node.color
              }}
              title={`Node ${index + 1}: ${node.color} (Click to select/recolor/delete)`}
            >
              <Move className="w-3 h-3 text-white drop-shadow" />
            </div>
          ))}

          {/* Selected Node Floating Action Toolbar */}
          {selectedNodeIndex !== null && gradient.colors[selectedNodeIndex] && (
            <div
              className="absolute node-toolbar-action p-2 bg-neutral-900/95 backdrop-blur border border-neutral-700 rounded-xl shadow-2xl flex items-center space-x-2 text-xs z-30 transform -translate-x-1/2 -translate-y-12"
              style={{
                left: `${gradient.colors[selectedNodeIndex].position.x * 100}%`,
                top: `${Math.max(0.1, gradient.colors[selectedNodeIndex].position.y) * 100}%`
              }}
            >
              <span className="text-[10px] font-mono text-neutral-400">Node #{selectedNodeIndex + 1}</span>
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
                className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer"
                title="Change Color"
              />
              <span className="font-mono text-[10px] text-neutral-200 uppercase">{gradient.colors[selectedNodeIndex].color}</span>

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
                className="p-1 text-neutral-400 hover:text-white rounded bg-neutral-800"
                title={gradient.colors[selectedNodeIndex].locked ? 'Unlock Node' : 'Lock Node'}
              >
                {gradient.colors[selectedNodeIndex].locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
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
                  className="p-1 text-red-400 hover:text-red-300 rounded bg-red-950/40 border border-red-800/40"
                  title="Delete Color Node"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Canvas Interactive Overlay Banner */}
          <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur rounded-lg border border-white/10 text-[10px] text-neutral-300 flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <Plus className="w-3 h-3 text-violet-400" />
            <span>Click canvas to add node • Drag nodes to move</span>
          </div>
        </div>
      </div>

      {/* Floating Canvas Footer Info Pill */}
      <div className="absolute bottom-4 right-6 px-3 py-1.5 bg-neutral-900/90 backdrop-blur border border-neutral-800 rounded-full text-[10px] font-mono text-neutral-400 flex items-center space-x-3 shadow-xl">
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
