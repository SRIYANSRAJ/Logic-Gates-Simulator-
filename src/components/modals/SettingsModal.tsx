/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useCircuit } from '../../context/CircuitContext';
import { THEME_PRESETS } from '../../theme/themes';
import { ThemePreset, WireRoutingMode } from '../../types/circuit';
import {
  Settings,
  X,
  Palette,
  Spline,
  CornerDownRight,
  Minus,
  Activity,
  Grid,
  Zap,
  Check,
  Sparkles,
  Smartphone,
} from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    theme,
    setTheme,
    wireRoutingMode,
    setWireRoutingMode,
    signalAnimation,
    setSignalAnimation,
    snapToGrid,
    setSnapToGrid,
    simulationSpeedHz,
    setSimulationSpeedHz,
  } = useCircuit();

  if (activeModal !== 'settings') return null;

  const currentThemeConfig = THEME_PRESETS[theme] || THEME_PRESETS.emerald;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/70 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl border flex items-center justify-center shadow-sm"
              style={{
                backgroundColor: `${currentThemeConfig.primaryColor}20`,
                borderColor: `${currentThemeConfig.primaryColor}50`,
                color: currentThemeConfig.primaryColor,
              }}
            >
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2">
                Simulator Preferences & Themes
              </h2>
              <p className="text-xs text-slate-400">
                Customize appearance, wire curvature, themes, and canvas behavior
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal('none')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* 1. Theme Selection Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-400" />
                <span>Color Theme Presets</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                Active: <strong className="text-emerald-400">{currentThemeConfig.name}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Object.keys(THEME_PRESETS) as ThemePreset[]).map((key) => {
                const preset = THEME_PRESETS[key];
                const isActive = theme === key;

                return (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                      isActive
                        ? 'bg-slate-800/90 shadow-md ring-2'
                        : 'bg-slate-900/50 hover:bg-slate-800/50 border-slate-800 text-slate-300'
                    }`}
                    style={{
                      borderColor: isActive ? preset.primaryColor : undefined,
                      boxShadow: isActive ? `0 0 12px ${preset.primaryColor}30` : undefined,
                    }}
                  >
                    {/* Color Swatch Circle */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border shadow-inner"
                      style={{
                        backgroundColor: preset.canvasBg,
                        borderColor: preset.primaryColor,
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full shadow"
                        style={{ backgroundColor: preset.wireHighColor }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-100 text-xs truncate">
                          {preset.name}
                        </span>
                        {isActive && (
                          <Check className="w-4 h-4 shrink-0" style={{ color: preset.primaryColor }} />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {preset.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-slate-800/80" />

          {/* 2. Wire Routing Style & Curvature Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Spline className="w-4 h-4 text-cyan-400" />
                <span>Wire Style & Routing Mode</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                Current: <strong className="text-cyan-400 capitalize">{wireRoutingMode}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Curved Stylish Wires */}
              <button
                onClick={() => setWireRoutingMode('curved')}
                className={`p-3 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${
                  wireRoutingMode === 'curved'
                    ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300 ring-2 ring-cyan-500/30'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-cyan-400">
                  <Spline className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs">Curved (Stylish)</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Smooth organic cubic bezier paths
                  </div>
                </div>
                {wireRoutingMode === 'curved' && (
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-semibold">
                    Selected
                  </span>
                )}
              </button>

              {/* Orthogonal (90° Manhattan) */}
              <button
                onClick={() => setWireRoutingMode('orthogonal')}
                className={`p-3 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${
                  wireRoutingMode === 'orthogonal'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 ring-2 ring-emerald-500/30'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400">
                  <CornerDownRight className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs">Orthogonal (90°)</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Clean Manhattan schematic traces
                  </div>
                </div>
                {wireRoutingMode === 'orthogonal' && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                    Selected
                  </span>
                )}
              </button>

              {/* Straight Wires */}
              <button
                onClick={() => setWireRoutingMode('straight')}
                className={`p-3 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${
                  wireRoutingMode === 'straight'
                    ? 'bg-purple-500/10 border-purple-500/50 text-purple-300 ring-2 ring-purple-500/30'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-purple-400">
                  <Minus className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs">Straight (Direct)</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Shortest point-to-point lines
                  </div>
                </div>
                {wireRoutingMode === 'straight' && (
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-semibold">
                    Selected
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-800/80" />

          {/* 3. Animation & Simulation Performance */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Simulation & Animation Engine</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Signal Flow Animation */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-200 text-xs">Wire Flow Animation</div>
                  <div className="text-[10px] text-slate-400">Animated pulses on active high wires</div>
                </div>
                <button
                  onClick={() => setSignalAnimation(!signalAnimation)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    signalAnimation ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      signalAnimation ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Grid Snapping */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-200 text-xs">Snap to Grid (20px)</div>
                  <div className="text-[10px] text-slate-400">Align components on drop and drag</div>
                </div>
                <button
                  onClick={() => setSnapToGrid(!snapToGrid)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    snapToGrid ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      snapToGrid ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Simulation Clock Frequency Slider */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Clock Frequency & Oscillation Rate
                </span>
                <span className="font-mono font-bold text-amber-400 text-xs">
                  {simulationSpeedHz} Hz ({Math.round(1000 / simulationSpeedHz)}ms period)
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                value={simulationSpeedHz}
                onChange={(e) => setSimulationSpeedHz(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1 Hz (Slow / Step-by-Step)</span>
                <span>10 Hz (Default)</span>
                <span>30 Hz (Fast)</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-800/80" />

          {/* 4. Touch & Tablet Ergonomics Notice */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5">
            <Smartphone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-300 space-y-0.5">
              <span className="font-bold text-emerald-400 block">Tablet & Touch Optimized</span>
              <p>
                Use 2-finger pinch to zoom in/out, 2-finger drag to pan canvas, and tap ports directly
                to start and complete wire connections smoothly.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-end text-xs text-slate-400">
          <button
            onClick={() => setActiveModal('none')}
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
