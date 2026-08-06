import React, { useState } from 'react';
import { Tag, Copy, Check, X, FileSpreadsheet, Sparkles, Plus, Trash2 } from 'lucide-react';
import { BatchItem, ItemMetadata } from '../types';

interface MetadataModalProps {
  item: BatchItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveMetadata?: (itemId: string, metadata: ItemMetadata) => void;
}

export const MetadataModal: React.FC<MetadataModalProps> = ({
  item,
  isOpen,
  onClose,
  onSaveMetadata
}) => {
  const [copiedTags, setCopiedTags] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [localMetadata, setLocalMetadata] = useState<ItemMetadata | null>(null);

  React.useEffect(() => {
    if (item) {
      setLocalMetadata({ ...item.metadata });
    }
  }, [item]);

  if (!isOpen || !item || !localMetadata) return null;

  const handleCopyTags = () => {
    navigator.clipboard.writeText(localMetadata.keywords.join(', '));
    setCopiedTags(true);
    setTimeout(() => setCopiedTags(false), 2000);
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    const tagClean = newTag.trim().toLowerCase();
    if (!localMetadata.keywords.includes(tagClean)) {
      const updated = {
        ...localMetadata,
        keywords: [...localMetadata.keywords, tagClean]
      };
      setLocalMetadata(updated);
      if (onSaveMetadata) onSaveMetadata(item.id, updated);
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = {
      ...localMetadata,
      keywords: localMetadata.keywords.filter(t => t !== tagToRemove)
    };
    setLocalMetadata(updated);
    if (onSaveMetadata) onSaveMetadata(item.id, updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Microstock Asset Tags & SEO Metadata</h3>
              <p className="text-xs text-neutral-400">High-converting tags for Adobe Stock, Freepik & Shutterstock</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Asset Title */}
          <div>
            <label className="block text-neutral-400 font-medium mb-1">Microstock Commercial Title</label>
            <input
              type="text"
              value={localMetadata.title}
              onChange={e => {
                const updated = { ...localMetadata, title: e.target.value };
                setLocalMetadata(updated);
                if (onSaveMetadata) onSaveMetadata(item.id, updated);
              }}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-neutral-200 font-medium"
            />
          </div>

          {/* Asset Description */}
          <div>
            <label className="block text-neutral-400 font-medium mb-1">Stock Description</label>
            <textarea
              rows={2}
              value={localMetadata.description}
              onChange={e => {
                const updated = { ...localMetadata, description: e.target.value };
                setLocalMetadata(updated);
                if (onSaveMetadata) onSaveMetadata(item.id, updated);
              }}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-neutral-200"
            />
          </div>

          {/* Metadata Specs & Category */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
              <div className="text-[10px] text-neutral-400 font-mono">Category</div>
              <div className="text-neutral-200 font-medium mt-0.5">{localMetadata.category}</div>
            </div>

            <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
              <div className="text-[10px] text-neutral-400 font-mono">Dominant Hues</div>
              <div className="text-neutral-200 font-medium mt-0.5 truncate">
                {localMetadata.primaryColors.join(', ')}
              </div>
            </div>

            <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
              <div className="text-[10px] text-neutral-400 font-mono">Tag Count</div>
              <div className="text-emerald-400 font-mono font-bold mt-0.5">
                {localMetadata.keywords.length} Keywords
              </div>
            </div>
          </div>

          {/* Keywords Grid & Add Tag Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-neutral-300 font-medium">30-50 Keywords Taxonomy</label>
              <button
                onClick={handleCopyTags}
                className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] flex items-center space-x-1"
              >
                {copiedTags ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedTags ? 'Copied Comma CSV!' : 'Copy Tags (Comma-Separated)'}</span>
              </button>
            </div>

            {/* Add Tag Row */}
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                placeholder="Add custom tag..."
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-neutral-200 text-xs"
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 rounded-lg flex items-center space-x-1 hover:bg-emerald-600/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Tags Badges */}
            <div className="flex flex-wrap gap-1.5 bg-neutral-950 p-3 rounded-xl border border-neutral-800 max-h-48 overflow-y-auto">
              {localMetadata.keywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-neutral-900 text-neutral-300 border border-neutral-800 rounded-md text-[11px] flex items-center space-x-1 group hover:border-neutral-700"
                >
                  <span>{kw}</span>
                  <button
                    onClick={() => handleRemoveTag(kw)}
                    className="text-neutral-500 hover:text-rose-400 ml-1 opacity-60 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg shadow-lg shadow-emerald-600/20"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
