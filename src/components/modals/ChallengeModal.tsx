/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useCircuit } from '../../context/CircuitContext';
import { CHALLENGES, verifyChallenge, ChallengeVerificationResult } from '../../engine/challenges';
import { Award, CheckCircle2, HelpCircle, Play, X, XCircle, ArrowRight } from 'lucide-react';

export const ChallengeModal: React.FC = () => {
  const { activeModal, setActiveModal, components, wires, customGates, loadChallenge } = useCircuit();
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>(CHALLENGES[0].id);
  const [testResult, setTestResult] = useState<ChallengeVerificationResult | null>(null);
  const [showHint, setShowHint] = useState(false);

  if (activeModal !== 'challenges') return null;

  const currentChallenge = CHALLENGES.find((c) => c.id === selectedChallengeId) || CHALLENGES[0];

  const customMap = new Map();
  customGates.forEach((g) => customMap.set(g.id, g));

  const handleRunVerification = () => {
    const res = verifyChallenge(currentChallenge, components, wires, customMap);
    setTestResult(res);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-4xl flex flex-col shadow-2xl overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm">Interactive Logic Design Challenges</h2>
              <p className="text-xs text-slate-400">
                Test your digital design mastery against automated simulation harnesses
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

        {/* Content Layout: Left Challenge Selector, Right Challenge Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Challenge List */}
          <div className="w-64 border-r border-slate-800 bg-slate-950/50 p-3 space-y-1.5 overflow-y-auto">
            {CHALLENGES.map((ch) => {
              const active = ch.id === selectedChallengeId;
              let diffColor = 'text-emerald-400 bg-emerald-950/80 border-emerald-800/60';
              if (ch.difficulty === 'Medium') diffColor = 'text-amber-400 bg-amber-950/80 border-amber-800/60';
              else if (ch.difficulty === 'Hard') diffColor = 'text-rose-400 bg-rose-950/80 border-rose-800/60';

              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    setSelectedChallengeId(ch.id);
                    setTestResult(null);
                    setShowHint(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left transition-all border ${
                    active
                      ? 'bg-amber-500/15 border-amber-500/50 text-slate-100 shadow-sm'
                      : 'bg-slate-900/40 hover:bg-slate-900 border-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs truncate">{ch.title}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${diffColor}`}>
                      {ch.difficulty}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {ch.testCases.length} Tests
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Challenge Detail & Test Runner */}
          <div className="flex-1 p-5 overflow-y-auto space-y-5 text-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-100 text-base">{currentChallenge.title}</h3>
                <button
                  onClick={() => loadChallenge(currentChallenge)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <span>Load Starter Canvas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-slate-300 leading-relaxed">{currentChallenge.description}</p>
            </div>

            {/* Hint Box */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs hover:text-amber-300"
              >
                <HelpCircle className="w-4 h-4" />
                <span>{showHint ? 'Hide Hints' : 'Need Hints?'}</span>
              </button>
              {showHint && (
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs italic">
                  {currentChallenge.hints.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Test Harness Verification */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 text-xs">Automated Verification Harness:</span>
                <button
                  onClick={handleRunVerification}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg flex items-center gap-1.5 text-xs cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Verify Current Circuit</span>
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-4 rounded-xl border space-y-3 ${
                    testResult.passed
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {testResult.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400" />
                      )}
                      <span>{testResult.feedback}</span>
                    </div>
                    <span className="font-mono font-bold text-sm">Score: {testResult.score}%</span>
                  </div>

                  {/* Test Vector Results Table */}
                  {testResult.testResults.length > 0 && (
                    <div className="border border-slate-800 rounded-lg overflow-hidden font-mono text-[11px]">
                      <table className="w-full text-center bg-slate-950/80">
                        <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="p-1.5">Test #</th>
                            <th className="p-1.5">Inputs</th>
                            <th className="p-1.5">Expected</th>
                            <th className="p-1.5">Actual</th>
                            <th className="p-1.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {testResult.testResults.map((r, idx) => (
                            <tr key={idx} className={r.passed ? 'text-emerald-400' : 'text-rose-400'}>
                              <td className="p-1.5">{idx + 1}</td>
                              <td className="p-1.5">{JSON.stringify(r.inputs)}</td>
                              <td className="p-1.5">{JSON.stringify(r.expected)}</td>
                              <td className="p-1.5">{JSON.stringify(r.actual)}</td>
                              <td className="p-1.5 font-bold">{r.passed ? 'PASS' : 'FAIL'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
