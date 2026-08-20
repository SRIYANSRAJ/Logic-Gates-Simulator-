/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useCircuit } from '../../context/CircuitContext';
import { getPresetCircuits, PresetCircuit } from '../../engine/presets';
import { BookOpen, Cpu, FolderOpen, Sparkles, X, ArrowRight } from 'lucide-react';

export const PresetsModal: React.FC = () => {
  const { activeModal, setActiveModal, loadPreset } = useCircuit();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (activeModal !== 'presets') return null;

  const presets = getPresetCircuits();

  const categories = [
    { id: 'all', name: 'All Presets' },
    { id: 'COMBINATIONAL', name: 'Combinational Logic' },
    { id: 'ARITHMETIC', name: 'Arithmetic & ALUs' },
    { id: 'SEQUENTIAL', name: 'Sequential & Memory' },
    { id: 'SYSTEMS', name: 'Digital Systems & Displays' },
  ];

  const filtered = presets.filter(
    (p) => selectedCategory === 'all' || p.category === selectedCategory
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-4xl flex flex-col shadow-2xl overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm">Preset Circuits Library</h2>
              <p className="text-xs text-slate-400">
                Explore pre-built textbook circuits, adders, latches, and digital systems
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal('none')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-2 px-5 py-3 border-b border-slate-800 bg-slate-950/40 overflow-x-auto text-xs font-semibold">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Presets Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((preset) => (
            <div
              key={preset.id}
              className="p-4 bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all flex flex-col justify-between group"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100 text-sm group-hover:text-blue-400 transition-colors">
                    {preset.name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                    {preset.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{preset.description}</p>
                <div className="flex gap-3 text-[11px] text-slate-500 font-mono pt-1">
                  <span>{preset.components.length} Components</span>
                  <span>•</span>
                  <span>{preset.wires.length} Wires</span>
                </div>
              </div>

              <button
                onClick={() => loadPreset(preset)}
                className="mt-4 w-full py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border border-blue-500/30"
              >
                <span>Load into Canvas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
