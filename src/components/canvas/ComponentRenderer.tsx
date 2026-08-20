/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CircuitComponent, LogicState, Port } from '../../types/circuit';
import { COMPONENT_METADATA } from '../../engine/componentFactory';
import { useCircuit } from '../../context/CircuitContext';
import { THEME_PRESETS } from '../../theme/themes';

interface ComponentRendererProps {
  component: CircuitComponent;
  portValues: Record<string, LogicState>;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onPortMouseDown: (e: React.MouseEvent, port: Port) => void;
  onPortTouchStart?: (e: React.TouchEvent, port: Port) => void;
  onToggleSwitch?: (e: React.MouseEvent | React.TouchEvent) => void;
  onPressButton?: (pressed: boolean) => void;
  onTriggerPulse?: (e: React.MouseEvent | React.TouchEvent) => void;
}

export const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  component,
  portValues,
  isSelected,
  onMouseDown,
  onTouchStart,
  onPortMouseDown,
  onPortTouchStart,
  onToggleSwitch,
  onPressButton,
  onTriggerPulse,
}) => {
  const { theme } = useCircuit();
  const activeTheme = THEME_PRESETS[theme] || THEME_PRESETS.emerald;

  const meta = COMPONENT_METADATA[component.type] || COMPONENT_METADATA.AND;
  const width = meta.width;
  const height = Math.max(meta.height, component.inputCount > 2 ? component.inputCount * 22 + 16 : meta.height);

  const isFlipped = component.flipped;
  const rotation = component.rotation || 0;

  // Determine if this gate or asset is actively asserting / outputting a TRUE (1) value
  const isAnyOutputHigh = component.ports.some((p) => p.type === 'output' && portValues[p.id] === 1);
  const isSelfActive =
    component.internalState?.value === 1 ||
    component.internalState?.pressed === true ||
    component.internalState?.clockState === true ||
    isAnyOutputHigh;

  // Dynamic visual feedback based on active theme
  const gateFill = isSelfActive ? activeTheme.gateActiveFill : activeTheme.gateInactiveFill;
  const gateStroke = isSelected
    ? '#60a5fa'
    : isSelfActive
    ? activeTheme.gateActiveStroke
    : activeTheme.gateInactiveStroke;
  const gateStrokeWidth = isSelected ? 2.5 : isSelfActive ? 2 : 1.75;

  // Render gate SVG graphic according to component type
  const renderGateShape = () => {
    switch (component.type) {
      case 'AND':
        return (
          <path
            d={`M 10 5 L ${width - 30} 5 C ${width - 5} 5 ${width - 5} ${height - 5} ${width - 30} ${height - 5} L 10 ${height - 5} Z`}
            fill={gateFill}
            stroke={gateStroke}
            strokeWidth={gateStrokeWidth}
            className="transition-colors duration-150"
          />
        );

      case 'OR':
        return (
          <path
            d={`M 10 5 C 22 ${height * 0.35} 22 ${height * 0.65} 10 ${height - 5} L 25 ${height - 5} C ${width - 20} ${height - 5} ${width - 10} ${height * 0.6} ${width - 5} ${height / 2} C ${width - 10} ${height * 0.4} ${width - 20} 5 25 5 Z`}
            fill={gateFill}
            stroke={gateStroke}
            strokeWidth={gateStrokeWidth}
            className="transition-colors duration-150"
          />
        );

      case 'NOT':
        return (
          <g>
            <polygon
              points={`10,5 ${width - 18},${height / 2} 10,${height - 5}`}
              fill={gateFill}
              stroke={gateStroke}
              strokeWidth={gateStrokeWidth}
              className="transition-colors duration-150"
            />
            {/* Inversion Bubble */}
            <circle
              cx={width - 10}
              cy={height / 2}
              r={6.5}
              fill={gateFill}
              stroke={gateStroke}
              strokeWidth={gateStrokeWidth}
              className="transition-colors duration-150"
            />
          </g>
        );

      case 'NAND':
        return (
          <g>
            <path
              d={`M 10 5 L ${width - 36} 5 C ${width - 12} 5 ${width - 12} ${height - 5} ${width - 36} ${height - 5} L 10 ${height - 5} Z`}
              fill={gateFill}
              stroke={gateStroke}
              strokeWidth={gateStrokeWidth}
              className="transition-colors duration-150"
            />
            <circle
              cx={width - 10}
              cy={height / 2}
              r={6.5}
              fill={gateFill}
              stroke={gateStroke}
              strokeWidth={gateStrokeWidth}
              className="transition-colors duration-150"
            />
          </g>
        );

      case 'NOR':
        return (
          <g>
            <path
              d={`M 10 5 C 22 ${height * 0.35} 22 ${height * 0.65} 10 ${height - 5} L 25 ${height - 5} C ${width - 26} ${height - 5} ${width - 16} ${height * 0.6} ${width - 12} ${height / 2} C ${width - 16} ${height * 0.4} ${width - 26} 5 25 5 Z`}
              fill={gateFill}
              stroke={gateStroke}
              strokeWidth={gateStrokeWidth}
              className="transition-colors duration-150"
            />
            <circle
              cx={width - 10}
              cy={height / 2}
              r={6.5}
              fill={gateFill}
              stroke={gateStroke}
              strokeWidth={gateStrokeWidth}
              className="transition-colors duration-150"
            />
          </g>
        );

      case 'XOR':
        return (
          <g>
            {/* Back curved arc */}
            <path
              d={`M 4 5 C 16 ${height * 0.35} 16 ${height * 0.65} 4 ${height - 5}`}
              fill="none"
              stroke={gateStroke}
              strokeWidth={gateStrokeWidth}
              className="transition-colors duration-150"
            />
            {/* Main OR shape */}
            <path
              d={`M 12 5 C 24 ${height * 0.35} 24 ${height * 0.65} 12 ${height - 5} L 25 ${height - 5} C ${width - 20} ${height - 5} ${width - 10} ${height * 0.6} ${width - 5} ${height / 2} C ${width - 10} ${height * 0.4} ${width - 20} 5 25 5 Z`}
              fill={gateFill}
              stroke={gateStroke}
              strokeWidth={gateStrokeWidth}
              className="transition-colors duration-150"
            />
          </g>
        );

      case 'XNOR':
        return (
          <g>
            <path
              d={`M 4 5 C 16 ${height * 0.35} 16 ${height * 0.65} 4 ${height - 5}`}
              fill="none"
              stroke={gateStroke}
              strokeWidth={gateStrokeWidth}
              className="transition-colors duration-150"
            />
            <path
              d={`M 12 5 C 24 ${height * 0.35} 24 ${height * 0.65} 12 ${height - 5} L 25 ${height - 5} C ${width - 26} ${height - 5} ${width - 16} ${height * 0.6} ${width - 12} ${height / 2} C ${width - 16} ${height * 0.4} ${width - 26} 5 25 5 Z`}
              fill={gateFill}
              stroke={gateStroke}
              strokeWidth={gateStrokeWidth}
              className="transition-colors duration-150"
            />
            <circle
              cx={width - 10}
              cy={height / 2}
              r={6.5}
              fill={gateFill}
              stroke={gateStroke}
              strokeWidth={gateStrokeWidth}
              className="transition-colors duration-150"
            />
          </g>
        );

      case 'BUFFER':
        return (
          <polygon
            points={`10,5 ${width - 10},${height / 2} 10,${height - 5}`}
            fill={gateFill}
            stroke={gateStroke}
            strokeWidth={gateStrokeWidth}
            className="transition-colors duration-150"
          />
        );

      case 'TRI_STATE_BUFFER':
        return (
          <g>
            <polygon
              points={`10,5 ${width - 10},${height / 2} 10,${height - 5}`}
              fill={gateFill}
              stroke={gateStroke}
              strokeWidth={gateStrokeWidth}
              className="transition-colors duration-150"
            />
            {/* Control line from top */}
            <line x1={width / 2} y1={0} x2={width / 2} y2={height / 2 - 10} stroke="#94a3b8" strokeWidth={2} />
          </g>
        );

      case 'SWITCH': {
        const val = component.internalState?.value ?? 0;
        return (
          <g
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSwitch?.(e as any);
            }}
          >
            <rect
              x={5}
              y={5}
              width={width - 10}
              height={height - 10}
              rx={8}
              fill={val === 1 ? activeTheme.inputActiveFill : activeTheme.gateInactiveFill}
              stroke={val === 1 ? activeTheme.inputActiveStroke : isSelected ? '#60a5fa' : activeTheme.gateInactiveStroke}
              strokeWidth={2}
            />
            {/* Switch Toggle Knob */}
            <circle
              cx={val === 1 ? width - 20 : 20}
              cy={height / 2}
              r={12}
              fill={val === 1 ? activeTheme.inputKnobActive : '#64748b'}
              stroke="#0f172a"
              strokeWidth={2}
              className="transition-all duration-150 shadow-md"
            />
            <text
              x={val === 1 ? 20 : width - 20}
              y={height / 2 + 4}
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize={11}
              fontWeight="bold"
              className="pointer-events-none font-mono"
            >
              {val}
            </text>
          </g>
        );
      }

      case 'BUTTON': {
        const pressed = component.internalState?.pressed ?? false;
        return (
          <g
            className="cursor-pointer"
            onPointerDown={(e) => {
              (e.target as Element).setPointerCapture(e.pointerId);
              onPressButton?.(true);
            }}
            onPointerUp={(e) => {
              (e.target as Element).releasePointerCapture(e.pointerId);
              onPressButton?.(false);
            }}
            onPointerCancel={() => {
              onPressButton?.(false);
            }}
          >
            <rect
              x={5}
              y={5}
              width={width - 10}
              height={height - 10}
              rx={10}
              fill={activeTheme.gateInactiveFill}
              stroke={pressed ? activeTheme.inputActiveStroke : isSelected ? '#60a5fa' : activeTheme.gateInactiveStroke}
              strokeWidth={2}
            />
            <circle
              cx={width / 2}
              cy={height / 2}
              r={pressed ? 14 : 16}
              fill={pressed ? activeTheme.inputKnobActive : '#e11d48'}
              stroke="#0f172a"
              strokeWidth={2}
              className="transition-all duration-100 shadow-md"
            />
            <text
              x={width / 2}
              y={height / 2 + 3.5}
              textAnchor="middle"
              fill="#ffffff"
              fontSize={9}
              fontWeight="bold"
              className="pointer-events-none"
            >
              {pressed ? '1' : 'PUSH'}
            </text>
          </g>
        );
      }

      case 'CLOCK': {
        const clkVal = component.internalState?.value ?? 0;
        return (
          <g>
            <rect
              x={5}
              y={5}
              width={width - 10}
              height={height - 10}
              rx={8}
              fill={activeTheme.gateInactiveFill}
              stroke={clkVal === 1 ? activeTheme.inputActiveStroke : isSelected ? '#60a5fa' : activeTheme.gateInactiveStroke}
              strokeWidth={2}
            />
            {/* Square wave icon */}
            <path
              d={`M 14 ${height / 2 + 8} L 22 ${height / 2 + 8} L 22 ${height / 2 - 8} L 32 ${height / 2 - 8} L 32 ${height / 2 + 8} L 40 ${height / 2 + 8}`}
              fill="none"
              stroke={clkVal === 1 ? activeTheme.clockTraceActive : '#94a3b8'}
              strokeWidth={2.5}
            />
            <circle
              cx={width - 16}
              cy={14}
              r={3.5}
              fill={clkVal === 1 ? activeTheme.clockTraceActive : activeTheme.portInactiveColor}
            />
          </g>
        );
      }

      case 'CONST_1':
        return (
          <g>
            <rect
              x={5}
              y={5}
              width={width - 10}
              height={height - 10}
              rx={8}
              fill={activeTheme.inputActiveFill}
              stroke={activeTheme.inputActiveStroke}
              strokeWidth={2}
            />
            <text
              x={width / 2}
              y={height / 2 + 5}
              textAnchor="middle"
              fill={activeTheme.inputKnobActive}
              fontSize={14}
              fontWeight="bold"
              className="font-mono"
            >
              VCC (+1)
            </text>
          </g>
        );

      case 'CONST_0':
        return (
          <g>
            <rect
              x={5}
              y={5}
              width={width - 10}
              height={height - 10}
              rx={8}
              fill={activeTheme.gateInactiveFill}
              stroke={activeTheme.gateInactiveStroke}
              strokeWidth={2}
            />
            <text
              x={width / 2}
              y={height / 2 + 5}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize={14}
              fontWeight="bold"
              className="font-mono"
            >
              GND (0)
            </text>
          </g>
        );

      case 'LED': {
        const inVal = portValues[component.ports[0]?.id] ?? 0;
        const isOn = inVal === 1;
        return (
          <g>
            {/* Glow halo when ON */}
            {isOn && (
              <circle
                cx={width / 2}
                cy={height / 2}
                r={24}
                fill={activeTheme.ledGlowColor}
                className="animate-pulse"
              />
            )}
            
            {/* LED Base / Socket */}
            <circle
              cx={width / 2}
              cy={height / 2}
              r={18}
              fill="#0f172a"
              stroke={isSelected ? '#60a5fa' : activeTheme.gateInactiveStroke}
              strokeWidth={2}
            />

            {/* LED Bulb Glass */}
            <circle
              cx={width / 2}
              cy={height / 2}
              r={14}
              fill={isOn ? activeTheme.ledActiveFill : activeTheme.gateInactiveFill}
              stroke={isOn ? activeTheme.ledActiveStroke : '#0f172a'}
              strokeWidth={1.5}
              className="transition-colors duration-200"
            />
            
            {/* Inner Light Core */}
            <circle
              cx={width / 2}
              cy={height / 2}
              r={8}
              fill={isOn ? activeTheme.inputKnobActive : '#334155'}
              className="transition-colors duration-200"
              opacity={isOn ? 1 : 0.4}
            />

            {/* Specular Highlight */}
            <path
              d={`M ${width / 2 - 8} ${height / 2 - 8} Q ${width / 2} ${height / 2 - 12} ${width / 2 + 8} ${height / 2 - 8}`}
              fill="none"
              stroke="#ffffff"
              strokeWidth={2}
              strokeLinecap="round"
              opacity={isOn ? 0.8 : 0.15}
            />
          </g>
        );
      }

      case 'PROBE': {
        const inVal = portValues[component.ports[0]?.id] ?? 0;
        let badgeColor = activeTheme.gateInactiveFill;
        let textColor = '#94a3b8';
        if (inVal === 1) {
          badgeColor = activeTheme.probeActiveBg;
          textColor = activeTheme.probeActiveText;
        } else if (inVal === 'Z') {
          badgeColor = '#78350f';
          textColor = '#fbbf24';
        } else if (inVal === 'X') {
          badgeColor = '#881337';
          textColor = '#f43f5e';
        }

        return (
          <g>
            <rect
              x={5}
              y={5}
              width={width - 10}
              height={height - 10}
              rx={8}
              fill={badgeColor}
              stroke={isSelected ? '#60a5fa' : inVal === 1 ? activeTheme.inputActiveStroke : activeTheme.gateInactiveStroke}
              strokeWidth={2}
            />
            <text
              x={width / 2}
              y={height / 2 + 6}
              textAnchor="middle"
              fill={textColor}
              fontSize={18}
              fontWeight="bold"
              className="font-mono"
            >
              {inVal}
            </text>
          </g>
        );
      }

      case 'HEX_DISPLAY':
      case 'DECIMAL_DISPLAY': {
        const hexVal = component.internalState?.hexValue ?? '0';
        return (
          <g>
            <rect
              x={4}
              y={4}
              width={width - 8}
              height={height - 8}
              rx={8}
              fill={activeTheme.canvasBg}
              stroke={isSelected ? '#60a5fa' : activeTheme.gateInactiveStroke}
              strokeWidth={2}
            />
            {/* 7 Segment style digit display */}
            <text
              x={width / 2}
              y={height / 2 + 10}
              textAnchor="middle"
              fill={activeTheme.displayDigitColor}
              fontSize={28}
              fontFamily="monospace"
              fontWeight="bold"
              className={activeTheme.displayDigitGlow}
            >
              {hexVal}
            </text>
          </g>
        );
      }

      default: {
        // Generic IC Chip Representation (Adders, Multiplexers, Latches, Registers)
        const boxFill = isSelfActive ? activeTheme.boxActiveFill : activeTheme.boxInactiveFill;
        const boxStroke = isSelected
          ? '#60a5fa'
          : isSelfActive
          ? activeTheme.boxActiveStroke
          : activeTheme.boxInactiveStroke;

        return (
          <g>
            <rect
              x={8}
              y={5}
              width={width - 16}
              height={height - 10}
              rx={6}
              fill={boxFill}
              stroke={boxStroke}
              strokeWidth={gateStrokeWidth}
              className="transition-colors duration-150"
            />
            {/* IC Orientation Notch at top */}
            <path
              d={`M ${width / 2 - 8} 5 C ${width / 2 - 8} 10 ${width / 2 + 8} 10 ${width / 2 + 8} 5`}
              fill={activeTheme.panelBg}
              stroke={activeTheme.boxInactiveStroke}
              strokeWidth={1.25}
            />
            {/* IC Chip Label */}
            <text
              x={width / 2}
              y={height / 2 + 4}
              textAnchor="middle"
              fill={isSelfActive ? activeTheme.primaryColor : '#cbd5e1'}
              fontSize={10}
              fontWeight="bold"
              fontFamily="monospace"
              className="pointer-events-none"
            >
              {component.label || component.name || component.type}
            </text>
          </g>
        );
      }
    }
  };

  const labelText = component.label?.trim() || '';
  const showLabelBadge = !!labelText;

  return (
    <g
      id={component.id}
      transform={`translate(${component.x}, ${component.y}) rotate(${rotation}, ${width / 2}, ${height / 2}) scale(${isFlipped ? -1 : 1}, 1)`}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      className="cursor-move select-none group touch-none"
    >
      {/* Component Outer Body */}
      {renderGateShape()}

      {/* Dynamic Name / Label Badge (e.g. inp 1, inp 2, clk 1, etc.) */}
      {showLabelBadge && (
        <g transform={`translate(${width / 2}, ${-13})`}>
          <rect
            x={-14 - (labelText.length * 3.5)}
            y={-8}
            width={28 + (labelText.length * 7)}
            height={16}
            rx={8}
            fill={isSelfActive ? activeTheme.badgeActiveBg : activeTheme.panelBg}
            stroke={isSelfActive ? activeTheme.badgeActiveBorder : isSelected ? '#60a5fa' : activeTheme.gateInactiveStroke}
            strokeWidth={1.5}
            className="opacity-95 shadow-md"
          />
          <text
            x={0}
            y={3}
            textAnchor="middle"
            fill={isSelfActive ? activeTheme.badgeActiveText : '#e2e8f0'}
            fontSize={9.5}
            fontWeight="bold"
            fontFamily="monospace"
            className="pointer-events-none tracking-wide"
          >
            {labelText}
          </text>
        </g>
      )}

      {/* Connection Ports (Pins) */}
      {component.ports.map((port) => {
        const val = portValues[port.id];
        let portColor = activeTheme.portInactiveColor;
        if (val === 1) portColor = activeTheme.portActiveColor;
        else if (val === 'Z') portColor = '#d97706';
        else if (val === 'X') portColor = '#ef4444';

        const px = port.relativePosition.x;
        const py = port.relativePosition.y;

        return (
          <g
            key={port.id}
            data-comp-id={component.id}
            data-port-id={port.id}
            data-port-type={port.type}
            className="cursor-crosshair group/port"
            onMouseDown={(e) => {
              e.stopPropagation();
              onPortMouseDown(e, port);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              onPortTouchStart?.(e, port);
            }}
          >
            {/* Magnetic Touch Target & Hover Ring (Expanded for easy touch interaction) */}
            <circle
              cx={px}
              cy={py}
              r={24}
              fill="rgba(0,0,0,0.01)"
              style={{ pointerEvents: 'all' }}
            />
            <circle
              cx={px}
              cy={py}
              r={12}
              fill="transparent"
              stroke="#60a5fa"
              strokeWidth={2}
              className="opacity-0 group-hover/port:opacity-100 transition-opacity hidden md:block"
            />
            {/* Port Pin Connection Circle */}
            <circle
              cx={px}
              cy={py}
              r={4.5}
              fill={portColor}
              stroke="#0f172a"
              strokeWidth={1.5}
            />
            {/* Port Name Mini Label */}
            <text
              x={port.type === 'input' ? px + 8 : px - 8}
              y={py + 3}
              textAnchor={port.type === 'input' ? 'start' : 'end'}
              fill="#94a3b8"
              fontSize={8}
              fontWeight="bold"
              className="pointer-events-none opacity-80"
            >
              {port.name}
            </text>
          </g>
        );
      })}
    </g>
  );
};
