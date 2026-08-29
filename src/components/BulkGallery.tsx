import React, { useState } from 'react';
import {
  Download,
  Code,
  Heart,
  Eye,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Trash2,
  Sparkles,
  Tag,
  Layers,
  ArrowUpRight,
  FileCode,
  Loader2
} from 'lucide-react';
import { BatchItem } from '../types';
import { renderHighResBlob } from '../utils/worker';
import { downloadSingleSVG, exportBatchSVGsToZip } from '../utils/svgExporter';

interface BulkGalleryProps {
  items: BatchItem[];
  onSelectItemToEdit: (item: BatchItem) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteItems: (ids: string[]) => void;
  onExportSingleCSS: (item: BatchItem) => void;
  onOpenMetadataModal: (item: BatchItem) => void;
  isGeneratingBatch: boolean;
  batchProgress?: { current: number; total: number } | null;
  onGenerateBatch?: () => void;
  onClearAll?: () => void;
}

export const BulkGallery: React.FC<BulkGalleryProps> = ({
  items,
  onSelectItemToEdit,
  onToggleFavorite,
  onDeleteItems,
  onExportSingleCSS,
  onOpenMetadataModal,
  isGeneratingBatch,
  batchProgress,
  onGenerateBatch,
  onClearAll
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterFavorite, setFilterFavorite] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isExportingSVG, setIsExportingSVG] = useState<boolean>(false);
  const [svgProgress, setSvgProgress] = useState<{ current: number; total: number } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const displayedItems = filterFavorite
    ? items.filter(item => item.favorite)
    : items;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === displayedItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedItems.map(i => i.id));
    }
  };

  const handleDownloadSingle = async (item: BatchItem, format: 'jpeg' | 'png' = 'jpeg') => {
    try {
      setDownloadingId(item.id);
      const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const blob = await renderHighResBlob(
        item,
        item.dimensions.width,
        item.dimensions.height,
        mime,
        0.98
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.name.replace(/\s+/g, '_')}_${item.dimensions.width}x${item.dimensions.height}.${format === 'jpeg' ? 'jpg' : 'png'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div id="chroma-bulk-gallery" className="w-full bg-neutral-950 p-6 border-t border-neutral-900 overflow-y-auto max-h-[50vh]">
      {/* Animated Batch Generation Progress Bar */}
      {isGeneratingBatch && batchProgress && (
        <div className="mb-5 p-3.5 bg-neutral-900/90 border border-violet-800/60 rounded-xl shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center space-x-2 text-violet-300 font-semibold">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
              <span>Generating High-Res 8K Asset Batch...</span>
            </div>
            <div className="font-mono text-neutral-300">
              {batchProgress.current} / {batchProgress.total} cards ({Math.round((batchProgress.current / batchProgress.total) * 100)}%)
            </div>
          </div>
          <div className="w-full bg-neutral-950 rounded-full h-2 overflow-hidden border border-neutral-800">
            <div
              className="bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-500 h-full transition-all duration-300 ease-out rounded-full shadow-[0_0_12px_rgba(139,92,246,0.5)]"
              style={{ width: `${Math.min(100, Math.max(5, (batchProgress.current / batchProgress.total) * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* Gallery Header & Bulk Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
            <Layers className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Generated Batch Gallery</span>
              <span className="px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-400 text-xs font-mono font-normal border border-neutral-800">
                {items.length} Variations
              </span>
            </h2>
            <p className="text-xs text-neutral-400">Manage, preview, export 8K microstock assets & metadata</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setFilterFavorite(!filterFavorite)}
            className={`px-3 py-1.5 rounded-lg border flex items-center space-x-1.5 transition-all ${
              filterFavorite
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${filterFavorite ? 'fill-rose-400 text-rose-400' : ''}`} />
            <span>Favorites</span>
          </button>

          {items.length > 0 && (
            <>
              <button
                onClick={selectAll}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded-lg flex items-center space-x-1.5"
              >
                {selectedIds.length === displayedItems.length ? (
                  <CheckSquare className="w-3.5 h-3.5 text-violet-400" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-neutral-400" />
                )}
                <span>{selectedIds.length === displayedItems.length ? 'Deselect All' : 'Select All'}</span>
              </button>

              <button
                onClick={() => {
                  const targetItems = selectedIds.length > 0 ? items.filter(i => selectedIds.includes(i.id)) : items;
                  targetItems.forEach(item => handleDownloadSingle(item, 'jpeg'));
                }}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded-lg flex items-center space-x-1.5"
                title="Export high-resolution JPEG files"
              >
                <Download className="w-3.5 h-3.5 text-neutral-400" />
                <span>Export JPG ({selectedIds.length > 0 ? selectedIds.length : items.length})</span>
              </button>

              <button
                onClick={() => {
                  const targetItems = selectedIds.length > 0 ? items.filter(i => selectedIds.includes(i.id)) : items;
                  targetItems.forEach(item => handleDownloadSingle(item, 'png'));
                }}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-lg flex items-center space-x-1.5 shadow-sm"
                title="Export as PNG (Preserves 100% transparent background for Halftones)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PNG ({selectedIds.length > 0 ? selectedIds.length : items.length})</span>
              </button>

              <button
                onClick={async () => {
                  const targetItems = selectedIds.length > 0 ? items.filter(i => selectedIds.includes(i.id)) : items;
                  try {
                    setIsExportingSVG(true);
                    await exportBatchSVGsToZip(targetItems, (curr, tot) => {
                      setSvgProgress({ current: curr, total: tot });
                    });
                  } catch (err) {
                    console.error('SVG Batch Export failed:', err);
                  } finally {
                    setIsExportingSVG(false);
                    setSvgProgress(null);
                  }
                }}
                disabled={isExportingSVG}
                className="px-3 py-1.5 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-semibold rounded-lg flex items-center space-x-1.5 shadow-sm disabled:opacity-50 transition-all"
                title="Export as Hybrid Vector SVG (bundles into ZIP for batch)"
              >
                {isExportingSVG ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileCode className="w-3.5 h-3.5" />
                )}
                <span>
                  {isExportingSVG && svgProgress
                    ? `Exporting SVG (${svgProgress.current}/${svgProgress.total})...`
                    : `Export as SVG (${selectedIds.length > 0 ? selectedIds.length : items.length})`}
                </span>
              </button>

              {/* Clear Results / Reset Gallery Engine Control */}
              {showClearConfirm ? (
                <div className="flex items-center space-x-2 bg-rose-950/90 border border-rose-800 text-rose-200 px-3 py-1.5 rounded-lg animate-in fade-in zoom-in-95 duration-150 shadow-lg">
                  <span className="font-semibold text-xs">Clear all {items.length} cards?</span>
                  <button
                    onClick={() => {
                      if (onClearAll) onClearAll();
                      setSelectedIds([]);
                      setShowClearConfirm(false);
                    }}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-md shadow-sm transition-colors"
                  >
                    Confirm Clear
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-rose-950/70 text-neutral-300 hover:text-rose-300 border border-neutral-800 hover:border-rose-800/60 rounded-lg flex items-center space-x-1.5 shadow-sm transition-all"
                  title="Clear all generated cards from memory (Sidebar controls & presets are preserved)"
                >
                  <Trash2 className="w-3.5 h-3.5 text-neutral-400 group-hover:text-rose-400" />
                  <span>Clear Results</span>
                </button>
              )}
            </>
          )}

          {selectedIds.length > 0 && (
            <button
              onClick={() => {
                onDeleteItems(selectedIds);
                setSelectedIds([]);
              }}
              className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-lg flex items-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty Gallery State */}
      {displayedItems.length === 0 && (
        <div className="py-14 border border-dashed border-neutral-800 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-neutral-900/20 backdrop-blur-sm">
          <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4 shadow-inner">
            <Sparkles className="w-7 h-7 text-violet-400 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-neutral-100 mb-1.5">
            {items.length === 0 ? 'Gallery Cleared & Ready' : 'No Favorite Variations Found'}
          </h3>
          <p className="text-xs text-neutral-400 max-w-md mb-5 leading-relaxed">
            {items.length === 0
              ? 'All generated card assets have been cleared from memory. Your sidebar configurations, master toggles, custom presets, and seed parameters are fully preserved.'
              : 'You have not favorited any generated cards yet. Click the heart icon on cards in your gallery to filter them here.'}
          </p>
          {items.length === 0 && onGenerateBatch && (
            <button
              onClick={onGenerateBatch}
              disabled={isGeneratingBatch}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center space-x-2 shadow-lg shadow-violet-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingBatch ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Sparkles className="w-4 h-4 text-white" />
              )}
              <span>{isGeneratingBatch ? 'Generating Batch...' : 'Generate New Batch'}</span>
            </button>
          )}
        </div>
      )}

      {/* Responsive Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {displayedItems.map((item, index) => {
          const isSelected = selectedIds.includes(item.id);
          const isDownloading = downloadingId === item.id;

          return (
            <div
              key={item.id}
              className={`group relative bg-neutral-900 border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-black/50 ${
                isSelected
                  ? 'border-violet-500 ring-2 ring-violet-500/30'
                  : 'border-neutral-800 hover:border-neutral-700'
              }`}
            >
              {/* Thumbnail Container */}
              <div
                className="relative aspect-video bg-neutral-950 cursor-pointer overflow-hidden"
                onClick={() => onSelectItemToEdit(item)}
              >
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-950 flex items-center justify-center text-xs text-neutral-400">
                    Loading 8K Preview...
                  </div>
                )}

                {/* Top Badge Overlay */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                  <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur text-[10px] font-mono text-neutral-300 border border-white/10 uppercase">
                    {item.gradient.style}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(item.id);
                    }}
                    className={`p-1.5 rounded-full backdrop-blur pointer-events-auto transition-colors ${
                      item.favorite
                        ? 'bg-rose-500/80 text-white'
                        : 'bg-black/40 text-neutral-300 hover:bg-black/80'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${item.favorite ? 'fill-white' : ''}`} />
                  </button>
                </div>

                {/* Selection Overlay Checkbox */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(item.id);
                  }}
                  className="absolute bottom-2 left-2 p-1 bg-black/60 backdrop-blur rounded cursor-pointer hover:bg-black/90"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-violet-400" />
                  ) : (
                    <Square className="w-4 h-4 text-neutral-400" />
                  )}
                </div>
              </div>

              {/* Card Footer Info & Actions */}
              <div className="p-3 bg-neutral-900 border-t border-neutral-850 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="truncate font-medium text-xs text-neutral-200" title={item.name}>
                    #{index + 1} {item.name}
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">
                    {item.dimensions.width}×{item.dimensions.height}
                  </span>
                </div>

                {/* Palette color dots */}
                <div className="flex items-center space-x-1.5">
                  {item.gradient.colors.map((c, i) => (
                    <span
                      key={i}
                      className="w-2.5 h-2.5 rounded-full border border-black/30"
                      style={{ backgroundColor: c.color }}
                      title={c.color}
                    />
                  ))}
                  <span className="text-[10px] text-neutral-400 ml-auto font-mono">
                    Grain {item.noise.intensity}%
                  </span>
                </div>

                {/* Hover Action Buttons */}
                <div className="grid grid-cols-6 gap-1 pt-1 border-t border-neutral-850 text-neutral-400">
                  <button
                    onClick={() => onSelectItemToEdit(item)}
                    className="p-1.5 hover:bg-neutral-800 hover:text-white rounded flex justify-center"
                    title="Edit in Main Canvas"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onExportSingleCSS(item)}
                    className="p-1.5 hover:bg-neutral-800 hover:text-cyan-400 rounded flex justify-center"
                    title="Copy CSS Code"
                  >
                    <Code className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onOpenMetadataModal(item)}
                    className="p-1.5 hover:bg-neutral-800 hover:text-emerald-400 rounded flex justify-center"
                    title="View Microstock Tags"
                  >
                    <Tag className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        setDownloadingId(item.id);
                        await downloadSingleSVG(item);
                      } catch (err) {
                        console.error('Single SVG Download error:', err);
                      } finally {
                        setDownloadingId(null);
                      }
                    }}
                    disabled={isDownloading}
                    className="p-1.5 hover:bg-neutral-800 hover:text-fuchsia-400 rounded flex justify-center"
                    title="Download Vector SVG"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDownloadSingle(item, 'png')}
                    disabled={isDownloading}
                    className="p-1.5 hover:bg-neutral-800 hover:text-purple-400 rounded flex justify-center text-[10px] font-mono font-bold"
                    title="Download High-Res PNG (Supports Transparent Alpha Halftone)"
                  >
                    PNG
                  </button>

                  <button
                    onClick={() => handleDownloadSingle(item, 'jpeg')}
                    disabled={isDownloading}
                    className="p-1.5 hover:bg-neutral-800 hover:text-violet-400 rounded flex justify-center"
                    title="Download High-Res JPG"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
