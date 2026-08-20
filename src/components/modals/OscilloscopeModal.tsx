/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useCircuit } from '../../context/CircuitContext';
import { Activity, Download, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';

export const OscilloscopeModal: React.FC = () => {
  const { activeModal, setActiveModal, timingHistory } = useCircuit();
  const [zoomScale, setZoomScale] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  if (activeModal !== 'oscilloscope') return null;

  // Extract all unique signal names
  const signalNames = Array.from(
    new Set(timingHistory.flatMap((sample) => Object.keys(sample.signals)))
  );

  const width = 700;
  const channelHeight = 44;
  const totalHeight = Math.max(200, signalNames.length * channelHeight + 50);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-4xl flex flex-col shadow-2xl overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm">Digital Logic Analyzer & Oscilloscope</h2>
              <p className="text-xs text-slate-400">Real-time multi-channel digital waveform timing diagram</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoomScale((z) => Math.max(0.5, z * 0.8))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Zoom Out Time"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomScale((z) => Math.min(3, z * 1.25))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Zoom In Time"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveModal('none')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Waveform Canvas View */}
        <div ref={containerRef} className="flex-1 overflow-auto p-4 bg-[#090d16]">
          {signalNames.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs text-center space-y-2">
              <p>No active probe or switch signals recorded yet.</p>
              <p className="text-slate-500">Run the simulation to capture clock transitions and state changes.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <svg width={width * zoomScale} height={totalHeight} className="border border-slate-800 rounded-xl bg-slate-950/80">
                {/* Horizontal Channel Guidelines */}
                {signalNames.map((name, idx) => {
                  const y = idx * channelHeight + 30;
                  return (
                    <g key={name}>
                      <line x1={0} y1={y + 24} x2={width * zoomScale} y2={y + 24} stroke="#1e293b" strokeDasharray="2, 4" />
                      {/* Channel Label */}
                      <text x={10} y={y + 16} fill="#38bdf8" fontSize={11} fontWeight="bold" fontFamily="monospace">
                        {name}
                      </text>
                    </g>
                  );
                })}

                {/* Draw Waveforms */}
                {signalNames.map((name, idx) => {
                  const baselineY = idx * channelHeight + 54;
                  const highY = baselineY - 20;

                  // Build SVG path
                  let d = '';
                  const sampleWidth = (width * zoomScale) / Math.max(1, timingHistory.length);

                  timingHistory.forEach((sample, sIdx) => {
                    const val = sample.signals[name] === 1;
                    const x = sIdx * sampleWidth;
                    const curY = val ? highY : baselineY;

                    if (sIdx === 0) {
                      d += `M ${x} ${curY}`;
                    } else {
                      const prevVal = timingHistory[sIdx - 1].signals[name] === 1;
                      const prevY = prevVal ? highY : baselineY;
                      if (prevY !== curY) {
                        d += ` L ${x} ${prevY} L ${x} ${curY}`;
                      } else {
                        d += ` L ${x} ${curY}`;
                      }
                    }
                  });

                  return (
                    <g key={`wave_${name}`}>
                      <path
                        d={d}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
