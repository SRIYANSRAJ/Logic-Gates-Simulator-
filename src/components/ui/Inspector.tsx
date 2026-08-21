/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useCircuit } from '../../context/CircuitContext';
import { COMPONENT_METADATA } from '../../engine/componentFactory';
import { THEME_PRESETS } from '../../theme/themes';
import {
  Box,
  Copy,
  Cpu,
  FlipHorizontal,
  Info,
  Lock,
  LockOpen,
  RotateCw,
  Sliders,
  Sparkles,
  Trash2,
  X,
  Zap,
  Spline,
  CornerDownRight,
  Minus,
  Palette,
  Settings,
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
    clearCanvas,
    selectAllWires,
    clearSelection,
    setActiveModal,
    inspectorOpen,
    setInspectorOpen,
    wireRoutingMode,
    setWireRoutingMode,
    theme,
  } = useCircuit();

  const selectedComps = components.filter((c) => selection.componentIds.includes(c.id));
  const selectedWires = wires.filter((w) => selection.wireIds.includes(w.id));
  const totalSelected = selectedComps.length + selectedWires.length;

  if (!inspectorOpen) return null;

  const currentTheme = THEME_PRESETS[theme] || THEME_PRESETS.emerald;

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
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                wireVal === 1
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {wireVal === 1 ? 'STATE: HIGH (1)' : 'STATE: LOW (0)'}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Source Port:</span>
              <span className="font-bold text-slate-200 font-mono">
                {fromComp?.label || fromComp?.name || 'Component'} ({wire.fromPortId})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target Port:</span>
              <span className="font-bold text-slate-200 font-mono">
                {toComp?.label || toComp?.name || 'Component'} ({wire.toPortId})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Selected Wires:</span>
              <span className="font-bold text-slate-200 font-mono">{selectedWires.length}</span>
            </div>
          </div>

          {/* Wire Routing Style Picker */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] text-slate-400 font-medium">Wire Routing Style</div>
            <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setWireRoutingMode('curved')}
                className={`py-1.5 px-2 rounded flex flex-col items-center gap-1 transition-all ${
                  wireRoutingMode === 'curved'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Curved / Stylish Bezier Wires"
              >
                <Spline className="w-3.5 h-3.5" />
                <span className="text-[10px]">Curved</span>
              </button>
              <button
                onClick={() => setWireRoutingMode('orthogonal')}
                className={`py-1.5 px-2 rounded flex flex-col items-center gap-1 transition-all ${
                  wireRoutingMode === 'orthogonal'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Orthogonal / 90° Manhattan Wires"
              >
                <CornerDownRight className="w-3.5 h-3.5" />
                <span className="text-[10px]">Orthogonal</span>
              </button>
              <button
                onClick={() => setWireRoutingMode('straight')}
                className={`py-1.5 px-2 rounded flex flex-col items-center gap-1 transition-all ${
                  wireRoutingMode === 'straight'
                    ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Straight Lines"
              >
                <Minus className="w-3.5 h-3.5" />
                <span className="text-[10px]">Straight</span>
              </button>
            </div>
          </div>

          {/* Wire Actions */}
          <div className="space-y-1.5 pt-1">
            <button
              onClick={deleteSelection}
              className="w-full flex items-center justify-center gap-2 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-400 rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Wire ({selectedWires.length})</span>
            </button>
            <button
              onClick={clearSelection}
              className="w-full flex items-center justify-center gap-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              <span>Deselect</span>
            </button>
          </div>
        </div>
      );
    }

    // 2. Multiple Components Selected
    if (selectedComps.length > 1) {
      const allLocked = selectedComps.every((c) => c.locked);

      return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 font-bold text-slate-100">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Multiple Selected</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">
              {selectedComps.length} items
            </span>
          </div>

          {/* Group Canvas Operations (Moved from left sidebar) */}
          <div className="space-y-1.5">
            <div className="text-[11px] text-slate-400 font-medium">Batch Operations</div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={rotateSelection}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-medium transition-colors text-xs"
                title="Rotate Selection 90° Clockwise [R]"
              >
                <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Rotate 90°</span>
              </button>
              <button
                onClick={flipSelection}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-medium transition-colors text-xs"
                title="Flip Horizontal [F]"
              >
                <FlipHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Flip</span>
              </button>
              <button
                onClick={duplicateSelection}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-medium transition-colors text-xs"
                title="Duplicate Selection [Ctrl+D]"
              >
                <Copy className="w-3.5 h-3.5 text-purple-400" />
                <span>Duplicate</span>
              </button>
              <button
                onClick={lockSelection}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-medium transition-colors text-xs"
                title="Toggle Position Lock"
              >
                {allLocked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <LockOpen className="w-3.5 h-3.5 text-slate-400" />}
                <span>{allLocked ? 'Unlock' : 'Lock'}</span>
              </button>
            </div>

            <button
              onClick={deleteSelection}
              className="w-full flex items-center justify-center gap-2 py-2 mt-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-400 rounded-lg text-xs font-bold transition-all shadow-sm"
              title="Delete all selected items [Del]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selection ({totalSelected})</span>
            </button>
          </div>

          {/* Package into Custom IC Module */}
          <div className="mt-1 p-3 bg-slate-900/60 border border-emerald-500/30 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
              <Box className="w-4 h-4" />
              <span>Package Selection into IC</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Synthesize these selected gates and wires into a reusable custom chip with automatic port mappings.
            </p>
            <button
              onClick={() => setActiveModal('customGate')}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg transition-all shadow-md shadow-emerald-950/40 text-center block text-xs"
            >
              Create Custom IC
            </button>
          </div>
        </div>
      );
    }

    // 3. Single Component Selected
    if (selectedComps.length === 1) {
      const comp = selectedComps[0];
      const meta = COMPONENT_METADATA[comp.type] || COMPONENT_METADATA.AND;
      const portVals = simulationState.portValues[comp.id] || {};

      return (
        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
            <div className="flex items-center gap-2 min-w-0">
              <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold text-slate-100 truncate">{comp.name || comp.type}</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono shrink-0">
              {comp.type}
            </span>
          </div>

          {/* All Component Operations (Moved from left sidebar) */}
          <div className="space-y-1.5">
            <div className="text-[11px] text-slate-400 font-medium">Quick Actions</div>
            <div className="grid grid-cols-4 gap-1">
              <button
                onClick={rotateSelection}
                className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-emerald-400 font-medium transition-colors text-[10px]"
                title="Rotate 90° Clockwise [R]"
              >
                <RotateCw className="w-3.5 h-3.5 mb-0.5 text-emerald-400" />
                <span>Rotate</span>
              </button>
              <button
                onClick={flipSelection}
                className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-cyan-400 font-medium transition-colors text-[10px]"
                title="Flip Horizontal [F]"
              >
                <FlipHorizontal className="w-3.5 h-3.5 mb-0.5 text-cyan-400" />
                <span>Flip</span>
              </button>
              <button
                onClick={duplicateSelection}
                className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-purple-400 font-medium transition-colors text-[10px]"
                title="Duplicate Gate [Ctrl+D]"
              >
                <Copy className="w-3.5 h-3.5 mb-0.5 text-purple-400" />
                <span>Clone</span>
              </button>
              <button
                onClick={lockSelection}
                className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition-colors text-[10px] ${
                  comp.locked
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                }`}
                title="Lock position to prevent accidental drag"
              >
                {comp.locked ? <Lock className="w-3.5 h-3.5 mb-0.5 text-amber-400" /> : <LockOpen className="w-3.5 h-3.5 mb-0.5" />}
                <span>{comp.locked ? 'Locked' : 'Lock'}</span>
              </button>
            </div>

            <button
              onClick={deleteSelection}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-400 rounded-lg text-xs font-bold transition-all shadow-sm"
              title="Delete this component [Del / Backspace]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete {comp.name || comp.type}</span>
            </button>
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
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2 space-y-1 max-h-36 overflow-y-auto">
              {comp.ports.map((port) => {
                const val = portVals[port.id] ?? 'Z';
                return (
                  <div key={port.id} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono truncate pr-2">
                      [{port.type.toUpperCase()}] {port.name}:
                    </span>
                    <span
                      className={`font-mono font-bold px-1.5 py-0.2 rounded shrink-0 ${
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
        </div>
      );
    }

    // 4. Default Circuit Summary (Nothing Selected)
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60 font-bold text-slate-100">
          <Info className="w-4 h-4 text-emerald-400" />
          <span>Circuit Overview</span>
        </div>

        {/* Global Canvas Quick Operations */}
        <div className="space-y-1.5">
          <div className="text-[11px] text-slate-400 font-medium">Canvas Operations</div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={selectAllWires}
              className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 font-medium transition-colors text-xs"
              title="Select all wires on canvas"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Select All Wires</span>
            </button>
            <button
              onClick={clearCanvas}
              className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-medium transition-colors text-xs"
              title="Clear all components and wires"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear Canvas</span>
            </button>
          </div>
        </div>

        {/* Wire Style Quick Switcher */}
        <div className="space-y-1.5">
          <div className="text-[11px] text-slate-400 font-medium">Wire Routing Style</div>
          <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setWireRoutingMode('curved')}
              className={`py-1.5 px-2 rounded flex flex-col items-center gap-1 transition-all ${
                wireRoutingMode === 'curved'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Curved / Stylish Bezier Wires"
            >
              <Spline className="w-3.5 h-3.5" />
              <span className="text-[10px]">Curved</span>
            </button>
            <button
              onClick={() => setWireRoutingMode('orthogonal')}
              className={`py-1.5 px-2 rounded flex flex-col items-center gap-1 transition-all ${
                wireRoutingMode === 'orthogonal'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Orthogonal / 90° Manhattan Wires"
            >
              <CornerDownRight className="w-3.5 h-3.5" />
              <span className="text-[10px]">Orthogonal</span>
            </button>
            <button
              onClick={() => setWireRoutingMode('straight')}
              className={`py-1.5 px-2 rounded flex flex-col items-center gap-1 transition-all ${
                wireRoutingMode === 'straight'
                  ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Straight Lines"
            >
              <Minus className="w-3.5 h-3.5" />
              <span className="text-[10px]">Straight</span>
            </button>
          </div>
        </div>

        {/* Theme & Settings Quick Launcher */}
        <button
          onClick={() => setActiveModal('settings')}
          className="w-full flex items-center justify-between p-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-200 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-emerald-400" />
            <div className="text-left">
              <div className="font-semibold text-xs text-slate-200">Theme & Preferences</div>
              <div className="text-[10px] text-slate-400">Current: {currentTheme.name}</div>
            </div>
          </div>
          <Settings className="w-4 h-4 text-slate-400" />
        </button>

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
          <span className="font-semibold text-slate-300 block">Touch & Pointer Tips:</span>
          <p>• Tap any gate or wire to inspect and perform operations.</p>
          <p>• Drag an output pin to an input pin to connect wires.</p>
          <p>• Use 2 fingers to pinch-zoom and pan on touchscreens.</p>
        </div>
      </div>
    );
  };

  return (
    <aside
      style={{
        backgroundColor: currentTheme.panelBg,
        borderColor: currentTheme.panelBorder || currentTheme.borderTone,
      }}
      className="fixed xl:relative right-0 top-14 xl:top-0 bottom-0 h-[calc(100vh-3.5rem)] w-72 xl:w-64 border-l p-3 flex flex-col justify-between select-none text-xs text-slate-300 z-40 shadow-2xl xl:shadow-none overflow-hidden transition-all duration-300"
    >
      <div
        style={{ borderColor: currentTheme.borderTone }}
        className="flex items-center justify-between pb-1.5 border-b shrink-0"
      >
        <span className="text-xs font-bold text-slate-200">Properties & Operations</span>
        <button
          onClick={() => setInspectorOpen(false)}
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pt-2 pb-2 space-y-3 min-h-0 touch-auto overscroll-contain">
        {renderContent()}
      </div>
    </aside>
  );
};
