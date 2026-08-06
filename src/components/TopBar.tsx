import React from 'react';
import {
  Sparkles,
  Download,
  Code,
  Shuffle,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  Cpu,
  Bookmark
} from 'lucide-react';
import { StudioPreset } from '../types';

interface TopBarProps {
  onGenerateBatch: () => void;
  onExportZip: () => void;
  onExportCSS: () => void;
  onExportCSV: () => void;
  onRandomizeAll: () => void;
  onSelectPreset: (preset: StudioPreset) => void;
  presets: StudioPreset[];
  activePresetId?: string;
  isGeneratingBatch: boolean;
  batchProgress: { current: number; total: number } | null;
  totalGeneratedCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  onGenerateBatch,
  onExportZip,
  onExportCSS,
  onExportCSV,
  onRandomizeAll,
  onSelectPreset,
  presets,
  activePresetId,
  isGeneratingBatch,
  batchProgress,
  totalGeneratedCount
}) => {
  return (
    <header id="chroma-topbar" className="h-16 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30 shrink-0">
      {/* Brand & Status */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-amber-400 p-[1.5px] shadow-lg shadow-violet-500/20">
            <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-white tracking-wide font-sans">ChromaGrain Studio</h1>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-violet-500/10 text-violet-400 border border-violet-500/30 rounded">
                PRO 8K
              </span>
            </div>
            <p className="text-xs text-neutral-400 hidden sm:block">Procedural Microstock Grainy Gradient Engine</p>
          </div>
        </div>

        <div className="hidden lg:flex items-center space-x-3 text-xs border-l border-neutral-800 pl-4">
          <div className="flex items-center space-x-1.5 text-emerald-400 font-mono">
            <Cpu className="w-3.5 h-3.5" />
            <span>OffscreenCanvas 8K</span>
          </div>
          <div className="flex items-center space-x-1.5 text-sky-400 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Anti-Banding ON</span>
          </div>
        </div>
      </div>

      {/* Preset Dropdown & Global Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Built-in Presets */}
        <div className="relative hidden md:block">
          <select
            id="preset-selector"
            className="h-9 bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs rounded-lg px-3 pr-8 focus:outline-none focus:border-violet-500 cursor-pointer transition-colors"
            value={activePresetId || ''}
            onChange={(e) => {
              const selected = presets.find(p => p.id === e.target.value);
              if (selected) onSelectPreset(selected);
            }}
          >
            <option value="" disabled>Load Preset Template...</option>
            {presets.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.tag})
              </option>
            ))}
          </select>
        </div>

        <button
          id="btn-randomize-all"
          onClick={onRandomizeAll}
          className="h-9 px-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all active:scale-95"
          title="Randomize gradient, seed & parameters"
        >
          <Shuffle className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Randomize</span>
        </button>

        <button
          id="btn-export-css"
          onClick={onExportCSS}
          className="h-9 px-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all active:scale-95"
        >
          <Code className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">CSS Code</span>
        </button>

        <button
          id="btn-export-csv"
          onClick={onExportCSV}
          className="h-9 px-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all active:scale-95"
          title="Export Microstock CSV (Adobe Stock / Freepik format)"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">CSV Tags</span>
        </button>

        <button
          id="btn-export-zip"
          onClick={onExportZip}
          disabled={totalGeneratedCount === 0 || isGeneratingBatch}
          className="h-9 px-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 border border-neutral-700 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all active:scale-95"
        >
          <Download className="w-3.5 h-3.5 text-violet-400" />
          <span className="hidden sm:inline">Export ZIP</span>
        </button>

        <button
          id="btn-generate-batch"
          onClick={onGenerateBatch}
          disabled={isGeneratingBatch}
          className="h-9 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-lg text-xs flex items-center space-x-2 shadow-lg shadow-violet-600/25 transition-all active:scale-95 disabled:opacity-50"
        >
          <Layers className="w-4 h-4" />
          <span>
            {isGeneratingBatch
              ? `Generating (${batchProgress?.current || 0}/${batchProgress?.total || 0})...`
              : 'Generate Batch'}
          </span>
        </button>
      </div>
    </header>
  );
};
