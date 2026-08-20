/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useCircuit } from '../../context/CircuitContext';
import { THEME_PRESETS } from '../../theme/themes';
import {
  Activity,
  Award,
  BookOpen,
  Check,
  Compass,
  Cpu,
  Database,
  Download,
  FileCode2,
  FolderOpen,
  Grid,
  HelpCircle,
  Menu,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Redo2,
  RotateCcw,
  Sliders,
  Sparkles,
  StepForward,
  Table,
  Trash2,
  Undo2,
  Upload,
  Zap,
  Settings,
  Spline,
  Palette,
} from 'lucide-react';

export const Toolbar: React.FC = () => {
  const {
    circuitName,
    setCircuitName,
    simulationRunning,
    toggleSimulation,
    stepSimulation,
    resetSimulation,
    simulationSpeedHz,
    setSimulationSpeedHz,
    canUndo,
    canRedo,
    undo,
    redo,
    wireRoutingMode,
    setWireRoutingMode,
    signalAnimation,
    setSignalAnimation,
    snapToGrid,
    setSnapToGrid,
    selection,
    wires,
    selectAllWires,
    deleteSelection,
    exportJson,
    importJson,
    clearCanvas,
    setActiveModal,
    theme,
    sidebarOpen,
    toggleSidebar,
    inspectorOpen,
    toggleInspector,
  } = useCircuit();

  const activeTheme = THEME_PRESETS[theme] || THEME_PRESETS.emerald;
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(circuitName);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveToLocal = () => {
    const jsonStr = exportJson();
    localStorage.setItem('digilogic_saved_circuit', jsonStr);
    setExportNotice('Saved to local storage!');
    setTimeout(() => setExportNotice(null), 2000);
    setToolsDropdownOpen(false);
  };

  const handleLoadFromLocal = () => {
    const jsonStr = localStorage.getItem('digilogic_saved_circuit');
    if (jsonStr) {
      const success = importJson(jsonStr);
      if (success) {
        setExportNotice('Loaded from local storage!');
      } else {
        setExportNotice('Invalid local storage data');
      }
    } else {
      setExportNotice('No saved circuit found');
    }
    setTimeout(() => setExportNotice(null), 2000);
    setToolsDropdownOpen(false);
  };

  const handleExport = () => {
    const jsonStr = exportJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${circuitName.toLowerCase().replace(/\s+/g, '_')}_circuit.json`;
    a.click();
    URL.revokeObjectURL(url);

    setExportNotice('Exported circuit JSON!');
    setTimeout(() => setExportNotice(null), 2000);
    setToolsDropdownOpen(false);
  };

  const handleTriggerImport = () => {
    setToolsDropdownOpen(false);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importJson(content);
        if (success) {
          setExportNotice('Loaded circuit successfully!');
          setTimeout(() => setExportNotice(null), 2000);
        } else {
          setExportNotice('Invalid circuit JSON format');
          setTimeout(() => setExportNotice(null), 2500);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setToolsDropdownOpen(false);
  };

  return (
    <header
      style={{
        backgroundColor: activeTheme.navBg,
        borderColor: activeTheme.borderTone,
      }}
      className="h-14 border-b px-2 sm:px-3 flex items-center justify-between z-20 select-none shrink-0 gap-1 sm:gap-2 transition-colors duration-300"
    >
      {/* Left: Library Toggle & Brand */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Toggle Library Drawer Button */}
        <button
          onClick={toggleSidebar}
          style={
            sidebarOpen
              ? {
                  backgroundColor: `${activeTheme.primaryColor}22`,
                  borderColor: `${activeTheme.primaryColor}55`,
                  color: activeTheme.primaryColor,
                }
              : {}
          }
          className={`p-2 rounded-lg border transition-colors ${
            sidebarOpen
              ? ''
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
          title="Toggle Component Library"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <div
            style={{
              backgroundColor: `${activeTheme.primaryColor}20`,
              borderColor: `${activeTheme.primaryColor}40`,
              color: activeTheme.primaryColor,
            }}
            className="w-8 h-8 rounded-lg border flex items-center justify-center shadow-sm"
          >
            <Cpu className="w-5 h-5" />
          </div>
          <div className="hidden xs:block sm:block">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-sm text-slate-100 tracking-wide font-mono">
                DigiLogic
              </span>
              <span
                style={{
                  backgroundColor: `${activeTheme.primaryColor}15`,
                  color: activeTheme.primaryColor,
                  borderColor: `${activeTheme.primaryColor}30`,
                }}
                className="text-[10px] px-1.5 py-0.2 rounded border font-semibold hidden md:inline"
              >
                Lab
              </span>
            </div>
          </div>
        </div>

        {/* Editable Circuit Title */}
        <div className="hidden md:block h-5 w-px bg-slate-800 mx-0.5" />

        <div className="hidden md:block">
          {isEditingName ? (
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={() => {
                setCircuitName(tempName || 'Untitled Circuit');
                setIsEditingName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setCircuitName(tempName || 'Untitled Circuit');
                  setIsEditingName(false);
                }
              }}
              autoFocus
              className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 font-semibold focus:outline-none max-w-32"
            />
          ) : (
            <button
              onClick={() => {
                setTempName(circuitName);
                setIsEditingName(true);
              }}
              className="text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 px-2 py-1 rounded transition-colors truncate max-w-36"
              title="Click to rename circuit"
            >
              {circuitName}
            </button>
          )}
        </div>
      </div>

      {/* Center: Simulation Engine Controls */}
      <div className="flex items-center gap-1 sm:gap-2 bg-slate-900/80 border border-slate-800/80 px-1.5 sm:px-2.5 py-1 rounded-xl shadow-inner shrink-0">
        {/* Run/Pause Toggle */}
        <button
          onClick={() => toggleSimulation()}
          style={
            simulationRunning
              ? {
                  backgroundColor: `${activeTheme.primaryColor}22`,
                  borderColor: `${activeTheme.primaryColor}55`,
                  color: activeTheme.primaryColor,
                }
              : {}
          }
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg font-bold text-xs transition-all shadow-sm ${
            simulationRunning
              ? 'border'
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
          }`}
          title={simulationRunning ? 'Pause simulation' : 'Run simulation'}
        >
          {simulationRunning ? (
            <>
              <Pause className="w-3.5 h-3.5" style={{ fill: activeTheme.primaryColor }} />
              <span className="hidden sm:inline">RUNNING</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-amber-400" />
              <span className="hidden sm:inline">PAUSED</span>
            </>
          )}
        </button>

        {/* Step Simulation */}
        <button
          onClick={stepSimulation}
          disabled={simulationRunning}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40 transition-colors"
          title="Single Step Simulation"
        >
          <StepForward className="w-4 h-4" />
        </button>

        {/* Reset Simulation State */}
        <button
          onClick={resetSimulation}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Reset Signal States"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Frequency Slider (Hidden on ultra small screens) */}
        <div className="hidden lg:flex items-center gap-1.5 text-slate-400 text-[11px] font-mono pl-1 border-l border-slate-800">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>{simulationSpeedHz}Hz</span>
          <input
            type="range"
            min={1}
            max={30}
            value={simulationSpeedHz}
            onChange={(e) => setSimulationSpeedHz(parseInt(e.target.value, 10))}
            className="w-14 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            title="Adjust Simulation Clock Frequency"
          />
        </div>
      </div>

        {/* Right: Actions, Modals & Inspector Toggle */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Unified Delete Button (Prominently integrated for BOTH PC and Mobile) */}
        {(() => {
          const totalSelected = selection.wireIds.length + selection.componentIds.length;
          const hasSelection = totalSelected > 0;
          return (
            <button
              id="navbar-delete-btn"
              onClick={() => {
                if (hasSelection) {
                  deleteSelection();
                } else {
                  clearCanvas();
                }
              }}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 ${
                hasSelection
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 shadow-rose-950/50 animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800'
              }`}
              title={
                hasSelection
                  ? `Delete ${totalSelected} selected item(s) [Del / Backspace]`
                  : 'Delete / Clear Canvas'
              }
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">
                {hasSelection ? `Delete (${totalSelected})` : 'Delete'}
              </span>
            </button>
          );
        })()}

        {/* Saved Circuits Modal Launcher (Local Storage Library) */}
        <button
          id="navbar-saved-circuits-btn"
          onClick={() => setActiveModal('savedCircuits')}
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors"
          title="Saved Circuits & Local Storage Manager"
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Saved Circuits</span>
        </button>

        {/* Quick Tutorial / Guide Button */}
        <button
          id="navbar-tutorial-btn"
          onClick={() => setActiveModal('tutorial')}
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-colors shadow-sm"
          title="Interactive User Guide & Touch Controls Tutorial"
        >
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden lg:inline">Tutorial</span>
        </button>

        {/* Undo / Redo on Desktop / Tablet */}
        <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Wire Style Toggle (Curved stylish vs Orthogonal) - visible on tablets and desktop */}
        <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs text-slate-400">
          <button
            onClick={() => setWireRoutingMode(wireRoutingMode === 'orthogonal' ? 'curved' : 'orthogonal')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors text-[11px] font-semibold ${
              wireRoutingMode === 'curved'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                : 'hover:text-slate-200 text-slate-400'
            }`}
            title="Switch wire style between Orthogonal (90°) and Curved (Stylish Bezier)"
          >
            <Spline className="w-3.5 h-3.5" />
            <span>{wireRoutingMode === 'curved' ? 'Curved Wires' : 'Orthogonal'}</span>
          </button>
        </div>

        {/* Primary Analysis Modals on Wide Screens */}
        <div className="hidden 2xl:flex items-center gap-1">
          <button
            onClick={() => setActiveModal('truthTable')}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-800 text-xs font-medium transition-colors"
            title="Generate Truth Table"
          >
            <Table className="w-3.5 h-3.5 text-emerald-400" />
            <span>Truth Table</span>
          </button>

          <button
            onClick={() => setActiveModal('boolean')}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800 text-xs font-medium transition-colors"
            title="Boolean Algebra & Synthesis"
          >
            <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Boolean Solver</span>
          </button>

          <button
            onClick={() => setActiveModal('kmap')}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-purple-400 border border-slate-800 text-xs font-medium transition-colors"
            title="Karnaugh Map Minimizator"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>K-Map</span>
          </button>

          <button
            onClick={() => setActiveModal('presets')}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-blue-400 border border-slate-800 text-xs font-medium transition-colors"
            title="Circuit Presets Library"
          >
            <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Presets</span>
          </button>

          <button
            onClick={() => setActiveModal('challenges')}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-medium transition-colors"
            title="Interactive Challenges"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Challenges</span>
          </button>
        </div>

        {/* Settings Button */}
        <button
          onClick={() => setActiveModal('settings')}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-400 transition-colors"
          title="Settings, Themes & Wire Options"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Permanent '...' / All Features Dropdown Menu (Accessible on all screen sizes & fullscreen) */}
        <div className="relative">
          <button
            onClick={() => setToolsDropdownOpen((prev) => !prev)}
            className={`p-2 rounded-lg border transition-all shadow-sm ${
              toolsDropdownOpen
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-emerald-400'
            }`}
            title="All Features & Analysis Tools"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {toolsDropdownOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-72 bg-[#0d1527] border border-slate-700/90 rounded-xl shadow-2xl p-2 z-50 text-xs text-slate-200 space-y-1 backdrop-blur-xl animate-fade-in touch-auto max-h-[85vh] overflow-y-auto overscroll-contain"
              onClick={() => setToolsDropdownOpen(false)}
            >
              <div className="px-2 py-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                <span>⚡ All Circuit Features</span>
                <span className="text-[9px] text-slate-500">Quick Access</span>
              </div>
              <button
                onClick={() => {
                  setActiveModal('tutorial');
                  setToolsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-slate-800/80 text-left rounded-lg text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 transition-colors font-semibold"
              >
                <Compass className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="font-semibold">Quick Start Guide & Tutorial</div>
                  <div className="text-[10px] text-slate-400">PC mouse & tablet touch controls overview</div>
                </div>
              </button>
              <button
                onClick={() => setActiveModal('settings')}
                className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-slate-800/80 text-left rounded-lg text-emerald-400 bg-emerald-500/10 transition-colors font-semibold"
              >
                <Settings className="w-4 h-4 text-emerald-400" />
                <div>
                  <div>Settings, Themes & Wires</div>
                  <div className="text-[10px] text-slate-400">Color themes, curved wires & simulation</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setWireRoutingMode(wireRoutingMode === 'orthogonal' ? 'curved' : 'orthogonal');
                  setToolsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-slate-800/80 text-left rounded-lg text-cyan-300 hover:text-cyan-200 transition-colors"
              >
                <Spline className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="font-semibold">
                    Toggle Wire Style: {wireRoutingMode === 'orthogonal' ? 'Curved' : 'Orthogonal'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Switch between 90° Manhattan and fluid bezier curves
                  </div>
                </div>
              </button>
              <button
                onClick={() => setActiveModal('truthTable')}
                className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-slate-800/80 text-left rounded-lg text-slate-200 hover:text-emerald-400 transition-colors"
              >
                <Table className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-semibold">Truth Table Generator</div>
                  <div className="text-[10px] text-slate-400">Generate full combinatorial state table</div>
                </div>
              </button>
              <button
                onClick={() => setActiveModal('boolean')}
                className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-slate-800/80 text-left rounded-lg text-slate-200 hover:text-cyan-400 transition-colors"
              >
                <FileCode2 className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="font-semibold">Boolean Solver & Synthesis</div>
                  <div className="text-[10px] text-slate-400">Live as-you-type circuit synthesis & derivation</div>
                </div>
              </button>
              <button
                onClick={() => setActiveModal('kmap')}
                className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-slate-800/80 text-left rounded-lg text-slate-200 hover:text-purple-400 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="font-semibold">Karnaugh Map (K-Map)</div>
                  <div className="text-[10px] text-slate-400">Visual Gray-code minimization</div>
                </div>
              </button>
              <button
                onClick={() => setActiveModal('oscilloscope')}
                className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-slate-800/80 text-left rounded-lg text-slate-200 hover:text-amber-400 transition-colors"
              >
                <Activity className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-semibold">Timing Oscilloscope</div>
                  <div className="text-[10px] text-slate-400">Multi-channel logic analyzer</div>
                </div>
              </button>

              <div className="h-px bg-slate-800 my-1" />
              <div className="px-2 py-1 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                Library & Learning
              </div>
              <button
                onClick={() => setActiveModal('savedCircuits')}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-800/80 text-left rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors font-semibold"
              >
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Saved Circuits Manager (Local Storage)</span>
              </button>
              <button
                onClick={() => setActiveModal('presets')}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-800/80 text-left rounded-lg text-slate-200 hover:text-blue-400 transition-colors"
              >
                <FolderOpen className="w-4 h-4 text-blue-400" />
                <span>Circuit Presets Library</span>
              </button>
              <button
                onClick={() => setActiveModal('challenges')}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-800/80 text-left rounded-lg text-amber-400 hover:bg-amber-500/10 transition-colors"
              >
                <Award className="w-4 h-4 text-amber-400" />
                <span>Interactive Challenges</span>
              </button>
              <button
                onClick={() => setActiveModal('learn')}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-800/80 text-left rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>Logic Gates Educational Guide</span>
              </button>

              <div className="h-px bg-slate-800 my-1" />
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Edit & Wire Controls
              </div>
              <button
                onClick={() => {
                  deleteSelection();
                  setToolsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-rose-500/20 text-left rounded-lg text-rose-400 transition-colors font-semibold"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>
                  Delete Selected Items (
                  {selection.wireIds.length + selection.componentIds.length})
                </span>
              </button>
              <button
                onClick={() => {
                  clearCanvas();
                  setToolsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-800/80 text-left rounded-lg text-rose-300 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Canvas</span>
              </button>
              <button
                onClick={() => {
                  selectAllWires();
                  setToolsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-800/80 text-left rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              >
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Select All Wires ({wires.length})</span>
              </button>
              <button
                onClick={() => { undo(); setToolsDropdownOpen(false); }}
                disabled={!canUndo}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-800/80 text-left rounded-lg text-slate-200 disabled:opacity-30 transition-colors"
              >
                <Undo2 className="w-4 h-4" />
                <span>Undo (Ctrl+Z)</span>
              </button>
              <button
                onClick={() => { redo(); setToolsDropdownOpen(false); }}
                disabled={!canRedo}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-800/80 text-left rounded-lg text-slate-200 disabled:opacity-30 transition-colors"
              >
                <Redo2 className="w-4 h-4" />
                <span>Redo (Ctrl+Y)</span>
              </button>

              <div className="h-px bg-slate-800 my-1" />
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                File Storage & Export
              </div>
              <button
                onClick={() => setActiveModal('savedCircuits')}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-800/80 text-left rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              >
                <Database className="w-4 h-4" />
                <span>Saved Circuits Manager</span>
              </button>
              <button
                onClick={handleExport}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-800/80 text-left rounded-lg text-slate-200 transition-colors"
              >
                <Download className="w-4 h-4 text-slate-400" />
                <span>Export Circuit (JSON)</span>
              </button>
              <button
                onClick={handleTriggerImport}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-800/80 text-left rounded-lg text-slate-200 transition-colors"
              >
                <Upload className="w-4 h-4 text-slate-400" />
                <span>Import Circuit (JSON)</span>
              </button>
              <button
                onClick={() => setActiveModal('shortcuts')}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-800/80 text-left rounded-lg text-slate-200 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>Keyboard Shortcuts & Touch Gestures</span>
              </button>

              {/* Author Credits in Dropdown */}
              <div className="h-px bg-slate-800 my-1" />
              <div className="p-2 bg-slate-950/80 rounded-lg text-[10px] text-slate-400 space-y-0.5 border border-slate-800">
                <div className="text-slate-300 font-semibold">
                  Crafted with passion and precision by Devashish and Sriyans
                </div>
                <a
                  href="mailto:sriyansraj02@gmail.com"
                  className="text-emerald-400 hover:underline block font-mono"
                >
                  sriyansraj02@gmail.com
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Hidden persistent file input for JSON import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImportFile}
          className="hidden"
        />

        {/* Toggle Inspector Drawer Button */}
        <button
          onClick={toggleInspector}
          style={
            inspectorOpen
              ? {
                  backgroundColor: `${activeTheme.primaryColor}22`,
                  borderColor: `${activeTheme.primaryColor}55`,
                  color: activeTheme.primaryColor,
                }
              : {}
          }
          className={`p-2 rounded-lg border transition-colors ${
            inspectorOpen
              ? ''
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
          title="Toggle Property Inspector"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Export Toast Notification */}
      {exportNotice && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs px-3 py-2 rounded-lg shadow-xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4" />
          <span>{exportNotice}</span>
        </div>
      )}
    </header>
  );
};
