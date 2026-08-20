/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useCircuit } from '../../context/CircuitContext';
import { COMPONENT_METADATA } from '../../engine/componentFactory';
import {
  Box,
  Copy,
  Cpu,
  Info,
  Lock,
  LockOpen,
  RotateCw,
  Sliders,
  Sparkles,
  Trash2,
  Undo,
  X,
  Zap,
} from 'lucide-react';

export const Inspector: React.FC = () => {
  const {
    components,
    wires,
    selection,
    simulationState,
    updateComponent,
    setComponentInputCount,
    deleteSelection,
    duplicateSelection,
    rotateSelection,
    flipSelection,
    lockSelection,
    setActiveModal,
    inspectorOpen,
    setInspectorOpen,
  } = useCircuit();

  const selectedComps = components.filter((c) => selection.componentIds.includes(c.id));
  const selectedWires = wires.filter((w) => selection.wireIds.includes(w.id));

  const [customGateName, setCustomGateName] = useState('');

  if (!inspectorOpen) return null;

  const renderContent = () => {
    // 1. Wire Selected
    if (selectedWires.length > 0 && selectedComps.length === 0) {
      const wire = selectedWires[0];
      const fromComp = components.find((c) => c.id === wire.fromComponentId);
      const toComp = components.find((c) => c.id === wire.toComponentId);
      const wireVal = simulationState.wireValues[wire.id] ?? 0;

      return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 font-bold text-slate-100">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Wire Connection</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
              wireVal === 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
            }`}>
              {wireVal === 1 ? 'STATE: HIGH (1)' : 'STATE: LOW (0)'}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Source:</span>
              <span className="font-bold text-slate-200 font-mono">
                {fromComp?.label || fromComp?.name || 'Component'} ({wire.fromPortId})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Destination:</span>
              <span className="font-bold text-slate-200 font-mono">
                {toComp?.label || toComp?.name || 'Component'} ({wire.toPortId})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Wires Selected:</span>
              <span className="font-bold text-slate-200 font-mono">{selectedWires.length}</span>
            </div>
          </div>
        </div>
      );
    }

    // 2. Multiple Components Selected
    if (selectedComps.length > 1) {
      return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60 font-bold text-slate-100">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Multiple Selected ({selectedComps.length})</span>
          </div>

          {/* Group Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={duplicateSelection}
              className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-medium transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </button>
            <button
              onClick={rotateSelection}
              className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-medium transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Rotate 90°</span>
            </button>
            <button
              onClick={lockSelection}
              className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-medium transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Toggle Lock</span>
            </button>
          </div>

          {/* Package into Custom IC Module */}
          <div className="mt-2 p-3 bg-slate-900/60 border border-emerald-500/30 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Box className="w-4 h-4" />
              <span>Package Selection into IC</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Synthesize these selected gates and wires into a reusable custom chip with automatic port mappings.
            </p>
            <button
              onClick={() => setActiveModal('customGate')}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg transition-all shadow-md shadow-emerald-950/40 text-center block"
            >
              Create Custom IC
            </button>
          </div>
        </div>
      );
    }

    // 2. Single Component Selected
    if (selectedComps.length === 1) {
      const comp = selectedComps[0];
      const meta = COMPONENT_METADATA[comp.type] || COMPONENT_METADATA.AND;
      const portVals = simulationState.portValues[comp.id] || {};

      return (
        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-slate-100">{comp.name || comp.type}</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              {comp.type}
            </span>
          </div>

          {/* Label Editor */}
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-medium">Custom Label</label>
            <input
              type="text"
              value={comp.label || ''}
              onChange={(e) => updateComponent(comp.id, { label: e.target.value })}
              placeholder="e.g. Carry In, Data Enable"
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Variable Inputs (If multi-input gate) */}
          {['AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR'].includes(comp.type) && (
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 font-medium">Number of Inputs</label>
              <div className="grid grid-cols-4 gap-1">
                {[2, 3, 4, 8].map((num) => (
                  <button
                    key={num}
                    onClick={() => setComponentInputCount(comp.id, num)}
                    className={`py-1 rounded-md text-xs font-bold transition-colors ${
                      comp.inputCount === num
                        ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live Port Values Inspector */}
          <div className="space-y-1.5">
            <div className="text-[11px] text-slate-400 font-medium">Live Pin States</div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2 space-y-1">
              {comp.ports.map((port) => {
                const val = portVals[port.id] ?? 'Z';
                return (
                  <div key={port.id} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono">
                      [{port.type.toUpperCase()}] {port.name}:
                    </span>
                    <span
                      className={`font-mono font-bold px-1.5 py-0.2 rounded ${
                        val === 1
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : val === 0
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {val}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              onClick={rotateSelection}
              className="flex items-center justify-center gap-1.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg font-semibold transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Rotate</span>
            </button>
            <button
              onClick={flipSelection}
              className="flex items-center justify-center gap-1.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg font-semibold transition-colors"
            >
              <Undo className="w-3.5 h-3.5" />
              <span>Flip</span>
            </button>
            <button
              onClick={duplicateSelection}
              className="flex items-center justify-center gap-1.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg font-semibold transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </button>
          </div>
        </div>
      );
    }

    // 3. Default Circuit Summary (Nothing Selected)
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60 font-bold text-slate-100">
          <Info className="w-4 h-4 text-emerald-400" />
          <span>Circuit Overview</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">Total Components:</span>
            <span className="font-bold text-slate-100 font-mono">{components.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Total Wires:</span>
            <span className="font-bold text-slate-100 font-mono">{wires.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Input Switches:</span>
            <span className="font-bold text-slate-100 font-mono">
              {components.filter((c) => ['SWITCH', 'BUTTON', 'CLOCK', 'CONST_1', 'CONST_0'].includes(c.type)).length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Output Probes/LEDs:</span>
            <span className="font-bold text-slate-100 font-mono">
              {components.filter((c) => ['LED', 'PROBE', 'HEX_DISPLAY', 'DECIMAL_DISPLAY'].includes(c.type)).length}
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-900/40 border border-slate-800/60 rounded-xl space-y-1.5 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-300 block">Quick Tips:</span>
          <p>• Touch & drag an output pin to an input pin to connect wires.</p>
          <p>• Pinch with 2 fingers to zoom in/out.</p>
          <p>• Drag background with 1 finger to pan across the infinite canvas.</p>
        </div>
      </div>
    );
  };

  return (
    <aside className="fixed xl:relative right-0 top-14 xl:top-0 bottom-0 w-72 xl:w-64 bg-[#0b111e] border-l border-slate-800/80 p-3 flex flex-col gap-3 select-none text-xs text-slate-300 z-40 shadow-2xl xl:shadow-none overflow-y-auto">
      <div className="flex items-center justify-between xl:hidden pb-1 border-b border-slate-800/40">
        <span className="text-xs font-bold text-slate-300">Properties & Inspector</span>
        <button
          onClick={() => setInspectorOpen(false)}
          className="p-1 text-slate-400 hover:text-slate-200 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {renderContent()}
    </aside>
  );
};
