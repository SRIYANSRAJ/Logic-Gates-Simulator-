/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useCircuit } from '../../context/CircuitContext';
import { Box, Check, X } from 'lucide-react';

export const CustomGateModal: React.FC = () => {
  const { activeModal, setActiveModal, selection, createCustomGateFromSelection } = useCircuit();
  const [name, setName] = useState('MyCustomIC');
  const [description, setDescription] = useState('Modular Subcircuit IC');
  const [color, setColor] = useState('#8b5cf6');
  const [error, setError] = useState<string | null>(null);

  if (activeModal !== 'customGate') return null;

  const handleCreate = () => {
    setError(null);
    if (!name.trim()) {
      setError('Please enter a name for the custom gate.');
      return;
    }

    const created = createCustomGateFromSelection(name, description, color);
    if (!created) {
      setError(
        'Selection must contain at least 1 input source (Switch/Button/Const) and at least 1 output indicator (LED/Probe).'
      );
      return;
    }

    setActiveModal('none');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm">Package Custom IC Subcircuit</h2>
              <p className="text-xs text-slate-400">Bundle selected gates into a reusable integrated circuit</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal('none')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold">IC Chip Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 1-Bit Full Adder IC"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-semibold focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold">Description:</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Performs binary addition with carry-in"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold">IC Package Accent Color:</label>
            <div className="flex gap-2">
              {['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#334155'].map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-white' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              onClick={() => setActiveModal('none')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-colors shadow-lg flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Create IC Subcircuit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
