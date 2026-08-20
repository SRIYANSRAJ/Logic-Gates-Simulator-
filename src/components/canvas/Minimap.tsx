/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useCircuit } from '../../context/CircuitContext';
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react';

export const Minimap: React.FC = () => {
  const { components, camera, setCamera } = useCircuit();
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="absolute bottom-4 right-4 z-20 bg-slate-900/90 border border-slate-700/80 p-2 rounded-lg text-slate-400 hover:text-slate-200 shadow-xl backdrop-blur-sm"
        title="Open Minimap"
      >
        <MapPin className="w-4 h-4" />
      </button>
    );
  }

  // Calculate bounding box of all components
  const minX = components.length > 0 ? Math.min(...components.map((c) => c.x)) - 100 : -500;
  const maxX = components.length > 0 ? Math.max(...components.map((c) => c.x + 100)) + 100 : 500;
  const minY = components.length > 0 ? Math.min(...components.map((c) => c.y)) - 100 : -500;
  const maxY = components.length > 0 ? Math.max(...components.map((c) => c.y + 100)) + 100 : 500;

  const worldWidth = Math.max(800, maxX - minX);
  const worldHeight = Math.max(600, maxY - minY);

  const mapWidth = 160;
  const mapHeight = 110;
  const scale = Math.min(mapWidth / worldWidth, mapHeight / worldHeight);

  // Viewport rectangle in minimap space
  const vpX = (-camera.x - minX) * scale;
  const vpY = (-camera.y - minY) * scale;
  const vpWidth = (window.innerWidth / camera.zoom) * scale;
  const vpHeight = (window.innerHeight / camera.zoom) * scale;

  const handleMinimapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const targetWorldX = clickX / scale + minX;
    const targetWorldY = clickY / scale + minY;

    setCamera((prev) => ({
      ...prev,
      x: -(targetWorldX - window.innerWidth / 2 / prev.zoom),
      y: -(targetWorldY - window.innerHeight / 2 / prev.zoom),
    }));
  };

  return (
    <div className="absolute bottom-4 right-4 z-20 bg-slate-900/90 border border-slate-700/80 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between px-2.5 py-1 bg-slate-800/80 border-b border-slate-700/50 text-[11px] font-medium text-slate-300">
        <span>Minimap ({components.length} gates)</span>
        <button
          onClick={() => setCollapsed(true)}
          className="text-slate-400 hover:text-slate-200 p-0.5"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      <svg
        width={mapWidth}
        height={mapHeight}
        className="bg-slate-950/80 cursor-crosshair"
        onClick={handleMinimapClick}
      >
        {/* Render component mini rectangles */}
        {components.map((c) => {
          const cx = (c.x - minX) * scale;
          const cy = (c.y - minY) * scale;
          return (
            <rect
              key={c.id}
              x={cx}
              y={cy}
              width={Math.max(4, 30 * scale)}
              height={Math.max(3, 20 * scale)}
              rx={1}
              fill="#10b981"
              opacity={0.7}
            />
          );
        })}

        {/* Viewport Frame */}
        <rect
          x={vpX}
          y={vpY}
          width={vpWidth}
          height={vpHeight}
          fill="rgba(59, 130, 246, 0.15)"
          stroke="#60a5fa"
          strokeWidth={1.5}
        />
      </svg>
    </div>
  );
};
