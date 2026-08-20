/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useCircuit } from '../../context/CircuitContext';
import { generateKMap, KMapCell } from '../../engine/kmap';
import { parseBooleanExpression, synthesizeCircuitFromAST } from '../../engine/booleanParser';
import { Sparkles, Wand2, X, RotateCcw } from 'lucide-react';

export const KMapModal: React.FC = () => {
  const { activeModal, setActiveModal, clearCanvas } = useCircuit();
  const [numVars, setNumVars] = useState<2 | 3 | 4>(3);

  // Minterm bit states: 0, 1, or 'X' (don't care)
  const totalMinterms = Math.pow(2, numVars);
  const [minterms, setMinterms] = useState<(0 | 1)[]>(() => {
    // Default example: F(A,B,C) = m(1,3,4,6,7)
    const arr: (0 | 1)[] = Array(16).fill(0);
    [1, 3, 4, 6, 7].forEach((m) => {
      arr[m] = 1;
    });
    return arr;
  });

  // Generate K-Map calculation
  const kmapResult = useMemo(() => {
    return generateKMap(numVars, minterms);
  }, [numVars, minterms]);

  if (activeModal !== 'kmap') return null;

  // Handle var change
  const handleVarChange = (vars: 2 | 3 | 4) => {
    setNumVars(vars);
    const count = Math.pow(2, vars);
    setMinterms(Array(count).fill(0));
  };

  // Toggle cell value: 0 -> 1 -> 0
  const toggleCell = (index: number) => {
    setMinterms((prev) => {
      const next = [...prev];
      next[index] = next[index] === 0 ? 1 : 0;
      return next;
    });
  };

  // Build circuit from minimized SOP
  const handleSynthesizeKMap = () => {
    if (kmapResult.minimizedSOP === '0' || kmapResult.minimizedSOP === '1') return;
    try {
      const ast = parseBooleanExpression(kmapResult.minimizedSOP);
      const { components, wires } = synthesizeCircuitFromAST(ast, 'F', 100, 100);

      window.dispatchEvent(
        new CustomEvent('load_synthesized_circuit', {
          detail: { components, wires, name: `K-Map: ${kmapResult.minimizedSOP}` },
        })
      );
      setActiveModal('none');
    } catch (err) {
      console.error('KMap synthesis failed:', err);
    }
  };

  // Group colors for bounding loops
  const groupColors = ['#10b981', '#38bdf8', '#f59e0b', '#ec4899', '#a855f7'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm">Interactive Karnaugh Map Minimizator</h2>
              <p className="text-xs text-slate-400">Gray-code grid minimization & optimal prime implicant grouping</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal('none')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/40 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Variables:</span>
            {[2, 3, 4].map((v) => (
              <button
                key={v}
                onClick={() => handleVarChange(v as 2 | 3 | 4)}
                className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                  numVars === v
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {v} Variables ({v === 2 ? 'AB' : v === 3 ? 'ABC' : 'ABCD'})
              </button>
            ))}
          </div>

          <button
            onClick={() => setMinterms(Array(totalMinterms).fill(0))}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-xs px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Grid</span>
          </button>
        </div>

        {/* K-Map Interactive Grid */}
        <div className="p-6 flex flex-col items-center justify-center space-y-6">
          <div className="inline-block border border-slate-800 rounded-2xl p-4 bg-slate-950/70 shadow-inner">
            <table className="border-collapse font-mono text-center">
              <thead>
                <tr>
                  <th className="p-3 text-purple-400 text-xs font-bold border-b border-r border-slate-800">
                    {numVars === 2 ? 'A \\ B' : numVars === 3 ? 'A \\ BC' : 'AB \\ CD'}
                  </th>
                  {kmapResult.colHeaders.map((colHeader) => (
                    <th key={colHeader} className="p-3 text-slate-300 text-xs font-bold border-b border-slate-800 w-16">
                      {colHeader}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kmapResult.grid.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td className="p-3 text-slate-300 text-xs font-bold border-r border-slate-800">
                      {kmapResult.rowHeaders[rIdx]}
                    </td>
                    {row.map((cell) => {
                      const val = minterms[cell.mintermIndex];
                      return (
                        <td key={cell.mintermIndex} className="p-1">
                          <button
                            onClick={() => toggleCell(cell.mintermIndex)}
                            className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
                              val === 1
                                ? 'bg-purple-950/80 border-purple-500 text-purple-300 shadow-md shadow-purple-950'
                                : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                            }`}
                          >
                            <span className="text-base font-bold">{val}</span>
                            <span className="text-[9px] text-slate-500 font-mono">m{cell.mintermIndex}</span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Minimized SOP Expression Card */}
          <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-slate-400 text-xs font-medium">Minimized Sum of Products (SOP):</span>
              <div className="text-emerald-400 font-mono font-bold text-base tracking-wide">
                F = {kmapResult.minimizedSOP}
              </div>
            </div>

            <button
              onClick={handleSynthesizeKMap}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs transition-colors shadow-lg flex items-center gap-2 whitespace-nowrap"
            >
              <Wand2 className="w-4 h-4" />
              <span>Synthesize to Canvas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
