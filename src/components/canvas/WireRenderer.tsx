/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CircuitComponent, LogicState, Wire } from '../../types/circuit';
import { useCircuit } from '../../context/CircuitContext';
import { THEME_PRESETS } from '../../theme/themes';

interface WireRendererProps {
  wire: Wire;
  fromComponent: CircuitComponent;
  toComponent: CircuitComponent;
  state: LogicState;
  isSelected: boolean;
  routingMode: 'orthogonal' | 'curved' | 'straight';
  signalAnimation: boolean;
  hasBranches?: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onBranchWire?: (pos: { x: number; y: number }) => void;
  onStartWireBranch?: (e: React.MouseEvent | React.TouchEvent, pos: { x: number; y: number }) => void;
}

export const WireRenderer: React.FC<WireRendererProps> = ({
  wire,
  fromComponent,
  toComponent,
  state,
  isSelected,
  routingMode,
  signalAnimation,
  hasBranches,
  onSelect,
  onDelete,
  onBranchWire,
  onStartWireBranch,
}) => {
  const { theme, wireDraft } = useCircuit();
  const activeTheme = THEME_PRESETS[theme] || THEME_PRESETS.emerald;

  // Find ports
  const fromPort = fromComponent.ports.find((p) => p.id === wire.fromPortId);
  const toPort = toComponent.ports.find((p) => p.id === wire.toPortId);

  if (!fromPort || !toPort) return null;

  // Calculate actual canvas coordinates for fromPort and toPort (accounting for rotation)
  const getPortCanvasPos = (comp: CircuitComponent, port: { relativePosition: { x: number; y: number } }) => {
    const cx = comp.x + (comp.flipped ? -port.relativePosition.x : port.relativePosition.x);
    const cy = comp.y + port.relativePosition.y;
    return { x: cx, y: cy };
  };

  const start = getPortCanvasPos(fromComponent, fromPort);
  const end = getPortCanvasPos(toComponent, toPort);
  const midPoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };

  // Generate SVG path string based on routing mode
  const generatePath = (): string => {
    if (routingMode === 'straight') {
      return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
    }

    if (routingMode === 'curved') {
      if (end.x > start.x + 15) {
        // Forward stylish cubic bezier curve
        const dx = Math.max(Math.abs(end.x - start.x) * 0.52, 35);
        return `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`;
      } else {
        // Smooth loop-back bezier curve
        const dy = end.y - start.y;
        const loopRadius = Math.max(Math.abs(dy) * 0.35, 45);
        const loopY = dy >= 0 ? start.y - loopRadius : start.y + loopRadius;
        return `M ${start.x} ${start.y} C ${start.x + 50} ${start.y}, ${start.x + 50} ${loopY}, ${(start.x + end.x) / 2} ${loopY} C ${end.x - 50} ${loopY}, ${end.x - 50} ${end.y}, ${end.x} ${end.y}`;
      }
    }

    // Default Orthogonal routing (Manhattan with smooth middle junction)
    const midX = (start.x + end.x) / 2;
    if (end.x > start.x + 20) {
      return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
    } else {
      // Loop back routing
      const offsetY = start.y < end.y ? 40 : -40;
      return `M ${start.x} ${start.y} L ${start.x + 25} ${start.y} L ${start.x + 25} ${start.y + offsetY} L ${end.x - 25} ${start.y + offsetY} L ${end.x - 25} ${end.y} L ${end.x} ${end.y}`;
    }
  };

  const pathD = generatePath();

  // Color coding based on digital state and active theme
  let strokeColor = activeTheme.wireLowColor || '#334155'; // 0 / Low: theme low color
  let glowColor = 'none';

  if (state === 1) {
    strokeColor = activeTheme.wireHighColor; // Vibrant theme high color
    glowColor = activeTheme.wireGlowColor;
  } else if (state === 'Z') {
    strokeColor = '#d97706'; // High-Z: amber
  } else if (state === 'X') {
    strokeColor = '#ef4444'; // Error / Conflict: crimson
    glowColor = 'rgba(239, 68, 68, 0.5)';
  }

  if (isSelected) {
    strokeColor = '#60a5fa'; // Blue selection
  }

  return (
    <g className="cursor-pointer group">
      {/* Invisible thick stroke for easy wire selecting, hovering, dragging, and branching */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="pointer-events-auto"
        onClick={onSelect}
        onMouseDown={(e) => {
          if (!wireDraft && e.button === 0 && onStartWireBranch) {
            onStartWireBranch(e, midPoint);
          }
        }}
        onTouchStart={(e) => {
          if (!wireDraft && onStartWireBranch) {
            onStartWireBranch(e, midPoint);
          }
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onBranchWire?.(midPoint);
        }}
      />

      {/* Glow shadow for HIGH state */}
      {state === 1 && (
        <path
          d={pathD}
          fill="none"
          stroke={glowColor}
          strokeWidth={6.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none"
        />
      )}

      {/* Base wire stroke */}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={isSelected ? 3.5 : 2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-colors duration-150 pointer-events-none"
      />

      {/* Flowing animated signal dashes for HIGH state */}
      {state === 1 && signalAnimation && (
        <path
          d={pathD}
          fill="none"
          stroke={activeTheme.secondaryColor}
          strokeWidth={2}
          strokeDasharray="6, 8"
          strokeLinecap="round"
          className="animate-wire-flow pointer-events-none"
        />
      )}

      {/* Electrical Schematic Junction Solder Dot (rendered when multiple wires branch from source) */}
      {hasBranches && (
        <circle
          cx={start.x + 10}
          cy={start.y}
          r={3.8}
          fill={strokeColor}
          stroke="#0f172a"
          strokeWidth={1.5}
          className="pointer-events-none transition-colors duration-150"
        />
      )}

      {/* Wire Branch Hover Node Indicator (allows visual tapping into wire) */}
      <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block">
        <circle
          cx={midPoint.x}
          cy={midPoint.y}
          r={5}
          fill="#3b82f6"
          stroke="#ffffff"
          strokeWidth={1.5}
        />
      </g>
    </g>
  );
};
