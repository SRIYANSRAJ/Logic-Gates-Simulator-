/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useCircuit } from '../../context/CircuitContext';
import { GateType } from '../../types/circuit';
import {
  Activity,
  Binary,
  Box,
  Cpu,
  Database,
  GitMerge,
  Lightbulb,
  Plus,
  Search,
  Sliders,
  Sparkles,
  ToggleRight,
  X,
} from 'lucide-react';

interface ComponentItem {
  type: GateType;
  name: string;
  inputCount?: number;
  customGateId?: string;
  description: string;
  equation?: string;
  tags: string[];
}

interface ComponentGroup {
  id: string;
  name: string;
  icon: React.ElementType;
  items: ComponentItem[];
}

export const Sidebar: React.FC = () => {
  const { addComponent, customGates, camera, sidebarOpen, setSidebarOpen } = useCircuit();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global '/' key to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        if (!['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const groups: ComponentGroup[] = useMemo(() => [
    {
      id: 'gates',
      name: 'Logic Gates',
      icon: GitMerge,
      items: [
        {
          type: 'AND',
          name: 'AND Gate',
          inputCount: 2,
          description: 'Y = A · B (High when both inputs are 1)',
          equation: 'Y = A · B',
          tags: ['and', 'gate', 'conjunction', 'logic', 'product'],
        },
        {
          type: 'OR',
          name: 'OR Gate',
          inputCount: 2,
          description: 'Y = A + B (High when any input is 1)',
          equation: 'Y = A + B',
          tags: ['or', 'gate', 'disjunction', 'logic', 'sum'],
        },
        {
          type: 'NOT',
          name: 'NOT Inverter',
          inputCount: 1,
          description: 'Y = A\' (Inverts 0 to 1 and 1 to 0)',
          equation: 'Y = A\'',
          tags: ['not', 'inverter', 'invert', 'complement', 'negation', 'gate'],
        },
        {
          type: 'NAND',
          name: 'NAND Gate',
          inputCount: 2,
          description: 'Universal Gate: Y = (A · B)\'',
          equation: 'Y = (A·B)\'',
          tags: ['nand', 'universal', 'not and', 'gate', 'and'],
        },
        {
          type: 'NOR',
          name: 'NOR Gate',
          inputCount: 2,
          description: 'Universal Gate: Y = (A + B)\'',
          equation: 'Y = (A+B)\'',
          tags: ['nor', 'universal', 'not or', 'gate', 'or'],
        },
        {
          type: 'XOR',
          name: 'XOR Gate',
          inputCount: 2,
          description: 'Exclusive-OR: Y = A ⊕ B (Odd parity)',
          equation: 'Y = A ⊕ B',
          tags: ['xor', 'exclusive or', 'parity', 'inequality', 'adder', 'gate', 'or'],
        },
        {
          type: 'XNOR',
          name: 'XNOR Gate',
          inputCount: 2,
          description: 'Equivalence: Y = (A ⊕ B)\'',
          equation: 'Y = A ⊙ B',
          tags: ['xnor', 'exclusive nor', 'equivalence', 'equality', 'gate', 'or'],
        },
        {
          type: 'BUFFER',
          name: 'Buffer',
          inputCount: 1,
          description: 'Y = A (Signal Buffer / Delay)',
          equation: 'Y = A',
          tags: ['buffer', 'delay', 'driver', 'signal', 'gate'],
        },
        {
          type: 'TRI_STATE_BUFFER',
          name: 'Tri-State Buffer',
          inputCount: 2,
          description: 'High-Z (Floating) when Enable = 0',
          equation: 'Y = En ? A : Z',
          tags: ['tri-state', 'tristate', 'buffer', 'high-z', 'bus', 'enable', 'floating'],
        },
      ],
    },
    {
      id: 'multi_input',
      name: 'Variable-Input Gates',
      icon: Sliders,
      items: [
        {
          type: 'AND',
          name: 'AND 3-Input',
          inputCount: 3,
          description: '3-Input AND Gate (Y = A·B·C)',
          equation: 'Y = A·B·C',
          tags: ['and', '3-input', 'multi-input', '3 input and', 'gate'],
        },
        {
          type: 'AND',
          name: 'AND 4-Input',
          inputCount: 4,
          description: '4-Input AND Gate (Y = A·B·C·D)',
          equation: 'Y = A·B·C·D',
          tags: ['and', '4-input', 'multi-input', '4 input and', 'gate'],
        },
        {
          type: 'AND',
          name: 'AND 8-Input',
          inputCount: 8,
          description: '8-Input AND Gate (Y = A..H)',
          equation: 'Y = A..H',
          tags: ['and', '8-input', 'multi-input', '8 input and', 'gate'],
        },
        {
          type: 'OR',
          name: 'OR 3-Input',
          inputCount: 3,
          description: '3-Input OR Gate (Y = A+B+C)',
          equation: 'Y = A+B+C',
          tags: ['or', '3-input', 'multi-input', '3 input or', 'gate'],
        },
        {
          type: 'OR',
          name: 'OR 4-Input',
          inputCount: 4,
          description: '4-Input OR Gate (Y = A+B+C+D)',
          equation: 'Y = A+B+C+D',
          tags: ['or', '4-input', 'multi-input', '4 input or', 'gate'],
        },
        {
          type: 'XOR',
          name: 'XOR 3-Input',
          inputCount: 3,
          description: '3-Input XOR Gate (Y = A⊕B⊕C)',
          equation: 'Y = A⊕B⊕C',
          tags: ['xor', '3-input', 'multi-input', 'parity', 'gate', 'or'],
        },
        {
          type: 'NAND',
          name: 'NAND 3-Input',
          inputCount: 3,
          description: '3-Input NAND Gate (Y = (A·B·C)\')',
          equation: 'Y = (A·B·C)\'',
          tags: ['nand', '3-input', 'multi-input', 'gate', 'and'],
        },
        {
          type: 'NOR',
          name: 'NOR 3-Input',
          inputCount: 3,
          description: '3-Input NOR Gate (Y = (A+B+C)\')',
          equation: 'Y = (A+B+C)\'',
          tags: ['nor', '3-input', 'multi-input', 'gate', 'or'],
        },
      ],
    },
    {
      id: 'inputs',
      name: 'Input Sources',
      icon: ToggleRight,
      items: [
        {
          type: 'SWITCH',
          name: 'Toggle Switch',
          description: 'Interactive latching digital switch (0 / 1)',
          tags: ['switch', 'toggle', 'input', 'bit', 'binary', 'source', 'key'],
        },
        {
          type: 'BUTTON',
          name: 'Push Button',
          description: 'Momentary contact pushbutton (active while pressed)',
          tags: ['button', 'pushbutton', 'momentary', 'input', 'trigger', 'press'],
        },
        {
          type: 'CLOCK',
          name: 'Clock Generator',
          description: 'Continuous square wave oscillation pulse generator',
          tags: ['clock', 'clk', 'oscillator', 'pulse', 'timer', 'frequency', 'hz', 'signal', 'source'],
        },
        {
          type: 'CONST_1',
          name: 'VCC (+5V / High 1)',
          description: 'Tied permanently to Logic High (+5V / 1)',
          tags: ['vcc', 'high', 'const 1', 'constant', 'power', '1', 'true', 'plus 5v'],
        },
        {
          type: 'CONST_0',
          name: 'GND (0V / Low 0)',
          description: 'Tied permanently to Ground (0V / 0)',
          tags: ['gnd', 'ground', 'low', 'const 0', 'constant', '0', 'false', 'zero'],
        },
        {
          type: 'PULSE',
          name: 'Pulse Generator',
          description: 'Single high impulse trigger pulse on click',
          tags: ['pulse', 'impulse', 'single shot', 'trigger', 'mono', 'input'],
        },
        {
          type: 'RANDOM',
          name: 'Random Generator',
          description: 'Pseudo-random digital bits on each clock cycle',
          tags: ['random', 'noise', 'prng', 'stochastic', 'bits', 'generator'],
        },
      ],
    },
    {
      id: 'outputs',
      name: 'Output Displays',
      icon: Lightbulb,
      items: [
        {
          type: 'PROBE',
          name: 'Logic Probe',
          description: 'Displays exact digital state (0, 1, Z, X)',
          tags: ['probe', 'tester', 'meter', 'logic probe', 'display', 'output', 'state', 'monitor'],
        },
        {
          type: 'LED',
          name: 'LED Indicator',
          description: 'Vibrant glowing digital lamp (ON / OFF)',
          tags: ['led', 'lamp', 'light', 'indicator', 'output', 'diode', 'glow'],
        },
        {
          type: 'HEX_DISPLAY',
          name: 'Hexadecimal Display',
          description: 'Decodes 4-bit binary to Hex character (0-9, A-F)',
          tags: ['hex', 'hexadecimal', 'display', 'bcd', '4-bit', 'number', 'digit', 'screen'],
        },
        {
          type: 'DECIMAL_DISPLAY',
          name: 'Decimal Display',
          description: 'Decodes 4-bit binary to decimal integer (0-15)',
          tags: ['decimal', 'display', 'number', 'integer', '4-bit', 'count', 'screen'],
        },
        {
          type: 'SEGMENT_7',
          name: '7-Segment Display',
          description: 'Raw 7-segment LED array with individual pins (a-g, dp)',
          tags: ['7-segment', '7 segment', 'seven segment', 'segment', 'display', 'led', 'screen', 'digit'],
        },
        {
          type: 'BINARY_DISPLAY',
          name: '4-Bit Binary Bar',
          description: '4-bit parallel logic level LED indicator bar',
          tags: ['binary', 'bar', '4-bit', 'bus', 'led bar', 'display', 'parallel'],
        },
      ],
    },
    {
      id: 'complex',
      name: 'Arithmetic & MSI',
      icon: Cpu,
      items: [
        {
          type: 'HALF_ADDER',
          name: 'Half Adder',
          description: 'SUM = A ⊕ B, CARRY = A · B',
          tags: ['adder', 'half adder', 'ha', 'arithmetic', 'sum', 'carry', 'math', 'alu', 'addition'],
        },
        {
          type: 'FULL_ADDER',
          name: 'Full Adder',
          description: 'SUM = A ⊕ B ⊕ Cin, Cout = (A·B) + Cin(A⊕B)',
          tags: ['adder', 'full adder', 'fa', 'cin', 'cout', 'arithmetic', 'sum', 'carry', 'alu', 'addition'],
        },
        {
          type: 'HALF_SUBTRACTOR',
          name: 'Half Subtractor',
          description: 'Diff = A ⊕ B, Borrow = A\' · B',
          tags: ['subtractor', 'half subtractor', 'subtraction', 'borrow', 'difference', 'arithmetic', 'alu', 'adder'],
        },
        {
          type: 'FULL_SUBTRACTOR',
          name: 'Full Subtractor',
          description: 'Diff & Borrow with Borrow In (Bin)',
          tags: ['subtractor', 'full subtractor', 'subtraction', 'borrow in', 'bin', 'arithmetic', 'alu', 'adder'],
        },
        {
          type: 'MUX_2_1',
          name: '2:1 Multiplexer',
          description: '2-to-1 Data Selector (Y = S\'D0 + SD1)',
          tags: ['mux', 'multiplexer', '2:1 mux', 'selector', 'data selector', 'routing', 'switch'],
        },
        {
          type: 'MUX_4_1',
          name: '4:1 Multiplexer',
          description: '4-to-1 Data Selector with 2 select lines',
          tags: ['mux', 'multiplexer', '4:1 mux', 'selector', 'data selector', '4 to 1', 'routing'],
        },
        {
          type: 'DEMUX_1_2',
          name: '1:2 Demultiplexer',
          description: '1-to-2 Data Router (Routes input to Y0 or Y1)',
          tags: ['demux', 'demultiplexer', '1:2 demux', 'router', 'distribution', 'switch'],
        },
        {
          type: 'DEMUX_1_4',
          name: '1:4 Demultiplexer',
          description: '1-to-4 Data Router with 2 select lines',
          tags: ['demux', 'demultiplexer', '1:4 demux', 'router', 'distribution'],
        },
        {
          type: 'DECODER_2_4',
          name: '2:4 Binary Decoder',
          description: 'Decodes 2-bit address into 4 active-high lines',
          tags: ['decoder', '2:4 decoder', 'address', 'decoding', 'binary decoder', 'select'],
        },
        {
          type: 'DECODER_3_8',
          name: '3:8 Binary Decoder',
          description: 'Decodes 3-bit address into 8 active-high lines',
          tags: ['decoder', '3:8 decoder', 'address', 'decoding', 'binary decoder', 'octal'],
        },
        {
          type: 'ENCODER_4_2',
          name: '4:2 Priority Encoder',
          description: 'Encodes 4 input lines into a 2-bit binary code',
          tags: ['encoder', 'priority encoder', '4:2 encoder', 'priority', 'encoding', 'binary'],
        },
        {
          type: 'COMPARATOR_1BIT',
          name: '1-Bit Comparator',
          description: 'Compares 2 bits: A > B, A = B, A < B',
          tags: ['comparator', 'compare', 'magnitude', 'equality', 'greater', 'less', '1-bit'],
        },
        {
          type: 'COMPARATOR_2BIT',
          name: '2-Bit Comparator',
          description: 'Compares 2-bit words (A1A0 vs B1B0)',
          tags: ['comparator', 'compare', 'magnitude', 'equality', '2-bit', 'words'],
        },
        {
          type: 'RIPPLE_ADDER_4BIT',
          name: '4-Bit Adder (ALU)',
          description: '4-bit parallel binary adder with carry-in and carry-out',
          tags: ['adder', '4-bit adder', 'ripple carry', 'alu', 'arithmetic', 'multi-bit', 'addition', 'math'],
        },
        {
          type: 'PARITY_GEN',
          name: 'Parity Generator',
          description: 'Generates Even and Odd parity bits for 4-bit data',
          tags: ['parity', 'generator', 'error detection', 'even parity', 'odd parity', 'checker'],
        },
        {
          type: 'PARITY_CHECK',
          name: 'Parity Checker',
          description: 'Validates 4-bit data word against parity bit',
          tags: ['parity', 'checker', 'error detection', 'validation', 'check'],
        },
      ],
    },
    {
      id: 'sequential',
      name: 'Sequential & Memory',
      icon: Database,
      items: [
        {
          type: 'SR_LATCH',
          name: 'SR Latch',
          description: 'Set-Reset 1-bit memory latch (bistable multivibrator)',
          tags: ['sr latch', 'latch', 'set reset', 'flip-flop', 'flipflop', 'memory', 'bistable', 'storage', 'sequential'],
        },
        {
          type: 'D_FLIP_FLOP',
          name: 'D Flip-Flop',
          description: 'Edge-triggered Data Flip-Flop (captures D on clock rising edge)',
          tags: ['d flip-flop', 'd flip flop', 'd flipflop', 'flip-flop', 'flipflop', 'dff', 'data flip flop', 'memory', 'edge-triggered', 'clock', 'sequential'],
        },
        {
          type: 'JK_FLIP_FLOP',
          name: 'JK Flip-Flop',
          description: 'Universal Flip-Flop: Set, Reset, Hold, and Toggle (J=K=1)',
          tags: ['jk flip-flop', 'jk flip flop', 'jk flipflop', 'flip-flop', 'flipflop', 'jk', 'toggle', 'universal flip flop', 'memory', 'sequential'],
        },
        {
          type: 'T_FLIP_FLOP',
          name: 'T Flip-Flop',
          description: 'Toggle Flip-Flop: inverts output Q on each clock pulse when T=1',
          tags: ['t flip-flop', 't flip flop', 't flipflop', 'flip-flop', 'flipflop', 'toggle', 'counter', 'frequency divider', 'memory', 'sequential'],
        },
        {
          type: 'COUNTER_4BIT',
          name: '4-Bit Binary Counter',
          description: 'Modulo-16 Synchronous Binary Up-Counter (0 to 15)',
          tags: ['counter', '4-bit counter', 'binary counter', 'modulo 16', 'timer', 'frequency divider', 'sequential', 'flip-flop'],
        },
        {
          type: 'REGISTER_4BIT',
          name: '4-Bit Data Register',
          description: '4-bit parallel load storage register with Clock & Load enable',
          tags: ['register', '4-bit register', 'storage', 'memory', 'buffer register', 'parallel load', 'sequential', 'flip-flop'],
        },
      ],
    },
    ...(customGates.length > 0
      ? [
          {
            id: 'custom',
            name: 'Custom IC Subcircuits',
            icon: Box,
            items: customGates.map((cg) => ({
              type: 'CUSTOM_IC' as GateType,
              name: cg.name,
              customGateId: cg.id,
              description: cg.description || 'Custom Modular IC Subcircuit',
              tags: ['custom', 'ic', 'chip', 'subcircuit', 'modular', cg.name.toLowerCase()],
            })),
          },
        ]
      : []),
  ], [customGates]);

  // Clean & normalize search query
  const normalizedQuery = searchQuery.trim().toLowerCase().replace(/[-_]/g, ' ');

  // Filter items across name, description, equation, type, and tags
  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) {
      return groups.filter((g) => activeCategory === 'all' || activeCategory === g.id);
    }

    const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => {
          const nameNorm = item.name.toLowerCase().replace(/[-_]/g, ' ');
          const descNorm = item.description.toLowerCase().replace(/[-_]/g, ' ');
          const typeNorm = item.type.toLowerCase().replace(/[-_]/g, ' ');
          const eqNorm = (item.equation || '').toLowerCase();
          const allTags = item.tags.map((t) => t.toLowerCase().replace(/[-_]/g, ' '));

          // Check if every token in query matches something in item
          return queryTokens.every(
            (token) =>
              nameNorm.includes(token) ||
              descNorm.includes(token) ||
              typeNorm.includes(token) ||
              eqNorm.includes(token) ||
              allTags.some((tag) => tag.includes(token))
          );
        }),
      }))
      .filter((g) => g.items.length > 0 && (activeCategory === 'all' || activeCategory === g.id));
  }, [groups, normalizedQuery, activeCategory]);

  const totalMatchingItems = useMemo(() => {
    return filteredGroups.reduce((acc, g) => acc + g.items.length, 0);
  }, [filteredGroups]);

  // Place component onto canvas center
  const handlePlaceComponent = (item: ComponentItem) => {
    const centerX = (-camera.x + window.innerWidth / 2 - 100) / camera.zoom;
    const centerY = (-camera.y + window.innerHeight / 2 - 50) / camera.zoom;

    addComponent(item.type, centerX, centerY, {
      inputCount: item.inputCount,
      customGateId: item.customGateId,
      name: item.name,
    });

    // On tablet/mobile, automatically close drawer after picking component so user sees canvas
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  if (!sidebarOpen) return null;

  return (
    <aside className="fixed lg:relative left-0 top-14 lg:top-0 bottom-0 w-72 lg:w-64 bg-[#0b111e] border-r border-slate-800/80 flex flex-col z-40 select-none shadow-2xl lg:shadow-none transition-transform">
      {/* Search Header */}
      <div className="p-3 border-b border-slate-800/60 space-y-2.5">
        <div className="flex items-center justify-between lg:hidden pb-1 border-b border-slate-800/40">
          <span className="text-xs font-bold text-slate-300">Component Library</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search gates, adders, flip-flops... (/)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-slate-900 border border-slate-700/70 focus:border-emerald-500 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors shadow-inner"
          />
          {searchQuery ? (
            <button
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-2 top-2 px-1.5 py-0.2 bg-slate-800 text-[10px] text-slate-400 rounded font-mono border border-slate-700 pointer-events-none">
              /
            </kbd>
          )}
        </div>

        {/* Search status & results counter */}
        {searchQuery.trim() && (
          <div className="flex items-center justify-between text-[11px] px-0.5 text-slate-400 font-medium">
            <span>
              {totalMatchingItems} {totalMatchingItems === 1 ? 'component' : 'components'} found
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-emerald-400 hover:text-emerald-300 text-[10px] font-semibold"
            >
              Reset
            </button>
          </div>
        )}

        {/* Category Pills */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-0.5 text-[11px]">
          {[
            { id: 'all', label: 'All' },
            { id: 'gates', label: 'Gates' },
            { id: 'inputs', label: 'Inputs' },
            { id: 'outputs', label: 'Displays' },
            { id: 'complex', label: 'MSI/ALU' },
            { id: 'sequential', label: 'Memory' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2 py-0.5 rounded-md whitespace-nowrap font-medium transition-colors cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Component Library List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 text-xs">
        {filteredGroups.length === 0 ? (
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3 text-slate-400">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-full text-slate-500">
              <Search className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-300 text-xs">No matching components</p>
              <p className="text-[11px] text-slate-500">
                No components matched "{searchQuery}". Try keywords like <span className="text-emerald-400">AND</span>, <span className="text-emerald-400">adder</span>, or <span className="text-emerald-400">flip-flop</span>.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
            >
              Clear Search & Filter
            </button>
          </div>
        ) : (
          filteredGroups.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.id} className="space-y-1.5">
                <div className="flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                    <span>{group.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{group.items.length}</span>
                </div>

                <div className="grid grid-cols-1 gap-1">
                  {group.items.map((item, idx) => (
                    <button
                      key={`${item.type}_${item.inputCount || 0}_${item.customGateId || idx}`}
                      onClick={() => handlePlaceComponent(item)}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800/50 hover:border-slate-700 text-left transition-all group cursor-pointer"
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors truncate">
                            {item.name}
                          </span>
                          {item.equation && (
                            <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                              {item.equation}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 truncate mt-0.5">
                          {item.description}
                        </span>
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-emerald-500/20 text-emerald-400 rounded shrink-0">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
        
        {/* Footer Credit */}
        <div className="pt-6 pb-2 mt-4 text-center">
          <p className="text-[10px] text-slate-500 font-medium tracking-wide">
            Designed by <span className="text-emerald-400">Sriyans Raj</span>
          </p>
        </div>
      </div>
    </aside>
  );
};
