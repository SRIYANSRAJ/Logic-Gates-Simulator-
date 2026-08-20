/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChallengeDefinition, CircuitComponent, CustomGateDefinition, Wire } from '../types/circuit';
import { createComponent } from './componentFactory';
import { simulateCircuit } from './simulation';

export const CHALLENGES: ChallengeDefinition[] = [
  {
    id: 'ch_nand_from_and_not',
    title: 'Challenge 1: Build a NAND Gate',
    category: 'Basics',
    difficulty: 'Easy',
    description: 'Construct a 2-input NAND function using an AND gate and a NOT gate.',
    objective: 'The output must be 0 ONLY when both A and B are 1; otherwise 1.',
    expectedInputs: ['A', 'B'],
    expectedOutputs: ['Y'],
    allowedGateTypes: ['AND', 'NOT', 'SWITCH', 'PROBE', 'LED'],
    testCases: [
      { inputs: { A: 0, B: 0 }, expected: { Y: 1 } },
      { inputs: { A: 0, B: 1 }, expected: { Y: 1 } },
      { inputs: { A: 1, B: 0 }, expected: { Y: 1 } },
      { inputs: { A: 1, B: 1 }, expected: { Y: 0 } },
    ],
    hints: [
      'Connect both input switches (A and B) into the inputs of an AND gate.',
      'Connect the output of the AND gate into the input of a NOT gate.',
      'Connect the NOT gate output to the probe Y.',
    ],
    explanation: 'A NAND gate is logically equivalent to an AND gate followed immediately by an Inverter (NOT).',
    starterCircuit: {
      components: [
        createComponent('SWITCH', 100, 150, { label: 'A', name: 'Input A' }),
        createComponent('SWITCH', 100, 250, { label: 'B', name: 'Input B' }),
        createComponent('PROBE', 500, 200, { label: 'Y', name: 'Output Y' }),
      ],
      wires: [],
    },
  },
  {
    id: 'ch_xor_from_primitives',
    title: 'Challenge 2: Build XOR from Basic Gates',
    category: 'Basics',
    difficulty: 'Medium',
    description: 'Synthesize an Exclusive-OR (XOR) gate using only AND, OR, and NOT gates (no direct XOR gate).',
    objective: 'Output Y is 1 when exactly one input is 1 (A ⊕ B = AB\' + A\'B).',
    expectedInputs: ['A', 'B'],
    expectedOutputs: ['Y'],
    allowedGateTypes: ['AND', 'OR', 'NOT', 'SWITCH', 'PROBE', 'LED'],
    testCases: [
      { inputs: { A: 0, B: 0 }, expected: { Y: 0 } },
      { inputs: { A: 0, B: 1 }, expected: { Y: 1 } },
      { inputs: { A: 1, B: 0 }, expected: { Y: 1 } },
      { inputs: { A: 1, B: 1 }, expected: { Y: 0 } },
    ],
    hints: [
      'Remember the canonical SOP equation: Y = (A · NOT B) + (NOT A · B).',
      'Use two NOT gates to create A\' and B\'.',
      'Feed (A and B\') into one AND gate, and (A\' and B) into a second AND gate.',
      'Combine both AND gate outputs with an OR gate.',
    ],
    explanation: 'XOR represents inequality or odd parity in digital systems and is fundamental to all binary adders.',
    starterCircuit: {
      components: [
        createComponent('SWITCH', 100, 140, { label: 'A', name: 'Input A' }),
        createComponent('SWITCH', 100, 260, { label: 'B', name: 'Input B' }),
        createComponent('PROBE', 560, 200, { label: 'Y', name: 'Output Y' }),
      ],
      wires: [],
    },
  },
  {
    id: 'ch_half_adder',
    title: 'Challenge 3: Build a Half Adder',
    category: 'Arithmetic',
    difficulty: 'Easy',
    description: 'Design a 1-bit Half Adder that adds two binary inputs A and B.',
    objective: 'Output SUM (S) = A ⊕ B, and CARRY (C) = A · B.',
    expectedInputs: ['A', 'B'],
    expectedOutputs: ['SUM', 'CARRY'],
    testCases: [
      { inputs: { A: 0, B: 0 }, expected: { SUM: 0, CARRY: 0 } },
      { inputs: { A: 0, B: 1 }, expected: { SUM: 1, CARRY: 0 } },
      { inputs: { A: 1, B: 0 }, expected: { SUM: 1, CARRY: 0 } },
      { inputs: { A: 1, B: 1 }, expected: { SUM: 0, CARRY: 1 } },
    ],
    hints: [
      'SUM is 1 when either A or B is 1, but 0 when both are 1 (use XOR).',
      'CARRY is 1 only when both A and B are 1 (use AND).',
    ],
    explanation: 'A Half Adder computes the lowest bit of binary addition without handling incoming carry bits.',
    starterCircuit: {
      components: [
        createComponent('SWITCH', 100, 140, { label: 'A', name: 'Input A' }),
        createComponent('SWITCH', 100, 260, { label: 'B', name: 'Input B' }),
        createComponent('PROBE', 500, 140, { label: 'SUM', name: 'SUM' }),
        createComponent('PROBE', 500, 260, { label: 'CARRY', name: 'CARRY' }),
      ],
      wires: [],
    },
  },
  {
    id: 'ch_full_adder',
    title: 'Challenge 4: Build a Full Adder',
    category: 'Arithmetic',
    difficulty: 'Hard',
    description: 'Construct a complete 1-bit Full Adder with Carry In (Cin) and Carry Out (Cout).',
    objective: 'SUM = A ⊕ B ⊕ Cin; Cout = AB + Cin(A ⊕ B).',
    expectedInputs: ['A', 'B', 'Cin'],
    expectedOutputs: ['SUM', 'Cout'],
    testCases: [
      { inputs: { A: 0, B: 0, Cin: 0 }, expected: { SUM: 0, Cout: 0 } },
      { inputs: { A: 0, B: 0, Cin: 1 }, expected: { SUM: 1, Cout: 0 } },
      { inputs: { A: 0, B: 1, Cin: 0 }, expected: { SUM: 1, Cout: 0 } },
      { inputs: { A: 0, B: 1, Cin: 1 }, expected: { SUM: 0, Cout: 1 } },
      { inputs: { A: 1, B: 0, Cin: 0 }, expected: { SUM: 1, Cout: 0 } },
      { inputs: { A: 1, B: 0, Cin: 1 }, expected: { SUM: 0, Cout: 1 } },
      { inputs: { A: 1, B: 1, Cin: 0 }, expected: { SUM: 0, Cout: 1 } },
      { inputs: { A: 1, B: 1, Cin: 1 }, expected: { SUM: 1, Cout: 1 } },
    ],
    hints: [
      'You can construct this using two Half Adders and an OR gate.',
      'Stage 1: Half Adder on A and B gives partial Sum S1 and partial Carry C1.',
      'Stage 2: Half Adder on S1 and Cin gives final SUM and partial Carry C2.',
      'Final Carry Cout = C1 OR C2.',
    ],
    explanation: 'Full Adders form the core building blocks of multi-bit Arithmetic Logic Units (ALUs) in CPUs.',
    starterCircuit: {
      components: [
        createComponent('SWITCH', 80, 120, { label: 'A', name: 'Input A' }),
        createComponent('SWITCH', 80, 200, { label: 'B', name: 'Input B' }),
        createComponent('SWITCH', 80, 280, { label: 'Cin', name: 'Carry In' }),
        createComponent('PROBE', 560, 150, { label: 'SUM', name: 'SUM' }),
        createComponent('PROBE', 560, 270, { label: 'Cout', name: 'Cout' }),
      ],
      wires: [],
    },
  },
  {
    id: 'ch_majority_voter',
    title: 'Challenge 5: Majority Vote Circuit',
    category: 'Combinational',
    difficulty: 'Medium',
    description: 'Build a 3-input decision voter circuit that outputs 1 whenever at least 2 out of 3 inputs are HIGH.',
    objective: 'Y = AB + BC + AC (Triple-Modular Redundancy).',
    expectedInputs: ['A', 'B', 'C'],
    expectedOutputs: ['Y'],
    testCases: [
      { inputs: { A: 0, B: 0, C: 0 }, expected: { Y: 0 } },
      { inputs: { A: 0, B: 0, C: 1 }, expected: { Y: 0 } },
      { inputs: { A: 0, B: 1, C: 0 }, expected: { Y: 0 } },
      { inputs: { A: 0, B: 1, C: 1 }, expected: { Y: 1 } },
      { inputs: { A: 1, B: 0, C: 0 }, expected: { Y: 0 } },
      { inputs: { A: 1, B: 0, C: 1 }, expected: { Y: 1 } },
      { inputs: { A: 1, B: 1, C: 0 }, expected: { Y: 1 } },
      { inputs: { A: 1, B: 1, C: 1 }, expected: { Y: 1 } },
    ],
    hints: [
      'Create 3 AND pairs: (A AND B), (B AND C), (A AND C).',
      'Feed all 3 AND gate outputs into a 3-input OR gate (or two 2-input OR gates).',
    ],
    explanation: 'Majority voting logic is extensively used in aerospace and mission-critical fault-tolerant computing.',
    starterCircuit: {
      components: [
        createComponent('SWITCH', 80, 120, { label: 'A', name: 'Voter A' }),
        createComponent('SWITCH', 80, 200, { label: 'B', name: 'Voter B' }),
        createComponent('SWITCH', 80, 280, { label: 'C', name: 'Voter C' }),
        createComponent('PROBE', 560, 200, { label: 'Y', name: 'Majority Outcome' }),
      ],
      wires: [],
    },
  },
  {
    id: 'ch_2_to_1_mux',
    title: 'Challenge 6: Build a 2:1 Multiplexer',
    category: 'Combinational',
    difficulty: 'Medium',
    description: 'Create a 2-to-1 data multiplexer that routes D0 when S=0, and D1 when S=1.',
    objective: 'Y = (NOT S · D0) + (S · D1).',
    expectedInputs: ['D0', 'D1', 'S'],
    expectedOutputs: ['Y'],
    testCases: [
      { inputs: { D0: 0, D1: 0, S: 0 }, expected: { Y: 0 } },
      { inputs: { D0: 1, D1: 0, S: 0 }, expected: { Y: 1 } },
      { inputs: { D0: 0, D1: 1, S: 0 }, expected: { Y: 0 } },
      { inputs: { D0: 1, D1: 1, S: 0 }, expected: { Y: 1 } },
      { inputs: { D0: 0, D1: 0, S: 1 }, expected: { Y: 0 } },
      { inputs: { D0: 1, D1: 0, S: 1 }, expected: { Y: 0 } },
      { inputs: { D0: 0, D1: 1, S: 1 }, expected: { Y: 1 } },
      { inputs: { D0: 1, D1: 1, S: 1 }, expected: { Y: 1 } },
    ],
    hints: [
      'Invert select signal S using a NOT gate.',
      'AND the inverted select with D0.',
      'AND the original select S with D1.',
      'OR the two AND results together into Y.',
    ],
    explanation: 'Multiplexers are fundamental digital switches used for bus sharing, memory addressing, and routing.',
    starterCircuit: {
      components: [
        createComponent('SWITCH', 80, 100, { label: 'D0', name: 'Data 0' }),
        createComponent('SWITCH', 80, 180, { label: 'D1', name: 'Data 1' }),
        createComponent('SWITCH', 80, 260, { label: 'S', name: 'Select S' }),
        createComponent('PROBE', 540, 180, { label: 'Y', name: 'Output Y' }),
      ],
      wires: [],
    },
  },
];

export interface ChallengeVerificationResult {
  passed: boolean;
  score: number;
  totalTests: number;
  passedTests: number;
  feedback: string;
  testResults: Array<{
    inputs: Record<string, 0 | 1>;
    expected: Record<string, 0 | 1>;
    actual: Record<string, any>;
    passed: boolean;
  }>;
}

/**
 * Automates test execution over user's circuit for a specific challenge
 */
export function verifyChallenge(
  challenge: ChallengeDefinition,
  components: CircuitComponent[],
  wires: Wire[],
  customGateDefs: Map<string, CustomGateDefinition> = new Map()
): ChallengeVerificationResult {
  // Find components matching expected input labels
  const inputComps: Record<string, CircuitComponent> = {};
  challenge.expectedInputs.forEach((name) => {
    const found = components.find(
      (c) =>
        (c.label?.trim().toUpperCase() === name.toUpperCase() ||
          c.name.trim().toUpperCase() === name.toUpperCase()) &&
        ['SWITCH', 'BUTTON', 'CONST_0', 'CONST_1'].includes(c.type)
    );
    if (found) inputComps[name] = found;
  });

  // Find components matching expected output labels
  const outputComps: Record<string, CircuitComponent> = {};
  challenge.expectedOutputs.forEach((name) => {
    const found = components.find(
      (c) =>
        (c.label?.trim().toUpperCase() === name.toUpperCase() ||
          c.name.trim().toUpperCase() === name.toUpperCase()) &&
        ['LED', 'PROBE'].includes(c.type)
    );
    if (found) outputComps[name] = found;
  });

  // Check missing pins
  const missingInputs = challenge.expectedInputs.filter((name) => !inputComps[name]);
  const missingOutputs = challenge.expectedOutputs.filter((name) => !outputComps[name]);

  if (missingInputs.length > 0 || missingOutputs.length > 0) {
    return {
      passed: false,
      score: 0,
      totalTests: challenge.testCases.length,
      passedTests: 0,
      feedback: `Missing required labeled components! Ensure you have inputs labeled: [${challenge.expectedInputs.join(
        ', '
      )}] and outputs labeled: [${challenge.expectedOutputs.join(', ')}].`,
      testResults: [],
    };
  }

  let passedTests = 0;
  const testResults: ChallengeVerificationResult['testResults'] = [];

  for (const testCase of challenge.testCases) {
    // Clone components with injected inputs
    const clonedComps = components.map((c) => {
      for (const [inName, inVal] of Object.entries(testCase.inputs)) {
        if (inputComps[inName]?.id === c.id) {
          return {
            ...c,
            internalState: {
              ...c.internalState,
              value: inVal,
              pressed: inVal === 1,
            },
          };
        }
      }
      return { ...c };
    });

    const sim = simulateCircuit(clonedComps, wires, customGateDefs);

    const actual: Record<string, any> = {};
    let casePassed = true;

    for (const [outName, expectedVal] of Object.entries(testCase.expected)) {
      const outComp = outputComps[outName];
      const actualVal = sim.portValues[outComp.id]?.['in_0'] ?? 0;
      actual[outName] = actualVal;

      if (actualVal !== expectedVal) {
        casePassed = false;
      }
    }

    if (casePassed) passedTests++;

    testResults.push({
      inputs: testCase.inputs,
      expected: testCase.expected,
      actual,
      passed: casePassed,
    });
  }

  const allPassed = passedTests === challenge.testCases.length;
  const score = Math.round((passedTests / challenge.testCases.length) * 100);

  return {
    passed: allPassed,
    score,
    totalTests: challenge.testCases.length,
    passedTests,
    feedback: allPassed
      ? '🎉 Brilliant work! All verification test cases passed with 100% accuracy.'
      : `Passed ${passedTests} of ${challenge.testCases.length} test vectors. Inspect the truth-table diff below to fix failing cases.`,
    testResults,
  };
}
