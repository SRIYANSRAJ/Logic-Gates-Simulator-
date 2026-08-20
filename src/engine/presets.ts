/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CircuitComponent, Wire } from '../types/circuit';
import { createComponent } from './componentFactory';

export interface PresetCircuit {
  id: string;
  name: string;
  category: 'Arithmetic' | 'Combinational' | 'Sequential' | 'Basics';
  description: string;
  tags: string[];
  components: CircuitComponent[];
  wires: Wire[];
}

export function getPresetCircuits(): PresetCircuit[] {
  return [
    // 1. HALF ADDER
    (() => {
      const swA = createComponent('SWITCH', 100, 150, { label: 'A', name: 'Input A' });
      const swB = createComponent('SWITCH', 100, 260, { label: 'B', name: 'Input B' });
      const xorGate = createComponent('XOR', 280, 150, { inputCount: 2 });
      const andGate = createComponent('AND', 280, 260, { inputCount: 2 });
      const ledSum = createComponent('LED', 460, 150, { label: 'SUM', name: 'SUM (S)' });
      const ledCarry = createComponent('LED', 460, 260, { label: 'CARRY', name: 'CARRY (C)' });

      const wires: Wire[] = [
        { id: 'w1', fromComponentId: swA.id, fromPortId: 'out', toComponentId: xorGate.id, toPortId: 'in_0' },
        { id: 'w2', fromComponentId: swB.id, fromPortId: 'out', toComponentId: xorGate.id, toPortId: 'in_1' },
        { id: 'w3', fromComponentId: swA.id, fromPortId: 'out', toComponentId: andGate.id, toPortId: 'in_0' },
        { id: 'w4', fromComponentId: swB.id, fromPortId: 'out', toComponentId: andGate.id, toPortId: 'in_1' },
        { id: 'w5', fromComponentId: xorGate.id, fromPortId: 'out', toComponentId: ledSum.id, toPortId: 'in_0' },
        { id: 'w6', fromComponentId: andGate.id, fromPortId: 'out', toComponentId: ledCarry.id, toPortId: 'in_0' },
      ];

      return {
        id: 'half_adder',
        name: 'Half Adder',
        category: 'Arithmetic',
        description: 'Adds two single binary bits A and B to generate SUM (A ⊕ B) and CARRY (A · B).',
        tags: ['Adder', 'Arithmetic', 'XOR', 'AND'],
        components: [swA, swB, xorGate, andGate, ledSum, ledCarry],
        wires,
      };
    })(),

    // 2. FULL ADDER (Structural: 2 Half Adders + OR gate)
    (() => {
      const swA = createComponent('SWITCH', 80, 120, { label: 'A', name: 'Input A' });
      const swB = createComponent('SWITCH', 80, 200, { label: 'B', name: 'Input B' });
      const swCin = createComponent('SWITCH', 80, 280, { label: 'Cin', name: 'Carry In' });

      // First Half Adder stage
      const xor1 = createComponent('XOR', 240, 140, { inputCount: 2 });
      const and1 = createComponent('AND', 240, 240, { inputCount: 2 });

      // Second Half Adder stage
      const xor2 = createComponent('XOR', 400, 160, { inputCount: 2 });
      const and2 = createComponent('AND', 400, 260, { inputCount: 2 });

      // Carry Out OR gate
      const orGate = createComponent('OR', 540, 280, { inputCount: 2 });

      // Outputs
      const probeSum = createComponent('PROBE', 560, 160, { label: 'SUM', name: 'Sum Output' });
      const probeCout = createComponent('PROBE', 680, 280, { label: 'Cout', name: 'Carry Out' });

      const wires: Wire[] = [
        // Inputs to Stage 1
        { id: 'fa_w1', fromComponentId: swA.id, fromPortId: 'out', toComponentId: xor1.id, toPortId: 'in_0' },
        { id: 'fa_w2', fromComponentId: swB.id, fromPortId: 'out', toComponentId: xor1.id, toPortId: 'in_1' },
        { id: 'fa_w3', fromComponentId: swA.id, fromPortId: 'out', toComponentId: and1.id, toPortId: 'in_0' },
        { id: 'fa_w4', fromComponentId: swB.id, fromPortId: 'out', toComponentId: and1.id, toPortId: 'in_1' },

        // Stage 1 to Stage 2
        { id: 'fa_w5', fromComponentId: xor1.id, fromPortId: 'out', toComponentId: xor2.id, toPortId: 'in_0' },
        { id: 'fa_w6', fromComponentId: swCin.id, fromPortId: 'out', toComponentId: xor2.id, toPortId: 'in_1' },
        { id: 'fa_w7', fromComponentId: xor1.id, fromPortId: 'out', toComponentId: and2.id, toPortId: 'in_0' },
        { id: 'fa_w8', fromComponentId: swCin.id, fromPortId: 'out', toComponentId: and2.id, toPortId: 'in_1' },

        // Sum Output
        { id: 'fa_w9', fromComponentId: xor2.id, fromPortId: 'out', toComponentId: probeSum.id, toPortId: 'in_0' },

        // Carry Stage: and1 + and2 -> OR -> Cout
        { id: 'fa_w10', fromComponentId: and2.id, fromPortId: 'out', toComponentId: orGate.id, toPortId: 'in_0' },
        { id: 'fa_w11', fromComponentId: and1.id, fromPortId: 'out', toComponentId: orGate.id, toPortId: 'in_1' },
        { id: 'fa_w12', fromComponentId: orGate.id, fromPortId: 'out', toComponentId: probeCout.id, toPortId: 'in_0' },
      ];

      return {
        id: 'full_adder_structural',
        name: 'Full Adder (2 Half Adders + OR)',
        category: 'Arithmetic',
        description: 'Complete 1-bit binary Full Adder constructed hierarchically from two Half Adders and an OR gate.',
        tags: ['Full Adder', 'Arithmetic', 'Hierarchical'],
        components: [swA, swB, swCin, xor1, and1, xor2, and2, orGate, probeSum, probeCout],
        wires,
      };
    })(),

    // 3. 2:1 MULTIPLEXER (from AND-OR logic)
    (() => {
      const swD0 = createComponent('SWITCH', 80, 100, { label: 'D0', name: 'Data 0' });
      const swD1 = createComponent('SWITCH', 80, 200, { label: 'D1', name: 'Data 1' });
      const swS = createComponent('SWITCH', 80, 300, { label: 'S', name: 'Select' });

      const notGate = createComponent('NOT', 200, 300);
      const and0 = createComponent('AND', 320, 120, { inputCount: 2 });
      const and1 = createComponent('AND', 320, 220, { inputCount: 2 });
      const orGate = createComponent('OR', 460, 170, { inputCount: 2 });
      const probeY = createComponent('PROBE', 580, 170, { label: 'Y (Out)', name: 'Multiplexed Output' });

      const wires: Wire[] = [
        { id: 'm1', fromComponentId: swS.id, fromPortId: 'out', toComponentId: notGate.id, toPortId: 'in_0' },
        { id: 'm2', fromComponentId: swD0.id, fromPortId: 'out', toComponentId: and0.id, toPortId: 'in_0' },
        { id: 'm3', fromComponentId: notGate.id, fromPortId: 'out', toComponentId: and0.id, toPortId: 'in_1' },
        { id: 'm4', fromComponentId: swD1.id, fromPortId: 'out', toComponentId: and1.id, toPortId: 'in_0' },
        { id: 'm5', fromComponentId: swS.id, fromPortId: 'out', toComponentId: and1.id, toPortId: 'in_1' },
        { id: 'm6', fromComponentId: and0.id, fromPortId: 'out', toComponentId: orGate.id, toPortId: 'in_0' },
        { id: 'm7', fromComponentId: and1.id, fromPortId: 'out', toComponentId: orGate.id, toPortId: 'in_1' },
        { id: 'm8', fromComponentId: orGate.id, fromPortId: 'out', toComponentId: probeY.id, toPortId: 'in_0' },
      ];

      return {
        id: 'mux_2_1_discrete',
        name: '2:1 Multiplexer (Discrete Gates)',
        category: 'Combinational',
        description: 'Data selector routing D0 when S=0, or D1 when S=1, synthesized with basic AND, OR, and NOT gates.',
        tags: ['MUX', 'Multiplexer', 'Data Selector'],
        components: [swD0, swD1, swS, notGate, and0, and1, orGate, probeY],
        wires,
      };
    })(),

    // 4. SR LATCH (Cross-Coupled NOR Feedback Loop)
    (() => {
      const swS = createComponent('BUTTON', 100, 120, { label: 'SET (S)', name: 'Set Button' });
      const swR = createComponent('BUTTON', 100, 280, { label: 'RESET (R)', name: 'Reset Button' });

      const nor1 = createComponent('NOR', 260, 140, { inputCount: 2 });
      const nor2 = createComponent('NOR', 260, 260, { inputCount: 2 });

      const ledQ = createComponent('LED', 440, 140, { label: 'Q', name: 'Q Output' });
      const ledNotQ = createComponent('LED', 440, 260, { label: 'Q\'', name: 'Inverted Q' });

      const wires: Wire[] = [
        { id: 'sr1', fromComponentId: swR.id, fromPortId: 'out', toComponentId: nor1.id, toPortId: 'in_0' },
        { id: 'sr2', fromComponentId: nor2.id, fromPortId: 'out', toComponentId: nor1.id, toPortId: 'in_1' },
        { id: 'sr3', fromComponentId: nor1.id, fromPortId: 'out', toComponentId: nor2.id, toPortId: 'in_0' },
        { id: 'sr4', fromComponentId: swS.id, fromPortId: 'out', toComponentId: nor2.id, toPortId: 'in_1' },
        { id: 'sr5', fromComponentId: nor1.id, fromPortId: 'out', toComponentId: ledQ.id, toPortId: 'in_0' },
        { id: 'sr6', fromComponentId: nor2.id, fromPortId: 'out', toComponentId: ledNotQ.id, toPortId: 'in_0' },
      ];

      return {
        id: 'sr_latch_nor',
        name: 'SR Latch (Cross-Coupled NOR)',
        category: 'Sequential',
        description: 'Classic 1-bit bistable multivibrator memory element built from cross-coupled NOR feedback gates.',
        tags: ['Memory', 'Latch', 'Sequential', 'Feedback'],
        components: [swS, swR, nor1, nor2, ledQ, ledNotQ],
        wires,
      };
    })(),

    // 5. 1-BIT MAGNITUDE COMPARATOR
    (() => {
      const swA = createComponent('SWITCH', 80, 120, { label: 'A', name: 'Bit A' });
      const swB = createComponent('SWITCH', 80, 240, { label: 'B', name: 'Bit B' });

      const notA = createComponent('NOT', 180, 120);
      const notB = createComponent('NOT', 180, 240);

      const andGT = createComponent('AND', 320, 100, { inputCount: 2 }); // A · B'
      const xnorEQ = createComponent('XNOR', 320, 180, { inputCount: 2 }); // (A ⊕ B)'
      const andLT = createComponent('AND', 320, 260, { inputCount: 2 }); // A' · B

      const probeGT = createComponent('PROBE', 460, 100, { label: 'A > B', name: 'Greater' });
      const probeEQ = createComponent('PROBE', 460, 180, { label: 'A == B', name: 'Equal' });
      const probeLT = createComponent('PROBE', 460, 260, { label: 'A < B', name: 'Less' });

      const wires: Wire[] = [
        { id: 'c1', fromComponentId: swA.id, fromPortId: 'out', toComponentId: notA.id, toPortId: 'in_0' },
        { id: 'c2', fromComponentId: swB.id, fromPortId: 'out', toComponentId: notB.id, toPortId: 'in_0' },

        // A > B: A and B'
        { id: 'c3', fromComponentId: swA.id, fromPortId: 'out', toComponentId: andGT.id, toPortId: 'in_0' },
        { id: 'c4', fromComponentId: notB.id, fromPortId: 'out', toComponentId: andGT.id, toPortId: 'in_1' },
        { id: 'c5', fromComponentId: andGT.id, fromPortId: 'out', toComponentId: probeGT.id, toPortId: 'in_0' },

        // A == B: A XNOR B
        { id: 'c6', fromComponentId: swA.id, fromPortId: 'out', toComponentId: xnorEQ.id, toPortId: 'in_0' },
        { id: 'c7', fromComponentId: swB.id, fromPortId: 'out', toComponentId: xnorEQ.id, toPortId: 'in_1' },
        { id: 'c8', fromComponentId: xnorEQ.id, fromPortId: 'out', toComponentId: probeEQ.id, toPortId: 'in_0' },

        // A < B: A' and B
        { id: 'c9', fromComponentId: notA.id, fromPortId: 'out', toComponentId: andLT.id, toPortId: 'in_0' },
        { id: 'c10', fromComponentId: swB.id, fromPortId: 'out', toComponentId: andLT.id, toPortId: 'in_1' },
        { id: 'c11', fromComponentId: andLT.id, fromPortId: 'out', toComponentId: probeLT.id, toPortId: 'in_0' },
      ];

      return {
        id: 'comparator_1bit_discrete',
        name: '1-Bit Magnitude Comparator',
        category: 'Combinational',
        description: 'Compares two binary bits A and B and simultaneously indicates if A > B, A == B, or A < B.',
        tags: ['Comparator', 'Combinational', 'Logic'],
        components: [swA, swB, notA, notB, andGT, xnorEQ, andLT, probeGT, probeEQ, probeLT],
        wires,
      };
    })(),

    // 6. 4-BIT BINARY COUNTER + 7-SEGMENT DISPLAY
    (() => {
      const clock = createComponent('CLOCK', 80, 160, { name: '1 Hz Clock' });
      const rstBtn = createComponent('BUTTON', 80, 240, { label: 'RST', name: 'Reset Button' });
      const counter = createComponent('COUNTER_4BIT', 220, 180);
      const hexDisplay = createComponent('HEX_DISPLAY', 380, 170);

      const wires: Wire[] = [
        { id: 'cnt1', fromComponentId: clock.id, fromPortId: 'out', toComponentId: counter.id, toPortId: 'in_clk' },
        { id: 'cnt2', fromComponentId: rstBtn.id, fromPortId: 'out', toComponentId: counter.id, toPortId: 'in_rst' },
        { id: 'cnt3', fromComponentId: counter.id, fromPortId: 'out_q3', toComponentId: hexDisplay.id, toPortId: 'in_3' },
        { id: 'cnt4', fromComponentId: counter.id, fromPortId: 'out_q2', toComponentId: hexDisplay.id, toPortId: 'in_2' },
        { id: 'cnt5', fromComponentId: counter.id, fromPortId: 'out_q1', toComponentId: hexDisplay.id, toPortId: 'in_1' },
        { id: 'cnt6', fromComponentId: counter.id, fromPortId: 'out_q0', toComponentId: hexDisplay.id, toPortId: 'in_0' },
      ];

      return {
        id: 'counter_hex_demo',
        name: '4-Bit Counter with Hex Display',
        category: 'Sequential',
        description: 'Continuous 4-bit binary up-counter cycling 0 through F (15) connected directly to a Hexadecimal display.',
        tags: ['Counter', 'Clock', 'Hex Display', 'Sequential'],
        components: [clock, rstBtn, counter, hexDisplay],
        wires,
      };
    })(),
  ];
}
