/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useCircuit } from '../../context/CircuitContext';
import { CircuitComponent, Port, Wire } from '../../types/circuit';
import { ComponentRenderer } from './ComponentRenderer';
import { WireRenderer } from './WireRenderer';
import { THEME_PRESETS } from '../../theme/themes';
import {
  Grid,
  Maximize2,
  Menu,
  Plus,
  Redo2,
  Sliders,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

export const Canvas: React.FC = () => {
  const {
    theme,
    components,
    wires,
    selection,
    camera,
    setCamera,
    simulationState,
    activeTool,
    wireDraft,
    wireRoutingMode,
    signalAnimation,
    snapToGrid,
    setSnapToGrid,
    gridSize,
    selectComponent,
    selectWire,
    selectAllWires,
    deleteSelectedWires,
    clearSelection,
    setBoxSelection,
    updateComponent,
    startWireDraft,
    updateWireDraft,
    completeWireDraft,
    cancelWireDraft,
    removeWire,
    deleteSelection,
    duplicateSelection,
    rotateSelection,
    flipSelection,
    toggleSwitch,
    pressButton,
    triggerPulse,
    undo,
    redo,
    canUndo,
    canRedo,
    recordHistorySnapshot,
    copy,
    paste,
    setComponentInputCount,
    fitToScreen,
    importJson,
    sidebarOpen,
    toggleSidebar,
    inspectorOpen,
    setInspectorOpen,
    toggleInspector,
  } = useCircuit();

  const activeTheme = THEME_PRESETS[theme] || THEME_PRESETS.emerald;

  const containerRef = useRef<HTMLDivElement>(null);

  // Interaction State (Mouse & Touch)
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingCompId, setDraggingCompId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragInitialPositions, setDragInitialPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const preDragSnapshotRef = useRef<{ components: CircuitComponent[]; wires: Wire[] } | null>(null);

  // Multi-Touch & Pinch-to-Zoom State for Tablets
  const touchStateRef = useRef<{
    initialDistance: number;
    initialCenter: { x: number; y: number };
    initialCamera: { x: number; y: number; zoom: number };
    lastTouchPos: { x: number; y: number };
    startPos: { x: number; y: number };
    hasMoved: boolean;
    isPinching: boolean;
    wireDraftStartedThisTouch: boolean;
  }>({
    initialDistance: 0,
    initialCenter: { x: 0, y: 0 },
    initialCamera: { x: 0, y: 0, zoom: 1 },
    lastTouchPos: { x: 0, y: 0 },
    startPos: { x: 0, y: 0 },
    hasMoved: false,
    isPinching: false,
    wireDraftStartedThisTouch: false,
  });

  // Box Marquee Selection
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);
  const [boxStart, setBoxStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [boxCurrent, setBoxCurrent] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Context menu for variable inputs
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    componentId: string;
  } | null>(null);

  // Coordinate conversion helpers
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const x = (screenX - rect.left - camera.x) / camera.zoom;
      const y = (screenY - rect.top - camera.y) / camera.zoom;
      return { x, y };
    },
    [camera]
  );

  // 1. Mouse Wheel Zoom (centered around pointer)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    const newZoom = Math.min(2.5, Math.max(0.3, camera.zoom * zoomFactor));

    const newX = mouseX - (mouseX - camera.x) * (newZoom / camera.zoom);
    const newY = mouseY - (mouseY - camera.y) * (newZoom / camera.zoom);

    setCamera({ x: newX, y: newY, zoom: newZoom });
  };

  // 2. Global Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copy();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        paste();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelection();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setBoxSelection(
          components.map((c) => c.id),
          wires.map((w) => w.id)
        );
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelection();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        rotateSelection();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        flipSelection();
      } else if (e.key === 'Escape') {
        cancelWireDraft();
        clearSelection();
        setContextMenu(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    undo,
    redo,
    copy,
    paste,
    duplicateSelection,
    deleteSelection,
    rotateSelection,
    flipSelection,
    cancelWireDraft,
    clearSelection,
    components,
    wires,
    setBoxSelection,
  ]);

  // 3. Mouse Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (contextMenu) setContextMenu(null);

    // Middle click or Pan tool -> Start Panning
    if (e.button === 1 || activeTool === 'pan' || e.spaceKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - camera.x, y: e.clientY - camera.y });
      return;
    }

    // Right Click -> Cancel/unlock wire drafting immediately
    if (e.button === 2) {
      if (wireDraft) {
        e.preventDefault();
        e.stopPropagation();
        cancelWireDraft();
        return;
      }
    }

    if (e.button === 0) {
      // If clicking on empty canvas while drafting wire, cancel it
      if (wireDraft) {
        cancelWireDraft();
        return;
      }

      // Left click on canvas background: start Box Marquee Selection
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setIsBoxSelecting(true);
      setBoxStart(canvasPos);
      setBoxCurrent(canvasPos);

      if (!e.shiftKey) {
        clearSelection();
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setCamera((prev) => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
      return;
    }

    const canvasPos = screenToCanvas(e.clientX, e.clientY);

    if (wireDraft) {
      updateWireDraft(canvasPos.x, canvasPos.y);
      return;
    }

    if (isBoxSelecting) {
      setBoxCurrent(canvasPos);
      return;
    }

    if (draggingCompId) {
      const deltaX = canvasPos.x - dragOffset.x;
      const deltaY = canvasPos.y - dragOffset.y;

      dragInitialPositions.forEach((initPos, id) => {
        let newX = initPos.x + deltaX;
        let newY = initPos.y + deltaY;

        if (snapToGrid) {
          newX = Math.round(newX / gridSize) * gridSize;
          newY = Math.round(newY / gridSize) * gridSize;
        }

        updateComponent(id, { x: newX, y: newY });
      });
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }

    if (wireDraft) {
      // Check if user was dragging wire (distance > 8px from startPos)
      const dx = wireDraft.currentX - wireDraft.startPos.x;
      const dy = wireDraft.currentY - wireDraft.startPos.y;
      if (Math.hypot(dx, dy) > 8) {
        // Find nearest port on another component within 30px
        let targetConnection: { compId: string; portId: string } | null = null;
        let minDistance = 30;

        components.forEach((comp) => {
          if (comp.id === wireDraft.fromCompId) return;
          comp.ports.forEach((p) => {
            const portWorldX = comp.x + p.relativePosition.x;
            const portWorldY = comp.y + p.relativePosition.y;
            const dist = Math.hypot(wireDraft.currentX - portWorldX, wireDraft.currentY - portWorldY);
            if (dist < minDistance) {
              minDistance = dist;
              targetConnection = { compId: comp.id, portId: p.id };
            }
          });
        });

        if (targetConnection) {
          completeWireDraft(targetConnection.compId, targetConnection.portId);
        }
      }
    }

    if (draggingCompId) {
      let hasMoved = false;
      dragInitialPositions.forEach((initPos, id) => {
        const curComp = components.find((c) => c.id === id);
        if (curComp && (curComp.x !== initPos.x || curComp.y !== initPos.y)) {
          hasMoved = true;
        }
      });

      if (hasMoved && preDragSnapshotRef.current) {
        recordHistorySnapshot(
          preDragSnapshotRef.current.components,
          preDragSnapshotRef.current.wires
        );
      }

      setDraggingCompId(null);
      setDragInitialPositions(new Map());
      preDragSnapshotRef.current = null;
    }

    if (isBoxSelecting) {
      setIsBoxSelecting(false);
      const minX = Math.min(boxStart.x, boxCurrent.x);
      const maxX = Math.max(boxStart.x, boxCurrent.x);
      const minY = Math.min(boxStart.y, boxCurrent.y);
      const maxY = Math.max(boxStart.y, boxCurrent.y);

      if (maxX - minX > 5 || maxY - minY > 5) {
        const selectedCompIds = components
          .filter((c) => c.x + 40 >= minX && c.x <= maxX && c.y + 40 >= minY && c.y <= maxY)
          .map((c) => c.id);

        const selectedWireIds = wires
          .filter((w) => selectedCompIds.includes(w.fromComponentId) && selectedCompIds.includes(w.toComponentId))
          .map((w) => w.id);

        setBoxSelection(selectedCompIds, selectedWireIds);
      }
    }
  };

  // Component Drag Start (Mouse)
  const handleComponentMouseDown = (e: React.MouseEvent, comp: CircuitComponent) => {
    e.stopPropagation();
    if (comp.locked) return;

    preDragSnapshotRef.current = {
      components: JSON.parse(JSON.stringify(components)),
      wires: JSON.parse(JSON.stringify(wires)),
    };

    const isAlreadySelected = selection.componentIds.includes(comp.id);
    if (!isAlreadySelected) {
      selectComponent(comp.id, e.shiftKey);
    }

    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setDraggingCompId(comp.id);
    setDragOffset(canvasPos);

    const activeSelectedIds = isAlreadySelected
      ? selection.componentIds
      : e.shiftKey
      ? [...selection.componentIds, comp.id]
      : [comp.id];

    const initMap = new Map<string, { x: number; y: number }>();
    activeSelectedIds.forEach((id) => {
      const c = components.find((item) => item.id === id);
      if (c) initMap.set(id, { x: c.x, y: c.y });
    });
    setDragInitialPositions(initMap);
  };

  // Port Wire Connection (Mouse Click & Drag)
  const handlePortMouseDown = (e: React.MouseEvent, comp: CircuitComponent, port: Port) => {
    e.stopPropagation();

    if (wireDraft) {
      if (wireDraft.fromCompId !== comp.id) {
        completeWireDraft(comp.id, port.id);
      } else {
        cancelWireDraft();
      }
      return;
    }

    // Start wire draft from ANY port (input OR output)
    const startX = comp.x + port.relativePosition.x;
    const startY = comp.y + port.relativePosition.y;
    startWireDraft(comp.id, port.id, { x: startX, y: startY });
  };

  const handlePortMouseUp = (e: React.MouseEvent, comp: CircuitComponent, port: Port) => {
    e.stopPropagation();
    if (wireDraft && wireDraft.fromCompId !== comp.id) {
      completeWireDraft(comp.id, port.id);
    }
  };

  // =========================================================================
  // 4. TOUCH-SPECIFIC INTERACTION LAYER (Tablets, iPad, Mobile)
  // =========================================================================

  const handleTouchStart = (e: React.TouchEvent) => {
    if (contextMenu) setContextMenu(null);

    // Two-Finger Gesture: Pinch-to-Zoom and Multi-Touch Pan
    if (e.touches.length === 2) {
      e.preventDefault();
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      const center = {
        x: (t0.clientX + t1.clientX) / 2,
        y: (t0.clientY + t1.clientY) / 2,
      };

      touchStateRef.current = {
        initialDistance: dist,
        initialCenter: center,
        initialCamera: { ...camera },
        lastTouchPos: center,
        startPos: center,
        hasMoved: false,
        isPinching: true,
        wireDraftStartedThisTouch: false,
      };

      // Cancel any ongoing 1-finger component drag
      if (draggingCompId) {
        setDraggingCompId(null);
      }
      return;
    }

    // One-Finger Background Touch: Start Canvas Pan
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStateRef.current.lastTouchPos = { x: touch.clientX, y: touch.clientY };
      touchStateRef.current.startPos = { x: touch.clientX, y: touch.clientY };
      touchStateRef.current.hasMoved = false;
      touchStateRef.current.wireDraftStartedThisTouch = false;
      touchStateRef.current.isPinching = false;

      // Start background pan if not touching a component/port
      if (!draggingCompId && !wireDraft) {
        setIsPanning(true);
        setPanStart({ x: touch.clientX - camera.x, y: touch.clientY - camera.y });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // 1. Two-Finger Pinch-to-Zoom + Pan
    if (e.touches.length === 2 && touchStateRef.current.isPinching) {
      e.preventDefault();
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      const currentCenter = {
        x: (t0.clientX + t1.clientX) / 2,
        y: (t0.clientY + t1.clientY) / 2,
      };

      const { initialDistance, initialCenter, initialCamera } = touchStateRef.current;
      if (initialDistance > 0 && containerRef.current) {
        const scaleFactor = currentDist / initialDistance;
        const newZoom = Math.min(2.5, Math.max(0.3, initialCamera.zoom * scaleFactor));

        const rect = containerRef.current.getBoundingClientRect();
        const midX = initialCenter.x - rect.left;
        const midY = initialCenter.y - rect.top;

        // Position in world canvas space at initial pinch center
        const worldX = (midX - initialCamera.x) / initialCamera.zoom;
        const worldY = (midY - initialCamera.y) / initialCamera.zoom;

        // Apply new zoom and pan delta
        const panDeltaX = currentCenter.x - initialCenter.x;
        const panDeltaY = currentCenter.y - initialCenter.y;

        const newX = midX - worldX * newZoom + panDeltaX;
        const newY = midY - worldY * newZoom + panDeltaY;

        setCamera({ x: newX, y: newY, zoom: newZoom });
      }
      return;
    }

    // 2. One-Finger Touch Interactions
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const dist = Math.hypot(
        touch.clientX - touchStateRef.current.startPos.x,
        touch.clientY - touchStateRef.current.startPos.y
      );
      if (dist > 8) {
        touchStateRef.current.hasMoved = true;
      }
      touchStateRef.current.lastTouchPos = { x: touch.clientX, y: touch.clientY };
      const canvasPos = screenToCanvas(touch.clientX, touch.clientY);

      // A. Wire Drafting
      if (wireDraft) {
        e.preventDefault();
        updateWireDraft(canvasPos.x, canvasPos.y);
        return;
      }

      // B. Component Touch Dragging
      if (draggingCompId) {
        e.preventDefault();
        const deltaX = canvasPos.x - dragOffset.x;
        const deltaY = canvasPos.y - dragOffset.y;

        dragInitialPositions.forEach((initPos, id) => {
          let newX = initPos.x + deltaX;
          let newY = initPos.y + deltaY;

          if (snapToGrid) {
            newX = Math.round(newX / gridSize) * gridSize;
            newY = Math.round(newY / gridSize) * gridSize;
          }

          updateComponent(id, { x: newX, y: newY });
        });
        return;
      }

      // C. Background Canvas Panning
      if (isPanning) {
        setCamera((prev) => ({
          ...prev,
          x: touch.clientX - panStart.x,
          y: touch.clientY - panStart.y,
        }));
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // If pinch ends
    if (touchStateRef.current.isPinching && e.touches.length < 2) {
      touchStateRef.current.isPinching = false;
    }

    if (isPanning) {
      setIsPanning(false);
    }

    // Wire Draft Completion via Touch Release (Detect input port under finger)
    if (wireDraft) {
      if (touchStateRef.current.hasMoved) {
        const lastTouch = touchStateRef.current.lastTouchPos;
        const canvasReleasePos = screenToCanvas(lastTouch.x, lastTouch.y);

        // Find nearest port within generous touch tolerance threshold (45px)
        let targetConnection: { compId: string; portId: string } | null = null;
        let minDistance = 45;

        components.forEach((comp) => {
          if (comp.id === wireDraft.fromCompId) return; // Prevent self-loop
          comp.ports.forEach((port) => {
            const portWorldX = comp.x + port.relativePosition.x;
            const portWorldY = comp.y + port.relativePosition.y;
            const dist = Math.hypot(canvasReleasePos.x - portWorldX, canvasReleasePos.y - portWorldY);
            if (dist < minDistance) {
              minDistance = dist;
              targetConnection = { compId: comp.id, portId: port.id };
            }
          });
        });

        if (targetConnection) {
          completeWireDraft(targetConnection.compId, targetConnection.portId);
        } else {
          cancelWireDraft();
        }
      } else {
        // Tapped without moving. If this touch just started the draft, don't cancel it!
        // This enables 2-tap wiring (tap output, then tap input).
        if (touchStateRef.current.wireDraftStartedThisTouch) {
          touchStateRef.current.wireDraftStartedThisTouch = false;
        } else {
          cancelWireDraft();
        }
      }
    }

    // Component Drag Finish via Touch
    if (draggingCompId) {
      let hasMoved = false;
      dragInitialPositions.forEach((initPos, id) => {
        const curComp = components.find((c) => c.id === id);
        if (curComp && (curComp.x !== initPos.x || curComp.y !== initPos.y)) {
          hasMoved = true;
        }
      });

      if (hasMoved && preDragSnapshotRef.current) {
        recordHistorySnapshot(
          preDragSnapshotRef.current.components,
          preDragSnapshotRef.current.wires
        );
      }

      setDraggingCompId(null);
      setDragInitialPositions(new Map());
      preDragSnapshotRef.current = null;
    }
  };

  // Component Drag Start via Touch
  const handleComponentTouchStart = (e: React.TouchEvent, comp: CircuitComponent) => {
    e.stopPropagation();
    if (comp.locked || e.touches.length > 1) return;

    preDragSnapshotRef.current = {
      components: JSON.parse(JSON.stringify(components)),
      wires: JSON.parse(JSON.stringify(wires)),
    };

    const isAlreadySelected = selection.componentIds.includes(comp.id);
    if (!isAlreadySelected) {
      selectComponent(comp.id, false);
    }

    const touch = e.touches[0];
    const canvasPos = screenToCanvas(touch.clientX, touch.clientY);
    
    touchStateRef.current.lastTouchPos = { x: touch.clientX, y: touch.clientY };
    touchStateRef.current.startPos = { x: touch.clientX, y: touch.clientY };
    touchStateRef.current.hasMoved = false;

    setDraggingCompId(comp.id);
    setDragOffset(canvasPos);

    const activeSelectedIds = isAlreadySelected ? selection.componentIds : [comp.id];
    const initMap = new Map<string, { x: number; y: number }>();
    activeSelectedIds.forEach((id) => {
      const c = components.find((item) => item.id === id);
      if (c) initMap.set(id, { x: c.x, y: c.y });
    });
    setDragInitialPositions(initMap);
  };

  // Port Wire Draft Start via Touch
  const handlePortTouchStart = (e: React.TouchEvent, comp: CircuitComponent, port: Port) => {
    e.stopPropagation();
    if (e.touches.length > 1) return;

    const touch = e.touches[0];
    touchStateRef.current.lastTouchPos = { x: touch.clientX, y: touch.clientY };
    touchStateRef.current.startPos = { x: touch.clientX, y: touch.clientY };
    touchStateRef.current.hasMoved = false;

    if (wireDraft) {
      if (port.type === 'input') {
        completeWireDraft(comp.id, port.id);
      } else {
        cancelWireDraft();
      }
      return;
    }

    if (port.type === 'output') {
      const startX = comp.x + port.relativePosition.x;
      const startY = comp.y + port.relativePosition.y;
      startWireDraft(comp.id, port.id, { x: startX, y: startY });
      touchStateRef.current.wireDraftStartedThisTouch = true;
    }
  };

  // Context Menu Handler
  const handleContextMenu = (e: React.MouseEvent, compId?: string) => {
    e.preventDefault();
    if (wireDraft) {
      cancelWireDraft();
      return;
    }
    if (compId) {
      setContextMenu({ x: e.clientX, y: e.clientY, componentId: compId });
    }
  };

  // Quick Zoom Helper
  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    if (direction === 'reset') {
      fitToScreen();
      return;
    }
    const factor = direction === 'in' ? 1.25 : 0.8;
    const newZoom = Math.min(2.5, Math.max(0.3, camera.zoom * factor));
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const newX = centerX - (centerX - camera.x) * (newZoom / camera.zoom);
      const newY = centerY - (centerY - camera.y) * (newZoom / camera.zoom);
      setCamera({ x: newX, y: newY, zoom: newZoom });
    }
  };

  // Drag and Drop File Import Handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.json') || file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          if (text) {
            importJson(text);
          }
        };
        reader.readAsText(file);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      id="circuit-canvas-container"
      style={{ backgroundColor: activeTheme.canvasBg }}
      className="relative w-full h-full overflow-hidden select-none cursor-default touch-none transition-colors duration-300"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onContextMenu={(e) => handleContextMenu(e)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Background SVG Grid */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <pattern
            id="grid-dots"
            width={gridSize * camera.zoom}
            height={gridSize * camera.zoom}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${camera.x % (gridSize * camera.zoom)}, ${
              camera.y % (gridSize * camera.zoom)
            })`}
          >
            <circle cx={1.5} cy={1.5} r={1.2} fill={activeTheme.gridDotColor} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-dots)" />
      </svg>

      {/* Main World Space SVG */}
      <svg className="absolute inset-0 w-full h-full overflow-visible">
        <g transform={`translate(${camera.x}, ${camera.y}) scale(${camera.zoom})`}>
          {/* 1. Render All Connected Circuit Wires */}
          {wires.map((wire) => {
            const fromComp = components.find((c) => c.id === wire.fromComponentId);
            const toComp = components.find((c) => c.id === wire.toComponentId);
            if (!fromComp || !toComp) return null;

            const wireVal = simulationState.wireValues[wire.id] ?? 0;
            const isSelected = selection.wireIds.includes(wire.id);

            return (
              <WireRenderer
                key={wire.id}
                wire={wire}
                fromComponent={fromComp}
                toComponent={toComp}
                state={wireVal}
                isSelected={isSelected}
                routingMode={wireRoutingMode}
                signalAnimation={signalAnimation}
                onSelect={(e) => {
                  e.stopPropagation();
                  selectWire(wire.id, e.shiftKey);
                }}
                onDelete={() => removeWire(wire.id)}
                onBranchWire={(pos) => {
                  startWireDraft(wire.fromComponentId, wire.fromPortId, pos);
                }}
              />
            );
          })}

          {/* 2. Active Wire Drafting Line */}
          {wireDraft && (
            <path
              d={
                wireRoutingMode === 'straight'
                  ? `M ${wireDraft.startPos.x} ${wireDraft.startPos.y} L ${wireDraft.currentX} ${wireDraft.currentY}`
                  : `M ${wireDraft.startPos.x} ${wireDraft.startPos.y} L ${(wireDraft.startPos.x + wireDraft.currentX) / 2} ${wireDraft.startPos.y} L ${(wireDraft.startPos.x + wireDraft.currentX) / 2} ${wireDraft.currentY} L ${wireDraft.currentX} ${wireDraft.currentY}`
              }
              fill="none"
              stroke="#60a5fa"
              strokeWidth={3}
              strokeDasharray="4, 4"
              className="pointer-events-none"
            />
          )}

          {/* 3. Render All Circuit Components */}
          {components.map((comp) => {
            const isSelected = selection.componentIds.includes(comp.id);
            const portVals = simulationState.portValues[comp.id] || {};

            return (
              <g key={comp.id} onContextMenu={(e) => handleContextMenu(e, comp.id)}>
                <ComponentRenderer
                  component={comp}
                  portValues={portVals}
                  isSelected={isSelected}
                  onMouseDown={(e) => handleComponentMouseDown(e, comp)}
                  onTouchStart={(e) => handleComponentTouchStart(e, comp)}
                  onPortMouseDown={(e, port) => handlePortMouseDown(e, comp, port)}
                  onPortMouseUp={(e, port) => handlePortMouseUp(e, comp, port)}
                  onPortTouchStart={(e, port) => handlePortTouchStart(e, comp, port)}
                  onToggleSwitch={() => toggleSwitch(comp.id)}
                  onPressButton={(pressed) => pressButton(comp.id, pressed)}
                  onTriggerPulse={() => triggerPulse(comp.id)}
                />
              </g>
            );
          })}

          {/* 4. Box Marquee Selection Rectangle */}
          {isBoxSelecting && (
            <rect
              x={Math.min(boxStart.x, boxCurrent.x)}
              y={Math.min(boxStart.y, boxCurrent.y)}
              width={Math.abs(boxCurrent.x - boxStart.x)}
              height={Math.abs(boxCurrent.y - boxStart.y)}
              fill="rgba(59, 130, 246, 0.15)"
              stroke="#3b82f6"
              strokeWidth={1.5}
              strokeDasharray="4, 4"
              className="pointer-events-none"
            />
          )}
        </g>
      </svg>

      {/* Touch-Friendly Floating Canvas Ergonomics Toolbar (Bottom Center / Left) */}
      <div className="absolute bottom-4 left-4 z-30 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800/90 p-1.5 rounded-xl shadow-2xl">
        {/* Toggle Library Drawer Button on Mobile/Tablet */}
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-lg text-xs font-bold transition-all shadow-sm"
            title="Open Component Library"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Gate</span>
          </button>
        )}

        <div className="flex items-center bg-slate-950/60 rounded-lg p-0.5 border border-slate-800/80">
          <button
            onClick={() => handleZoom('in')}
            className="p-2 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 rounded-md transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-400 px-1.5 font-bold min-w-10 text-center">
            {Math.round(camera.zoom * 100)}%
          </span>
          <button
            onClick={() => handleZoom('out')}
            className="p-2 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 rounded-md transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom('reset')}
            className="p-2 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 rounded-md transition-colors"
            title="Fit to Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Snap to Grid Toggle */}
        <button
          onClick={() => setSnapToGrid(!snapToGrid)}
          className={`p-2 rounded-lg border transition-colors ${
            snapToGrid
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle Grid Snapping"
        >
          <Grid className="w-4 h-4" />
        </button>

        {/* Undo / Redo Touch Buttons */}
        <div className="flex items-center bg-slate-950/60 rounded-lg p-0.5 border border-slate-800/80">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-2 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 disabled:opacity-30 rounded-md transition-colors"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-2 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 disabled:opacity-30 rounded-md transition-colors"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Toggle Inspector Drawer Button on Mobile/Tablet */}
        {!inspectorOpen && (
          <button
            onClick={toggleInspector}
            className="p-2 bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 text-slate-300 hover:text-emerald-400 rounded-lg transition-colors"
            title="Open Inspector Properties"
          >
            <Sliders className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Context Menu for Variable Inputs */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-[#1e293b] border border-slate-700 rounded-lg shadow-xl p-1 text-sm text-slate-200"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 border-b border-slate-700/60">
            Configure Gate
          </div>
          <div className="py-1">
            {[2, 3, 4, 8].map((num) => (
              <button
                key={num}
                onClick={() => {
                  setComponentInputCount(contextMenu.componentId, num);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-emerald-600/20 hover:text-emerald-400 rounded transition-colors flex items-center justify-between"
              >
                <span>{num} Inputs</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
