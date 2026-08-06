import React, { useState } from 'react';
import { Code, Copy, Check, X, Sparkles, FileCode } from 'lucide-react';
import { BatchItem } from '../types';
import { generateCSSCode } from '../utils/metadata';
import { downloadSingleSVG } from '../utils/svgExporter';

interface ExportModalProps {
  item: BatchItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ item, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [downloadingSVG, setDownloadingSVG] = useState(false);

  if (!isOpen || !item) return null;

  const cssCode = generateCSSCode(item);

  const handleCopy = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSVG = async () => {
    try {
      setDownloadingSVG(true);
      await downloadSingleSVG(item);
    } catch (err) {
      console.error('Failed to download SVG:', err);
    } finally {
      setDownloadingSVG(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Export Responsive CSS & SVG Noise</h3>
              <p className="text-xs text-neutral-400">Pure CSS radial-gradient + embedded data URI noise layer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4">
          <div className="relative">
            <pre className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-xs font-mono text-cyan-300 overflow-x-auto max-h-80 leading-relaxed">
              <code>{cssCode}</code>
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium flex items-center space-x-1.5 border border-neutral-700 transition-all active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy CSS'}</span>
            </button>
          </div>

          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 text-xs text-neutral-400 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
              <span>No external images required. Works across all modern browsers.</span>
            </div>
            <span className="font-mono text-[10px] text-neutral-400">Zero Dependencies</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <button
            onClick={handleDownloadSVG}
            disabled={downloadingSVG}
            className="px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 shadow-sm transition-all disabled:opacity-50"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{downloadingSVG ? 'Generating SVG...' : 'Download Vector SVG'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
