/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useCircuit } from '../../context/CircuitContext';
import {
  parseBooleanExpression,
  generateTruthTableFromAST,
  simplifyBooleanExpression,
  extractVariablesFromAST,
  LiveTruthTableResult,
} from '../../engine/booleanParser';
import {
  FileCode2,
  Sparkles,
  Wand2,
  X,
  ArrowRight,
  Check,
  AlertCircle,
  Play,
  Copy,
  Table,
  Plus,
  Layers,
  HelpCircle,
} from 'lucide-react';

export const BooleanToolModal: React.FC = () => {
  const { activeModal, setActiveModal, synthesizeAndLoadExpression } = useCircuit();
  const [activeTab, setActiveTab] = useState<'synthesize' | 'simplify'>('synthesize');

  // Synthesizer Live Input State
  const [expression, setExpression] = useState<string>('(A AND B) OR (NOT C)');
  const [synthesisMode, setSynthesisMode] = useState<'replace' | 'insert'>('replace');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Simplifier Live Input State
  const [inputToSimplify, setInputToSimplify] = useState<string>('(A AND B) OR (A AND (NOT B))');

  // Real-time parsed AST and Truth Table for Synthesizer Tab
  const liveSynthesizerAnalysis = useMemo(() => {
    if (!expression.trim()) {
      return { isValid: false, error: 'Type a Boolean expression above (e.g. AB + C)', truthTable: null, vars: [] };
    }
    try {
      const ast = parseBooleanExpression(expression);
      const truthTable = generateTruthTableFromAST(ast);
      const vars = extractVariablesFromAST(ast);
      return { isValid: true, error: null, truthTable, vars, ast };
    } catch (err: any) {
      return { isValid: false, error: err.message || 'Syntax error in Boolean expression', truthTable: null, vars: [] };
    }
  }, [expression]);

  // Real-time simplified result for Simplifier Tab
  const liveSimplifierAnalysis = useMemo(() => {
    if (!inputToSimplify.trim()) {
      return { isValid: false, error: 'Enter a Boolean expression to simplify', result: null };
    }
    try {
      const res = simplifyBooleanExpression(inputToSimplify);
      return { isValid: true, error: null, result: res };
    } catch (err: any) {
      return { isValid: false, error: err.message || 'Syntax error in Boolean expression', result: null };
    }
  }, [inputToSimplify]);

  if (activeModal !== 'boolean') return null;

  const handleSynthesizeCircuit = () => {
    if (!liveSynthesizerAnalysis.isValid) return;
    const res = synthesizeAndLoadExpression(expression, synthesisMode);
    if (res.success) {
      setSuccessMsg(`Synthesized & loaded circuit for "${expression}"!`);
      setTimeout(() => {
        setSuccessMsg(null);
        setActiveModal('none');
      }, 1000);
    }
  };

  const insertSymbol = (sym: string, target: 'synthesize' | 'simplify') => {
    if (target === 'synthesize') {
      setExpression((prev) => prev + (prev.endsWith(' ') || prev === '' ? sym : ` ${sym}`));
    } else {
      setInputToSimplify((prev) => prev + (prev.endsWith(' ') || prev === '' ? sym : ` ${sym}`));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2.5 sm:p-4 animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl shadow-sm">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2">
                Live Boolean Solver & Circuit Synthesizer
              </h2>
              <p className="text-xs text-slate-400">
                Type equations to synthesize interactive gates, truth tables, and step-by-step simplification
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

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 px-5 pt-3 gap-4 text-xs font-semibold shrink-0 bg-slate-900/40">
          <button
            onClick={() => setActiveTab('synthesize')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'synthesize'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Real-time Circuit Synthesizer</span>
          </button>
          <button
            onClick={() => setActiveTab('simplify')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'simplify'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Step-by-Step Algebraic Solver</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'synthesize' ? (
            <div className="space-y-4">
              {/* Input Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <span>Boolean Expression:</span>
                    {liveSynthesizerAnalysis.isValid ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3" /> Valid Expression
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3" /> Syntax Alert
                      </span>
                    )}
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                    Auto-evaluates as you type
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={expression}
                    onChange={(e) => setExpression(e.target.value)}
                    placeholder="e.g. (A AND B) OR (NOT C) or AB + C'"
                    autoFocus
                    className={`w-full px-4 py-3 bg-slate-900 border rounded-xl text-slate-100 font-mono text-sm sm:text-base focus:outline-none transition-colors shadow-inner ${
                      liveSynthesizerAnalysis.isValid
                        ? 'border-cyan-500/60 focus:border-cyan-400'
                        : 'border-rose-500/60 focus:border-rose-400'
                    }`}
                  />
                  {expression && (
                    <button
                      onClick={() => setExpression('')}
                      className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Error message indicator */}
                {liveSynthesizerAnalysis.error && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1 font-mono">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {liveSynthesizerAnalysis.error}
                  </p>
                )}

                {/* Quick Touch Keypad for Tablet & Mobile Users */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 font-medium mr-1">Insert:</span>
                  {['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR', '(', ')', "’", 'A', 'B', 'C', 'D'].map(
                    (sym) => (
                      <button
                        key={sym}
                        onClick={() => insertSymbol(sym, 'synthesize')}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-cyan-500/30 text-slate-200 font-mono text-xs font-semibold border border-slate-700/60 transition-colors"
                      >
                        {sym}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Presets List */}
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <span className="text-[11px] text-slate-400 font-semibold block">
                  Quick Architecture Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Half Adder Sum', expr: 'A XOR B' },
                    { label: 'Full Adder Carry', expr: '(A AND B) OR (Cin AND (A XOR B))' },
                    { label: '2:1 Mux', expr: '(A AND (NOT S)) OR (B AND S)' },
                    { label: 'Majority (3-input)', expr: '(A AND B) OR (B AND C) OR (A AND C)' },
                    { label: 'De Morgan NAND', expr: 'NOT (A AND B)' },
                    { label: 'XOR from Basic Gates', expr: '(A AND (NOT B)) OR ((NOT A) AND B)' },
                  ].map((pre) => (
                    <button
                      key={pre.label}
                      onClick={() => setExpression(pre.expr)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-cyan-950/40 hover:text-cyan-300 hover:border-cyan-500/40 border border-slate-700/60 text-[11px] text-slate-300 font-medium transition-all"
                    >
                      {pre.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Truth Table & Analysis Results Preview */}
              {liveSynthesizerAnalysis.isValid && liveSynthesizerAnalysis.truthTable && (
                <div className="space-y-3 p-4 bg-slate-900/70 border border-slate-800 rounded-xl">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Table className="w-4 h-4 text-cyan-400" />
                      <span className="font-bold text-slate-200 text-xs">Live Generated Truth Table</span>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-mono">
                        {liveSynthesizerAnalysis.vars.length} Variables ({Math.pow(2, liveSynthesizerAnalysis.vars.length)} Combinations)
                      </span>
                    </div>
                  </div>

                  {/* Truth Table Grid */}
                  <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-lg bg-slate-950/60">
                    <table className="w-full text-left font-mono text-[11px]">
                      <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400">
                        <tr>
                          <th className="py-1.5 px-3">#</th>
                          {liveSynthesizerAnalysis.vars.map((v) => (
                            <th key={v} className="py-1.5 px-3 text-cyan-400 font-bold">
                              {v}
                            </th>
                          ))}
                          <th className="py-1.5 px-3 text-emerald-400 font-bold bg-emerald-950/20">
                            Output (Y)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {liveSynthesizerAnalysis.truthTable.rows.map((row) => (
                          <tr
                            key={row.index}
                            className={`hover:bg-slate-800/40 transition-colors ${
                              row.output === 1 ? 'bg-emerald-500/5' : ''
                            }`}
                          >
                            <td className="py-1 px-3 text-slate-500">{row.minterm}</td>
                            {liveSynthesizerAnalysis.vars.map((v) => (
                              <td key={v} className="py-1 px-3 font-bold">
                                {row.inputs[v]}
                              </td>
                            ))}
                            <td
                              className={`py-1 px-3 font-bold ${
                                row.output === 1 ? 'text-emerald-400 bg-emerald-950/20' : 'text-slate-400'
                              }`}
                            >
                              {row.output}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Canonical Min-term & Max-term forms */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg">
                      <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">
                        Canonical SOP (∑ m):
                      </span>
                      <span className="text-emerald-400 font-semibold truncate block mt-0.5">
                        {liveSynthesizerAnalysis.truthTable.sopExpression}
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg">
                      <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">
                        Canonical POS (∏ M):
                      </span>
                      <span className="text-cyan-400 font-semibold truncate block mt-0.5">
                        {liveSynthesizerAnalysis.truthTable.posExpression}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Step-by-Step Algebraic Simplifier Tab */
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-slate-200 font-bold block">
                  Expression to Simplify / Prove:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={inputToSimplify}
                    onChange={(e) => setInputToSimplify(e.target.value)}
                    placeholder="e.g. (A AND B) OR (A AND (NOT B))"
                    className="w-full px-4 py-3 bg-slate-900 border border-cyan-500/60 rounded-xl text-slate-100 font-mono text-sm sm:text-base focus:outline-none focus:border-cyan-400 shadow-inner"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 font-medium mr-1">Insert:</span>
                  {['AND', 'OR', 'NOT', 'XOR', '(', ')', "’", 'A', 'B', 'C'].map((sym) => (
                    <button
                      key={sym}
                      onClick={() => insertSymbol(sym, 'simplify')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-semibold border border-slate-700/60 transition-colors"
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>

              {/* Simplification Steps Display */}
              {liveSimplifierAnalysis.isValid && liveSimplifierAnalysis.result && (
                <div className="space-y-3 p-4 bg-slate-900/70 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-slate-200 text-xs">
                      Step-by-Step Boolean Derivation
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs">
                      Simplified: {liveSimplifierAnalysis.result.simplified}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {liveSimplifierAnalysis.result.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            {step.rule}
                          </span>
                          <span className="font-mono text-slate-200 font-semibold px-2 py-0.5 bg-slate-900 rounded border border-slate-800">
                            {step.expression}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 pl-5.5">{step.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-900/95 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {activeTab === 'synthesize' && (
              <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                <button
                  onClick={() => setSynthesisMode('replace')}
                  className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                    synthesisMode === 'replace'
                      ? 'bg-slate-800 text-cyan-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Replace Canvas
                </button>
                <button
                  onClick={() => setSynthesisMode('insert')}
                  className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                    synthesisMode === 'insert'
                      ? 'bg-slate-800 text-cyan-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Insert / Append
                </button>
              </div>
            )}
            {successMsg && (
              <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1">
                <Check className="w-4 h-4" /> {successMsg}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setActiveModal('none')}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>

            {activeTab === 'synthesize' ? (
              <button
                onClick={handleSynthesizeCircuit}
                disabled={!liveSynthesizerAnalysis.isValid}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-950/50"
              >
                <Wand2 className="w-4 h-4" />
                <span>Synthesize & Load Circuit</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (liveSimplifierAnalysis.result) {
                    setExpression(liveSimplifierAnalysis.result.simplified);
                    setActiveTab('synthesize');
                  }
                }}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Use in Synthesizer</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
