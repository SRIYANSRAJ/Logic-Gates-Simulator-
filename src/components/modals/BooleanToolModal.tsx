/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCircuit } from '../../context/CircuitContext';
import {
  parseExpression,
  simplifyBoolean,
  SimplificationResult,
} from '../../engine/boolean';
import {
  Sparkles,
  X,
  Check,
  AlertCircle,
  Copy,
  Cpu,
  Delete,
  Zap,
  ShieldCheck,
} from 'lucide-react';

const QUICK_EXAMPLES = [
  { label: "X'Y'Z + YZ + XZ", expr: "X'Y'Z + YZ + XZ" },
  { label: '(XY+Y\'X+YZ\')X\'Y\' + X\'Y\' + YZ\'', expr: '(XY + Y\'X + YZ\') X\'Y\' + X\'Y\' + YZ\'' },
  { label: '(A+B+C)(A+B\'+C)(A+B+C\')', expr: '(A+B+C)(A+B\'+C)(A+B+C\')' },
  { label: 'AB + A\'C + BC', expr: 'AB + A\'C + BC' },
  { label: 'A + AB + A\'B', expr: 'A + AB + A\'B' },
  { label: 'A(A + B)', expr: 'A(A + B)' },
  { label: '(A + B)(A + C)', expr: '(A + B)(A + C)' },
  { label: 'AB + Cin(A ⊕ B)', expr: 'AB + Cin(A ⊕ B)' },
];

export const BooleanToolModal: React.FC = () => {
  const { activeModal, setActiveModal, synthesizeAndLoadExpression } = useCircuit();

  const [inputEquation, setInputEquation] = useState<string>('(XY + Y\'X + YZ\') X\'Y\' + X\'Y\' + YZ\'');
  const [copiedResult, setCopiedResult] = useState(false);
  const [copiedProof, setCopiedProof] = useState(false);
  const [loadSuccessNotice, setLoadSuccessNotice] = useState<string | null>(null);

  const [solvedResult, setSolvedResult] = useState<SimplificationResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const solveEquation = useCallback((exprToSolve?: string) => {
    const expr = (exprToSolve !== undefined ? exprToSolve : inputEquation).trim();
    if (!expr) {
      setParseError('Please enter a Boolean equation.');
      setSolvedResult(null);
      return;
    }

    try {
      const ast = parseExpression(expr);
      const simResult = simplifyBoolean(ast);
      setSolvedResult(simResult);
      setParseError(null);
    } catch (err: any) {
      setParseError(err.message || 'Syntax error in Boolean equation.');
      setSolvedResult(null);
    }
  }, [inputEquation]);

  // Solve initial equation on modal open
  useEffect(() => {
    if (activeModal === 'boolean') {
      solveEquation(inputEquation);
    }
  }, [activeModal]);

  if (activeModal !== 'boolean') return null;

  const handleInsertSymbol = (sym: string) => {
    const el = inputRef.current;
    if (!el) {
      const next = inputEquation + sym;
      setInputEquation(next);
      solveEquation(next);
      return;
    }

    const start = el.selectionStart ?? inputEquation.length;
    const end = el.selectionEnd ?? inputEquation.length;
    const prev = inputEquation;

    const nextVal = prev.substring(0, start) + sym + prev.substring(end);
    setInputEquation(nextVal);
    solveEquation(nextVal);

    setTimeout(() => {
      el.focus();
      const newPos = start + sym.length;
      el.setSelectionRange(newPos, newPos);
    }, 10);
  };

  const handleBackspace = () => {
    const el = inputRef.current;
    if (!el) {
      const next = inputEquation.slice(0, -1);
      setInputEquation(next);
      if (next.trim()) solveEquation(next);
      else setSolvedResult(null);
      return;
    }

    const start = el.selectionStart ?? inputEquation.length;
    const end = el.selectionEnd ?? inputEquation.length;

    let nextVal = '';
    let newPos = start;

    if (start === end) {
      if (start > 0) {
        nextVal = inputEquation.substring(0, start - 1) + inputEquation.substring(end);
        newPos = start - 1;
      } else {
        return;
      }
    } else {
      nextVal = inputEquation.substring(0, start) + inputEquation.substring(end);
      newPos = start;
    }

    setInputEquation(nextVal);
    if (nextVal.trim()) solveEquation(nextVal);
    else setSolvedResult(null);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(newPos, newPos);
    }, 10);
  };

  const handleClear = () => {
    setInputEquation('');
    setSolvedResult(null);
    setParseError(null);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleCopyResult = () => {
    if (!solvedResult) return;
    navigator.clipboard.writeText(solvedResult.simplifiedExpression);
    setCopiedResult(true);
    setTimeout(() => setCopiedResult(false), 2000);
  };

  const handleCopyProof = () => {
    if (!solvedResult) return;
    const proofText = solvedResult.steps
      .map((s) => `Step ${s.stepNumber}: ${s.expression}  [${s.lawName}]`)
      .join('\n');
    navigator.clipboard.writeText(proofText);
    setCopiedProof(true);
    setTimeout(() => setCopiedProof(false), 2000);
  };

  const handleSynthesizeOriginal = () => {
    const exprToUse = inputEquation.trim();
    if (!exprToUse) return;
    const res = synthesizeAndLoadExpression(exprToUse, 'replace');
    if (res.success) {
      setLoadSuccessNotice(`Original circuit generated on canvas for "${exprToUse}"`);
      setTimeout(() => {
        setLoadSuccessNotice(null);
        setActiveModal('none');
      }, 700);
    } else {
      setParseError(res.error || 'Failed to synthesize original circuit.');
    }
  };

  const handleSynthesizeSimplified = () => {
    if (!solvedResult) return;
    const exprToUse = solvedResult.simplifiedExpression || inputEquation;
    const res = synthesizeAndLoadExpression(exprToUse, 'replace');
    if (res.success) {
      setLoadSuccessNotice(`Simplified circuit generated on canvas for "${exprToUse}"`);
      setTimeout(() => {
        setLoadSuccessNotice(null);
        setActiveModal('none');
      }, 700);
    } else {
      setParseError(res.error || 'Failed to synthesize simplified circuit.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-fade-in select-none overflow-y-auto">
      <div className="bg-[#0b1324] border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden transition-all duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-[#0d162a] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2">
                <span>Advanced Boolean Algebra Solver</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Rigorous step-by-step algebraic proof &amp; logic simplification
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal('none')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          
          {/* Input Box */}
          <div className="space-y-1.5">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputEquation}
                onChange={(e) => {
                  setInputEquation(e.target.value);
                  solveEquation(e.target.value);
                }}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="Enter equation, e.g. (XY + Y'X + YZ') X'Y' + X'Y' + YZ'"
                className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-slate-100 font-mono text-base sm:text-lg focus:outline-none transition-colors shadow-inner ${
                  parseError ? 'border-rose-500/60 focus:border-rose-400' : 'border-cyan-500/50 focus:border-cyan-400'
                }`}
              />
              {inputEquation && (
                <button
                  onClick={handleClear}
                  className="absolute right-3 p-1.5 text-slate-400 hover:text-slate-200 rounded-lg"
                  title="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Parse error if any */}
            {parseError && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-center gap-2 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}
          </div>

          {/* Touch-friendly Keypad & Quick Examples */}
          <div className="p-3 bg-slate-900/90 border border-slate-800/90 rounded-xl space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Variables */}
              <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 tracking-wider">Vars:</span>
              {['A', 'B', 'C', 'D', 'X', 'Y', 'Z'].map((v) => (
                <button
                  key={v}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleInsertSymbol(v)}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-cyan-500 text-cyan-300 active:text-slate-950 font-mono text-sm font-bold border border-slate-700 transition-colors shadow-sm cursor-pointer"
                >
                  {v}
                </button>
              ))}

              <div className="h-6 w-px bg-slate-700 mx-1 hidden sm:block" />

              {/* Operators */}
              <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 tracking-wider">Ops:</span>
              {[
                { label: "' (NOT)", sym: "'" },
                { label: '+ (OR)', sym: ' + ' },
                { label: '· (AND)', sym: ' · ' },
                { label: '(', sym: '(' },
                { label: ')', sym: ')' },
                { label: '⊕ (XOR)', sym: ' ⊕ ' },
                { label: '⊙ (XNOR)', sym: ' ⊙ ' },
                { label: '0', sym: '0' },
                { label: '1', sym: '1' },
              ].map((op) => (
                <button
                  key={op.label}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleInsertSymbol(op.sym)}
                  className="min-h-[40px] px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-cyan-500 text-slate-200 active:text-slate-950 font-mono text-xs sm:text-sm font-bold border border-slate-700 transition-colors shadow-sm cursor-pointer"
                >
                  {op.label}
                </button>
              ))}

              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleBackspace}
                className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 font-semibold border border-rose-800/40 transition-colors flex items-center gap-1.5 text-xs cursor-pointer ml-auto"
                title="Backspace"
              >
                <Delete className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>

            {/* Quick examples */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800 text-[11px]">
              <span className="text-slate-400 font-bold mr-1">Quick Examples:</span>
              {QUICK_EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => {
                    setInputEquation(ex.expr);
                    solveEquation(ex.expr);
                  }}
                  className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-cyan-950 hover:text-cyan-300 hover:border-cyan-500/40 border border-slate-700 text-slate-300 transition-all font-mono"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          {/* Disclaimer & Accuracy Notice */}
          <div className="px-3.5 py-2 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-center gap-2.5 text-[11px] text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Note:</strong> Algorithmic step derivations can make mistakes. Always double check your answers and verify proofs for academic exams.
            </span>
          </div>

          {/* Solved Result Card & Step-by-Step Derivation */}
          {solvedResult && (
            <div className="space-y-4">
              {/* Final Result Card */}
              <div className="p-4 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900 border border-cyan-500/40 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
                <div>
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Simplest Minimal Form:</span>
                  </span>
                  <div className="text-lg sm:text-2xl font-bold font-mono text-cyan-200 mt-1">
                    Y = {solvedResult.simplifiedExpression}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyResult}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copiedResult ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copiedResult ? 'Copied' : 'Copy Result'}</span>
                  </button>

                  <button
                    onClick={handleCopyProof}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copiedProof ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copiedProof ? 'Copied Proof' : 'Copy All Steps'}</span>
                  </button>
                </div>
              </div>

              {/* Step-by-Step Derivation Proof */}
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-slate-200 text-xs sm:text-sm flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Step-by-Step Algebraic Derivation</span>
                  </span>
                  <span className="text-[11px] font-semibold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                    {solvedResult.steps.length} Steps
                  </span>
                </div>

                <div className="space-y-2.5 font-mono">
                  {solvedResult.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${
                        idx === solvedResult.steps.length - 1
                          ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
                          : 'bg-slate-950/80 border-slate-800/90 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-slate-800 text-cyan-400 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-700">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-sm sm:text-base break-all">
                          = {step.expression}
                        </span>
                      </div>

                      <div className="text-left sm:text-right font-sans shrink-0">
                        <span className="inline-block px-3 py-1 rounded-lg bg-slate-800/90 text-cyan-300 border border-slate-700/80 text-xs font-semibold shadow-sm">
                          {step.lawName}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {loadSuccessNotice && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{loadSuccessNotice}</span>
            </div>
          )}
        </div>

        {/* Footer: Prominent Actions */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#0d162a] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <button
            onClick={() => setActiveModal('none')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 font-bold transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Option 1: Synthesize Original Equation */}
            <button
              onClick={handleSynthesizeOriginal}
              disabled={!inputEquation.trim() || !!parseError}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-600 hover:border-slate-500 disabled:opacity-40 text-slate-100 font-bold text-xs sm:text-sm transition-all shadow-sm cursor-pointer"
              title="Synthesize unreduced original equation onto the canvas"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Synthesize Original (OG)</span>
            </button>

            {/* Option 2: Synthesize Simplified Equation */}
            <button
              onClick={handleSynthesizeSimplified}
              disabled={!solvedResult}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 active:from-cyan-600 active:to-emerald-600 disabled:opacity-40 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer"
              title="Synthesize minimal simplified equation onto the canvas"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Synthesize Simplified</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
