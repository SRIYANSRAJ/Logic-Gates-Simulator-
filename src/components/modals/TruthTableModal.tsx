/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useCircuit } from '../../context/CircuitContext';
import { simulateCircuit } from '../../engine/simulation';
import { generateKMap, KMapResult } from '../../engine/kmap';
import { parseBooleanExpression, synthesizeCircuitFromAST } from '../../engine/booleanParser';
import { LogicState, CircuitComponent, Wire } from '../../types/circuit';
import { THEME_PRESETS } from '../../theme/themes';
import {
  Table,
  Sparkles,
  Download,
  X,
  Copy,
  Check,
  Play,
  RotateCcw,
  Layers,
  Wand2,
  Activity,
  Filter,
  Search,
  Eye,
  Sliders,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Code,
} from 'lucide-react';

interface VariableGroup {
  name: string;
  componentIds: string[];
  components: CircuitComponent[];
  isConnected: boolean;
  currentValue: 0 | 1;
}

interface OutputGroup {
  id: string;
  name: string;
  comp: CircuitComponent;
  type: string;
}

export const TruthTableModal: React.FC = () => {
  const {
    components,
    wires,
    customGates,
    activeModal,
    setActiveModal,
    theme,
    applyInputValues,
    loadCircuitData,
    recordHistorySnapshot,
  } = useCircuit();

  const currentTheme = THEME_PRESETS[theme] || THEME_PRESETS.emerald;

  // Active Concept Tab:
  // 1: 'table' -> Interactive Truth Table & Live Matrix
  // 2: 'equations' -> Canonical SOP/POS & Minimized Boolean Synthesis
  // 3: 'kmap' -> 2D Gray-Code Karnaugh Map & Digital Timing Waveforms
  const [activeTab, setActiveTab] = useState<'table' | 'equations' | 'kmap'>('table');

  // Filter & Search Controls
  const [rowFilter, setRowFilter] = useState<'all' | 'ones' | 'zeros'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOutputIndex, setSelectedOutputIndex] = useState<number>(0);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [appliedRowIndex, setAppliedRowIndex] = useState<number | null>(null);
  const [synthesisSuccess, setSynthesisSuccess] = useState<string | null>(null);

  // 1. Identify valid primary input variable components (excluding deleted components)
  const inputComps = useMemo(() => {
    return components.filter((c) =>
      ['SWITCH', 'BUTTON', 'PULSE', 'RANDOM', 'CLOCK'].includes(c.type)
    );
  }, [components]);

  // 2. Group duplicate inputs by Variable Name / Custom Label
  // If user has two switches named "A" or "inp 1", they are unified under ONE single variable!
  const variableGroups: VariableGroup[] = useMemo(() => {
    const varMap = new Map<string, VariableGroup>();
    const defaultLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    let autoIndex = 0;

    // Track which components have outgoing wires
    const connectedSourceIds = new Set(wires.map((w) => w.fromComponentId));

    inputComps.forEach((comp) => {
      let vName = comp.label?.trim();
      if (!vName) {
        if (
          comp.name &&
          !comp.name.match(/^[A-Z0-9_-]+_[0-9]+$/i) &&
          comp.name !== 'Toggle Switch' &&
          comp.name !== 'Push Button'
        ) {
          vName = comp.name.trim();
        } else {
          vName = defaultLetters[autoIndex] || `IN_${autoIndex + 1}`;
          autoIndex++;
        }
      }

      const key = vName.toLowerCase();
      const isConn = connectedSourceIds.has(comp.id);
      const curVal = (comp.internalState?.value ? 1 : 0) as 0 | 1;

      if (!varMap.has(key)) {
        varMap.set(key, {
          name: vName,
          componentIds: [comp.id],
          components: [comp],
          isConnected: isConn,
          currentValue: curVal,
        });
      } else {
        const existing = varMap.get(key)!;
        existing.componentIds.push(comp.id);
        existing.components.push(comp);
        if (isConn) existing.isConnected = true;
        if (curVal === 1) existing.currentValue = 1;
      }
    });

    // Cap to 8 variables (256 combinations) to guarantee instantaneous evaluation
    return Array.from(varMap.values()).slice(0, 8);
  }, [inputComps, wires]);

  // 3. Identify output components (probes, LEDs, displays) or monitored gate outputs
  const outputGroups: OutputGroup[] = useMemo(() => {
    const primaryOutputs = components.filter((c) =>
      ['PROBE', 'LED', 'HEX_DISPLAY', 'DECIMAL_DISPLAY', 'BINARY_DISPLAY', 'SEGMENT_7'].includes(c.type)
    );

    const result: OutputGroup[] = [];
    const usedNames = new Map<string, number>();

    primaryOutputs.forEach((comp, idx) => {
      let rawName =
        comp.label?.trim() ||
        comp.name?.trim() ||
        (primaryOutputs.length === 1 ? 'Y' : `OUT_${idx + 1}`);

      const key = rawName.toLowerCase();
      const count = usedNames.get(key) || 0;
      usedNames.set(key, count + 1);

      const finalName = count > 0 ? `${rawName}_${count + 1}` : rawName;
      result.push({
        id: comp.id,
        name: finalName,
        comp,
        type: comp.type,
      });
    });

    return result;
  }, [components]);

  const customGateMap = useMemo(() => {
    const map = new Map();
    customGates.forEach((g) => map.set(g.id, g));
    return map;
  }, [customGates]);

  const numVars = variableGroups.length;
  const totalCombinations = numVars > 0 ? 1 << numVars : 0;

  // 4. Generate Complete Truth Table Matrix with Multi-Pass Logic Convergence
  const { tableRows, mintermMap, maxtermMap, activeRowIndex } = useMemo(() => {
    if (numVars === 0 || outputGroups.length === 0) {
      return { tableRows: [], mintermMap: {}, maxtermMap: {}, activeRowIndex: -1 };
    }

    const rows = [];
    const minterms: Record<string, number[]> = {};
    const maxterms: Record<string, number[]> = {};
    outputGroups.forEach((out) => {
      minterms[out.name] = [];
      maxterms[out.name] = [];
    });

    let currentLiveRowIdx = -1;

    for (let r = 0; r < totalCombinations; r++) {
      const currentInputMap: Record<string, 0 | 1> = {};
      const componentOverrides = new Map<string, 0 | 1>();
      let matchesLiveCanvas = true;

      variableGroups.forEach((vGroup, vIdx) => {
        // Extract bit value (MSB -> LSB)
        const bit = ((r >> (numVars - 1 - vIdx)) & 1) as 0 | 1;
        currentInputMap[vGroup.name] = bit;
        vGroup.componentIds.forEach((cid) => {
          componentOverrides.set(cid, bit);
        });

        if (bit !== vGroup.currentValue) {
          matchesLiveCanvas = false;
        }
      });

      if (matchesLiveCanvas) {
        currentLiveRowIdx = r;
      }

      // Clone components and set input values
      const simComponents = components.map((c) => {
        if (componentOverrides.has(c.id)) {
          const bitVal = componentOverrides.get(c.id)!;
          return {
            ...c,
            internalState: {
              ...c.internalState,
              value: bitVal,
              pressed: bitVal === 1,
            },
          };
        }
        return c;
      });

      // Run pure multi-pass circuit evaluation
      const sim = simulateCircuit(simComponents, wires, customGateMap);

      // Collect outputs
      const currentOutputMap: Record<string, LogicState> = {};
      outputGroups.forEach((out) => {
        const val =
          sim.portValues[out.id]?.['in_0'] ??
          sim.portValues[out.id]?.['out'] ??
          0;
        currentOutputMap[out.name] = val;

        if (val === 1) {
          minterms[out.name].push(r);
        } else if (val === 0) {
          maxterms[out.name].push(r);
        }
      });

      // Binary string representation
      const binaryString = variableGroups
        .map((v) => currentInputMap[v.name])
        .join('');

      rows.push({
        rowIndex: r,
        binaryString,
        inputs: currentInputMap,
        outputs: currentOutputMap,
        minterm: `m${r}`,
        maxterm: `M${r}`,
        isLiveCurrent: matchesLiveCanvas,
      });
    }

    return {
      tableRows: rows,
      mintermMap: minterms,
      maxtermMap: maxterms,
      activeRowIndex: currentLiveRowIdx,
    };
  }, [numVars, totalCombinations, variableGroups, outputGroups, components, wires, customGateMap]);

  // Selected Output for Boolean Analysis & K-Map
  const activeOutputName = outputGroups[selectedOutputIndex]?.name || outputGroups[0]?.name || '';

  // 5. Karnaugh Map & Minimized SOP Equation Generation
  const kmapAnalysis: KMapResult | null = useMemo(() => {
    if (!activeOutputName || numVars < 2 || numVars > 4 || tableRows.length === 0) {
      return null;
    }
    const truthValues: Record<number, 0 | 1> = {};
    tableRows.forEach((row) => {
      truthValues[row.rowIndex] = row.outputs[activeOutputName] === 1 ? 1 : 0;
    });

    const varNames = variableGroups.map((v) => v.name);
    return generateKMap(numVars as 2 | 3 | 4, truthValues, varNames);
  }, [activeOutputName, numVars, tableRows, variableGroups]);

  // Canonical SOP & POS Equations for active output
  const { canonicalSOP, canonicalPOS, minimizedSOP } = useMemo(() => {
    if (!activeOutputName || !mintermMap[activeOutputName]) {
      return { canonicalSOP: '0', canonicalPOS: '1', minimizedSOP: '0' };
    }

    const minterms = mintermMap[activeOutputName] || [];
    const maxterms = maxtermMap[activeOutputName] || [];

    let sop = '0';
    let pos = '1';

    if (minterms.length === totalCombinations) {
      sop = '1';
    } else if (minterms.length > 0) {
      sop = `Σm(${minterms.join(', ')})`;
    }

    if (maxterms.length === totalCombinations) {
      pos = '0';
    } else if (maxterms.length > 0) {
      pos = `ΠM(${maxterms.join(', ')})`;
    }

    const minSop = kmapAnalysis?.minimizedSOP || (minterms.length === 0 ? '0' : sop);

    return {
      canonicalSOP: sop,
      canonicalPOS: pos,
      minimizedSOP: minSop,
    };
  }, [activeOutputName, mintermMap, maxtermMap, totalCombinations, kmapAnalysis]);

  // Handle Clicking a Row to Drive Canvas Switches in Real Time
  const handleApplyRowToCanvas = useCallback(
    (rowInputs: Record<string, 0 | 1>, rowIdx: number) => {
      applyInputValues(rowInputs);
      setAppliedRowIndex(rowIdx);
      setTimeout(() => setAppliedRowIndex(null), 1500);
    },
    [applyInputValues]
  );

  // Handle Synthesizing the Minimized Circuit onto the Canvas
  const handleSynthesizeMinimizedCircuit = useCallback(() => {
    if (!minimizedSOP || minimizedSOP === '0' || minimizedSOP === '1') return;
    try {
      const ast = parseBooleanExpression(minimizedSOP);
      const startX = 100;
      const startY = 100;
      const { components: synthComps, wires: synthWires } = synthesizeCircuitFromAST(
        ast,
        activeOutputName || 'Y',
        startX,
        startY
      );

      loadCircuitData(synthComps, synthWires, `Synthesized (${activeOutputName}): ${minimizedSOP}`);
      setSynthesisSuccess(`Synthesized equivalent circuit for ${activeOutputName} = ${minimizedSOP}!`);
      setTimeout(() => {
        setSynthesisSuccess(null);
        setActiveModal('none');
      }, 1200);
    } catch (err: any) {
      console.error('Synthesis failed:', err);
    }
  }, [minimizedSOP, activeOutputName, loadCircuitData, setActiveModal]);

  // Export CSV
  const exportCsv = () => {
    if (tableRows.length === 0) return;
    const inHeaders = variableGroups.map((v) => v.name);
    const outHeaders = outputGroups.map((o) => o.name);
    const headerRow = ['Index', ...inHeaders, ...outHeaders, 'Minterm', 'Maxterm'].join(',');

    const csvLines = tableRows.map((r) => {
      const inVals = inHeaders.map((h) => r.inputs[h]);
      const outVals = outHeaders.map((h) => r.outputs[h]);
      return [r.rowIndex, ...inVals, ...outVals, r.minterm, r.maxterm].join(',');
    });

    const csvContent = [headerRow, ...csvLines].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `truth_table_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy Equation / Markdown to Clipboard
  const copyToClipboard = (text: string, formatName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(formatName);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  // Filtered rows for Tab 1
  const filteredRows = useMemo(() => {
    return tableRows.filter((r) => {
      if (rowFilter === 'ones' && r.outputs[activeOutputName] !== 1) return false;
      if (rowFilter === 'zeros' && r.outputs[activeOutputName] !== 0) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesIndex = r.rowIndex.toString() === q || r.minterm.toLowerCase().includes(q);
        const matchesBinary = r.binaryString.includes(q);
        return matchesIndex || matchesBinary;
      }
      return true;
    });
  }, [tableRows, rowFilter, activeOutputName, searchQuery]);

  if (activeModal !== 'truthTable') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-fade-in select-none">
      <div
        style={{
          backgroundColor: currentTheme.panelBg,
          borderColor: currentTheme.borderTone,
        }}
        className="border rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden transition-colors duration-300"
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: currentTheme.navBg,
            borderColor: currentTheme.borderTone,
          }}
          className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b shrink-0"
        >
          <div className="flex items-center gap-3">
            <div
              style={{
                backgroundColor: `${currentTheme.primaryColor}22`,
                borderColor: `${currentTheme.primaryColor}55`,
                color: currentTheme.primaryColor,
              }}
              className="p-2.5 rounded-xl border shadow-sm flex items-center justify-center"
            >
              <Table className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-100 text-sm sm:text-base tracking-wide font-mono">
                  Circuit Truth Table & Analysis Engine
                </h2>
                {numVars > 0 && (
                  <span
                    style={{
                      backgroundColor: `${currentTheme.primaryColor}18`,
                      color: currentTheme.primaryColor,
                      borderColor: `${currentTheme.primaryColor}40`,
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold"
                  >
                    {numVars} {numVars === 1 ? 'Variable' : 'Variables'} ({totalCombinations} States)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Unified multi-variable evaluation, canonical boolean equations & real-time canvas synchronization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              disabled={tableRows.length === 0}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 disabled:opacity-40 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700/80 shadow-sm"
              title="Export complete truth table as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setActiveModal('none')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Detected Variables & Outputs Banner */}
        <div
          style={{
            backgroundColor: `${currentTheme.canvasBg}dd`,
            borderColor: currentTheme.borderTone,
          }}
          className="px-4 sm:px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs shrink-0"
        >
          {/* Detected Input Variables with Multi-Switch Unification */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5" /> Inputs ({variableGroups.length}):
            </span>
            {variableGroups.length === 0 ? (
              <span className="text-amber-400 font-mono text-[11px]">No input switches detected</span>
            ) : (
              variableGroups.map((v, i) => (
                <span
                  key={v.name}
                  style={{
                    backgroundColor: `${currentTheme.primaryColor}15`,
                    borderColor: `${currentTheme.primaryColor}35`,
                    color: currentTheme.primaryColor,
                  }}
                  className="px-2 py-0.5 rounded-md border font-mono font-bold text-[11px] flex items-center gap-1"
                  title={`Variable ${v.name}: controls ${v.componentIds.length} switch/button asset(s)`}
                >
                  <span>{v.name}</span>
                  {v.componentIds.length > 1 && (
                    <span className="text-[9px] px-1 bg-slate-900/80 rounded text-slate-300 font-normal">
                      ×{v.componentIds.length}
                    </span>
                  )}
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      v.currentValue === 1 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                    }`}
                  />
                </span>
              ))
            )}
          </div>

          {/* Monitored Outputs Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Output:
            </span>
            {outputGroups.length === 0 ? (
              <span className="text-amber-400 font-mono text-[11px]">No output probes placed</span>
            ) : outputGroups.length === 1 ? (
              <span
                style={{
                  backgroundColor: `${currentTheme.accentColor}20`,
                  borderColor: `${currentTheme.accentColor}40`,
                  color: currentTheme.accentColor,
                }}
                className="px-2 py-0.5 rounded-md border font-mono font-bold text-[11px]"
              >
                {outputGroups[0].name}
              </span>
            ) : (
              <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800">
                {outputGroups.map((out, idx) => (
                  <button
                    key={out.id}
                    onClick={() => setSelectedOutputIndex(idx)}
                    style={
                      selectedOutputIndex === idx
                        ? {
                            backgroundColor: `${currentTheme.primaryColor}25`,
                            color: currentTheme.primaryColor,
                            borderColor: `${currentTheme.primaryColor}50`,
                          }
                        : {}
                    }
                    className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold transition-all border ${
                      selectedOutputIndex === idx
                        ? 'border shadow-sm'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {out.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Concept Tabs Navigation */}
        <div
          style={{ borderColor: currentTheme.borderTone }}
          className="flex border-b px-4 sm:px-6 pt-2.5 gap-4 sm:gap-6 text-xs font-semibold shrink-0 bg-slate-950/40 overflow-x-auto"
        >
          <button
            onClick={() => setActiveTab('table')}
            style={
              activeTab === 'table'
                ? {
                    borderBottomColor: currentTheme.primaryColor,
                    color: currentTheme.primaryColor,
                  }
                : {}
            }
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'table' ? 'font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>1. Interactive Truth Table</span>
            {activeRowIndex >= 0 && (
              <span
                style={{
                  backgroundColor: `${currentTheme.primaryColor}20`,
                  color: currentTheme.primaryColor,
                }}
                className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold hidden sm:inline"
              >
                Live: #{activeRowIndex}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('equations')}
            style={
              activeTab === 'equations'
                ? {
                    borderBottomColor: currentTheme.primaryColor,
                    color: currentTheme.primaryColor,
                  }
                : {}
            }
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'equations' ? 'font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>2. Canonical & Minimized Equations</span>
          </button>

          <button
            onClick={() => setActiveTab('kmap')}
            style={
              activeTab === 'kmap'
                ? {
                    borderBottomColor: currentTheme.primaryColor,
                    color: currentTheme.primaryColor,
                  }
                : {}
            }
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'kmap' ? 'font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>3. 2D Karnaugh Map & Waveforms</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 text-xs">
          {numVars === 0 || outputGroups.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-3 p-6">
              <div
                style={{
                  backgroundColor: `${currentTheme.primaryColor}15`,
                  borderColor: `${currentTheme.primaryColor}30`,
                  color: currentTheme.primaryColor,
                }}
                className="w-12 h-12 rounded-2xl border flex items-center justify-center shadow-lg"
              >
                <Cpu className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="font-bold text-slate-200 text-sm">Circuit Inputs & Outputs Required</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Place at least one input variable switch (Toggle Switch, Push Button) and one output indicator
                  (Output Probe, LED, or 7-Segment Display) on the canvas to generate a complete truth table.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* CONCEPT 1: Interactive Truth Table */}
              {activeTab === 'table' && (
                <div className="space-y-3">
                  {/* Filters and Search Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                        <button
                          onClick={() => setRowFilter('all')}
                          className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                            rowFilter === 'all'
                              ? 'bg-slate-800 text-slate-100'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          All ({tableRows.length})
                        </button>
                        <button
                          onClick={() => setRowFilter('ones')}
                          className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                            rowFilter === 'ones'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Minterms ({mintermMap[activeOutputName]?.length || 0})
                        </button>
                        <button
                          onClick={() => setRowFilter('zeros')}
                          className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                            rowFilter === 'zeros'
                              ? 'bg-slate-800 text-slate-300'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Maxterms ({maxtermMap[activeOutputName]?.length || 0})
                        </button>
                      </div>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search row / binary..."
                          className="pl-8 pr-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono focus:outline-none focus:border-slate-700 w-36 sm:w-44"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span>Current Canvas Row:</span>
                        <strong className="text-slate-200 font-mono">
                          {activeRowIndex >= 0 ? `#${activeRowIndex}` : 'None'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Truth Table Grid */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden shadow-lg bg-slate-950/70 max-h-96 overflow-y-auto">
                    <table className="w-full text-center border-collapse text-xs font-mono">
                      <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-300 z-10">
                        <tr>
                          <th className="p-2 border-r border-slate-800 text-slate-500 w-12">#</th>
                          <th className="p-2 border-r border-slate-800 text-slate-500 w-16">Term</th>
                          {variableGroups.map((v) => (
                            <th
                              key={v.name}
                              style={{ color: currentTheme.primaryColor }}
                              className="p-2 border-r border-slate-800 font-bold"
                            >
                              {v.name}
                            </th>
                          ))}
                          {outputGroups.map((out) => (
                            <th
                              key={out.name}
                              style={{ color: currentTheme.accentColor }}
                              className="p-2 border-r border-slate-800 last:border-r-0 font-bold bg-slate-900/90"
                            >
                              {out.name}
                            </th>
                          ))}
                          <th className="p-2 text-slate-500 w-24">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {filteredRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={3 + variableGroups.length + outputGroups.length}
                              className="p-6 text-center text-slate-500 font-sans"
                            >
                              No matching truth table rows for current filter criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredRows.map((row) => {
                            const isLive = row.rowIndex === activeRowIndex;
                            const isApplied = appliedRowIndex === row.rowIndex;

                            return (
                              <tr
                                key={row.rowIndex}
                                style={
                                  isLive
                                    ? {
                                        backgroundColor: `${currentTheme.primaryColor}12`,
                                        borderColor: `${currentTheme.primaryColor}55`,
                                      }
                                    : {}
                                }
                                className={`hover:bg-slate-800/50 transition-colors ${
                                  isLive ? 'font-semibold' : ''
                                }`}
                              >
                                <td className="p-2 border-r border-slate-800/80 text-slate-500 font-mono text-[11px]">
                                  {row.rowIndex}
                                </td>
                                <td className="p-2 border-r border-slate-800/80 text-slate-400 font-mono text-[11px]">
                                  {row.minterm}
                                </td>
                                {variableGroups.map((v) => {
                                  const val = row.inputs[v.name];
                                  return (
                                    <td key={v.name} className="p-2 border-r border-slate-800/80">
                                      <span
                                        style={
                                          val === 1
                                            ? {
                                                backgroundColor: `${currentTheme.primaryColor}22`,
                                                color: currentTheme.primaryColor,
                                                borderColor: `${currentTheme.primaryColor}55`,
                                              }
                                            : {}
                                        }
                                        className={`px-2 py-0.5 rounded font-bold inline-block min-w-6 text-center ${
                                          val === 1 ? 'border shadow-sm' : 'text-slate-500 bg-slate-900/60'
                                        }`}
                                      >
                                        {val}
                                      </span>
                                    </td>
                                  );
                                })}
                                {outputGroups.map((out) => {
                                  const outVal = row.outputs[out.name];
                                  return (
                                    <td
                                      key={out.name}
                                      className="p-2 border-r border-slate-800/80 last:border-r-0 bg-slate-950/30"
                                    >
                                      <span
                                        style={
                                          outVal === 1
                                            ? {
                                                backgroundColor: `${currentTheme.accentColor}25`,
                                                color: currentTheme.accentColor,
                                                borderColor: `${currentTheme.accentColor}60`,
                                              }
                                            : outVal === 'X'
                                            ? { backgroundColor: '#e11d4833', color: '#fb7185' }
                                            : outVal === 'Z'
                                            ? { backgroundColor: '#f59e0b33', color: '#fbbf24' }
                                            : {}
                                        }
                                        className={`px-2.5 py-0.5 rounded font-bold inline-block min-w-6 text-center ${
                                          outVal === 1
                                            ? 'border shadow-sm'
                                            : 'text-slate-500 bg-slate-900/80'
                                        }`}
                                      >
                                        {outVal}
                                      </span>
                                    </td>
                                  );
                                })}
                                <td className="p-1.5 text-center">
                                  <button
                                    onClick={() => handleApplyRowToCanvas(row.inputs, row.rowIndex)}
                                    style={
                                      isLive
                                        ? {
                                            backgroundColor: `${currentTheme.primaryColor}25`,
                                            color: currentTheme.primaryColor,
                                            borderColor: `${currentTheme.primaryColor}60`,
                                          }
                                        : {}
                                    }
                                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all border ${
                                      isApplied
                                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                        : isLive
                                        ? 'border'
                                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                                    }`}
                                    title="Drive canvas switches to this combination in real-time"
                                  >
                                    {isApplied ? (
                                      <span className="flex items-center gap-1 justify-center">
                                        <Check className="w-3 h-3" /> Set
                                      </span>
                                    ) : isLive ? (
                                      <span className="flex items-center gap-1 justify-center">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                        Active
                                      </span>
                                    ) : (
                                      'Test State'
                                    )}
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CONCEPT 2: Canonical & Minimized Boolean Synthesis */}
              {activeTab === 'equations' && (
                <div className="space-y-4">
                  {/* Minimized SOP Card */}
                  <div
                    style={{
                      backgroundColor: `${currentTheme.canvasBg}ee`,
                      borderColor: currentTheme.borderTone,
                    }}
                    className="p-4 rounded-xl border shadow-lg space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Sparkles
                          style={{ color: currentTheme.primaryColor }}
                          className="w-4 h-4"
                        />
                        <span className="font-bold text-slate-100 text-xs">
                          Minimized Boolean Equation ({activeOutputName})
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                          Optimal Prime Implicants
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => copyToClipboard(minimizedSOP, 'minimized')}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-semibold border border-slate-800 transition-colors"
                        >
                          {copiedFormat === 'minimized' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleSynthesizeMinimizedCircuit}
                          style={{
                            backgroundColor: currentTheme.primaryColor,
                            color: '#0f172a',
                          }}
                          className="flex items-center gap-1.5 px-3 py-1 rounded font-bold text-[11px] transition-all shadow-md"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>Synthesize Equivalent Circuit</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800/90 font-mono text-sm sm:text-base text-slate-100 flex items-center justify-between">
                      <span className="font-bold tracking-wide">
                        <span style={{ color: currentTheme.accentColor }}>{activeOutputName}</span>
                        <span className="text-slate-400 mx-2">=</span>
                        <span style={{ color: currentTheme.primaryColor }}>{minimizedSOP}</span>
                      </span>
                    </div>

                    {synthesisSuccess && (
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{synthesisSuccess}</span>
                      </div>
                    )}
                  </div>

                  {/* Canonical Forms Comparison Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Canonical SOP */}
                    <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                          Canonical Sum of Products (SOP)
                        </span>
                        <button
                          onClick={() => copyToClipboard(canonicalSOP, 'sop')}
                          className="text-slate-400 hover:text-slate-200 text-[10px] flex items-center gap-1 font-mono"
                        >
                          {copiedFormat === 'sop' ? 'Copied!' : 'Copy Σm'}
                        </button>
                      </div>
                      <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg font-mono text-xs text-emerald-400 break-words">
                        {canonicalSOP}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Evaluates to 1 for all true minterm input combinations.
                      </p>
                    </div>

                    {/* Canonical POS */}
                    <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                          Canonical Product of Sums (POS)
                        </span>
                        <button
                          onClick={() => copyToClipboard(canonicalPOS, 'pos')}
                          className="text-slate-400 hover:text-slate-200 text-[10px] flex items-center gap-1 font-mono"
                        >
                          {copiedFormat === 'pos' ? 'Copied!' : 'Copy ΠM'}
                        </button>
                      </div>
                      <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg font-mono text-xs text-cyan-400 break-words">
                        {canonicalPOS}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Evaluates to 0 for all false maxterm input combinations.
                      </p>
                    </div>
                  </div>

                  {/* Export / HDL Formats */}
                  <div className="p-3.5 bg-slate-900/50 border border-slate-800 rounded-xl space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Hardware Description Code (Verilog / VHDL):
                    </span>
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 flex items-center justify-between">
                      <code>
                        assign {activeOutputName} = {minimizedSOP.replace(/ \+ /g, ' | ').replace(/([A-Za-z0-9_]+)'/g, '~$1').replace(/([A-Za-z0-9_]+)([A-Za-z0-9_]+)/g, '$1 & $2')};
                      </code>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `assign ${activeOutputName} = ${minimizedSOP.replace(/ \+ /g, ' | ').replace(/([A-Za-z0-9_]+)'/g, '~$1')};`,
                            'verilog'
                          )
                        }
                        className="text-slate-400 hover:text-slate-200 text-[10px] ml-2"
                      >
                        {copiedFormat === 'verilog' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CONCEPT 3: 2D Karnaugh Map Matrix & Digital Waveforms */}
              {activeTab === 'kmap' && (
                <div className="space-y-4">
                  {kmapAnalysis ? (
                    <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-purple-400" />
                          <span>2D Karnaugh Map Matrix for {activeOutputName}</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {kmapAnalysis.variableCount}-Variable Gray-Code Grid
                        </span>
                      </div>

                      {/* 2D Gray-Code Table */}
                      <div className="overflow-x-auto flex justify-center py-2">
                        <table className="border-collapse font-mono text-xs">
                          <thead>
                            <tr>
                              <th className="p-2 text-slate-500 border border-slate-800 bg-slate-950 text-[10px]">
                                {kmapAnalysis.rowVarNames.join('')} \ {kmapAnalysis.colVarNames.join('')}
                              </th>
                              {kmapAnalysis.colHeaders.map((colH) => (
                                <th
                                  key={colH}
                                  className="p-2 border border-slate-800 text-cyan-400 bg-slate-900 font-bold min-w-12 text-center"
                                >
                                  {colH}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {kmapAnalysis.grid.map((rowCells, rIdx) => (
                              <tr key={rIdx}>
                                <th className="p-2 border border-slate-800 text-purple-400 bg-slate-900 font-bold text-center">
                                  {kmapAnalysis.rowHeaders[rIdx]}
                                </th>
                                {rowCells.map((cell) => (
                                  <td
                                    key={cell.mintermIndex}
                                    style={
                                      cell.value === 1
                                        ? {
                                            backgroundColor: `${currentTheme.primaryColor}25`,
                                            color: currentTheme.primaryColor,
                                            borderColor: `${currentTheme.primaryColor}40`,
                                          }
                                        : {}
                                    }
                                    className={`p-3 border text-center font-bold text-sm ${
                                      cell.value === 1
                                        ? 'shadow-inner'
                                        : 'border-slate-800 text-slate-500 bg-slate-950/60'
                                    }`}
                                  >
                                    <div className="flex flex-col items-center">
                                      <span>{cell.value}</span>
                                      <span className="text-[9px] text-slate-500 font-normal">
                                        m{cell.mintermIndex}
                                      </span>
                                    </div>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
                      <p>K-Map matrix is supported for 2, 3, or 4 input variables.</p>
                    </div>
                  )}

                  {/* Digital Timing Waveform Sequence Preview */}
                  <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        <span>Digital Timing Waveform Preview</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {totalCombinations} State Steps
                      </span>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {/* Input Traces */}
                      {variableGroups.map((v) => (
                        <div key={v.name} className="flex items-center gap-3 text-[11px] font-mono">
                          <span
                            style={{ color: currentTheme.primaryColor }}
                            className="w-12 text-right font-bold truncate shrink-0"
                          >
                            {v.name}:
                          </span>
                          <div className="flex-1 flex h-6 bg-slate-950 border border-slate-800/80 rounded overflow-hidden">
                            {tableRows.map((r) => {
                              const bit = r.inputs[v.name];
                              return (
                                <div
                                  key={r.rowIndex}
                                  className="flex-1 border-r border-slate-800/40 flex items-center justify-center relative"
                                  title={`Step ${r.rowIndex}: ${v.name} = ${bit}`}
                                >
                                  <div
                                    style={
                                      bit === 1
                                        ? {
                                            backgroundColor: currentTheme.primaryColor,
                                            height: '65%',
                                            width: '100%',
                                            opacity: 0.9,
                                          }
                                        : {
                                            backgroundColor: '#334155',
                                            height: '15%',
                                            width: '100%',
                                            marginTop: 'auto',
                                          }
                                    }
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {/* Output Trace */}
                      <div className="flex items-center gap-3 text-[11px] font-mono pt-1 border-t border-slate-800">
                        <span
                          style={{ color: currentTheme.accentColor }}
                          className="w-12 text-right font-bold truncate shrink-0"
                        >
                          {activeOutputName}:
                        </span>
                        <div className="flex-1 flex h-6 bg-slate-950 border border-slate-800/80 rounded overflow-hidden">
                          {tableRows.map((r) => {
                            const outBit = r.outputs[activeOutputName];
                            return (
                              <div
                                key={r.rowIndex}
                                className="flex-1 border-r border-slate-800/40 flex items-center justify-center relative"
                                title={`Step ${r.rowIndex}: ${activeOutputName} = ${outBit}`}
                              >
                                <div
                                  style={
                                    outBit === 1
                                      ? {
                                          backgroundColor: currentTheme.accentColor,
                                          height: '75%',
                                          width: '100%',
                                          opacity: 0.95,
                                        }
                                      : {
                                          backgroundColor: '#334155',
                                          height: '15%',
                                          width: '100%',
                                          marginTop: 'auto',
                                        }
                                  }
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            backgroundColor: currentTheme.navBg,
            borderColor: currentTheme.borderTone,
          }}
          className="px-4 sm:px-6 py-3 border-t flex items-center justify-between shrink-0"
        >
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <span className="hidden sm:inline">
              Variables automatically unified by label & net names.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveModal('none')}
              className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 font-semibold text-xs transition-colors border border-slate-700/60"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
