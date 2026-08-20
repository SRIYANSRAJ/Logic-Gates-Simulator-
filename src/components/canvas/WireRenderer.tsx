/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CircuitComponent, LogicState, Wire, WirePoint } from '../../types/circuit';

interface WireRendererProps {
  wire: Wire;
  fromComponent: CircuitComponent;
  toComponent: CircuitComponent;
  state: LogicState;
  isSelected: boolean;
  routingMode: 'orthogonal' | 'curved' | 'straight';
  signalAnimation: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onBranchWire?: (pos: { x: number; y: number }) => void;
}

export const WireRenderer: React.FC<WireRendererProps> = ({
  wire,
  fromComponent,
  toComponent,
  state,
  isSelected,
  routingMode,
  signalAnimation,
  onSelect,
  onDelete,
  onBranchWire,
}) => {
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
      const dx = Math.abs(end.x - start.x) * 0.5;
      return `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`;
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

  // Color coding based on digital state
  let strokeColor = '#475569'; // 0 / Low: dark slate
  let glowColor = 'none';

  if (state === 1) {
    strokeColor = '#10b981'; // 1 / High: vibrant emerald
    glowColor = 'rgba(16, 185, 129, 0.4)';
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
      {/* Invisible thick stroke for easier clicking, hovering and branching */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={18}
        className="pointer-events-auto"
        onClick={onSelect}
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
          strokeWidth={6}
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
        strokeWidth={isSelected ? 3.5 : 2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-colors duration-150 pointer-events-none"
      />

      {/* Flowing animated signal dashes for HIGH state */}
      {state === 1 && signalAnimation && (
        <path
          d={pathD}
          fill="none"
          stroke="#a7f3d0"
          strokeWidth={2}
          strokeDasharray="6, 8"
          strokeLinecap="round"
          className="animate-wire-flow pointer-events-none"
        />
      )}

      {/* Floating Action Controls on Selected Wire: Branch Wire */}
      {isSelected && (
        <g transform={`translate(${midPoint.x}, ${midPoint.y})`} className="select-none">
          {/* Branch Wire Button (+) */}
          <g
            className="cursor-pointer group/branch"
            onClick={(e) => {
              e.stopPropagation();
              onBranchWire?.(midPoint);
            }}
          >
            <circle cx={0} cy={0} r={12} fill="#10b981" className="group-hover/branch:fill-emerald-600 transition-colors shadow-xl" />
            <text
              x={0}
              y={4.5}
              textAnchor="middle"
              fill="#ffffff"
              fontSize={14}
              fontWeight="bold"
              className="pointer-events-none"
            >
              +
            </text>
          </g>
        </g>
      )}
    </g>
  );
};
