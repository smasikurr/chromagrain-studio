import React, { useState, useCallback, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import {
  BatchSettings,
  GradientConfig,
  NoiseConfig,
  CameraRawConfig,
  BlurConfig,
  FilterGalleryConfig,
  ColorRulesConfig,
  BatchItem,
  StudioPreset,
  ItemMetadata
} from './types';
import { BUILT_IN_PRESETS, DEFAULT_BLUR, DEFAULT_FILTER_GALLERY } from './utils/presets';
import { generatePalette, isBatchItem70PercentUnique, hasAtLeast3DistinctColors, calculateAestheticScore } from './utils/color';
import { generateProceduralMetadata, generateMicrostockCSV } from './utils/metadata';
import { generateProceduralPattern, calculateTopologySimilarity } from './utils/proceduralEngine';
import { renderHighResBlob, getDimensionsFromPreset } from './utils/worker';
import { renderGradientToCanvas, logWebGLMemoryUsage } from './utils/renderer';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { CanvasPreview } from './components/CanvasPreview';
import { BulkGallery } from './components/BulkGallery';
import { ExportModal } from './components/ExportModal';
import { MetadataModal } from './components/MetadataModal';

const CUSTOM_PRESETS_KEY = 'chromagrain_custom_presets_v3';

export default function App() {
  const defaultPreset = BUILT_IN_PRESETS[0];

  const [batchSettings, setBatchSettings] = useState<BatchSettings>({
    count: 12,
    resolution: '4k',
    customWidth: 3840,
    customHeight: 2160,
    aspectRatio: '16:9'
  });

  const [gradient, setGradient] = useState<GradientConfig>(defaultPreset.gradient);
  const [noise, setNoise] = useState<NoiseConfig>(defaultPreset.noise);
  const [cameraRaw, setCameraRaw] = useState<CameraRawConfig>(defaultPreset.cameraRaw);
  const [blur, setBlur] = useState<BlurConfig>(defaultPreset.blur || { ...DEFAULT_BLUR });
  const [filterGallery, setFilterGallery] = useState<FilterGalleryConfig>(defaultPreset.filterGallery || { ...DEFAULT_FILTER_GALLERY });
  const [colorRules, setColorRules] = useState<ColorRulesConfig>(defaultPreset.colorRules);
  const [activePresetId, setActivePresetId] = useState<string>(defaultPreset.id);

  // Preset list management with LocalStorage
  const [presets, setPresets] = useState<StudioPreset[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_PRESETS_KEY);
      if (saved) {
        const customParsed = JSON.parse(saved);
        return [...BUILT_IN_PRESETS, ...customParsed];
      }
    } catch {
      // fallback
    }
    return BUILT_IN_PRESETS;
  });

  // Generated Items state
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  // Modals state
  const [exportModalItem, setExportModalItem] = useState<BatchItem | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [metadataModalItem, setMetadataModalItem] = useState<BatchItem | null>(null);
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState<boolean>(false);

  // Save Custom Preset
  const handleSaveCustomPreset = (name: string, description: string) => {
    const newPreset: StudioPreset = {
      id: `custom-preset-${Date.now()}`,
      name,
      description,
      tag: 'Custom',
      isCustom: true,
      gradient,
      noise,
      cameraRaw,
      blur,
      filterGallery,
      colorRules
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);

    try {
      const customOnly = updatedPresets.filter(p => p.isCustom);
      localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(customOnly));
    } catch (err) {
      console.error('Failed to save preset to LocalStorage', err);
    }
  };

  // Delete Custom Preset
  const handleDeleteCustomPreset = (id: string) => {
    const updatedPresets = presets.filter(p => p.id !== id);
    setPresets(updatedPresets);

    try {
      const customOnly = updatedPresets.filter(p => p.isCustom);
      localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(customOnly));
    } catch (err) {
      console.error('Failed to update LocalStorage presets', err);
    }
  };

  // Load Preset Handler
  const handleSelectPreset = (preset: StudioPreset) => {
    setActivePresetId(preset.id);
    setGradient(preset.gradient);
    setNoise(preset.noise);
    setCameraRaw(preset.cameraRaw);
    if (preset.blur) setBlur(preset.blur);
    if (preset.filterGallery) setFilterGallery(preset.filterGallery);
    setColorRules(preset.colorRules);
  };

  // Apply Alphanumeric Seed Code for Reproducibility
  const handleApplySeedCode = (code: string) => {
    if (!code.trim()) return;
    const cleanCode = code.trim().toUpperCase();

    // Hash string to pseudo-seed number
    let hash = 0;
    for (let i = 0; i < cleanCode.length; i++) {
      hash = (hash << 5) - hash + cleanCode.charCodeAt(i);
      hash |= 0;
    }
    const numericSeed = Math.abs(hash);

    // Reproduce deterministic palette
    const baseHue = numericSeed % 360;
    const colors = gradient.colors.map((c, i) => {
      const h = (baseHue + (i * 360) / gradient.colors.length) % 360;
      return {
        ...c,
        color: `#${Math.floor((h / 360) * 16777215).toString(16).padStart(6, '0')}`,
        position: {
          x: ((numericSeed * (i + 1) * 37) % 80 + 10) / 100,
          y: ((numericSeed * (i + 1) * 73) % 80 + 10) / 100
        }
      };
    });

    setGradient(prev => ({
      ...prev,
      colors,
      seed: numericSeed,
      seedCode: cleanCode
    }));
  };

  // Randomize Unlocked Colors
  const handleRandomizeColors = useCallback(() => {
    const newNodes = generatePalette(colorRules.paletteMode, gradient.colors.length, gradient.colors);
    const newSeedNum = Math.floor(Math.random() * 1000000);
    const newSeedStr = `SEED-${newSeedNum.toString(16).toUpperCase()}`;

    setGradient(prev => ({
      ...prev,
      colors: newNodes,
      angle: Math.floor(Math.random() * 360),
      seed: newSeedNum,
      seedCode: newSeedStr
    }));
  }, [colorRules.paletteMode, gradient.colors]);

  // Reset Camera Raw
  const handleResetCameraRaw = () => {
    setCameraRaw({
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
    });
  };

  // Global Randomize All
  const handleRandomizeAll = () => {
    const styles: GradientConfig['style'][] = ['mesh', 'blob', 'radial', 'linear', 'conic'];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    const newNodes = generatePalette(colorRules.paletteMode, gradient.colors.length, gradient.colors);
    const newSeedNum = Math.floor(Math.random() * 1000000);

    setGradient({
      style: randomStyle,
      colors: newNodes,
      blurRadius: Math.floor(Math.random() * 30),
      angle: Math.floor(Math.random() * 360),
      flowSpeed: 1.0,
      seed: newSeedNum,
      seedCode: `SEED-${newSeedNum.toString(16).toUpperCase()}`
    });

    setNoise(prev => ({
      ...prev,
      intensity: 15 + Math.floor(Math.random() * 45),
      scale: 0.8 + Math.random() * 1.5
    }));
  };

  // Helper to generate a low-res thumbnail Data URL for gallery cards
  const createThumbnailUrl = async (
    g: GradientConfig,
    n: NoiseConfig,
    c: CameraRawConfig,
    b?: BlurConfig,
    fg?: FilterGalleryConfig
  ): Promise<string> => {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 270;
    renderGradientToCanvas({
      canvas,
      gradient: g,
      noise: n,
      cameraRaw: c,
      blur: b,
      filterGallery: fg
    });
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  // BATCH GENERATION ENGINE (With >70% Distinction Algorithm & Strict Unique Color Groups)
  const handleGenerateBatch = async () => {
    if (isGeneratingBatch) return;

    setIsGeneratingBatch(true);
    const total = batchSettings.count;
    setBatchProgress({ current: 0, total });

    const newItems: BatchItem[] = [];
    const usedColorSignatures = new Set<string>();

    const dims = getDimensionsFromPreset(
      batchSettings.resolution,
      batchSettings.aspectRatio,
      batchSettings.customWidth,
      batchSettings.customHeight
    );

    // High-Load Batch Engine Performance & VRAM Tracker Logging
    logWebGLMemoryUsage(total, dims.width, dims.height);

    const availableStyles: GradientConfig['style'][] = [
      'mesh', 'blob', 'radial', 'linear', 'conic',
      'aurora', 'fluid', 'spiral', 'glass_wave', 'prism',
      'diamond', 'angular', 'freeform'
    ];

    for (let i = 0; i < total; i++) {
      setBatchProgress({ current: i + 1, total });

      let attempts = 0;
      let candidateItem: BatchItem | null = null;

      // >70% Distinction & Topology Uniqueness Engine Loop
      while (attempts < 20) {
        const itemColors = generatePalette(colorRules.paletteMode, gradient.colors.length, gradient.colors);
        const colorSig = itemColors.map(c => c.color.toLowerCase()).sort().join('-');

        // Ensure color scheme non-repetition or at least 3 distinct colors if base palette reused
        if (usedColorSignatures.has(colorSig) && attempts < 15) {
          const lastItem = newItems[newItems.length - 1];
          if (lastItem && !hasAtLeast3DistinctColors(itemColors, lastItem.gradient.colors)) {
            attempts++;
            continue;
          }
        }

        const itemStyle = availableStyles[(i + attempts) % availableStyles.length];
        const seedVal = Date.now() + i + attempts + Math.floor(Math.random() * 10000);
        const procConfig = generateProceduralPattern(seedVal, itemColors.length);

        const itemGradient: GradientConfig = {
          ...gradient,
          style: itemStyle,
          colors: itemColors,
          angle: (gradient.angle + (i + attempts) * 37) % 360,
          seed: seedVal,
          seedCode: `SEED-${seedVal.toString(16).toUpperCase()}`,
          proceduralConfig: procConfig
        };

        const itemNoise: NoiseConfig = {
          ...noise,
          intensity: Math.max(0, Math.min(80, noise.intensity + ((i + attempts) % 3 === 0 ? 10 : -5)))
        };

        const testItem = {
          gradient: itemGradient,
          noise: itemNoise
        };

        // Aesthetic Quality Score Auto-Curator Check (<60 is rejected & regenerated)
        const aestheticScore = calculateAestheticScore(itemColors);
        if (aestheticScore < 60 && attempts < 15) {
          attempts++;
          continue;
        }

        // Topological structural similarity check against active batch
        let topologyTooSimilar = false;
        for (const existing of [...items, ...newItems]) {
          if (existing.gradient.proceduralConfig) {
            const topSim = calculateTopologySimilarity(procConfig, existing.gradient.proceduralConfig);
            if (topSim > 50) {
              topologyTooSimilar = true;
              break;
            }
          }
        }

        if (topologyTooSimilar && attempts < 15) {
          attempts++;
          continue;
        }

        // Check overall visual similarity
        if (isBatchItem70PercentUnique(testItem, [...items, ...newItems], 30) || attempts >= 18) {
          usedColorSignatures.add(colorSig);

          const metadata = generateProceduralMetadata({
            gradient: itemGradient,
            noise: itemNoise,
            cameraRaw
          });

          const thumbnailUrl = await createThumbnailUrl(itemGradient, itemNoise, cameraRaw, blur, filterGallery);

          candidateItem = {
            id: `batch-item-${Date.now()}-${i}-${Math.random()}`,
            name: `ChromaGrain Asset ${i + 1}`,
            timestamp: Date.now(),
            gradient: itemGradient,
            noise: itemNoise,
            cameraRaw,
            blur,
            filterGallery,
            colorRules,
            seedCode: itemGradient.seedCode || `SEED-${Date.now().toString(16).toUpperCase()}`,
            metadata,
            thumbnailUrl,
            favorite: false,
            dimensions: dims
          };
          break;
        }
        attempts++;
      }

      if (candidateItem) {
        newItems.push(candidateItem);
      }

      // Yield main thread slightly for UI responsiveness
      await new Promise(r => setTimeout(r, 10));
    }

    setItems(prev => [...newItems, ...prev]);
    setIsGeneratingBatch(false);
    setBatchProgress(null);
  };

  const hasInitializedRef = useRef(false);

  // Clear All Generated Results & Memory Disposal
  const handleClearAll = useCallback(() => {
    items.forEach(item => {
      if (item.thumbnailUrl && item.thumbnailUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(item.thumbnailUrl);
        } catch {
          // ignore
        }
      }
    });
    setItems([]);
  }, [items]);

  // Generate initial sample batch on mount if empty
  useEffect(() => {
    if (items.length === 0 && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      handleGenerateBatch();
    }
  }, []);

  // Card Selection & Editing Handler
  const handleSelectItemToEdit = (item: BatchItem) => {
    setGradient(item.gradient);
    setNoise(item.noise);
    setCameraRaw(item.cameraRaw);
    if (item.blur) setBlur(item.blur);
    if (item.filterGallery) setFilterGallery(item.filterGallery);
    setColorRules(item.colorRules);

    // Scroll preview into view
    document.getElementById('chroma-canvas-preview')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleToggleFavorite = (id: string) => {
    setItems(prev =>
      prev.map(i => (i.id === id ? { ...i, favorite: !i.favorite } : i))
    );
  };

  const handleDeleteItems = (ids: string[]) => {
    setItems(prev => prev.filter(i => !ids.includes(i.id)));
  };

  const handleSaveMetadata = (itemId: string, metadata: ItemMetadata) => {
    setItems(prev =>
      prev.map(i => (i.id === itemId ? { ...i, metadata } : i))
    );
  };

  // EXPORT ALL AS ZIP ARCHIVE (8K/4K Images)
  const handleExportZip = async () => {
    if (items.length === 0) return;

    try {
      setIsGeneratingBatch(true);
      const zip = new JSZip();

      // Render each item in high resolution
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        setBatchProgress({ current: idx + 1, total: items.length });

        const blob = await renderHighResBlob(
          item,
          item.dimensions.width,
          item.dimensions.height,
          'image/jpeg',
          0.98
        );

        const filename = `${item.name.replace(/\s+/g, '_')}_${item.dimensions.width}x${item.dimensions.height}.jpg`;
        zip.file(filename, blob);
      }

      // Compress and download
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ChromaGrain_Studio_Batch_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP Export error:', err);
    } finally {
      setIsGeneratingBatch(false);
      setBatchProgress(null);
    }
  };

  // EXPORT STANDALONE CSV
  const handleExportCSV = () => {
    if (items.length === 0) return;
    const csvStr = generateMicrostockCSV(items);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `microstock_metadata_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="chromagrain-app" className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-violet-500/30 selection:text-violet-200">
      {/* Top Bar */}
      <TopBar
        onGenerateBatch={handleGenerateBatch}
        onExportZip={handleExportZip}
        onExportCSS={() => {
          if (items[0]) setExportModalItem(items[0]);
          else {
            const dims = getDimensionsFromPreset(batchSettings.resolution, batchSettings.aspectRatio);
            setExportModalItem({
              id: 'current',
              name: 'Current Canvas',
              timestamp: Date.now(),
              gradient,
              noise,
              cameraRaw,
              blur,
              filterGallery,
              colorRules,
              seedCode: gradient.seedCode || 'SEED-CURRENT',
              metadata: generateProceduralMetadata({ gradient, noise, cameraRaw }),
              favorite: false,
              dimensions: dims
            });
          }
          setIsExportModalOpen(true);
        }}
        onExportCSV={handleExportCSV}
        onRandomizeAll={handleRandomizeAll}
        onSelectPreset={handleSelectPreset}
        presets={presets}
        activePresetId={activePresetId}
        isGeneratingBatch={isGeneratingBatch}
        batchProgress={batchProgress}
        totalGeneratedCount={items.length}
      />

      {/* Main Studio Workbench */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar Controls */}
        <Sidebar
          batchSettings={batchSettings}
          setBatchSettings={setBatchSettings}
          gradient={gradient}
          setGradient={setGradient}
          noise={noise}
          setNoise={setNoise}
          cameraRaw={cameraRaw}
          setCameraRaw={setCameraRaw}
          blur={blur}
          setBlur={setBlur}
          filterGallery={filterGallery}
          setFilterGallery={setFilterGallery}
          colorRules={colorRules}
          setColorRules={setColorRules}
          presets={presets}
          onSaveCustomPreset={handleSaveCustomPreset}
          onDeleteCustomPreset={handleDeleteCustomPreset}
          onLoadPreset={handleSelectPreset}
          onRandomizeColors={handleRandomizeColors}
          onResetCameraRaw={handleResetCameraRaw}
          onApplySeedCode={handleApplySeedCode}
        />

        {/* Right Studio Main Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-black">
          <CanvasPreview
            gradient={gradient}
            setGradient={setGradient}
            noise={noise}
            cameraRaw={cameraRaw}
            blur={blur}
            filterGallery={filterGallery}
            batchSettings={batchSettings}
            onRandomizeCurrent={handleRandomizeColors}
          />
        </div>
      </div>

      {/* Bottom Bulk Cards Grid Gallery */}
      <BulkGallery
        items={items}
        onSelectItemToEdit={handleSelectItemToEdit}
        onToggleFavorite={handleToggleFavorite}
        onDeleteItems={handleDeleteItems}
        onExportSingleCSS={(item) => {
          setExportModalItem(item);
          setIsExportModalOpen(true);
        }}
        onOpenMetadataModal={(item) => {
          setMetadataModalItem(item);
          setIsMetadataModalOpen(true);
        }}
        isGeneratingBatch={isGeneratingBatch}
        batchProgress={batchProgress}
        onGenerateBatch={handleGenerateBatch}
        onClearAll={handleClearAll}
      />

      {/* Export CSS Modal */}
      <ExportModal
        item={exportModalItem}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* Microstock Metadata Modal */}
      <MetadataModal
        item={metadataModalItem}
        isOpen={isMetadataModalOpen}
        onClose={() => setIsMetadataModalOpen(false)}
        onSaveMetadata={handleSaveMetadata}
      />
    </div>
  );
}
