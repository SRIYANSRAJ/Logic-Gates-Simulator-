/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
  ChallengeDefinition,
  CircuitComponent,
  CircuitData,
  CustomGateDefinition,
  GateType,
  LogicState,
  SimulationState,
  TimingSample,
  Wire,
  ThemePreset,
  WireRoutingMode,
} from '../types/circuit';
import { createComponent, generateComponentPorts } from '../engine/componentFactory';
import { CHALLENGES } from '../engine/challenges';
import { getPresetCircuits, PresetCircuit } from '../engine/presets';
import { simulateCircuit } from '../engine/simulation';
import { parseBooleanExpression, synthesizeCircuitFromAST } from '../engine/booleanParser';
import { THEME_PRESETS } from '../theme/themes';

export type ActiveModalType =
  | 'none'
  | 'tutorial'
  | 'truthTable'
  | 'boolean'
  | 'kmap'
  | 'analyzer'
  | 'customGate'
  | 'presets'
  | 'learn'
  | 'challenges'
  | 'oscilloscope'
  | 'shortcuts'
  | 'savedCircuits'
  | 'settings';

interface SelectionState {
  componentIds: string[];
  wireIds: string[];
}

interface CircuitContextType {
  // State
  components: CircuitComponent[];
  wires: Wire[];
  customGates: CustomGateDefinition[];
  selection: SelectionState;
  camera: { x: number; y: number; zoom: number };
  simulationRunning: boolean;
  simulationSpeedHz: number;
  simulationState: SimulationState;
  activeTool: 'select' | 'pan' | 'wire' | 'delete';
  wireDraft: {
    fromCompId: string;
    fromPortId: string;
    startPos: { x: number; y: number };
    currentX: number;
    currentY: number;
  } | null;
  wireRoutingMode: WireRoutingMode;
  theme: ThemePreset;
  signalAnimation: boolean;
  snapToGrid: boolean;
  gridSize: number;
  timingHistory: TimingSample[];
  activeModal: ActiveModalType;
  activeChallenge: ChallengeDefinition | null;
  canUndo: boolean;
  canRedo: boolean;
  circuitName: string;
  sidebarOpen: boolean;
  inspectorOpen: boolean;

  // Actions
  setCamera: React.Dispatch<React.SetStateAction<{ x: number; y: number; zoom: number }>>;
  setSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  setInspectorOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  toggleSidebar: () => void;
  toggleInspector: () => void;
  setActiveTool: (tool: 'select' | 'pan' | 'wire' | 'delete') => void;
  setActiveModal: (modal: ActiveModalType) => void;
  setWireRoutingMode: (mode: WireRoutingMode) => void;
  setTheme: (theme: ThemePreset) => void;
  setSignalAnimation: (enabled: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;
  setSimulationSpeedHz: (hz: number) => void;
  setCircuitName: (name: string) => void;

  addComponent: (type: GateType, x: number, y: number, options?: any) => CircuitComponent;
  updateComponent: (id: string, partial: Partial<CircuitComponent>, withHistory?: boolean) => void;
  setComponentInputCount: (id: string, count: number) => void;
  deleteSelection: () => void;
  duplicateSelection: () => void;
  rotateSelection: () => void;
  flipSelection: () => void;
  lockSelection: () => void;
  selectComponent: (id: string, append?: boolean) => void;
  selectWire: (id: string, append?: boolean) => void;
  selectAllWires: () => void;
  deleteSelectedWires: () => void;
  clearSelection: () => void;
  setBoxSelection: (compIds: string[], wireIds: string[]) => void;

  startWireDraft: (compId: string, portId: string, startPos: { x: number; y: number }) => void;
  updateWireDraft: (x: number, y: number) => void;
  completeWireDraft: (targetCompId: string, targetPortId: string) => void;
  cancelWireDraft: () => void;
  removeWire: (id: string) => void;

  toggleSwitch: (compId: string) => void;
  pressButton: (compId: string, pressed: boolean) => void;
  triggerPulse: (compId: string) => void;
  applyInputValues: (variableValues: Record<string, 0 | 1>) => void;

  stepSimulation: () => void;
  toggleSimulation: (running?: boolean) => void;
  resetSimulation: () => void;

  undo: () => void;
  redo: () => void;
  recordHistorySnapshot: (customComps?: CircuitComponent[], customWires?: Wire[]) => void;
  copy: () => void;
  paste: () => void;

  createCustomGateFromSelection: (name: string, description: string, color?: string) => CustomGateDefinition | null;
  loadPreset: (preset: PresetCircuit) => void;
  loadChallenge: (challenge: ChallengeDefinition) => void;
  clearCanvas: () => void;
  fitToScreen: () => void;
  exportJson: () => string;
  importJson: (jsonStr: string) => boolean;
  synthesizeAndLoadExpression: (expr: string, mode?: 'replace' | 'insert') => { success: boolean; error?: string };
  loadCircuitData: (components: CircuitComponent[], wires: Wire[], name?: string) => void;
}

const CircuitContext = createContext<CircuitContextType | null>(null);

const STORAGE_KEY = 'digilogic_circuit_autosave_v1';
const CUSTOM_GATES_KEY = 'digilogic_custom_gates_v1';
const THEME_STORAGE_KEY = 'digilogic_theme_v1';
const ROUTING_STORAGE_KEY = 'digilogic_routing_mode_v1';

export const CircuitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Primary State
  const [components, setComponents] = useState<CircuitComponent[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  const [customGates, setCustomGates] = useState<CustomGateDefinition[]>([]);
  const [circuitName, setCircuitName] = useState<string>('Untitled Circuit');
  const [selection, setSelection] = useState<SelectionState>({ componentIds: [], wireIds: [] });
  const [clipboard, setClipboard] = useState<{ components: CircuitComponent[]; wires: Wire[] } | null>(null);

  // Undo/Redo History
  const [history, setHistory] = useState<{
    past: Array<{ components: CircuitComponent[]; wires: Wire[] }>;
    future: Array<{ components: CircuitComponent[]; wires: Wire[] }>;
  }>({ past: [], future: [] });

  // Viewport & UI state
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [activeTool, setActiveTool] = useState<'select' | 'pan' | 'wire' | 'delete'>('select');
  const [wireRoutingMode, setWireRoutingModeState] = useState<WireRoutingMode>(() => {
    try {
      const saved = localStorage.getItem(ROUTING_STORAGE_KEY);
      if (saved === 'orthogonal' || saved === 'curved' || saved === 'straight') {
        return saved;
      }
    } catch (_) {}
    return 'orthogonal';
  });

  const setWireRoutingMode = useCallback((mode: WireRoutingMode) => {
    setWireRoutingModeState(mode);
    try {
      localStorage.setItem(ROUTING_STORAGE_KEY, mode);
    } catch (_) {}
  }, []);

  // Theme preset state (defaults to Matrix Emerald)
  const [theme, setThemeState] = useState<ThemePreset>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved && Object.keys(THEME_PRESETS).includes(saved)) {
        return saved as ThemePreset;
      }
    } catch (_) {}
    return 'emerald';
  });

  const setTheme = useCallback((newTheme: ThemePreset) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    } catch (_) {}
  }, []);

  // Apply theme to document element
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
    } catch (_) {}
  }, [theme]);

  const [signalAnimation, setSignalAnimation] = useState<boolean>(true);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const gridSize = 20;

  // Wire Drafting State
  const [wireDraft, setWireDraft] = useState<{
    fromCompId: string;
    fromPortId: string;
    startPos: { x: number; y: number };
    currentX: number;
    currentY: number;
  } | null>(null);

  // Simulation Engine State
  const [simulationRunning, setSimulationRunning] = useState<boolean>(true);
  const [simulationSpeedHz, setSimulationSpeedHz] = useState<number>(10);
  const [simulationState, setSimulationState] = useState<SimulationState>({
    portValues: {},
    wireValues: {},
    componentStates: {},
    simulationStep: 0,
    hasErrors: false,
    errorMessages: [],
    loopDetected: false,
  });
  const simulationStateRef = useRef<SimulationState>(simulationState);
  simulationStateRef.current = simulationState;

  const [timingHistory, setTimingHistory] = useState<TimingSample[]>([]);
  const [activeModal, setActiveModal] = useState<ActiveModalType>('none');
  const [activeChallenge, setActiveChallenge] = useState<ChallengeDefinition | null>(null);

  // Responsive Drawer/Panel State (Auto-collapse on tablets/mobile)
  const isDesktop = typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  const isLargeDesktop = typeof window !== 'undefined' ? window.innerWidth >= 1280 : true;
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(isDesktop);
  const [inspectorOpen, setInspectorOpen] = useState<boolean>(isLargeDesktop);

  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);
  const toggleInspector = useCallback(() => setInspectorOpen((prev) => !prev), []);

  // Custom Gate Defs Map helper
  const customGateMap = useRef<Map<string, CustomGateDefinition>>(new Map());
  useEffect(() => {
    const map = new Map<string, CustomGateDefinition>();
    customGates.forEach((g) => map.set(g.id, g));
    customGateMap.current = map;
  }, [customGates]);

  // Record History State for Undo/Redo (Max 50 steps deep-cloned)
  const recordHistory = useCallback(
    (newComps: CircuitComponent[], newWires: Wire[]) => {
      const clonedComps = JSON.parse(JSON.stringify(newComps));
      const clonedWires = JSON.parse(JSON.stringify(newWires));
      setHistory((prev) => ({
        past: [...prev.past.slice(-50), { components: clonedComps, wires: clonedWires }],
        future: [],
      }));
    },
    []
  );

  const recordHistorySnapshot = useCallback(
    (customComps?: CircuitComponent[], customWires?: Wire[]) => {
      const snapshotComps = JSON.parse(JSON.stringify(customComps ?? components));
      const snapshotWires = JSON.parse(JSON.stringify(customWires ?? wires));
      setHistory((prev) => ({
        past: [...prev.past.slice(-50), { components: snapshotComps, wires: snapshotWires }],
        future: [],
      }));
    },
    [components, wires]
  );

  // 1. Initial Load: Try LocalStorage or fallback to Starter Preset (Half Adder)
  useEffect(() => {
    try {
      const savedGates = localStorage.getItem(CUSTOM_GATES_KEY);
      if (savedGates) {
        setCustomGates(JSON.parse(savedGates));
      }

      const savedCircuit = localStorage.getItem(STORAGE_KEY);
      if (savedCircuit) {
        const data: CircuitData = JSON.parse(savedCircuit);
        if (data.components && data.components.length > 0) {
          setComponents(data.components);
          setWires(data.wires || []);
          if (data.name) setCircuitName(data.name);
          if (data.camera) setCamera(data.camera);
          return;
        }
      }
    } catch (err) {
      console.warn('Could not restore from localStorage:', err);
    }

    // Default starter preset: Full Adder structural
    const defaultPreset = getPresetCircuits()[1];
    setComponents(defaultPreset.components);
    setWires(defaultPreset.wires);
    setCircuitName(defaultPreset.name);

    // Auto-open tutorial on first-ever visit
    try {
      const tutorialSeen = localStorage.getItem('digilogic_tutorial_seen');
      if (!tutorialSeen) {
        setTimeout(() => {
          setActiveModal('tutorial');
        }, 500);
      }
    } catch {
      // ignore
    }
  }, []);

  // Autosave locally on state changes
  useEffect(() => {
    if (components.length === 0) return;
    const timeout = setTimeout(() => {
      try {
        const data: CircuitData = {
          version: '1.0.0',
          name: circuitName,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          components,
          wires,
          customGates,
          camera,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(CUSTOM_GATES_KEY, JSON.stringify(customGates));
      } catch (err) {
        console.warn('Autosave failed:', err);
      }
    }, 800);
    return () => clearTimeout(timeout);
  }, [components, wires, customGates, circuitName, camera]);

  // 2. Simulation Tick Cycle for CLOCK and RANDOM components
  useEffect(() => {
    if (!simulationRunning) return;

    let animationFrameId: number;
    let lastTickTime = performance.now();

    const loop = (currentTime: number) => {
      const elapsed = currentTime - lastTickTime;
      const interval = 1000 / simulationSpeedHz;

      if (elapsed >= interval) {
        lastTickTime = currentTime;

        // Clock & random components oscillation check
        setComponents((prevComps) => {
          const hasOscillating = prevComps.some(
            (c) => c.type === 'CLOCK' || c.type === 'RANDOM'
          );
          if (!hasOscillating) return prevComps;

          return prevComps.map((c) => {
            if (c.type === 'CLOCK') {
              const curState = c.internalState?.clockState ?? false;
              return {
                ...c,
                internalState: {
                  ...c.internalState,
                  clockState: !curState,
                },
              };
            }
            if (c.type === 'RANDOM') {
              return {
                ...c,
                internalState: {
                  ...c.internalState,
                  value: Math.random() > 0.5 ? 1 : 0,
                },
              };
            }
            return c;
          });
        });
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [simulationRunning, simulationSpeedHz]);

  // Synchronous re-evaluation of circuit whenever components, wires, or states change
  useEffect(() => {
    const nextSim = simulateCircuit(
      components,
      wires,
      customGateMap.current,
      simulationStateRef.current.componentStates
    );
    simulationStateRef.current = nextSim;
    setSimulationState(nextSim);

    // Record Timing diagram sample for oscilloscope / logic analyzer
    const probeSamples: Record<string, LogicState> = {};
    let hasMonitoredComponents = false;
    components.forEach((c) => {
      if (['PROBE', 'LED', 'CLOCK', 'SWITCH', 'BUTTON'].includes(c.type)) {
        hasMonitoredComponents = true;
        const val = nextSim.portValues[c.id]?.['out'] ?? nextSim.portValues[c.id]?.['in_0'] ?? 0;
        probeSamples[c.label || c.name || c.id] = val;
      }
    });

    if (hasMonitoredComponents) {
      setTimingHistory((prev) => {
        const now = Date.now();
        const updated = [...prev.slice(-100), { timestamp: now, signals: probeSamples }];
        return updated;
      });
    }
  }, [components, wires]);

  // User Actions Implementation
  const addComponent = useCallback(
    (type: GateType, x: number, y: number, options: any = {}) => {
      const snapX = snapToGrid ? Math.round(x / gridSize) * gridSize : x;
      const snapY = snapToGrid ? Math.round(y / gridSize) * gridSize : y;

      let customDef: CustomGateDefinition | undefined;
      if (type === 'CUSTOM_IC' && options.customGateId) {
        customDef = customGates.find((g) => g.id === options.customGateId);
      }

      // Dynamic sequential naming for inputs and assets
      let dynamicLabel = options.label;
      let dynamicName = options.name;

      if (!dynamicLabel) {
        if (type === 'SWITCH') {
          const count = components.filter((c) => c.type === 'SWITCH').length + 1;
          dynamicLabel = `inp ${count}`;
          if (!dynamicName || dynamicName === 'Toggle Switch') {
            dynamicName = `Switch ${count}`;
          }
        } else if (type === 'BUTTON') {
          const count = components.filter((c) => c.type === 'BUTTON').length + 1;
          dynamicLabel = `inp ${count}`;
          if (!dynamicName || dynamicName === 'Push Button') {
            dynamicName = `Button ${count}`;
          }
        } else if (type === 'CLOCK') {
          const count = components.filter((c) => c.type === 'CLOCK').length + 1;
          dynamicLabel = `clk ${count}`;
          if (!dynamicName) dynamicName = `Clock ${count}`;
        } else if (type === 'CONST_1') {
          const count = components.filter((c) => c.type === 'CONST_1').length + 1;
          dynamicLabel = `vcc ${count}`;
          if (!dynamicName) dynamicName = `VCC ${count}`;
        } else if (type === 'CONST_0') {
          const count = components.filter((c) => c.type === 'CONST_0').length + 1;
          dynamicLabel = `gnd ${count}`;
          if (!dynamicName) dynamicName = `GND ${count}`;
        } else if (type === 'PULSE') {
          const count = components.filter((c) => c.type === 'PULSE').length + 1;
          dynamicLabel = `pls ${count}`;
          if (!dynamicName) dynamicName = `Pulse ${count}`;
        } else if (type === 'RANDOM') {
          const count = components.filter((c) => c.type === 'RANDOM').length + 1;
          dynamicLabel = `rnd ${count}`;
          if (!dynamicName) dynamicName = `Random ${count}`;
        } else if (type === 'LED') {
          const count = components.filter((c) => c.type === 'LED').length + 1;
          dynamicLabel = `out ${count}`;
          if (!dynamicName) dynamicName = `LED ${count}`;
        } else if (type === 'PROBE') {
          const count = components.filter((c) => c.type === 'PROBE').length + 1;
          dynamicLabel = `prb ${count}`;
          if (!dynamicName) dynamicName = `Probe ${count}`;
        }
      }

      const newComp = createComponent(type, snapX, snapY, {
        ...options,
        name: dynamicName,
        label: dynamicLabel,
        customDef,
      });

      recordHistory(components, wires);
      setComponents((prev) => [...prev, newComp]);
      setSelection({ componentIds: [newComp.id], wireIds: [] });
      return newComp;
    },
    [snapToGrid, gridSize, customGates, components, wires, recordHistory]
  );

  const updateComponent = useCallback(
    (id: string, partial: Partial<CircuitComponent>, withHistory: boolean = false) => {
      if (withHistory) {
        recordHistory(components, wires);
      }
      setComponents((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...partial } : c))
      );
    },
    [components, wires, recordHistory]
  );

  const setComponentInputCount = useCallback(
    (id: string, count: number) => {
      recordHistory(components, wires);
      setComponents((prev) =>
        prev.map((c) => {
          if (c.id === id) {
            const newPorts = generateComponentPorts(c.type, count, undefined);
            return {
              ...c,
              inputCount: count,
              ports: newPorts,
            };
          }
          return c;
        })
      );
      // Clean up orphaned wires connecting to removed ports
      setWires((prev) =>
        prev.filter((w) => {
          if (w.toComponentId === id) {
            const portIdx = parseInt(w.toPortId.replace('in_', ''), 10);
            return isNaN(portIdx) || portIdx < count;
          }
          return true;
        })
      );
    },
    [components, wires, recordHistory]
  );

  const deleteSelection = useCallback(() => {
    if (selection.componentIds.length === 0 && selection.wireIds.length === 0) return;

    recordHistory(components, wires);
    const delCompSet = new Set(selection.componentIds);
    const delWireSet = new Set(selection.wireIds);

    // Also delete any wire connected to a deleted component
    setComponents((prev) => prev.filter((c) => !delCompSet.has(c.id)));
    setWires((prev) =>
      prev.filter(
        (w) =>
          !delWireSet.has(w.id) &&
          !delCompSet.has(w.fromComponentId) &&
          !delCompSet.has(w.toComponentId)
      )
    );
    setSelection({ componentIds: [], wireIds: [] });
  }, [selection, components, wires, recordHistory]);

  const duplicateSelection = useCallback(() => {
    if (selection.componentIds.length === 0) return;
    recordHistory(components, wires);

    const idMap = new Map<string, string>();
    const newComps: CircuitComponent[] = [];

    selection.componentIds.forEach((compId) => {
      const orig = components.find((c) => c.id === compId);
      if (orig) {
        const cloned = createComponent(orig.type, orig.x + 40, orig.y + 40, {
          inputCount: orig.inputCount,
          customGateId: orig.customGateId,
          name: orig.name,
          label: orig.label ? `${orig.label}_copy` : undefined,
          rotation: orig.rotation,
        });
        newComps.push(cloned);
        idMap.set(orig.id, cloned.id);
      }
    });

    // Also duplicate internal interconnected wires
    const newWires: Wire[] = [];
    wires.forEach((w) => {
      if (idMap.has(w.fromComponentId) && idMap.has(w.toComponentId)) {
        newWires.push({
          id: `wire_${Date.now()}_${Math.random()}`,
          fromComponentId: idMap.get(w.fromComponentId)!,
          fromPortId: w.fromPortId,
          toComponentId: idMap.get(w.toComponentId)!,
          toPortId: w.toPortId,
          color: w.color,
        });
      }
    });

    setComponents((prev) => [...prev, ...newComps]);
    setWires((prev) => [...prev, ...newWires]);
    setSelection({ componentIds: newComps.map((c) => c.id), wireIds: newWires.map((w) => w.id) });
  }, [selection, components, wires, recordHistory]);

  const rotateSelection = useCallback(() => {
    if (selection.componentIds.length === 0) return;
    recordHistory(components, wires);
    setComponents((prev) =>
      prev.map((c) => {
        if (selection.componentIds.includes(c.id)) {
          return { ...c, rotation: (c.rotation + 90) % 360 };
        }
        return c;
      })
    );
  }, [selection, components, wires, recordHistory]);

  const flipSelection = useCallback(() => {
    if (selection.componentIds.length === 0) return;
    recordHistory(components, wires);
    setComponents((prev) =>
      prev.map((c) => {
        if (selection.componentIds.includes(c.id)) {
          return { ...c, flipped: !c.flipped };
        }
        return c;
      })
    );
  }, [selection, components, wires, recordHistory]);

  const lockSelection = useCallback(() => {
    if (selection.componentIds.length === 0) return;
    setComponents((prev) =>
      prev.map((c) => {
        if (selection.componentIds.includes(c.id)) {
          return { ...c, locked: !c.locked };
        }
        return c;
      })
    );
  }, [selection]);

  const selectComponent = useCallback((id: string, append: boolean = false) => {
    setSelection((prev) => ({
      componentIds: append
        ? prev.componentIds.includes(id)
          ? prev.componentIds.filter((cid) => cid !== id)
          : [...prev.componentIds, id]
        : [id],
      wireIds: append ? prev.wireIds : [],
    }));
  }, []);

  const selectWire = useCallback((id: string, append: boolean = false) => {
    setSelection((prev) => ({
      componentIds: append ? prev.componentIds : [],
      wireIds: append
        ? prev.wireIds.includes(id)
          ? prev.wireIds.filter((wid) => wid !== id)
          : [...prev.wireIds, id]
        : [id],
    }));
  }, []);

  const selectAllWires = useCallback(() => {
    setSelection((prev) => ({
      ...prev,
      wireIds: wires.map((w) => w.id),
    }));
  }, [wires]);

  const deleteSelectedWires = useCallback(() => {
    if (selection.wireIds.length === 0) return;
    recordHistory(components, wires);
    const delSet = new Set(selection.wireIds);
    setWires((prev) => prev.filter((w) => !delSet.has(w.id)));
    setSelection((prev) => ({ ...prev, wireIds: [] }));
  }, [selection.wireIds, components, wires, recordHistory]);

  const clearSelection = useCallback(() => {
    setSelection({ componentIds: [], wireIds: [] });
  }, []);

  const setBoxSelection = useCallback((compIds: string[], wireIds: string[]) => {
    setSelection({ componentIds: compIds, wireIds });
  }, []);

  // Wire Connections
  const startWireDraft = useCallback(
    (compId: string, portId: string, startPos: { x: number; y: number }) => {
      setWireDraft({
        fromCompId: compId,
        fromPortId: portId,
        startPos,
        currentX: startPos.x,
        currentY: startPos.y,
      });
    },
    []
  );

  const updateWireDraft = useCallback((x: number, y: number) => {
    setWireDraft((prev) => (prev ? { ...prev, currentX: x, currentY: y } : null));
  }, []);

  const completeWireDraft = useCallback(
    (targetCompId: string, targetPortId: string) => {
      if (!wireDraft) return;
      if (wireDraft.fromCompId === targetCompId) {
        setWireDraft(null);
        return; // Prevent self-loop on same component
      }

      // Check if wire already exists
      const existing = wires.find(
        (w) =>
          w.fromComponentId === wireDraft.fromCompId &&
          w.fromPortId === wireDraft.fromPortId &&
          w.toComponentId === targetCompId &&
          w.toPortId === targetPortId
      );

      if (!existing) {
        recordHistory(components, wires);
        const newWire: Wire = {
          id: `wire_${Date.now()}_${Math.random()}`,
          fromComponentId: wireDraft.fromCompId,
          fromPortId: wireDraft.fromPortId,
          toComponentId: targetCompId,
          toPortId: targetPortId,
        };
        setWires((prev) => [...prev, newWire]);
      }
      setWireDraft(null);
    },
    [wireDraft, wires, components, recordHistory]
  );

  const cancelWireDraft = useCallback(() => {
    setWireDraft(null);
  }, []);

  const removeWire = useCallback(
    (id: string) => {
      recordHistory(components, wires);
      setWires((prev) => prev.filter((w) => w.id !== id));
      setSelection((prev) => ({
        ...prev,
        wireIds: prev.wireIds.filter((wid) => wid !== id),
      }));
    },
    [components, wires, recordHistory]
  );

  // Interactive Inputs with Automatic Synchronization for Matching Named Inputs & Assets
  const toggleSwitch = useCallback((compId: string) => {
    setComponents((prev) => {
      const target = prev.find((c) => c.id === compId);
      if (!target) return prev;
      const targetTag = (target.label?.trim() || (target.name && !target.name.match(/^[A-Z0-9_-]+_[0-9]+$/i) ? target.name.trim() : '')).toLowerCase();
      const cur = target.internalState?.value ?? 0;
      const nextVal = cur === 1 ? 0 : 1;

      return prev.map((c) => {
        const cTag = (c.label?.trim() || (c.name && !c.name.match(/^[A-Z0-9_-]+_[0-9]+$/i) ? c.name.trim() : '')).toLowerCase();
        // Sync this component and all inputs/assets sharing the exact same custom name
        if (c.id === compId || (targetTag && cTag === targetTag && ['SWITCH', 'BUTTON', 'CONST_1', 'CONST_0', 'CLOCK', 'PULSE', 'RANDOM'].includes(c.type))) {
          return {
            ...c,
            internalState: {
              ...c.internalState,
              value: nextVal,
            },
          };
        }
        return c;
      });
    });
  }, []);

  const pressButton = useCallback((compId: string, pressed: boolean) => {
    setComponents((prev) => {
      const target = prev.find((c) => c.id === compId);
      if (!target) return prev;
      const targetTag = (target.label?.trim() || (target.name && !target.name.match(/^[A-Z0-9_-]+_[0-9]+$/i) ? target.name.trim() : '')).toLowerCase();

      return prev.map((c) => {
        const cTag = (c.label?.trim() || (c.name && !c.name.match(/^[A-Z0-9_-]+_[0-9]+$/i) ? c.name.trim() : '')).toLowerCase();
        if (c.id === compId || (targetTag && cTag === targetTag && ['BUTTON', 'SWITCH'].includes(c.type))) {
          return {
            ...c,
            internalState: {
              ...c.internalState,
              pressed,
              value: pressed ? 1 : 0,
            },
          };
        }
        return c;
      });
    });
  }, []);

  const triggerPulse = useCallback((compId: string) => {
    setComponents((prev) => {
      const target = prev.find((c) => c.id === compId);
      if (!target) return prev;
      const targetTag = (target.label?.trim() || (target.name && !target.name.match(/^[A-Z0-9_-]+_[0-9]+$/i) ? target.name.trim() : '')).toLowerCase();

      return prev.map((c) => {
        const cTag = (c.label?.trim() || (c.name && !c.name.match(/^[A-Z0-9_-]+_[0-9]+$/i) ? c.name.trim() : '')).toLowerCase();
        if (c.id === compId || (targetTag && cTag === targetTag && c.type === 'PULSE')) {
          return {
            ...c,
            internalState: {
              ...c.internalState,
              pulseActive: true,
            },
          };
        }
        return c;
      });
    });
    setTimeout(() => {
      setComponents((prev) => {
        const target = prev.find((c) => c.id === compId);
        const targetTag = target ? (target.label?.trim() || (target.name && !target.name.match(/^[A-Z0-9_-]+_[0-9]+$/i) ? target.name.trim() : '')).toLowerCase() : '';

        return prev.map((c) => {
          const cTag = (c.label?.trim() || (c.name && !c.name.match(/^[A-Z0-9_-]+_[0-9]+$/i) ? c.name.trim() : '')).toLowerCase();
          if (c.id === compId || (targetTag && cTag === targetTag && c.type === 'PULSE')) {
            return {
              ...c,
              internalState: {
                ...c.internalState,
                pulseActive: false,
              },
            };
          }
          return c;
        });
      });
    }, 150);
  }, []);

  const applyInputValues = useCallback((variableValues: Record<string, 0 | 1>) => {
    setComponents((prev) => {
      return prev.map((c) => {
        const customTag = (c.label?.trim() || (c.name && !c.name.match(/^[A-Z0-9_-]+_[0-9]+$/i) ? c.name.trim() : '')).toLowerCase();
        
        for (const [vName, vVal] of Object.entries(variableValues)) {
          const targetKey = vName.trim().toLowerCase();
          const matchesLabel = c.label?.trim().toLowerCase() === targetKey;
          const matchesName = c.name?.trim().toLowerCase() === targetKey;
          const matchesTag = customTag === targetKey;

          if (matchesLabel || matchesName || matchesTag) {
            return {
              ...c,
              internalState: {
                ...c.internalState,
                value: vVal,
                pressed: vVal === 1,
              },
            };
          }
        }
        return c;
      });
    });
  }, []);

  // Simulation Controls
  const stepSimulation = useCallback(() => {
    const next = simulateCircuit(components, wires, customGateMap.current, simulationState.componentStates);
    setSimulationState(next);
  }, [components, wires, simulationState.componentStates]);

  const toggleSimulation = useCallback((running?: boolean) => {
    setSimulationRunning((prev) => (running !== undefined ? running : !prev));
  }, []);

  const resetSimulation = useCallback(() => {
    setSimulationState({
      portValues: {},
      wireValues: {},
      componentStates: {},
      simulationStep: 0,
      hasErrors: false,
      errorMessages: [],
      loopDetected: false,
    });
    setTimingHistory([]);
  }, []);

  // Undo / Redo
  const undo = useCallback(() => {
    if (history.past.length === 0) return;
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);

    const currentCompsCloned = JSON.parse(JSON.stringify(components));
    const currentWiresCloned = JSON.parse(JSON.stringify(wires));

    setHistory({
      past: newPast,
      future: [{ components: currentCompsCloned, wires: currentWiresCloned }, ...history.future],
    });

    setComponents(JSON.parse(JSON.stringify(previous.components)));
    setWires(JSON.parse(JSON.stringify(previous.wires)));
    setSelection({ componentIds: [], wireIds: [] });
  }, [history, components, wires]);

  const redo = useCallback(() => {
    if (history.future.length === 0) return;
    const next = history.future[0];
    const newFuture = history.future.slice(1);

    const currentCompsCloned = JSON.parse(JSON.stringify(components));
    const currentWiresCloned = JSON.parse(JSON.stringify(wires));

    setHistory({
      past: [...history.past, { components: currentCompsCloned, wires: currentWiresCloned }],
      future: newFuture,
    });

    setComponents(JSON.parse(JSON.stringify(next.components)));
    setWires(JSON.parse(JSON.stringify(next.wires)));
    setSelection({ componentIds: [], wireIds: [] });
  }, [history, components, wires]);

  // Copy / Paste
  const copy = useCallback(() => {
    if (selection.componentIds.length === 0) return;
    const selComps = components.filter((c) => selection.componentIds.includes(c.id));
    const selWires = wires.filter(
      (w) =>
        selection.componentIds.includes(w.fromComponentId) &&
        selection.componentIds.includes(w.toComponentId)
    );
    setClipboard({ components: selComps, wires: selWires });
  }, [selection, components, wires]);

  const paste = useCallback(() => {
    if (!clipboard || clipboard.components.length === 0) return;
    recordHistory(components, wires);

    const idMap = new Map<string, string>();
    const newComps: CircuitComponent[] = [];

    clipboard.components.forEach((orig) => {
      const cloned = createComponent(orig.type, orig.x + 50, orig.y + 50, {
        inputCount: orig.inputCount,
        customGateId: orig.customGateId,
        name: orig.name,
        label: orig.label ? `${orig.label}_copy` : undefined,
        rotation: orig.rotation,
      });
      newComps.push(cloned);
      idMap.set(orig.id, cloned.id);
    });

    const newWires: Wire[] = [];
    clipboard.wires.forEach((w) => {
      if (idMap.has(w.fromComponentId) && idMap.has(w.toComponentId)) {
        newWires.push({
          id: `wire_${Date.now()}_${Math.random()}`,
          fromComponentId: idMap.get(w.fromComponentId)!,
          fromPortId: w.fromPortId,
          toComponentId: idMap.get(w.toComponentId)!,
          toPortId: w.toPortId,
        });
      }
    });

    setComponents((prev) => [...prev, ...newComps]);
    setWires((prev) => [...prev, ...newWires]);
    setSelection({ componentIds: newComps.map((c) => c.id), wireIds: newWires.map((w) => w.id) });
  }, [clipboard, components, wires, recordHistory]);

  // Custom IC Subcircuit Creation
  const createCustomGateFromSelection = useCallback(
    (name: string, description: string, color?: string): CustomGateDefinition | null => {
      if (selection.componentIds.length === 0) return null;

      const selComps = components.filter((c) => selection.componentIds.includes(c.id));
      const selWires = wires.filter(
        (w) =>
          selection.componentIds.includes(w.fromComponentId) &&
          selection.componentIds.includes(w.toComponentId)
      );

      // Find input components (switches/buttons) and output components (probes/leds)
      const inputNodes = selComps.filter((c) =>
        ['SWITCH', 'BUTTON', 'CONST_0', 'CONST_1'].includes(c.type)
      );
      const outputNodes = selComps.filter((c) => ['LED', 'PROBE'].includes(c.type));

      if (inputNodes.length === 0 || outputNodes.length === 0) {
        return null;
      }

      const customDef: CustomGateDefinition = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name,
        category: 'CUSTOM',
        description: description || 'Custom Modular IC Subcircuit',
        color: color || '#8b5cf6',
        inputPorts: inputNodes.map((inp, idx) => ({
          id: `in_${idx}`,
          name: inp.label || inp.name || `In${idx}`,
        })),
        outputPorts: outputNodes.map((out, idx) => ({
          id: `out_${idx}`,
          name: out.label || out.name || `Out${idx}`,
        })),
        components: selComps,
        wires: selWires,
      };

      setCustomGates((prev) => [...prev, customDef]);
      return customDef;
    },
    [selection, components, wires]
  );

  const loadPreset = useCallback(
    (preset: PresetCircuit) => {
      recordHistory(components, wires);
      setComponents(preset.components);
      setWires(preset.wires);
      setCircuitName(preset.name);
      setSelection({ componentIds: [], wireIds: [] });
      setCamera({ x: 0, y: 0, zoom: 1 });
      setActiveModal('none');
    },
    [components, wires, recordHistory]
  );

  const loadChallenge = useCallback((challenge: ChallengeDefinition) => {
    setActiveChallenge(challenge);
    if (challenge.starterCircuit) {
      setComponents((challenge.starterCircuit.components as CircuitComponent[]) || []);
      setWires((challenge.starterCircuit.wires as Wire[]) || []);
    } else {
      setComponents([]);
      setWires([]);
    }
    setCircuitName(challenge.title);
    setSelection({ componentIds: [], wireIds: [] });
    setCamera({ x: 0, y: 0, zoom: 1 });
    setActiveModal('none');
  }, []);

  const clearCanvas = useCallback(() => {
    recordHistory(components, wires);
    setComponents([]);
    setWires([]);
    setSelection({ componentIds: [], wireIds: [] });
    setCircuitName('New Circuit');
  }, [components, wires, recordHistory]);

  const fitToScreen = useCallback(() => {
    if (components.length === 0) {
      setCamera({ x: 0, y: 0, zoom: 1 });
      return;
    }
    const minX = Math.min(...components.map((c) => c.x));
    const maxX = Math.max(...components.map((c) => c.x + 100));
    const minY = Math.min(...components.map((c) => c.y));
    const maxY = Math.max(...components.map((c) => c.y + 80));

    const width = maxX - minX;
    const height = maxY - minY;
    const targetZoom = Math.min(1.2, Math.max(0.6, 600 / Math.max(width, height)));

    setCamera({
      x: -minX + 80,
      y: -minY + 80,
      zoom: targetZoom,
    });
  }, [components]);

  const exportJson = useCallback((): string => {
    const data: CircuitData = {
      version: '1.0.0',
      name: circuitName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      components,
      wires,
      customGates,
      camera,
    };
    return JSON.stringify(data, null, 2);
  }, [circuitName, components, wires, customGates, camera]);

  const importJson = useCallback(
    (jsonStr: string): boolean => {
      try {
        let rawData = JSON.parse(jsonStr);
        let comps: CircuitComponent[] = [];
        let circuitWires: Wire[] = [];
        let loadedGates: CustomGateDefinition[] = [];
        let name: string = circuitName;
        let loadedCamera = camera;

        if (Array.isArray(rawData)) {
          comps = rawData;
        } else if (rawData && typeof rawData === 'object') {
          if (rawData.circuit && Array.isArray(rawData.circuit.components)) {
            rawData = rawData.circuit;
          }
          if (Array.isArray(rawData.components)) {
            comps = rawData.components;
            circuitWires = Array.isArray(rawData.wires) ? rawData.wires : [];
            if (Array.isArray(rawData.customGates)) loadedGates = rawData.customGates;
            if (rawData.name && typeof rawData.name === 'string') name = rawData.name;
            if (rawData.camera && typeof rawData.camera.x === 'number') loadedCamera = rawData.camera;
          }
        }

        if (comps.length > 0 || circuitWires.length > 0) {
          recordHistory(components, wires);
          // Ensure every component has valid port definitions and positions
          const sanitizedComps = comps.map((c) => {
            if (!c.ports || c.ports.length === 0) {
              const generatedPorts = generateComponentPorts(c.type, c.inputCount || 2, undefined);
              return { ...c, ports: generatedPorts };
            }
            return c;
          });

          setComponents(sanitizedComps);
          setWires(circuitWires);
          if (loadedGates.length > 0) setCustomGates(loadedGates);
          if (name) setCircuitName(name);

          // If camera was provided, use it; otherwise compute bounding center
          if (rawData.camera) {
            setCamera(loadedCamera);
          } else if (sanitizedComps.length > 0) {
            const minX = Math.min(...sanitizedComps.map((c) => c.x));
            const maxX = Math.max(...sanitizedComps.map((c) => c.x + 100));
            const minY = Math.min(...sanitizedComps.map((c) => c.y));
            const maxY = Math.max(...sanitizedComps.map((c) => c.y + 60));
            const cX = (minX + maxX) / 2;
            const cY = (minY + maxY) / 2;
            setCamera({
              x: window.innerWidth / 2 - cX,
              y: window.innerHeight / 2 - cY,
              zoom: 1,
            });
          }

          setSelection({ componentIds: [], wireIds: [] });
          return true;
        }
      } catch (err) {
        console.error('Failed to parse circuit JSON:', err);
      }
      return false;
    },
    [components, wires, circuitName, camera, recordHistory]
  );

  const loadCircuitData = useCallback(
    (newComps: CircuitComponent[], newWires: Wire[], name?: string) => {
      recordHistory(components, wires);
      const sanitizedComps = newComps.map((c) => {
        if (!c.ports || c.ports.length === 0) {
          const generatedPorts = generateComponentPorts(c.type, c.inputCount || 2, undefined);
          return { ...c, ports: generatedPorts };
        }
        return c;
      });

      setComponents(sanitizedComps);
      setWires(newWires);
      if (name) setCircuitName(name);
      setSelection({ componentIds: [], wireIds: [] });

      // Automatically frame / fit camera to circuit
      if (sanitizedComps.length > 0) {
        const minX = Math.min(...sanitizedComps.map((c) => c.x));
        const maxX = Math.max(...sanitizedComps.map((c) => c.x + 100));
        const minY = Math.min(...sanitizedComps.map((c) => c.y));
        const maxY = Math.max(...sanitizedComps.map((c) => c.y + 60));
        const cX = (minX + maxX) / 2;
        const cY = (minY + maxY) / 2;
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
        setCamera({
          x: vw / 2 - cX,
          y: vh / 2 - cY,
          zoom: 1,
        });
      }
    },
    [components, wires, recordHistory]
  );

  const synthesizeAndLoadExpression = useCallback(
    (expr: string, mode: 'replace' | 'insert' = 'replace'): { success: boolean; error?: string } => {
      try {
        const ast = parseBooleanExpression(expr);
        const startX =
          mode === 'insert' && components.length > 0
            ? Math.max(...components.map((c) => c.x)) + 200
            : 100;
        const startY = 100;
        const { components: synthComps, wires: synthWires } = synthesizeCircuitFromAST(
          ast,
          'Y',
          startX,
          startY
        );

        if (mode === 'replace') {
          loadCircuitData(synthComps, synthWires, `Synthesized: ${expr}`);
        } else {
          recordHistory(components, wires);
          setComponents((prev) => [...prev, ...synthComps]);
          setWires((prev) => [...prev, ...synthWires]);
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Failed to synthesize expression' };
      }
    },
    [components, wires, recordHistory, loadCircuitData]
  );

  return (
    <CircuitContext.Provider
      value={{
        components,
        wires,
        customGates,
        selection,
        camera,
        simulationRunning,
        simulationSpeedHz,
        simulationState,
        activeTool,
        wireDraft,
        wireRoutingMode,
        theme,
        signalAnimation,
        snapToGrid,
        gridSize,
        timingHistory,
        activeModal,
        activeChallenge,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
        circuitName,
        sidebarOpen,
        inspectorOpen,

        setCamera,
        setSidebarOpen,
        setInspectorOpen,
        toggleSidebar,
        toggleInspector,
        setActiveTool,
        setActiveModal,
        setWireRoutingMode,
        setTheme,
        setSignalAnimation,
        setSnapToGrid,
        setSimulationSpeedHz,
        setCircuitName,

        addComponent,
        updateComponent,
        setComponentInputCount,
        deleteSelection,
        duplicateSelection,
        rotateSelection,
        flipSelection,
        lockSelection,
        selectComponent,
        selectWire,
        selectAllWires,
        deleteSelectedWires,
        clearSelection,
        setBoxSelection,

        startWireDraft,
        updateWireDraft,
        completeWireDraft,
        cancelWireDraft,
        removeWire,

        toggleSwitch,
        pressButton,
        triggerPulse,
        applyInputValues,

        stepSimulation,
        toggleSimulation,
        resetSimulation,

        undo,
        redo,
        recordHistorySnapshot,
        copy,
        paste,

        createCustomGateFromSelection,
        loadPreset,
        loadChallenge,
        clearCanvas,
        fitToScreen,
        exportJson,
        importJson,
        synthesizeAndLoadExpression,
        loadCircuitData,
      }}
    >
      {children}
    </CircuitContext.Provider>
  );
};

export const useCircuit = (): CircuitContextType => {
  const ctx = useContext(CircuitContext);
  if (!ctx) {
    throw new Error('useCircuit must be used within a CircuitProvider');
  }
  return ctx;
};
