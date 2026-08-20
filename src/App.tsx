/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { CircuitProvider, useCircuit } from './context/CircuitContext';
import { Toolbar } from './components/ui/Toolbar';
import { Sidebar } from './components/ui/Sidebar';
import { Canvas } from './components/canvas/Canvas';
import { Inspector } from './components/ui/Inspector';
import { TruthTableModal } from './components/modals/TruthTableModal';
import { BooleanToolModal } from './components/modals/BooleanToolModal';
import { KMapModal } from './components/modals/KMapModal';
import { OscilloscopeModal } from './components/modals/OscilloscopeModal';
import { CustomGateModal } from './components/modals/CustomGateModal';
import { PresetsModal } from './components/modals/PresetsModal';
import { ChallengeModal } from './components/modals/ChallengeModal';
import { EducationalModal } from './components/modals/EducationalModal';
import { ShortcutHelpModal } from './components/modals/ShortcutHelpModal';
import { SavedCircuitsModal } from './components/modals/SavedCircuitsModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { TutorialModal } from './components/modals/TutorialModal';

const CircuitAppContent: React.FC = () => {
  const { importJson, sidebarOpen, setSidebarOpen, inspectorOpen, setInspectorOpen, activeModal } = useCircuit();
  const importJsonRef = useRef(importJson);
  importJsonRef.current = importJson;

  // Listen to synthesized circuits loader
  useEffect(() => {
    const handleSynthesizedLoad = (e: any) => {
      if (e.detail) {
        const { components, wires, name } = e.detail;
        importJsonRef.current(
          JSON.stringify({
            version: '1.0.0',
            name: name || 'Synthesized Circuit',
            components,
            wires,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })
        );
      }
    };

    window.addEventListener('load_synthesized_circuit', handleSynthesizedLoad);
    return () => window.removeEventListener('load_synthesized_circuit', handleSynthesizedLoad);
  }, []);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#090d16] text-slate-100 antialiased font-sans touch-none">
      {/* Top Navigation & Simulation Toolbar */}
      <Toolbar />

      {/* Main Studio Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Component Library Palette */}
        <Sidebar />

        {/* Backdrop for Mobile/Tablet when Sidebar Drawer is open */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 top-14 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Central Infinite Logic Canvas */}
        <main className="flex-1 h-full relative">
          <Canvas />
        </main>

        {/* Right Property Inspector Panel */}
        <Inspector />
      </div>

      {/* Interactive Feature Modals */}
      {activeModal === 'truthTable' && <TruthTableModal />}
      {activeModal === 'boolean' && <BooleanToolModal />}
      {activeModal === 'kmap' && <KMapModal />}
      {activeModal === 'oscilloscope' && <OscilloscopeModal />}
      {activeModal === 'customGate' && <CustomGateModal />}
      {activeModal === 'presets' && <PresetsModal />}
      {activeModal === 'challenges' && <ChallengeModal />}
      {activeModal === 'learn' && <EducationalModal />}
      {activeModal === 'shortcuts' && <ShortcutHelpModal />}
      {activeModal === 'savedCircuits' && <SavedCircuitsModal />}
      {activeModal === 'settings' && <SettingsModal />}
      {activeModal === 'tutorial' && <TutorialModal />}
    </div>
  );
};

export default function App() {
  return (
    <CircuitProvider>
      <CircuitAppContent />
    </CircuitProvider>
  );
}
