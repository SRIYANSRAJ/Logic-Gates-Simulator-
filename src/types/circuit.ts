/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LogicState = 0 | 1 | 'Z' | 'X'; // 0 = LOW, 1 = HIGH, Z = High-Z (floating), X = Contention/Error

export type WireRoutingMode = 'orthogonal' | 'curved' | 'straight';

export type ThemePreset =
  | 'emerald' // Default Matrix Emerald
  | 'cyberpunk' // Cyan & Neon Magenta
  | 'cobalt' // Electric Blue
  | 'amber' // Retro Phosphor Amber Gold
  | 'crimson' // Ruby / Rose
  | 'violet' // Deep Amethyst
  | 'monochrome'; // Minimal Slate

export interface ThemeConfig {
  id: ThemePreset;
  name: string;
  description: string;
  // Brand / Main Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;

  // Wires & Signals
  wireHighColor: string;
  wireGlowColor: string;
  wireLowColor: string;
  signalPulseColor: string;

  // Canvas & Backgrounds
  canvasBg: string;
  gridDotColor: string;
  navBg: string;
  panelBg: string;
  panelBorder: string;
  borderTone: string;

  // Gate & Component Styling
  gateActiveFill: string;
  gateInactiveFill: string;
  gateActiveStroke: string;
  gateInactiveStroke: string;

  // IC Boxes & Complex Chips (Adders, Latches, MUX, etc.)
  boxActiveFill: string;
  boxInactiveFill: string;
  boxActiveStroke: string;
  boxInactiveStroke: string;

  // Input Controls (Switches, Buttons, Clocks, VCC)
  inputActiveFill: string;
  inputActiveStroke: string;
  inputKnobActive: string;
  clockTraceActive: string;

  // Output Visualizers (LEDs, Probes, 7-Segment, Hex)
  ledGlowColor: string;
  ledActiveFill: string;
  ledActiveStroke: string;
  probeActiveBg: string;
  probeActiveText: string;
  displayDigitColor: string;
  displayDigitGlow: string;

  // Port Pins
  portActiveColor: string;
  portInactiveColor: string;

  // Label Badges
  badgeActiveBg: string;
  badgeActiveBorder: string;
  badgeActiveText: string;
}

export type ComponentCategory = 
  | 'GATES'
  | 'INPUTS'
  | 'OUTPUTS'
  | 'COMPLEX'
  | 'SEQUENTIAL'
  | 'CUSTOM';

export type GateType =
  // Basic Gates
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'NAND'
  | 'NOR'
  | 'XOR'
  | 'XNOR'
  | 'BUFFER'
  | 'TRI_STATE_BUFFER'
  // Inputs
  | 'SWITCH'
  | 'BUTTON'
  | 'CLOCK'
  | 'CONST_0'
  | 'CONST_1'
  | 'PULSE'
  | 'RANDOM'
  // Outputs
  | 'LED'
  | 'PROBE'
  | 'SEGMENT_7'
  | 'HEX_DISPLAY'
  | 'DECIMAL_DISPLAY'
  | 'BINARY_DISPLAY'
  // Combinational & Complex
  | 'MUX_2_1'
  | 'MUX_4_1'
  | 'DEMUX_1_2'
  | 'DEMUX_1_4'
  | 'DECODER_2_4'
  | 'DECODER_3_8'
  | 'ENCODER_4_2'
  | 'COMPARATOR_1BIT'
  | 'COMPARATOR_2BIT'
  | 'HALF_ADDER'
  | 'FULL_ADDER'
  | 'HALF_SUBTRACTOR'
  | 'FULL_SUBTRACTOR'
  | 'RIPPLE_ADDER_4BIT'
  | 'PARITY_GEN'
  | 'PARITY_CHECK'
  // Sequential
  | 'SR_LATCH'
  | 'D_FLIP_FLOP'
  | 'JK_FLIP_FLOP'
  | 'T_FLIP_FLOP'
  | 'COUNTER_4BIT'
  | 'REGISTER_4BIT'
  // Custom Subcircuit
  | 'CUSTOM_IC';

export interface Port {
  id: string;
  name: string;
  type: 'input' | 'output';
  relativePosition: { x: number; y: number }; // Offset relative to component center/top-left
  description?: string;
  bitIndex?: number;
}

export interface CustomGateDefinition {
  id: string;
  name: string;
  category: 'CUSTOM';
  description: string;
  inputPorts: { id: string; name: string }[];
  outputPorts: { id: string; name: string }[];
  color?: string;
  // Internal circuit snapshot
  components: CircuitComponent[];
  wires: Wire[];
}

export interface CircuitComponent {
  id: string;
  type: GateType;
  customGateId?: string; // If type === 'CUSTOM_IC'
  name: string;
  x: number;
  y: number;
  rotation: number; // 0, 90, 180, 270 degrees
  flipped?: boolean;
  inputCount: number; // Variable input count for AND/OR/NAND/NOR/XOR etc.
  ports: Port[];
  label?: string;
  locked?: boolean;
  color?: string;
  
  // Runtime internal state (e.g. for flip flops, switches, clocks)
  internalState?: {
    value?: number | boolean;
    clockFreqHz?: number;
    pulseDurationMs?: number;
    lastClockTime?: number;
    clockState?: boolean;
    storedBits?: number[];
    q?: LogicState;
    notQ?: LogicState;
    [key: string]: any;
  };
}

export interface WirePoint {
  x: number;
  y: number;
}

export interface Wire {
  id: string;
  fromComponentId: string;
  fromPortId: string;
  toComponentId: string;
  toPortId: string;
  waypoints?: WirePoint[]; // Custom orthogonal routing waypoints
  color?: string;
  label?: string;
}

export interface SimulationState {
  // Map of ComponentId -> PortId -> LogicState
  portValues: Record<string, Record<string, LogicState>>;
  // Map of WireId -> LogicState
  wireValues: Record<string, LogicState>;
  // Component internal state overrides/updates
  componentStates: Record<string, any>;
  simulationStep: number;
  hasErrors: boolean;
  errorMessages: string[];
  loopDetected: boolean;
}

export interface TimingSample {
  timestamp: number; // in milliseconds or tick index
  signals: Record<string, LogicState>; // portId or probeId -> state
}

export interface CircuitAnalysisResult {
  totalComponents: number;
  totalGates: number;
  totalInputs: number;
  totalOutputs: number;
  totalWires: number;
  logicDepth: number;
  floatingInputs: { componentId: string; portId: string; portName: string }[];
  unconnectedOutputs: { componentId: string; portId: string; portName: string }[];
  loopsDetected: boolean;
  criticalPathDelayNs: number;
  isolatedComponents: string[];
}

export interface TruthTableRow {
  inputs: Record<string, 0 | 1>;
  outputs: Record<string, LogicState>;
  decimalIndex: number;
  minterm: string;
  maxterm: string;
}

export interface TruthTableData {
  inputNames: string[];
  outputNames: string[];
  rows: TruthTableRow[];
  mintermList: Record<string, number[]>; // outputName -> list of decimal indices
  maxtermList: Record<string, number[]>;
  sopExpressions: Record<string, string>;
  posExpressions: Record<string, string>;
}

export interface ChallengeDefinition {
  id: string;
  title: string;
  category: 'Basics' | 'Arithmetic' | 'Combinational' | 'Sequential';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  objective: string;
  expectedInputs: string[];
  expectedOutputs: string[];
  // Test cases: input values -> expected output values
  testCases: Array<{
    inputs: Record<string, 0 | 1>;
    expected: Record<string, 0 | 1>;
  }>;
  maxGates?: number;
  allowedGateTypes?: GateType[];
  hints: string[];
  explanation: string;
  starterCircuit?: {
    components: Partial<CircuitComponent>[];
    wires?: Partial<Wire>[];
  };
}

export interface CircuitData {
  version: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  components: CircuitComponent[];
  wires: Wire[];
  customGates?: CustomGateDefinition[];
  camera?: { x: number; y: number; zoom: number };
}
