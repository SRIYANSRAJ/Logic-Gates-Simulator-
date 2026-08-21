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
  onPortMouseUp?: (e: React.MouseEvent, port: Port) => void;
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
  onPortMouseUp,
  onPortTouchStart,
  onToggleSwitch,
  onPressButton,
  onTriggerPulse,
}) => {
  const { theme, wireDraft } = useCircuit();
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
        const isOn = val === 1;
        return (
          <g
            className="cursor-pointer select-none group/switch"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSwitch?.(e as any);
            }}
          >
            {/* Outer Sleek Matte Bezel Chassis */}
            <rect
              x={3}
              y={6}
              width={width - 6}
              height={height - 12}
              rx={12}
              fill="#090d16"
              stroke={isSelected ? '#60a5fa' : isOn ? activeTheme.inputActiveStroke : '#334155'}
              strokeWidth={isSelected ? 2 : 1.5}
              className="transition-colors duration-200"
            />
            {/* Inner Recessed Switch Track */}
            <rect
              x={6}
              y={9}
              width={width - 12}
              height={height - 18}
              rx={9}
              fill={isOn ? activeTheme.inputActiveFill : '#020617'}
              stroke={isOn ? activeTheme.inputActiveStroke : '#1e293b'}
              strokeWidth={1}
              className="transition-all duration-200"
            />
            {/* Binary State Text (0 / 1) cleanly positioned on non-knob side */}
            <text
              x={isOn ? 16 : width - 16}
              y={height / 2}
              dominantBaseline="central"
              textAnchor="middle"
              fill={isOn ? activeTheme.secondaryColor : '#64748b'}
              fontSize={11}
              fontWeight="bold"
              fontFamily="monospace"
              className="pointer-events-none select-none opacity-90"
            >
              {isOn ? '1' : '0'}
            </text>
            {/* Ergonomic Switch Slider Knob with Tactile Grips */}
            <g
              transform={`translate(${isOn ? width - 23 : 9}, ${11})`}
              className="transition-transform duration-200"
            >
              <rect
                x={0}
                y={0}
                width={14}
                height={height - 22}
                rx={6}
                fill={isOn ? activeTheme.inputKnobActive : '#cbd5e1'}
                stroke="#0f172a"
                strokeWidth={1.5}
                className="shadow-md"
              />
              {/* Tactile Grip Lines */}
              <line x1={4.5} y1={6} x2={4.5} y2={height - 28} stroke={isOn ? '#0f172a' : '#64748b'} strokeWidth={1} strokeLinecap="round" />
              <line x1={9.5} y1={6} x2={9.5} y2={height - 28} stroke={isOn ? '#0f172a' : '#64748b'} strokeWidth={1} strokeLinecap="round" />
            </g>
          </g>
        );
      }

      case 'BUTTON': {
        const pressed = component.internalState?.pressed ?? false;
        return (
          <g
            className="cursor-pointer select-none group/btn"
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
            {/* Outer Chassis */}
            <rect
              x={3}
              y={5}
              width={width - 6}
              height={height - 10}
              rx={12}
              fill="#090d16"
              stroke={isSelected ? '#60a5fa' : pressed ? activeTheme.inputActiveStroke : '#334155'}
              strokeWidth={isSelected ? 2 : 1.5}
              className="transition-colors duration-150"
            />
            {/* Outer Chamfer Ring */}
            <circle
              cx={width / 2}
              cy={height / 2}
              r={17}
              fill="#020617"
              stroke="#1e293b"
              strokeWidth={1.5}
            />
            {/* Push Button Center Actuator with Tactile Feedback */}
            <circle
              cx={width / 2}
              cy={height / 2}
              r={pressed ? 12 : 14}
              fill={pressed ? activeTheme.inputKnobActive : '#ef4444'}
              stroke={pressed ? activeTheme.inputActiveStroke : '#991b1b'}
              strokeWidth={2}
              className="transition-all duration-75 shadow-lg"
            />
            {/* Crisp Push Button Label */}
            <text
              x={width / 2}
              y={height / 2}
              dominantBaseline="central"
              textAnchor="middle"
              fill="#ffffff"
              fontSize={8.5}
              fontWeight="800"
              fontFamily="sans-serif"
              className="pointer-events-none select-none tracking-wider"
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
        const inPort = component.ports[0]?.id || 'in_0';
        const inVal = portValues[inPort] ?? component.internalState?.currentValue ?? 0;
        const isOn = inVal === 1 || inVal === '1';
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
        const inPort = component.ports[0]?.id || 'in_0';
        const inVal = portValues[inPort] ?? component.internalState?.currentValue ?? 0;
        let badgeColor = activeTheme.gateInactiveFill;
        let textColor = '#94a3b8';
        let strokeColor = activeTheme.gateInactiveStroke;
        
        if (inVal === 1 || inVal === '1') {
          badgeColor = activeTheme.probeActiveBg;
          textColor = activeTheme.probeActiveText;
          strokeColor = activeTheme.inputActiveStroke;
        } else if (inVal === 'Z') {
          badgeColor = '#451a03';
          textColor = '#fbbf24';
          strokeColor = '#d97706';
        } else if (inVal === 'X') {
          badgeColor = '#4c0519';
          textColor = '#f43f5e';
          strokeColor = '#e11d48';
        } else {
          badgeColor = '#0f172a';
          textColor = '#64748b';
          strokeColor = '#334155';
        }

        return (
          <g>
            {/* Glowing active outline */}
            {(inVal === 1 || inVal === '1') && (
              <rect
                x={3}
                y={3}
                width={width - 6}
                height={height - 6}
                rx={10}
                fill={activeTheme.ledGlowColor}
                className="animate-pulse opacity-60"
              />
            )}
            <rect
              x={5}
              y={5}
              width={width - 10}
              height={height - 10}
              rx={8}
              fill={badgeColor}
              stroke={isSelected ? '#60a5fa' : strokeColor}
              strokeWidth={isSelected ? 2.5 : 2}
            />
            <text
              x={width / 2}
              y={height / 2 + 6}
              textAnchor="middle"
              fill={textColor}
              fontSize={20}
              fontWeight="bold"
              className="font-mono select-none"
            >
              {inVal}
            </text>
          </g>
        );
      }

      case 'SEGMENT_7': {
        const segInputs: Record<string, boolean> = {
          a: (portValues['in_a'] ?? component.internalState?.segments?.a) === 1,
          b: (portValues['in_b'] ?? component.internalState?.segments?.b) === 1,
          c: (portValues['in_c'] ?? component.internalState?.segments?.c) === 1,
          d: (portValues['in_d'] ?? component.internalState?.segments?.d) === 1,
          e: (portValues['in_e'] ?? component.internalState?.segments?.e) === 1,
          f: (portValues['in_f'] ?? component.internalState?.segments?.f) === 1,
          g: (portValues['in_g'] ?? component.internalState?.segments?.g) === 1,
          dp: (portValues['in_dp'] ?? component.internalState?.segments?.dp) === 1,
        };

        const onFill = activeTheme.inputKnobActive || '#10b981';
        const offFill = '#1e293b';
        const offStroke = '#0f172a';

        return (
          <g>
            {/* Display Enclosure */}
            <rect
              x={16}
              y={5}
              width={width - 20}
              height={height - 10}
              rx={6}
              fill="#090d16"
              stroke={isSelected ? '#60a5fa' : '#334155'}
              strokeWidth={2}
            />

            {/* 7 Segments (a, b, c, d, e, f, g) */}
            {/* Segment a (top) */}
            <polygon
              points="34,14 58,14 54,19 38,19"
              fill={segInputs.a ? onFill : offFill}
              stroke={segInputs.a ? onFill : offStroke}
              strokeWidth={1}
            />
            {/* Segment b (top-right) */}
            <polygon
              points="59,16 63,20 59,45 55,42"
              fill={segInputs.b ? onFill : offFill}
              stroke={segInputs.b ? onFill : offStroke}
              strokeWidth={1}
            />
            {/* Segment c (bottom-right) */}
            <polygon
              points="58,52 62,55 58,80 54,76"
              fill={segInputs.c ? onFill : offFill}
              stroke={segInputs.c ? onFill : offStroke}
              strokeWidth={1}
            />
            {/* Segment d (bottom) */}
            <polygon
              points="34,82 54,82 50,77 38,77"
              fill={segInputs.d ? onFill : offFill}
              stroke={segInputs.d ? onFill : offStroke}
              strokeWidth={1}
            />
            {/* Segment e (bottom-left) */}
            <polygon
              points="33,52 37,55 33,80 29,76"
              fill={segInputs.e ? onFill : offFill}
              stroke={segInputs.e ? onFill : offStroke}
              strokeWidth={1}
            />
            {/* Segment f (top-left) */}
            <polygon
              points="34,16 38,20 34,45 30,42"
              fill={segInputs.f ? onFill : offFill}
              stroke={segInputs.f ? onFill : offStroke}
              strokeWidth={1}
            />
            {/* Segment g (middle) */}
            <polygon
              points="35,48 57,48 53,51 39,51"
              fill={segInputs.g ? onFill : offFill}
              stroke={segInputs.g ? onFill : offStroke}
              strokeWidth={1}
            />

            {/* Decimal Point (dp) */}
            <circle
              cx={67}
              cy={80}
              r={3}
              fill={segInputs.dp ? onFill : offFill}
              stroke={segInputs.dp ? onFill : offStroke}
              strokeWidth={1}
            />
          </g>
        );
      }

      case 'HEX_DISPLAY': {
        const d3 = portValues['in_3'] === 1 ? 1 : 0;
        const d2 = portValues['in_2'] === 1 ? 1 : 0;
        const d1 = portValues['in_1'] === 1 ? 1 : 0;
        const d0 = portValues['in_0'] === 1 ? 1 : 0;
        const calcVal = (d3 << 3) | (d2 << 2) | (d1 << 1) | d0;
        const hexChar = component.internalState?.hexValue ?? calcVal.toString(16).toUpperCase();

        return (
          <g>
            <rect
              x={16}
              y={5}
              width={width - 20}
              height={height - 10}
              rx={8}
              fill="#090d16"
              stroke={isSelected ? '#60a5fa' : '#334155'}
              strokeWidth={2}
            />
            <text
              x={(width + 12) / 2}
              y={height / 2 + 10}
              textAnchor="middle"
              fill={activeTheme.displayDigitColor || '#10b981'}
              fontSize={32}
              fontFamily="monospace"
              fontWeight="bold"
              className={activeTheme.displayDigitGlow}
            >
              {hexChar}
            </text>
            <text
              x={(width + 12) / 2}
              y={height - 8}
              textAnchor="middle"
              fill="#64748b"
              fontSize={7.5}
              fontWeight="bold"
              fontFamily="monospace"
            >
              HEX
            </text>
          </g>
        );
      }

      case 'DECIMAL_DISPLAY': {
        const d3 = portValues['in_3'] === 1 ? 1 : 0;
        const d2 = portValues['in_2'] === 1 ? 1 : 0;
        const d1 = portValues['in_1'] === 1 ? 1 : 0;
        const d0 = portValues['in_0'] === 1 ? 1 : 0;
        const calcVal = (d3 << 3) | (d2 << 2) | (d1 << 1) | d0;
        const decStr = component.internalState?.decValue ?? calcVal.toString(10);

        return (
          <g>
            <rect
              x={16}
              y={5}
              width={width - 20}
              height={height - 10}
              rx={8}
              fill="#090d16"
              stroke={isSelected ? '#60a5fa' : '#334155'}
              strokeWidth={2}
            />
            <text
              x={(width + 12) / 2}
              y={height / 2 + 10}
              textAnchor="middle"
              fill={activeTheme.displayDigitColor || '#38bdf8'}
              fontSize={decStr.length > 1 ? 26 : 32}
              fontFamily="monospace"
              fontWeight="bold"
              className={activeTheme.displayDigitGlow}
            >
              {decStr}
            </text>
            <text
              x={(width + 12) / 2}
              y={height - 8}
              textAnchor="middle"
              fill="#64748b"
              fontSize={7.5}
              fontWeight="bold"
              fontFamily="monospace"
            >
              DEC
            </text>
          </g>
        );
      }

      case 'BINARY_DISPLAY': {
        const bits = [
          portValues['in_3'] === 1 ? 1 : 0,
          portValues['in_2'] === 1 ? 1 : 0,
          portValues['in_1'] === 1 ? 1 : 0,
          portValues['in_0'] === 1 ? 1 : 0,
        ];
        const onFill = activeTheme.inputKnobActive || '#10b981';

        return (
          <g>
            <rect
              x={16}
              y={5}
              width={width - 20}
              height={height - 10}
              rx={6}
              fill="#090d16"
              stroke={isSelected ? '#60a5fa' : '#334155'}
              strokeWidth={2}
            />
            {bits.map((bit, idx) => {
              const cx = 26 + idx * 12;
              return (
                <g key={idx}>
                  <circle
                    cx={cx}
                    cy={height / 2 - 4}
                    r={4.5}
                    fill={bit === 1 ? onFill : '#1e293b'}
                    stroke={bit === 1 ? '#ffffff' : '#0f172a'}
                    strokeWidth={1}
                  />
                  <text
                    x={cx}
                    y={height / 2 + 14}
                    textAnchor="middle"
                    fill={bit === 1 ? '#ffffff' : '#64748b'}
                    fontSize={8.5}
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {bit}
                  </text>
                </g>
              );
            })}
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

  // Only complex ICs and multi-pin devices need internal pin labels (prevents collision on standard gates and switches)
  const showInternalPinLabels = [
    'D_FLIP_FLOP',
    'JK_FLIP_FLOP',
    'T_FLIP_FLOP',
    'SR_LATCH',
    'FULL_ADDER',
    'HALF_ADDER',
    'ALU_4BIT',
    'MUX_4TO1',
    'DEMUX_1TO4',
    'COUNTER_4BIT',
    'REGISTER_4BIT',
    'CUSTOM_IC',
    'SEGMENT_7',
    'TRI_STATE_BUFFER',
  ].includes(component.type);

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

      {/* Dynamic Custom Label Badge (cleanly centered, crisp typography) */}
      {showLabelBadge && (
        <g transform={`translate(${width / 2}, ${-13})`}>
          <rect
            x={-Math.max(14, labelText.length * 3.6 + 7)}
            y={-9}
            width={Math.max(28, labelText.length * 7.2 + 14)}
            height={18}
            rx={5}
            fill={isSelfActive ? activeTheme.badgeActiveBg : '#0b1120'}
            stroke={isSelfActive ? activeTheme.badgeActiveBorder : isSelected ? '#60a5fa' : '#334155'}
            strokeWidth={1.2}
            className="shadow-md"
          />
          <text
            x={0}
            y={0}
            dominantBaseline="central"
            textAnchor="middle"
            fill={isSelfActive ? activeTheme.badgeActiveText : '#e2e8f0'}
            fontSize={9.5}
            fontWeight="600"
            fontFamily="sans-serif"
            className="pointer-events-none select-none tracking-wide"
          >
            {labelText}
          </text>
        </g>
      )}

      {/* Connection Ports (Pins) - Rendered as crisp horizontal pin leads and terminal bars instead of circles */}
      {component.ports.map((port) => {
        const val = portValues[port.id];
        let portColor = activeTheme.portInactiveColor;
        if (val === 1) portColor = activeTheme.portActiveColor;
        else if (val === 'Z') portColor = '#d97706';
        else if (val === 'X') portColor = '#ef4444';

        const px = port.relativePosition.x;
        const py = port.relativePosition.y;
        const isOutput = port.type === 'output';
        const isInput = port.type === 'input';
        const isTargetCandidate = Boolean(wireDraft) && isInput && wireDraft?.fromCompId !== component.id;

        return (
          <g
            key={port.id}
            data-comp-id={component.id}
            data-port-id={port.id}
            data-port-type={port.type}
            className={`${isOutput ? 'cursor-crosshair' : isTargetCandidate ? 'cursor-crosshair' : 'cursor-default'} group/port`}
            onMouseDown={(e) => {
              e.stopPropagation();
              onPortMouseDown(e, port);
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              onPortMouseUp?.(e, port);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              onPortTouchStart?.(e, port);
            }}
          >
            {/* Magnetic Touch & Click Area (Generous touch target for tablets and desktop) */}
            <rect
              x={isInput ? px - 18 : px - 4}
              y={py - 14}
              width={24}
              height={28}
              fill="transparent"
              style={{ pointerEvents: 'all' }}
            />

            {/* Hover / Drop Target Indicator Pill */}
            <rect
              x={isInput ? px - 14 : px - 2}
              y={py - 7}
              width={16}
              height={14}
              rx={3}
              fill={isTargetCandidate ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.15)'}
              stroke="#60a5fa"
              strokeWidth={isTargetCandidate ? 1.5 : 1}
              className={
                isTargetCandidate
                  ? 'opacity-100'
                  : 'opacity-0 group-hover/port:opacity-100 transition-opacity hidden md:block'
              }
            />

            {/* Horizontal Terminal Pin Leads & Terminal Tabs (NO circles, preventing inverter bubble confusion) */}
            {isInput ? (
              <g className="transition-colors duration-150">
                {/* Horizontal Pin Lead Line */}
                <line
                  x1={px - 10}
                  y1={py}
                  x2={px}
                  y2={py}
                  stroke={portColor}
                  strokeWidth={2.5}
                  strokeLinecap="square"
                />
                {/* Vertical Terminal Contact Bar */}
                <line
                  x1={px - 10}
                  y1={py - 4}
                  x2={px - 10}
                  y2={py + 4}
                  stroke={portColor}
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </g>
            ) : (
              <g className="transition-colors duration-150">
                {/* Horizontal Pin Lead Line (Output source) */}
                <line
                  x1={px}
                  y1={py}
                  x2={px + 10}
                  y2={py}
                  stroke={portColor}
                  strokeWidth={2.5}
                  strokeLinecap="square"
                />
                {/* Vertical Terminal Contact Bar / Source Tab */}
                <line
                  x1={px + 10}
                  y1={py - 4}
                  x2={px + 10}
                  y2={py + 4}
                  stroke={portColor}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                />
              </g>
            )}

            {/* Clean Port Name Label (rendered cleanly on ICs / multi-pin chips without gate collision) */}
            {showInternalPinLabels && (
              <text
                x={isInput ? px + 8 : px - 8}
                y={py}
                dominantBaseline="central"
                textAnchor={isInput ? 'start' : 'end'}
                fill={isTargetCandidate ? '#60a5fa' : '#94a3b8'}
                fontSize={8.5}
                fontWeight="bold"
                fontFamily="sans-serif"
                className="pointer-events-none opacity-90 select-none"
              >
                {port.name}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
};
