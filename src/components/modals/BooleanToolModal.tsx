/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useCircuit } from '../../context/CircuitContext';
import {
  parseBooleanExpression,
  synthesizeCircuitFromAST,
  simplifyBooleanExpression,
} from '../../engine/booleanParser';
import { FileCode2, Sparkles, Wand2, X, ArrowRight, Check } from 'lucide-react';

export const BooleanToolModal: React.FC = () => {
  const { activeModal, setActiveModal, clearCanvas, setCamera } = useCircuit();
  const [activeTab, setActiveTab] = useState<'synthesize' | 'simplify'>('synthesize');

  // Synthesizer State
  const [expression, setExpression] = useState('(A AND B) OR (NOT C)');
  const [parseError, setParseError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Simplifier State
  const [inputToSimplify, setInputToSimplify] = useState('(A AND B) OR (A AND (NOT B))');
  const [simplifiedResult, setSimplifiedResult] = useState<{
    original: string;
    simplified: string;
    steps: { rule: string; expression: string; explanation: string }[];
  } | null>(null);

  if (activeModal !== 'boolean') return null;

  const handleSynthesize = () => {
    try {
      setParseError(null);
      const ast = parseBooleanExpression(expression);
      const { components, wires } = synthesizeCircuitFromAST(ast, 'Y', 100, 100);

      // Load synthesized circuit into context
      clearCanvas();
      // Inject components via import or direct update
      const { importJson } = (window as any).__circuitActions || {};
      
      // Dispatch custom event to load synthesized components
      window.dispatchEvent(
        new CustomEvent('load_synthesized_circuit', {
          detail: { components, wires, name: `Synthesized: ${expression}` },
        })
      );

      setSuccessMsg('Synthesized circuit successfully onto the canvas!');
      setTimeout(() => {
        setSuccessMsg(null);
        setActiveModal('none');
      }, 1200);
    } catch (err: any) {
      setParseError(err.message || 'Syntax error in Boolean expression');
    }
  };

  const handleSimplify = () => {
    try {
      setParseError(null);
      const res = simplifyBooleanExpression(inputToSimplify);
      setSimplifiedResult(res);
    } catch (err: any) {
      setParseError(err.message || 'Failed to simplify expression');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm">Boolean Algebra & Circuit Synthesizer</h2>
              <p className="text-xs text-slate-400">Synthesize gates from equations or simplify algebraic formulas</p>
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
        <div className="flex border-b border-slate-800 px-5 pt-3 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('synthesize')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'synthesize'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Expression-to-Circuit Synthesizer</span>
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
            <span>Algebraic Simplifier</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 text-xs">
          {activeTab === 'synthesize' ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Enter Boolean Expression:</label>
                <input
                  type="text"
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  placeholder="e.g. (A AND B) OR (NOT C)"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono text-sm focus:outline-none focus:border-cyan-500"
                />
                <div className="flex flex-wrap gap-1.5 mt-2 text-[11px] text-slate-400">
                  <span>Presets:</span>
                  {[
                    '(A AND B) OR C',
                    '(A XOR B) AND (NOT C)',
                    'NOT (A AND B)',
                    '(A AND B) OR (B AND C)',
                  ].map((pre) => (
                    <button
                      key={pre}
                      onClick={() => setExpression(pre)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition-colors"
                    >
                      {pre}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1 text-slate-400 text-[11px]">
                <span className="font-semibold text-slate-300 block">Supported Operators:</span>
                <p>• <b>AND</b>: <code className="text-cyan-400">AND</code>, <code className="text-cyan-400">&amp;</code>, <code className="text-cyan-400">*</code></p>
                <p>• <b>OR</b>: <code className="text-cyan-400">OR</code>, <code className="text-cyan-400">|</code>, <code className="text-cyan-400">+</code></p>
                <p>• <b>NOT</b>: <code className="text-cyan-400">NOT</code>, <code className="text-cyan-400">~</code>, <code className="text-cyan-400">!</code></p>
                <p>• <b>XOR</b>: <code className="text-cyan-400">XOR</code>, <code className="text-cyan-400">^</code></p>
                <p>• Grouping parentheses: <code className="text-cyan-400">( )</code></p>
              </div>

              {parseError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs">
                  {parseError}
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                onClick={handleSynthesize}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-xs"
              >
                <Wand2 className="w-4 h-4" />
                <span>Build Circuit on Canvas</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Enter Expression to Minimize:</label>
                <input
                  type="text"
                  value={inputToSimplify}
                  onChange={(e) => setInputToSimplify(e.target.value)}
                  placeholder="e.g. (A AND B) OR (A AND (NOT B))"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={handleSimplify}
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Simplify Expression</span>
              </button>

              {simplifiedResult && (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Minimized Form:</span>
                    <span className="text-emerald-400 font-bold font-mono text-sm">
                      {simplifiedResult.simplified}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <span className="text-slate-400 block text-[11px] font-semibold mb-1">Derivation Steps:</span>
                    {simplifiedResult.steps.map((step, i) => (
                      <div key={i} className="flex flex-col gap-1 text-slate-300 font-mono text-[11px] bg-slate-800/50 p-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="font-bold text-slate-200">{step.rule}</span>
                        </div>
                        <div className="pl-5 text-emerald-400 font-bold">{step.expression}</div>
                        <div className="pl-5 text-slate-400 text-[10px]">{step.explanation}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
