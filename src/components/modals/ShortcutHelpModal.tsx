/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useCircuit } from '../../context/CircuitContext';
import { HelpCircle, Keyboard, X } from 'lucide-react';

export const ShortcutHelpModal: React.FC = () => {
  const { activeModal, setActiveModal } = useCircuit();

  if (activeModal !== 'shortcuts') return null;

  const shortcuts = [
    { key: '/', desc: 'Quick search component library' },
    { key: 'Space', desc: 'Run / Pause simulation engine' },
    { key: 'Ctrl + Z', desc: 'Undo last action (drag, rotate, place, wire, delete)' },
    { key: 'Ctrl + Y / Shift+Z', desc: 'Redo previously undone action' },
    { key: 'Ctrl + C', desc: 'Copy selected components' },
    { key: 'Ctrl + V', desc: 'Paste copied components' },
    { key: 'Ctrl + D', desc: 'Duplicate selected components' },
    { key: 'Ctrl + A', desc: 'Select all components and wires' },
    { key: 'R', desc: 'Rotate selected component 90°' },
    { key: 'F', desc: 'Flip component horizontally' },
    { key: 'Del / Backspace', desc: 'Delete selected components and wires' },
    { key: 'Esc', desc: 'Cancel wire draft or deselect' },
    { key: 'Scroll Wheel', desc: 'Zoom canvas in / out' },
    { key: 'Middle Drag / Space+Drag', desc: 'Pan infinite canvas' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-800 text-slate-300 rounded-lg">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm">Keyboard Shortcuts</h2>
              <p className="text-xs text-slate-400">Boost your circuit design efficiency</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal('none')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto text-xs">
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800/60"
            >
              <span className="text-slate-300">{sc.desc}</span>
              <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-cyan-400 font-mono text-xs font-bold shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
