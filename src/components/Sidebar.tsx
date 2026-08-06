import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  SlidersHorizontal,
  Palette,
  Camera,
  Layers,
  ChevronDown,
  Lock,
  Unlock,
  RotateCcw,
  ShieldCheck,
  Eye,
  Wand2,
  Copy,
  Check,
  Plus,
  Trash2,
  Key,
  Grid,
  Aperture,
  Tv,
  Film
} from 'lucide-react';
import {
  GradientConfig,
  NoiseConfig,
  CameraRawConfig,
  ColorRulesConfig,
  BatchSettings,
  ResolutionPreset,
  AspectRatio,
  GradientStyle,
  NoiseType,
  PaletteMode,
  GrainBlendMode,
  BlurConfig,
  FilterGalleryConfig,
  StudioPreset
} from '../types';
import { generatePalette } from '../utils/color';

interface SidebarProps {
  batchSettings: BatchSettings;
  setBatchSettings: React.Dispatch<React.SetStateAction<BatchSettings>>;
  gradient: GradientConfig;
  setGradient: React.Dispatch<React.SetStateAction<GradientConfig>>;
  noise: NoiseConfig;
  setNoise: React.Dispatch<React.SetStateAction<NoiseConfig>>;
  cameraRaw: CameraRawConfig;
  setCameraRaw: React.Dispatch<React.SetStateAction<CameraRawConfig>>;
  blur: BlurConfig;
  setBlur: React.Dispatch<React.SetStateAction<BlurConfig>>;
  filterGallery: FilterGalleryConfig;
  setFilterGallery: React.Dispatch<React.SetStateAction<FilterGalleryConfig>>;
  colorRules: ColorRulesConfig;
  setColorRules: React.Dispatch<React.SetStateAction<ColorRulesConfig>>;
  presets: StudioPreset[];
  onSaveCustomPreset: (name: string, description: string) => void;
  onDeleteCustomPreset: (id: string) => void;
  onLoadPreset: (preset: StudioPreset) => void;
  onRandomizeColors: () => void;
  onResetCameraRaw: () => void;
  onApplySeedCode: (seedCode: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  batchSettings,
  setBatchSettings,
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
  colorRules,
  setColorRules,
  presets,
  onSaveCustomPreset,
  onDeleteCustomPreset,
  onLoadPreset,
  onRandomizeColors,
  onResetCameraRaw,
  onApplySeedCode
}) => {
  // Accordion state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    presets: true,
    batch: true,
    seed: false,
    base: true,
    blurSuite: false,
    filterGallery: false,
    halftone: false,
    volumetric: false,
    grain: true,
    camera: false,
    rules: false
  });

  const [copiedSeed, setCopiedSeed] = useState(false);
  const [seedInput, setSeedInput] = useState(gradient.seedCode || '');
  const [newPresetName, setNewPresetName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleColorCountChange = (count: number) => {
    const currentCount = gradient.colors.length;
    if (count === currentCount) return;

    if (count > currentCount) {
      const newNodes = generatePalette(colorRules.paletteMode, count, gradient.colors);
      setGradient(prev => ({ ...prev, colors: newNodes }));
    } else {
      setGradient(prev => ({ ...prev, colors: prev.colors.slice(0, count) }));
    }
  };

  const toggleColorLock = (index: number) => {
    setGradient(prev => {
      const updated = [...prev.colors];
      if (updated[index]) {
        updated[index] = { ...updated[index], locked: !updated[index].locked };
      }
      return { ...prev, colors: updated };
    });
  };

  const updateColorHex = (index: number, hex: string) => {
    setGradient(prev => {
      const updated = [...prev.colors];
      if (updated[index]) {
        updated[index] = { ...updated[index], color: hex };
      }
      return { ...prev, colors: updated };
    });
  };

  const copySeedToClipboard = () => {
    if (gradient.seedCode) {
      navigator.clipboard.writeText(gradient.seedCode);
      setCopiedSeed(true);
      setTimeout(() => setCopiedSeed(false), 2000);
    }
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    onSaveCustomPreset(newPresetName.trim(), 'Custom saved Studio formula');
    setNewPresetName('');
    setShowSaveModal(false);
  };

  return (
    <aside id="chroma-sidebar" className="w-full lg:w-96 border-r border-neutral-800 bg-neutral-950 text-neutral-200 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto shrink-0 select-none">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/40">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">Studio Controls</span>
        </div>
        <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
          v3.0 PRO
        </span>
      </div>

      <div className="p-3 space-y-3 divide-y divide-neutral-900">
        {/* PANEL 0: PRESET MANAGER */}
        <div className="rounded-xl border border-neutral-850 bg-neutral-900/60 overflow-hidden">
          <button
            onClick={() => toggleSection('presets')}
            className="w-full p-3 flex items-center justify-between text-xs font-semibold text-neutral-200 hover:bg-neutral-850 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Wand2 className="w-4 h-4 text-pink-400" />
              <span>Studio Formula Presets</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openSections.presets ? 'rotate-180' : ''}`} />
          </button>

          {openSections.presets && (
            <div className="p-3.5 pt-1 space-y-3 text-xs border-t border-neutral-850">
              <div className="flex justify-between items-center">
                <label className="text-neutral-400 font-medium">Load Formula Preset</label>
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="text-[10px] text-pink-400 hover:text-pink-300 flex items-center space-x-1 font-mono font-medium"
                >
                  <Plus className="w-3 h-3" />
                  <span>Save Current</span>
                </button>
              </div>

              <select
                onChange={e => {
                  const found = presets.find(p => p.id === e.target.value);
                  if (found) onLoadPreset(found);
                }}
                className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-[11px] rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="">Select a Preset Formula...</option>
                <optgroup label="Built-in Studio Formulas">
                  {presets.filter(p => !p.isCustom).map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.tag})</option>
                  ))}
                </optgroup>
                {presets.some(p => p.isCustom) && (
                  <optgroup label="My Custom Presets">
                    {presets.filter(p => p.isCustom).map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Custom)</option>
                    ))}
                  </optgroup>
                )}
              </select>

              {/* Custom Presets List with Delete option */}
              {presets.some(p => p.isCustom) && (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-neutral-500 font-mono">Custom Presets:</span>
                  <div className="space-y-1">
                    {presets.filter(p => p.isCustom).map(p => (
                      <div key={p.id} className="flex items-center justify-between p-1.5 bg-neutral-950 rounded border border-neutral-800 text-[11px]">
                        <span className="text-neutral-300 truncate">{p.name}</span>
                        <button
                          onClick={() => onDeleteCustomPreset(p.id)}
                          className="text-neutral-500 hover:text-rose-400 p-0.5"
                          title="Delete preset"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Save Preset Modal */}
              {showSaveModal && (
                <form onSubmit={handleSavePreset} className="p-3 bg-neutral-950 rounded-lg border border-pink-500/30 space-y-2 mt-2">
                  <div className="text-[11px] font-bold text-pink-300">Save Studio Formula Preset</div>
                  <input
                    type="text"
                    placeholder="Preset Name (e.g., Neon Cyber-Grain)"
                    value={newPresetName}
                    onChange={e => setNewPresetName(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-200"
                    autoFocus
                  />
                  <div className="flex space-x-2 pt-1">
                    <button
                      type="submit"
                      className="flex-1 bg-pink-600 hover:bg-pink-500 text-white text-[11px] font-semibold py-1 rounded"
                    >
                      Save Preset
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSaveModal(false)}
                      className="px-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* PANEL 1: BATCH & RESOLUTION SETTINGS */}
        <div className="rounded-xl border border-neutral-850 bg-neutral-900/60 overflow-hidden">
          <button
            onClick={() => toggleSection('batch')}
            className="w-full p-3 flex items-center justify-between text-xs font-semibold text-neutral-200 hover:bg-neutral-850 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Batch & Resolution Engine</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openSections.batch ? 'rotate-180' : ''}`} />
          </button>

          {openSections.batch && (
            <div className="p-3.5 pt-1 space-y-4 text-xs border-t border-neutral-850">
              {/* Batch Count Slider & Input */}
              <div>
                <div className="flex justify-between text-neutral-400 mb-1.5 font-medium">
                  <span>Batch Variations</span>
                  <div className="flex items-center space-x-1 font-mono">
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={batchSettings.count}
                      onChange={e => {
                        const val = Math.max(1, Math.min(500, parseInt(e.target.value) || 1));
                        setBatchSettings(prev => ({ ...prev, count: val }));
                      }}
                      className="w-16 bg-neutral-950 border border-neutral-800 rounded px-1.5 py-0.5 text-right font-bold text-violet-400 text-xs"
                    />
                    <span className="text-neutral-500 text-[10px]">Items</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={1}
                  max={500}
                  value={batchSettings.count}
                  onChange={e => setBatchSettings(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
                <div className="flex justify-between text-[10px] text-neutral-400 mt-1 font-mono">
                  <span>1 Single</span>
                  <span>50 Batch</span>
                  <span>250 High</span>
                  <span>500 Max</span>
                </div>
              </div>

              {/* Resolution Selection */}
              <div>
                <label className="block text-neutral-400 font-medium mb-1.5">Master Resolution</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['1080p', '2k', '4k', '8k', 'custom'] as ResolutionPreset[]).map(res => (
                    <button
                      key={res}
                      onClick={() => setBatchSettings(prev => ({ ...prev, resolution: res }))}
                      className={`py-1.5 px-2 rounded-lg border text-[11px] font-mono font-medium uppercase transition-all ${
                        batchSettings.resolution === res
                          ? 'bg-violet-600/20 text-violet-300 border-violet-500/50 shadow-sm'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {res === '8k' ? '⚡ 8K UHD' : res}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Resolution Inputs (500px to 10,000px) */}
              {batchSettings.resolution === 'custom' && (
                <div className="grid grid-cols-2 gap-2 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                  <div>
                    <label className="text-[10px] text-neutral-400 font-mono">Width (500-10000px)</label>
                    <input
                      type="number"
                      min={500}
                      max={10000}
                      value={batchSettings.customWidth}
                      onChange={e => {
                        const val = Math.max(500, Math.min(10000, parseInt(e.target.value) || 1920));
                        setBatchSettings(prev => ({ ...prev, customWidth: val }));
                      }}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 font-mono">Height (500-10000px)</label>
                    <input
                      type="number"
                      min={500}
                      max={10000}
                      value={batchSettings.customHeight}
                      onChange={e => {
                        const val = Math.max(500, Math.min(10000, parseInt(e.target.value) || 1080));
                        setBatchSettings(prev => ({ ...prev, customHeight: val }));
                      }}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-200 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Aspect Ratio */}
              <div>
                <label className="block text-neutral-400 font-medium mb-1.5">Aspect Ratio</label>
                <div className="grid grid-cols-4 gap-1">
                  {(['16:9', '1:1', '9:16', '4:5', '21:9', '32:9', '18:9', '4:3', '5:4', '3:2', '2:1', '16:10', '3:4', 'all_mix'] as AspectRatio[]).map(aspect => (
                    <button
                      key={aspect}
                      onClick={() => setBatchSettings(prev => ({ ...prev, aspectRatio: aspect }))}
                      className={`py-1 px-1 rounded border text-[10px] font-mono transition-all truncate ${
                        batchSettings.aspectRatio === aspect
                          ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50 font-bold'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                      }`}
                      title={aspect === 'all_mix' ? 'All Aspect Ratios (Mixed Batch)' : aspect}
                    >
                      {aspect === 'all_mix' ? 'MIX ALL' : aspect}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PANEL 1.5: SEED-BASED GENERATION ENGINE */}
        <div className="rounded-xl border border-neutral-850 bg-neutral-900/60 overflow-hidden">
          <button
            onClick={() => toggleSection('seed')}
            className="w-full p-3 flex items-center justify-between text-xs font-semibold text-neutral-200 hover:bg-neutral-850 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Seed-Based Reproducibility Engine</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openSections.seed ? 'rotate-180' : ''}`} />
          </button>

          {openSections.seed && (
            <div className="p-3.5 pt-1 space-y-3 text-xs border-t border-neutral-850">
              <p className="text-[11px] text-neutral-400">
                Alphanumeric seed formula guarantees 100% exact pattern reproduction across renders.
              </p>

              <div className="flex space-x-1.5">
                <input
                  type="text"
                  value={seedInput}
                  onChange={e => setSeedInput(e.target.value)}
                  placeholder="e.g. SEED-9A4F72B"
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 font-mono text-[11px] text-amber-300 uppercase"
                />
                <button
                  onClick={() => onApplySeedCode(seedInput)}
                  className="px-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded text-[11px]"
                >
                  Apply
                </button>
              </div>

              <div className="flex items-center justify-between bg-neutral-950 p-2 rounded border border-neutral-800">
                <span className="text-[10px] text-neutral-400 font-mono">Current Seed:</span>
                <span className="font-mono font-bold text-amber-400 text-xs">{gradient.seedCode || 'SEED-LIVE'}</span>
                <button
                  onClick={copySeedToClipboard}
                  className="p-1 text-neutral-400 hover:text-white"
                  title="Copy Seed Code"
                >
                  {copiedSeed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PANEL 2: BASE GRADIENT CONTROLS */}
        <div className="rounded-xl border border-neutral-850 bg-neutral-900/60 overflow-hidden">
          <button
            onClick={() => toggleSection('base')}
            className="w-full p-3 flex items-center justify-between text-xs font-semibold text-neutral-200 hover:bg-neutral-850 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Palette className="w-4 h-4 text-fuchsia-400" />
              <span>Base Gradient Architecture</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openSections.base ? 'rotate-180' : ''}`} />
          </button>

          {openSections.base && (
            <div className="p-3.5 pt-1 space-y-4 text-xs border-t border-neutral-850">
              {/* Master Procedural Pattern Switch */}
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between mb-1">
                <div>
                  <div className="font-semibold text-fuchsia-300 text-[11px]">Procedural Pattern Matrix</div>
                  <div className="text-[9px] text-neutral-400">16-Bit Float32 Algorithmic Generator</div>
                </div>
                <input
                  type="checkbox"
                  checked={gradient.proceduralEnabled !== false}
                  onChange={e => setGradient(prev => ({ ...prev, proceduralEnabled: e.target.checked }))}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-fuchsia-500 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Gradient Style */}
              <div>
                <label className="block text-neutral-400 font-medium mb-1.5">Gradient Style</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['mesh', 'blob', 'radial', 'linear', 'conic', 'aurora', 'fluid', 'spiral', 'glass_wave', 'prism', 'diamond', 'angular', 'freeform'] as GradientStyle[]).map(st => (
                    <button
                      key={st}
                      onClick={() => setGradient(prev => ({ ...prev, style: st }))}
                      className={`py-1.5 px-2 rounded-lg border text-[10px] font-medium capitalize transition-all truncate ${
                        gradient.style === st
                          ? 'bg-fuchsia-600/20 text-fuchsia-300 border-fuchsia-500/50 shadow-sm font-bold'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Colors */}
              <div>
                <div className="flex justify-between text-neutral-400 mb-1.5 font-medium">
                  <span>Color Palette Nodes</span>
                  <span className="text-fuchsia-400 font-mono font-bold">{gradient.colors.length} Nodes</span>
                </div>
                <div className="flex space-x-2">
                  {[3, 4, 5].map(num => (
                    <button
                      key={num}
                      onClick={() => handleColorCountChange(num)}
                      className={`flex-1 py-1 rounded border text-[11px] font-mono transition-all ${
                        gradient.colors.length === num
                          ? 'bg-fuchsia-600/20 text-fuchsia-300 border-fuchsia-500/50 font-bold'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                      }`}
                    >
                      {num} Colors
                    </button>
                  ))}
                  <button
                    onClick={onRandomizeColors}
                    className="px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded text-[11px] flex items-center justify-center space-x-1"
                    title="Randomize unlocked colors"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Shuffle</span>
                  </button>
                </div>
              </div>

              {/* Color Pickers */}
              <div className="space-y-2 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                <div className="text-[10px] text-neutral-400 uppercase font-mono tracking-wider mb-1">Color Palette & Lock Controls</div>
                <div className="grid grid-cols-1 gap-1.5">
                  {gradient.colors.map((node, index) => (
                    <div key={node.id} className="flex items-center space-x-2 bg-neutral-900 p-1.5 rounded border border-neutral-800">
                      <input
                        type="color"
                        value={node.color}
                        onChange={e => updateColorHex(index, e.target.value)}
                        className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={node.color}
                        onChange={e => updateColorHex(index, e.target.value)}
                        className="w-20 bg-neutral-950 border border-neutral-800 rounded px-1.5 py-0.5 text-neutral-300 font-mono text-[11px]"
                      />
                      <span className="text-[10px] text-neutral-400 font-mono flex-1">
                        Node {index + 1} ({Math.round(node.position.x * 100)}%, {Math.round(node.position.y * 100)}%)
                      </span>
                      <button
                        onClick={() => toggleColorLock(index)}
                        className={`p-1 rounded transition-colors ${
                          node.locked ? 'text-amber-400 bg-amber-400/10 border border-amber-400/30' : 'text-neutral-400 hover:text-white'
                        }`}
                        title={node.locked ? 'Locked' : 'Unlocked'}
                      >
                        {node.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Blur Radius */}
              <div>
                <div className="flex justify-between text-neutral-400 mb-1.5 font-medium">
                  <span>Fluid Blur Radius</span>
                  <span className="text-fuchsia-400 font-mono">{gradient.blurRadius}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={gradient.blurRadius}
                  onChange={e => setGradient(prev => ({ ...prev, blurRadius: parseInt(e.target.value) || 0 }))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                />
              </div>

              {/* Angle / Flow */}
              <div>
                <div className="flex justify-between text-neutral-400 mb-1.5 font-medium">
                  <span>Gradient Angle / Flow</span>
                  <span className="text-fuchsia-400 font-mono">{gradient.angle}°</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={gradient.angle}
                  onChange={e => setGradient(prev => ({ ...prev, angle: parseInt(e.target.value) || 0 }))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* PANEL 2.5: COMPREHENSIVE PHOTOSHOP-STYLE BLUR SUITE PANEL */}
        <div className="rounded-xl border border-neutral-850 bg-neutral-900/60 overflow-hidden">
          <button
            onClick={() => toggleSection('blurSuite')}
            className="w-full p-3 flex items-center justify-between text-xs font-semibold text-neutral-200 hover:bg-neutral-850 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Aperture className="w-4 h-4 text-cyan-400" />
              <span>Photoshop Blur Suite Engine</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openSections.blurSuite ? 'rotate-180' : ''}`} />
          </button>

          {openSections.blurSuite && (
            <div className="p-3.5 pt-1 space-y-4 text-xs border-t border-neutral-850">
              {/* Blur Suite Master Switch */}
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-cyan-300 text-[11px]">Photoshop Blur Suite Engine</div>
                  <div className="text-[9px] text-neutral-400">Master Switch for Blur Effects</div>
                </div>
                <input
                  type="checkbox"
                  checked={blur.enabled !== false}
                  onChange={e => setBlur(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-cyan-500 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Gaussian Blur */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-neutral-400 font-medium">
                  <span>Gaussian Blur</span>
                  <span className="font-mono text-cyan-400">{blur.gaussianRadius}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={200}
                  value={blur.gaussianRadius}
                  onChange={e => setBlur(prev => ({ ...prev, gaussianRadius: parseInt(e.target.value) || 0 }))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* Motion Blur */}
              <div className="border-t border-neutral-850 pt-3 space-y-2">
                <div className="text-[11px] font-semibold text-neutral-300">Motion Blur</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-neutral-400">Angle ({blur.motionAngle}°)</label>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={blur.motionAngle}
                      onChange={e => setBlur(prev => ({ ...prev, motionAngle: parseInt(e.target.value) || 0 }))}
                      className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400">Distance ({blur.motionDistance}px)</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={blur.motionDistance}
                      onChange={e => setBlur(prev => ({ ...prev, motionDistance: parseInt(e.target.value) || 0 }))}
                      className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Radial Blur */}
              <div className="border-t border-neutral-850 pt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-semibold text-neutral-300">Radial Blur</span>
                  <div className="flex space-x-1 bg-neutral-950 p-0.5 rounded border border-neutral-800">
                    <button
                      onClick={() => setBlur(prev => ({ ...prev, radialMode: 'spin' }))}
                      className={`px-2 py-0.5 text-[10px] rounded ${blur.radialMode === 'spin' ? 'bg-cyan-600 text-white' : 'text-neutral-400'}`}
                    >
                      Spin
                    </button>
                    <button
                      onClick={() => setBlur(prev => ({ ...prev, radialMode: 'zoom' }))}
                      className={`px-2 py-0.5 text-[10px] rounded ${blur.radialMode === 'zoom' ? 'bg-cyan-600 text-white' : 'text-neutral-400'}`}
                    >
                      Zoom
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-neutral-400">
                    <span>Strength / Amount</span>
                    <span className="font-mono text-cyan-400">{blur.radialAmount}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={blur.radialAmount}
                    onChange={e => setBlur(prev => ({ ...prev, radialAmount: parseInt(e.target.value) || 0 }))}
                    className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              </div>

              {/* Surface Blur */}
              <div className="border-t border-neutral-850 pt-3 space-y-2">
                <div className="text-[11px] font-semibold text-neutral-300">Surface / Box Edge Blur</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-neutral-400">Radius ({blur.surfaceRadius}px)</label>
                    <input
                      type="range"
                      min={0}
                      max={50}
                      value={blur.surfaceRadius}
                      onChange={e => setBlur(prev => ({ ...prev, surfaceRadius: parseInt(e.target.value) || 0 }))}
                      className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400">Threshold ({blur.surfaceThreshold})</label>
                    <input
                      type="range"
                      min={0}
                      max={255}
                      value={blur.surfaceThreshold}
                      onChange={e => setBlur(prev => ({ ...prev, surfaceThreshold: parseInt(e.target.value) || 0 }))}
                      className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PANEL 2.8: FILTER GALLERY ENGINE */}
        <div className="rounded-xl border border-neutral-850 bg-neutral-900/60 overflow-hidden">
          <button
            onClick={() => toggleSection('filterGallery')}
            className="w-full p-3 flex items-center justify-between text-xs font-semibold text-neutral-200 hover:bg-neutral-850 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Tv className="w-4 h-4 text-purple-400" />
              <span>Photoshop Filter Gallery Suite</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openSections.filterGallery ? 'rotate-180' : ''}`} />
          </button>

          {openSections.filterGallery && (
            <div className="p-3.5 pt-1 space-y-4 text-xs border-t border-neutral-850">
              {/* Glass / Ripple */}
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-purple-300 text-[11px]">Glass & Ripple Effect</span>
                  <input
                    type="checkbox"
                    checked={filterGallery.glassRipple.enabled}
                    onChange={e => setFilterGallery(prev => ({
                      ...prev,
                      glassRipple: { ...prev.glassRipple, enabled: e.target.checked }
                    }))}
                    className="w-3.5 h-3.5 rounded border-neutral-700 bg-neutral-900 text-purple-500 focus:ring-0"
                  />
                </div>
                {filterGallery.glassRipple.enabled && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] text-neutral-400">Distortion ({filterGallery.glassRipple.distortion})</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={filterGallery.glassRipple.distortion}
                        onChange={e => setFilterGallery(prev => ({
                          ...prev,
                          glassRipple: { ...prev.glassRipple, distortion: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400">Smoothness ({filterGallery.glassRipple.smoothness})</label>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={filterGallery.glassRipple.smoothness}
                        onChange={e => setFilterGallery(prev => ({
                          ...prev,
                          glassRipple: { ...prev.glassRipple, smoothness: parseInt(e.target.value) || 1 }
                        }))}
                        className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Plastic Wrap */}
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-purple-300 text-[11px]">Plastic Wrap Shine</span>
                  <input
                    type="checkbox"
                    checked={filterGallery.plasticWrap.enabled}
                    onChange={e => setFilterGallery(prev => ({
                      ...prev,
                      plasticWrap: { ...prev.plasticWrap, enabled: e.target.checked }
                    }))}
                    className="w-3.5 h-3.5 rounded border-neutral-700 bg-neutral-900 text-purple-500 focus:ring-0"
                  />
                </div>
                {filterGallery.plasticWrap.enabled && (
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <div>
                      <label className="text-[10px] text-neutral-400">Shine</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={filterGallery.plasticWrap.shine}
                        onChange={e => setFilterGallery(prev => ({
                          ...prev,
                          plasticWrap: { ...prev.plasticWrap, shine: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400">Detail</label>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={filterGallery.plasticWrap.detail}
                        onChange={e => setFilterGallery(prev => ({
                          ...prev,
                          plasticWrap: { ...prev.plasticWrap, detail: parseInt(e.target.value) || 1 }
                        }))}
                        className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400">Depth</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={filterGallery.plasticWrap.depth}
                        onChange={e => setFilterGallery(prev => ({
                          ...prev,
                          plasticWrap: { ...prev.plasticWrap, depth: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Halftone Pattern */}
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-purple-300 text-[11px]">Halftone Screen Pattern</span>
                  <input
                    type="checkbox"
                    checked={filterGallery.halftone.enabled}
                    onChange={e => setFilterGallery(prev => ({
                      ...prev,
                      halftone: { ...prev.halftone, enabled: e.target.checked }
                    }))}
                    className="w-3.5 h-3.5 rounded border-neutral-700 bg-neutral-900 text-purple-500 focus:ring-0"
                  />
                </div>
                {filterGallery.halftone.enabled && (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-3 gap-1">
                      {(['dot', 'line', 'circle', 'ellipse', 'cross', 'diamond'] as const).map(pat => (
                        <button
                          key={pat}
                          type="button"
                          onClick={() => setFilterGallery(prev => ({
                            ...prev,
                            halftone: { ...prev.halftone, pattern: pat }
                          }))}
                          className={`py-0.5 rounded text-[9px] uppercase font-mono border ${filterGallery.halftone.pattern === pat ? 'bg-purple-600/30 text-purple-300 border-purple-500 font-bold' : 'bg-neutral-900 border-neutral-800 text-neutral-400'}`}
                        >
                          {pat}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-neutral-400">Size ({filterGallery.halftone.size}px)</label>
                        <input
                          type="range"
                          min={2}
                          max={30}
                          value={filterGallery.halftone.size}
                          onChange={e => setFilterGallery(prev => ({
                            ...prev,
                            halftone: { ...prev.halftone, size: parseInt(e.target.value) || 2 }
                          }))}
                          className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-neutral-400">Angle ({filterGallery.halftone.angle || 0}°)</label>
                        <input
                          type="range"
                          min={0}
                          max={180}
                          value={filterGallery.halftone.angle || 0}
                          onChange={e => setFilterGallery(prev => ({
                            ...prev,
                            halftone: { ...prev.halftone, angle: parseInt(e.target.value) || 0 }
                          }))}
                          className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Grungy Texture Generator */}
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-purple-300 text-[11px]">Procedural Grungy Texture</span>
                  <input
                    type="checkbox"
                    checked={filterGallery.grungyTexture?.enabled || false}
                    onChange={e => setFilterGallery(prev => ({
                      ...prev,
                      grungyTexture: {
                        enabled: e.target.checked,
                        textureType: prev.grungyTexture?.textureType || 'scratches',
                        intensity: prev.grungyTexture?.intensity || 40,
                        scale: prev.grungyTexture?.scale || 1.0,
                        contrast: prev.grungyTexture?.contrast || 50,
                        invert: prev.grungyTexture?.invert || false,
                        opacity: prev.grungyTexture?.opacity || 70
                      }
                    }))}
                    className="w-3.5 h-3.5 rounded border-neutral-700 bg-neutral-900 text-purple-500 focus:ring-0"
                  />
                </div>
                {filterGallery.grungyTexture?.enabled && (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 gap-1">
                      {(['scratches', 'vintage_paper', 'film_spots', 'distressed'] as const).map(tt => (
                        <button
                          key={tt}
                          type="button"
                          onClick={() => setFilterGallery(prev => ({
                            ...prev,
                            grungyTexture: {
                              ...prev.grungyTexture!,
                              textureType: tt
                            }
                          }))}
                          className={`py-0.5 px-1 rounded text-[9px] font-mono border truncate ${filterGallery.grungyTexture?.textureType === tt ? 'bg-purple-600/30 text-purple-300 border-purple-500 font-bold' : 'bg-neutral-900 border-neutral-800 text-neutral-400'}`}
                        >
                          {tt.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-neutral-400">Intensity ({filterGallery.grungyTexture?.intensity}%)</label>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={filterGallery.grungyTexture?.intensity || 40}
                          onChange={e => setFilterGallery(prev => ({
                            ...prev,
                            grungyTexture: { ...prev.grungyTexture!, intensity: parseInt(e.target.value) || 0 }
                          }))}
                          className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-neutral-400">Scale ({filterGallery.grungyTexture?.scale || 1.0}x)</label>
                        <input
                          type="range"
                          min={0.2}
                          max={3.0}
                          step={0.1}
                          value={filterGallery.grungyTexture?.scale || 1.0}
                          onChange={e => setFilterGallery(prev => ({
                            ...prev,
                            grungyTexture: { ...prev.grungyTexture!, scale: parseFloat(e.target.value) || 1.0 }
                          }))}
                          className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mosaic / Stained Glass */}
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-purple-300 text-[11px]">Mosaic & Stained Glass</span>
                  <input
                    type="checkbox"
                    checked={filterGallery.mosaicStainedGlass.enabled}
                    onChange={e => setFilterGallery(prev => ({
                      ...prev,
                      mosaicStainedGlass: { ...prev.mosaicStainedGlass, enabled: e.target.checked }
                    }))}
                    className="w-3.5 h-3.5 rounded border-neutral-700 bg-neutral-900 text-purple-500 focus:ring-0"
                  />
                </div>
                {filterGallery.mosaicStainedGlass.enabled && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] text-neutral-400">Cell Size ({filterGallery.mosaicStainedGlass.cellSize}px)</label>
                      <input
                        type="range"
                        min={2}
                        max={50}
                        value={filterGallery.mosaicStainedGlass.cellSize}
                        onChange={e => setFilterGallery(prev => ({
                          ...prev,
                          mosaicStainedGlass: { ...prev.mosaicStainedGlass, cellSize: parseInt(e.target.value) || 2 }
                        }))}
                        className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400">Border ({filterGallery.mosaicStainedGlass.borderWidth}px)</label>
                      <input
                        type="range"
                        min={0}
                        max={10}
                        value={filterGallery.mosaicStainedGlass.borderWidth}
                        onChange={e => setFilterGallery(prev => ({
                          ...prev,
                          mosaicStainedGlass: { ...prev.mosaicStainedGlass, borderWidth: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Grain & Rough Texture */}
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-purple-300 text-[11px]">Rough Surface Texture</span>
                  <input
                    type="checkbox"
                    checked={filterGallery.roughTexture.enabled}
                    onChange={e => setFilterGallery(prev => ({
                      ...prev,
                      roughTexture: { ...prev.roughTexture, enabled: e.target.checked }
                    }))}
                    className="w-3.5 h-3.5 rounded border-neutral-700 bg-neutral-900 text-purple-500 focus:ring-0"
                  />
                </div>
                {filterGallery.roughTexture.enabled && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] text-neutral-400">Graininess</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={filterGallery.roughTexture.graininess}
                        onChange={e => setFilterGallery(prev => ({
                          ...prev,
                          roughTexture: { ...prev.roughTexture, graininess: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400">Highlight Boost</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={filterGallery.roughTexture.highlightIntensity}
                        onChange={e => setFilterGallery(prev => ({
                          ...prev,
                          roughTexture: { ...prev.roughTexture, highlightIntensity: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* PANEL: HALFTONE DESIGN ENGINE (Adobe Illustrator Color Halftone) */}
        <div className="rounded-xl border border-neutral-850 bg-neutral-900/60 overflow-hidden">
          <button
            onClick={() => toggleSection('halftone')}
            className="w-full p-3 flex items-center justify-between text-xs font-semibold text-neutral-200 hover:bg-neutral-850 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Grid className="w-4 h-4 text-purple-400" />
              <span>Color Halftone (Illustrator Engine)</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openSections.halftone ? 'rotate-180' : ''}`} />
          </button>

          {openSections.halftone && (
            <div className="p-3.5 pt-1 space-y-4 text-xs border-t border-neutral-850">
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-purple-300 text-[11px]">Effect &gt; Pixelate &gt; Color Halftone</div>
                  <div className="text-[9px] text-neutral-400">Adobe Illustrator CMYK Screen Engine</div>
                </div>
                <input
                  type="checkbox"
                  checked={filterGallery.halftone.enabled}
                  onChange={e => setFilterGallery(prev => ({
                    ...prev,
                    halftone: { ...prev.halftone, enabled: e.target.checked }
                  }))}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-purple-500 focus:ring-0 cursor-pointer"
                />
              </div>

              {filterGallery.halftone.enabled && (
                <div className="space-y-3.5">
                  {/* Presets Dropdown */}
                  <div>
                    <label className="block text-neutral-400 font-medium mb-1.5 text-[10px] uppercase tracking-wider">
                      Halftone Style Presets
                    </label>
                    <select
                      value={filterGallery.halftone.preset || 'custom'}
                      onChange={e => {
                        const val = e.target.value as any;
                        let updates: Partial<typeof filterGallery.halftone> = { preset: val };
                        if (val === 'cmyk_offset') {
                          updates = { preset: val, maxRadius: 8, channel1Angle: 108, channel2Angle: 162, channel3Angle: 90, channel4Angle: 45 };
                        } else if (val === 'vintage_comic') {
                          updates = { preset: val, maxRadius: 12, channel1Angle: 105, channel2Angle: 75, channel3Angle: 0, channel4Angle: 45 };
                        } else if (val === 'newspaper') {
                          updates = { preset: val, maxRadius: 10, channel1Angle: 45, channel2Angle: 45, channel3Angle: 45, channel4Angle: 45 };
                        } else if (val === 'pop_art') {
                          updates = { preset: val, maxRadius: 20, channel1Angle: 120, channel2Angle: 60, channel3Angle: 0, channel4Angle: 90 };
                        }
                        setFilterGallery(prev => ({
                          ...prev,
                          halftone: { ...prev.halftone, ...updates }
                        }));
                      }}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value="cmyk_offset">Classic CMYK Offset Print (Illustrator Default)</option>
                      <option value="vintage_comic">Vintage Comic Book (Retro Screen)</option>
                      <option value="newspaper">Monochrome Newspaper Screen</option>
                      <option value="pop_art">Pop Art Retro (Heavy Dots)</option>
                      <option value="custom">Custom Angle Matrix</option>
                    </select>
                  </div>

                  {/* Max Radius Control (Slider & Numeric Input) */}
                  <div className="p-2.5 rounded-lg bg-neutral-950/70 border border-neutral-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-neutral-300">Max Radius (Dot Size)</label>
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          min={4}
                          max={250}
                          value={filterGallery.halftone.maxRadius ?? filterGallery.halftone.size ?? 8}
                          onChange={e => {
                            const val = Math.max(4, Math.min(250, parseInt(e.target.value) || 4));
                            setFilterGallery(prev => ({
                              ...prev,
                              halftone: { ...prev.halftone, maxRadius: val, size: val, preset: 'custom' }
                            }));
                          }}
                          className="w-14 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 text-right text-[11px] font-mono text-purple-300 focus:outline-none focus:border-purple-500"
                        />
                        <span className="text-[10px] text-neutral-500">px</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={4}
                      max={250}
                      value={filterGallery.halftone.maxRadius ?? filterGallery.halftone.size ?? 8}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 4;
                        setFilterGallery(prev => ({
                          ...prev,
                          halftone: { ...prev.halftone, maxRadius: val, size: val, preset: 'custom' }
                        }));
                      }}
                      className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>

                  {/* CMYK Channel Screen Angles */}
                  <div>
                    <label className="block text-neutral-400 font-medium mb-1.5 text-[10px] uppercase tracking-wider">
                      Screen Angles (CMYK Channels 1–4)
                    </label>
                    <div className="space-y-2 p-2.5 bg-neutral-950/80 rounded-lg border border-neutral-800">
                      {/* Channel 1: Cyan */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-semibold text-cyan-400">Channel 1 (Cyan Angle)</span>
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              min={0}
                              max={360}
                              value={filterGallery.halftone.channel1Angle ?? 108}
                              onChange={e => {
                                const val = Math.max(0, Math.min(360, parseInt(e.target.value) || 0));
                                setFilterGallery(prev => ({
                                  ...prev,
                                  halftone: { ...prev.halftone, channel1Angle: val, preset: 'custom' }
                                }));
                              }}
                              className="w-12 bg-neutral-900 border border-neutral-700 rounded px-1 py-0.5 text-right font-mono text-cyan-300 text-[10px]"
                            />
                            <span className="text-neutral-500">°</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={360}
                          value={filterGallery.halftone.channel1Angle ?? 108}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 0;
                            setFilterGallery(prev => ({
                              ...prev,
                              halftone: { ...prev.halftone, channel1Angle: val, preset: 'custom' }
                            }));
                          }}
                          className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-cyan-400"
                        />
                      </div>

                      {/* Channel 2: Magenta */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-semibold text-fuchsia-400">Channel 2 (Magenta Angle)</span>
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              min={0}
                              max={360}
                              value={filterGallery.halftone.channel2Angle ?? 162}
                              onChange={e => {
                                const val = Math.max(0, Math.min(360, parseInt(e.target.value) || 0));
                                setFilterGallery(prev => ({
                                  ...prev,
                                  halftone: { ...prev.halftone, channel2Angle: val, preset: 'custom' }
                                }));
                              }}
                              className="w-12 bg-neutral-900 border border-neutral-700 rounded px-1 py-0.5 text-right font-mono text-fuchsia-300 text-[10px]"
                            />
                            <span className="text-neutral-500">°</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={360}
                          value={filterGallery.halftone.channel2Angle ?? 162}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 0;
                            setFilterGallery(prev => ({
                              ...prev,
                              halftone: { ...prev.halftone, channel2Angle: val, preset: 'custom' }
                            }));
                          }}
                          className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-fuchsia-400"
                        />
                      </div>

                      {/* Channel 3: Yellow */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-semibold text-yellow-400">Channel 3 (Yellow Angle)</span>
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              min={0}
                              max={360}
                              value={filterGallery.halftone.channel3Angle ?? 90}
                              onChange={e => {
                                const val = Math.max(0, Math.min(360, parseInt(e.target.value) || 0));
                                setFilterGallery(prev => ({
                                  ...prev,
                                  halftone: { ...prev.halftone, channel3Angle: val, preset: 'custom' }
                                }));
                              }}
                              className="w-12 bg-neutral-900 border border-neutral-700 rounded px-1 py-0.5 text-right font-mono text-yellow-300 text-[10px]"
                            />
                            <span className="text-neutral-500">°</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={360}
                          value={filterGallery.halftone.channel3Angle ?? 90}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 0;
                            setFilterGallery(prev => ({
                              ...prev,
                              halftone: { ...prev.halftone, channel3Angle: val, preset: 'custom' }
                            }));
                          }}
                          className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-yellow-400"
                        />
                      </div>

                      {/* Channel 4: Black / Key */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-semibold text-neutral-300">Channel 4 (Black/Key Angle)</span>
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              min={0}
                              max={360}
                              value={filterGallery.halftone.channel4Angle ?? 45}
                              onChange={e => {
                                const val = Math.max(0, Math.min(360, parseInt(e.target.value) || 0));
                                setFilterGallery(prev => ({
                                  ...prev,
                                  halftone: { ...prev.halftone, channel4Angle: val, preset: 'custom' }
                                }));
                              }}
                              className="w-12 bg-neutral-900 border border-neutral-700 rounded px-1 py-0.5 text-right font-mono text-neutral-200 text-[10px]"
                            />
                            <span className="text-neutral-500">°</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={360}
                          value={filterGallery.halftone.channel4Angle ?? 45}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 0;
                            setFilterGallery(prev => ({
                              ...prev,
                              halftone: { ...prev.halftone, channel4Angle: val, preset: 'custom' }
                            }));
                          }}
                          className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-neutral-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pattern Shape Selection */}
                  <div>
                    <label className="block text-neutral-400 font-medium mb-1.5 text-[10px] uppercase tracking-wider">
                      Pattern Grid Shape
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['dot', 'line', 'circle', 'ellipse', 'cross', 'diamond'] as const).map(pat => (
                        <button
                          key={pat}
                          type="button"
                          onClick={() => setFilterGallery(prev => ({
                            ...prev,
                            halftone: { ...prev.halftone, pattern: pat }
                          }))}
                          className={`py-1 rounded text-[10px] uppercase font-mono border transition-all ${filterGallery.halftone.pattern === pat ? 'bg-purple-600/30 text-purple-300 border-purple-500 font-bold' : 'bg-neutral-900 border-neutral-800 text-neutral-400'}`}
                        >
                          {pat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Contrast and Opacity */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-neutral-400">Dot Contrast ({filterGallery.halftone.contrast ?? 50}%)</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={filterGallery.halftone.contrast ?? 50}
                        onChange={e => setFilterGallery(prev => ({
                          ...prev,
                          halftone: { ...prev.halftone, contrast: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400">Opacity ({filterGallery.halftone.opacity ?? 100}%)</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={filterGallery.halftone.opacity ?? 100}
                        onChange={e => setFilterGallery(prev => ({
                          ...prev,
                          halftone: { ...prev.halftone, opacity: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PANEL: VOLUMETRIC LIGHTING & 3D DEPTH */}
        <div className="rounded-xl border border-neutral-850 bg-neutral-900/60 overflow-hidden">
          <button
            onClick={() => toggleSection('volumetric')}
            className="w-full p-3 flex items-center justify-between text-xs font-semibold text-neutral-200 hover:bg-neutral-850 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Aperture className="w-4 h-4 text-amber-400" />
              <span>Volumetric Lighting & 3D Depth</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openSections.volumetric ? 'rotate-180' : ''}`} />
          </button>

          {openSections.volumetric && (
            <div className="p-3.5 pt-1 space-y-4 text-xs border-t border-neutral-850">
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-amber-300 text-[11px]">3D Normal Mapping & Volumetric Light</div>
                  <div className="text-[9px] text-neutral-400">Directional Light Source & AO Shadows</div>
                </div>
                <input
                  type="checkbox"
                  checked={filterGallery.volumetricLighting?.enabled || false}
                  onChange={e => setFilterGallery(prev => ({
                    ...prev,
                    volumetricLighting: {
                      enabled: e.target.checked,
                      intensity: prev.volumetricLighting?.intensity || 60,
                      angle: prev.volumetricLighting?.angle || 45,
                      ambientOcclusion: prev.volumetricLighting?.ambientOcclusion || 35,
                      rimLighting: prev.volumetricLighting?.rimLighting || 40,
                      depthScale: prev.volumetricLighting?.depthScale || 50
                    }
                  }))}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-0 cursor-pointer"
                />
              </div>

              {filterGallery.volumetricLighting?.enabled && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-neutral-400">Intensity ({filterGallery.volumetricLighting?.intensity || 60}%)</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={filterGallery.volumetricLighting?.intensity || 60}
                        onChange={e => setFilterGallery(prev => ({
                          ...prev,
                          volumetricLighting: { ...prev.volumetricLighting!, intensity: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400">Light Angle ({filterGallery.volumetricLighting?.angle || 45}°)</label>
                      <input
                        type="range"
                        min={0}
                        max={360}
                        value={filterGallery.volumetricLighting?.angle || 45}
                        onChange={e => setFilterGallery(prev => ({
                          ...prev,
                          volumetricLighting: { ...prev.volumetricLighting!, angle: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <div>
                      <label className="text-[10px] text-neutral-400">Depth</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={filterGallery.volumetricLighting?.depthScale || 50}
                        onChange={e => setFilterGallery(prev => ({
                          ...prev,
                          volumetricLighting: { ...prev.volumetricLighting!, depthScale: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400">AO Shadow</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={filterGallery.volumetricLighting?.ambientOcclusion || 35}
                        onChange={e => setFilterGallery(prev => ({
                          ...prev,
                          volumetricLighting: { ...prev.volumetricLighting!, ambientOcclusion: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400">Rim Light</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={filterGallery.volumetricLighting?.rimLighting || 40}
                        onChange={e => setFilterGallery(prev => ({
                          ...prev,
                          volumetricLighting: { ...prev.volumetricLighting!, rimLighting: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PANEL 3: GRAIN & NOISE ENGINE */}
        <div className="rounded-xl border border-neutral-850 bg-neutral-900/60 overflow-hidden">
          <button
            onClick={() => toggleSection('grain')}
            className="w-full p-3 flex items-center justify-between text-xs font-semibold text-neutral-200 hover:bg-neutral-850 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <span>Grain & Film Noise Engine</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openSections.grain ? 'rotate-180' : ''}`} />
          </button>

          {openSections.grain && (
            <div className="p-3.5 pt-1 space-y-4 text-xs border-t border-neutral-850">
              {/* Grain / Grainless Mode Master Toggle */}
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-amber-300 text-[11px]">Grain Overlay Engine</div>
                  <div className="text-[9px] text-neutral-400">Toggle for Grainless / Ultra-Clean Gradients</div>
                </div>
                <input
                  type="checkbox"
                  checked={noise.enabled !== false}
                  onChange={e => setNoise(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-0 cursor-pointer"
                />
              </div>
              {/* Noise Type */}
              <div>
                <label className="block text-neutral-400 font-medium mb-1.5">Noise Type</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['monochromatic', 'gaussian', 'perlin', 'blue'] as NoiseType[]).map(nt => (
                    <button
                      key={nt}
                      onClick={() => setNoise(prev => ({ ...prev, type: nt }))}
                      className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium capitalize transition-all ${
                        noise.type === nt
                          ? 'bg-amber-600/20 text-amber-300 border-amber-500/50 shadow-sm'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {nt === 'monochromatic' ? 'Mono 35mm' : nt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Anti-Banding Dithering Toggle */}
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-emerald-300 font-medium text-[11px]">Anti-Banding Dithering Engine</div>
                    <div className="text-[9px] text-emerald-400/70">100% Pass Rate Microstock Filter</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={noise.antiBandingDither}
                  onChange={e => setNoise(prev => ({ ...prev, antiBandingDither: e.target.checked }))}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Intensity */}
              <div>
                <div className="flex justify-between text-neutral-400 mb-1.5 font-medium">
                  <span>Grain Intensity</span>
                  <span className="text-amber-400 font-mono">{noise.intensity}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={noise.intensity}
                  onChange={e => setNoise(prev => ({ ...prev, intensity: parseInt(e.target.value) || 0 }))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              {/* Scale / Size */}
              <div>
                <div className="flex justify-between text-neutral-400 mb-1.5 font-medium">
                  <span>Grain Scale / Size</span>
                  <span className="text-amber-400 font-mono">{noise.scale.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={4.0}
                  step={0.1}
                  value={noise.scale}
                  onChange={e => setNoise(prev => ({ ...prev, scale: parseFloat(e.target.value) || 1.0 }))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              {/* Opacity & Advanced Blend Mode */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-neutral-400 font-medium block mb-1">Opacity</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={noise.opacity}
                    onChange={e => setNoise(prev => ({ ...prev, opacity: parseInt(e.target.value) || 0 }))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 font-medium block mb-1">Layer Blend Mode</label>
                  <select
                    value={noise.blendMode}
                    onChange={e => setNoise(prev => ({ ...prev, blendMode: e.target.value as GrainBlendMode }))}
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-[11px] rounded px-2 py-1 focus:outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="overlay">Overlay</option>
                    <option value="soft-light">Soft Light</option>
                    <option value="hard-light">Hard Light</option>
                    <option value="multiply">Multiply</option>
                    <option value="screen">Screen</option>
                    <option value="color-dodge">Color Dodge</option>
                    <option value="linear-burn">Linear Burn</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PANEL 4: CAMERA RAW POST-PROCESSING PANEL */}
        <div className="rounded-xl border border-neutral-850 bg-neutral-900/60 overflow-hidden">
          <button
            onClick={() => toggleSection('camera')}
            className="w-full p-3 flex items-center justify-between text-xs font-semibold text-neutral-200 hover:bg-neutral-850 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>Camera Raw Post-Processing</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openSections.camera ? 'rotate-180' : ''}`} />
          </button>

          {openSections.camera && (
            <div className="p-3.5 pt-1 space-y-4 text-xs border-t border-neutral-850">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-neutral-400 font-mono">Pixel-Level Light & Tone</span>
                <button
                  onClick={onResetCameraRaw}
                  className="text-[10px] text-neutral-400 hover:text-white flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All</span>
                </button>
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Exposure</span>
                    <span className="font-mono text-cyan-400">{cameraRaw.exposure}</span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={cameraRaw.exposure}
                    onChange={e => setCameraRaw(prev => ({ ...prev, exposure: parseInt(e.target.value) || 0 }))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Contrast</span>
                    <span className="font-mono text-cyan-400">{cameraRaw.contrast}</span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={cameraRaw.contrast}
                    onChange={e => setCameraRaw(prev => ({ ...prev, contrast: parseInt(e.target.value) || 0 }))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Highlights</span>
                    <span className="font-mono text-cyan-400">{cameraRaw.highlights}</span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={cameraRaw.highlights}
                    onChange={e => setCameraRaw(prev => ({ ...prev, highlights: parseInt(e.target.value) || 0 }))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Shadows</span>
                    <span className="font-mono text-cyan-400">{cameraRaw.shadows}</span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={cameraRaw.shadows}
                    onChange={e => setCameraRaw(prev => ({ ...prev, shadows: parseInt(e.target.value) || 0 }))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              </div>

              {/* Clarity & Texture */}
              <div className="grid grid-cols-2 gap-3 border-t border-neutral-850 pt-2">
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Clarity</span>
                    <span className="font-mono text-cyan-400">{cameraRaw.clarity}</span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={cameraRaw.clarity}
                    onChange={e => setCameraRaw(prev => ({ ...prev, clarity: parseInt(e.target.value) || 0 }))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Texture</span>
                    <span className="font-mono text-cyan-400">{cameraRaw.texture}</span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={cameraRaw.texture}
                    onChange={e => setCameraRaw(prev => ({ ...prev, texture: parseInt(e.target.value) || 0 }))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              </div>

              {/* Vibrance & Saturation */}
              <div className="grid grid-cols-2 gap-3 border-t border-neutral-850 pt-2">
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Vibrance</span>
                    <span className="font-mono text-cyan-400">{cameraRaw.vibrance}</span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={cameraRaw.vibrance}
                    onChange={e => setCameraRaw(prev => ({ ...prev, vibrance: parseInt(e.target.value) || 0 }))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Saturation</span>
                    <span className="font-mono text-cyan-400">{cameraRaw.saturation}</span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={cameraRaw.saturation}
                    onChange={e => setCameraRaw(prev => ({ ...prev, saturation: parseInt(e.target.value) || 0 }))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              </div>

              {/* Vignette */}
              <div className="border-t border-neutral-850 pt-2 space-y-2">
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>Vignette Overlay</span>
                  <span className="font-mono text-cyan-400">{cameraRaw.vignetteAmount}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={cameraRaw.vignetteAmount}
                  onChange={e => setCameraRaw(prev => ({ ...prev, vignetteAmount: parseInt(e.target.value) || 0 }))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* PANEL 5: COLOR RULES ENGINE */}
        <div className="rounded-xl border border-neutral-850 bg-neutral-900/60 overflow-hidden">
          <button
            onClick={() => toggleSection('rules')}
            className="w-full p-3 flex items-center justify-between text-xs font-semibold text-neutral-200 hover:bg-neutral-850 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Smart Palette Rules Engine</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openSections.rules ? 'rotate-180' : ''}`} />
          </button>

          {openSections.rules && (
            <div className="p-3.5 pt-1 space-y-4 text-xs border-t border-neutral-850">
              {/* Palette Mode */}
              <div>
                <label className="block text-neutral-400 font-medium mb-1.5">Color Harmony & Aesthetic Theme</label>
                <select
                  value={colorRules.paletteMode}
                  onChange={e => setColorRules(prev => ({ ...prev, paletteMode: e.target.value as PaletteMode }))}
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-[11px] rounded-lg px-2.5 py-1.5"
                >
                  <optgroup label="Aesthetic Themes">
                    <option value="all_random">🎨 All Random (Full 16M Spectrum)</option>
                    <option value="vintage_retro">📜 Vintage & Retro (Warm Earthy Muted)</option>
                    <option value="neon_cyberpunk">⚡ Neon & Cyberpunk (High Saturation Electric)</option>
                    <option value="pastel_soft">🌸 Pastel & Soft (Soothing Low-Sat Tones)</option>
                    <option value="deep_dark">🌌 Deep & Dark (Moody Rich Dark Tones)</option>
                  </optgroup>
                  <optgroup label="Harmonic Rules">
                    <option value="strictly_unique">Strictly Unique (&gt;70% Variation)</option>
                    <option value="analogous">Analogous Harmony</option>
                    <option value="triadic">Triadic Vibrant</option>
                    <option value="monochromatic">Monochromatic Shade</option>
                  </optgroup>
                </select>
              </div>

              {/* Rules Checkboxes */}
              <div className="space-y-2 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!colorRules.allowColorReuse}
                    onChange={e => setColorRules(prev => ({ ...prev, allowColorReuse: !e.target.checked }))}
                    className="w-3.5 h-3.5 rounded border-neutral-800 text-emerald-500 focus:ring-0"
                  />
                  <span className="text-neutral-300 text-[11px]">Enforce Non-Repeating Palettes</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={colorRules.enforceUniqueStyles}
                    onChange={e => setColorRules(prev => ({ ...prev, enforceUniqueStyles: e.target.checked }))}
                    className="w-3.5 h-3.5 rounded border-neutral-800 text-emerald-500 focus:ring-0"
                  />
                  <span className="text-neutral-300 text-[11px]">&gt;70% Distinction Algorithm Active</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
