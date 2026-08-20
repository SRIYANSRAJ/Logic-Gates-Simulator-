/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useCircuit } from '../../context/CircuitContext';
import { BookOpen, Cpu, Database, GitMerge, Sparkles, X, Zap } from 'lucide-react';

export const EducationalModal: React.FC = () => {
  const { activeModal, setActiveModal } = useCircuit();
  const [activeChapter, setActiveChapter] = useState<number>(0);

  if (activeModal !== 'learn') return null;

  const chapters = [
    {
      id: 'fundamentals',
      title: '1. Primitive Logic Gates',
      icon: GitMerge,
      content: (
        <div className="space-y-4 text-slate-300 leading-relaxed text-xs">
          <h4 className="font-bold text-sm text-slate-100">Fundamental Boolean Operators</h4>
          <p>
            Digital electronics operates entirely on binary voltages: <b>Logic 1 (+5V / High)</b> and{' '}
            <b>Logic 0 (0V / Low)</b>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-emerald-400">AND Gate (Conjunction)</span>
              <p className="text-[11px] text-slate-400">
                Outputs 1 <b>ONLY</b> if both inputs A and B are 1. Equation: <code>Y = A · B</code>
              </p>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-emerald-400">OR Gate (Disjunction)</span>
              <p className="text-[11px] text-slate-400">
                Outputs 1 if <b>ANY</b> input is 1. Equation: <code>Y = A + B</code>
              </p>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-emerald-400">NOT Gate (Inverter)</span>
              <p className="text-[11px] text-slate-400">
                Inverts the input signal. 1 becomes 0; 0 becomes 1. Equation: <code>Y = A'</code>
              </p>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-emerald-400">XOR Gate (Exclusive-OR)</span>
              <p className="text-[11px] text-slate-400">
                Outputs 1 if inputs are <b>DIFFERENT</b>. Equation: <code>Y = A ⊕ B = A'B + AB'</code>
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'universal',
      title: '2. Universal Gates (NAND & NOR)',
      icon: Sparkles,
      content: (
        <div className="space-y-4 text-slate-300 leading-relaxed text-xs">
          <h4 className="font-bold text-sm text-slate-100">Why NAND & NOR are Universal</h4>
          <p>
            A <b>universal gate</b> is a logic gate that can implement any Boolean function without needing
            any other gate type!
          </p>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <span className="font-bold text-cyan-400 text-xs">Building Primitive Gates from NAND Only:</span>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
              <li>
                <b>NOT A</b> = <code>NAND(A, A)</code>
              </li>
              <li>
                <b>A AND B</b> = <code>NOT(NAND(A, B)) = NAND(NAND(A, B), NAND(A, B))</code>
              </li>
              <li>
                <b>A OR B</b> = <code>NAND(NOT A, NOT B) = NAND(NAND(A, A), NAND(B, B))</code>
              </li>
              <li>
                <b>A XOR B</b> = Built using 4 NAND gates. (Try this in the Challenges arena!)
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'arithmetic',
      title: '3. Adders & Arithmetic Units',
      icon: Cpu,
      content: (
        <div className="space-y-4 text-slate-300 leading-relaxed text-xs">
          <h4 className="font-bold text-sm text-slate-100">Binary Addition Principles</h4>
          <p>Computers calculate complex mathematical equations by chaining 1-bit binary adders.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
              <span className="font-bold text-blue-400">Half Adder</span>
              <p className="text-[11px] text-slate-400">
                Adds 2 single bits A and B. Produces <b>SUM</b> (A ⊕ B) and <b>CARRY</b> (A · B). Cannot handle a carry from a previous stage.
              </p>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
              <span className="font-bold text-blue-400">Full Adder</span>
              <p className="text-[11px] text-slate-400">
                Adds 3 bits: A, B, and Carry-In (Cin). SUM = A ⊕ B ⊕ Cin; Cout = (A·B) + (Cin·(A⊕B)).
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'sequential',
      title: '4. Sequential Logic & Memory',
      icon: Database,
      content: (
        <div className="space-y-4 text-slate-300 leading-relaxed text-xs">
          <h4 className="font-bold text-sm text-slate-100">Feedback Loops & State Storage</h4>
          <p>
            Unlike combinational circuits whose outputs depend purely on current inputs, <b>sequential circuits</b>{' '}
            possess memory and depend on past states.
          </p>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <span className="font-bold text-amber-400">The SR Latch & Flip-Flops:</span>
            <p className="text-slate-300 text-[11px]">
              Cross-coupling two NOR gates or NAND gates creates a bistable multivibrator capable of holding 1 bit of memory indefinitely.
            </p>
            <p className="text-slate-400 text-[11px]">
              <b>D Flip-Flop:</b> Synchronizes data capture to the rising edge of a Clock pulse, preventing race conditions.
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-4xl flex flex-col shadow-2xl overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm">Digital Electronics Interactive Textbook</h2>
              <p className="text-xs text-slate-400">Comprehensive educational guides from boolean foundations to computer ALUs</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal('none')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Layout: Chapters on left, Content on right */}
        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 border-r border-slate-800 bg-slate-950/50 p-3 space-y-1.5 overflow-y-auto">
            {chapters.map((ch, idx) => {
              const Icon = ch.icon;
              const active = idx === activeChapter;
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChapter(idx)}
                  className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center gap-2.5 border ${
                    active
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold'
                      : 'bg-slate-900/40 hover:bg-slate-900 border-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-xs truncate">{ch.title}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 p-6 overflow-y-auto">{chapters[activeChapter].content}</div>
        </div>
      </div>
    </div>
  );
};
