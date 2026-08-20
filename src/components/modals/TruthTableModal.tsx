/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useCircuit } from '../../context/CircuitContext';
import { simulateCircuit } from '../../engine/simulation';
import { LogicState } from '../../types/circuit';
import { Download, Table, X } from 'lucide-react';

export const TruthTableModal: React.FC = () => {
  const { components, wires, customGates, activeModal, setActiveModal, simulationState } = useCircuit();

  // Identify input components and output components
  const inputs = components.filter((c) =>
    ['SWITCH', 'BUTTON', 'CONST_1', 'CONST_0', 'CLOCK'].includes(c.type)
  );
  const outputs = components.filter((c) =>
    ['PROBE', 'LED', 'HEX_DISPLAY', 'SEGMENT_7'].includes(c.type)
  );

  // Generate all 2^N input combinations (capped at 256 rows to prevent lag)
  const numInputs = Math.min(inputs.length, 8);
  const totalRows = Math.pow(2, numInputs);

  const customMap = new Map();
  customGates.forEach((g) => customMap.set(g.id, g));

  const tableData = useMemo(() => {
    if (inputs.length === 0 || outputs.length === 0) return [];

    const rows = [];
    for (let r = 0; r < totalRows; r++) {
      // Set input values for combination r
      const currentInputs: Record<string, LogicState> = {};
      const modifiedComponents = components.map((comp) => {
        const inputIdx = inputs.findIndex((inp) => inp.id === comp.id);
        if (inputIdx >= 0 && inputIdx < numInputs) {
          // Bit value of r at position (numInputs - 1 - inputIdx)
          const bit = (r >> (numInputs - 1 - inputIdx)) & 1;
          currentInputs[comp.label || comp.name || `In${inputIdx}`] = (bit as LogicState);
          return {
            ...comp,
            internalState: { ...comp.internalState, value: bit },
          };
        }
        return comp;
      });

      // Run simulation for this combination
      const sim = simulateCircuit(modifiedComponents, wires, customMap);

      const currentOutputs: Record<string, LogicState> = {};
      outputs.forEach((outComp, idx) => {
        const val = sim.portValues[outComp.id]?.['in_0'] ?? sim.portValues[outComp.id]?.['out'] ?? 0;
        currentOutputs[outComp.label || outComp.name || `Out${idx}`] = val;
      });

      rows.push({
        rowIdx: r,
        inputs: currentInputs,
        outputs: currentOutputs,
      });
    }
    return rows;
  }, [components, wires, customGates, numInputs, totalRows]);

  if (activeModal !== 'truthTable') return null;

  // Export CSV
  const exportCsv = () => {
    if (tableData.length === 0) return;
    const inHeaders = Object.keys(tableData[0].inputs);
    const outHeaders = Object.keys(tableData[0].outputs);
    const headers = [...inHeaders, ...outHeaders].join(',');

    const csvRows = tableData.map((row) => {
      const inVals = inHeaders.map((h) => row.inputs[h]);
      const outVals = outHeaders.map((h) => row.outputs[h]);
      return [...inVals, ...outVals].join(',');
    });

    const csvContent = [headers, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'circuit_truth_table.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm">Automated Truth Table Generator</h2>
              <p className="text-xs text-slate-400">
                Evaluating all {totalRows} input states across {inputs.length} inputs & {outputs.length} outputs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              disabled={tableData.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
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

        {/* Content Table */}
        <div className="flex-1 overflow-auto p-4">
          {inputs.length === 0 || outputs.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs text-center space-y-2">
              <p>Please place at least one Input Switch/Button and one Output Probe/LED on the canvas.</p>
            </div>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-center border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-900 text-slate-300 font-bold border-b border-slate-800">
                    <th className="p-2.5 border-r border-slate-800 text-slate-500 w-12">#</th>
                    {Object.keys(tableData[0]?.inputs || {}).map((inp) => (
                      <th key={inp} className="p-2.5 border-r border-slate-800 text-cyan-400">
                        {inp}
                      </th>
                    ))}
                    {Object.keys(tableData[0]?.outputs || {}).map((out) => (
                      <th key={out} className="p-2.5 border-r border-slate-800 text-emerald-400 last:border-r-0">
                        {out}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/60">
                  {tableData.map((row) => (
                    <tr key={row.rowIdx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-2 border-r border-slate-800 text-slate-500">{row.rowIdx}</td>
                      {Object.keys(row.inputs).map((key) => (
                        <td key={key} className="p-2 border-r border-slate-800">
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              row.inputs[key] === 1 ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/50' : 'text-slate-500'
                            }`}
                          >
                            {row.inputs[key]}
                          </span>
                        </td>
                      ))}
                      {Object.keys(row.outputs).map((key) => (
                        <td key={key} className="p-2 border-r border-slate-800 last:border-r-0">
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              row.outputs[key] === 1
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                                : 'text-slate-500'
                            }`}
                          >
                            {row.outputs[key]}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
