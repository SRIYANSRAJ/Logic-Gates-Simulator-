/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useCircuit } from '../../context/CircuitContext';
import { CircuitData } from '../../types/circuit';
import {
  Archive,
  Check,
  Clock,
  Copy,
  Cpu,
  Database,
  Download,
  FolderOpen,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  X,
  Zap,
} from 'lucide-react';

interface SavedCircuitRecord {
  id: string;
  name: string;
  description?: string;
  savedAt: number;
  data: CircuitData;
  isAutosave?: boolean;
}

const STORAGE_KEY_LIST = 'digilogic_saved_circuits_library_v1';
const AUTOSAVE_KEY = 'digilogic_circuit_autosave_v1';
const LEGACY_SAVED_KEY = 'digilogic_saved_circuit';

export const SavedCircuitsModal: React.FC = () => {
  const {
    circuitName,
    setCircuitName,
    components,
    wires,
    customGates,
    camera,
    exportJson,
    importJson,
    setActiveModal,
  } = useCircuit();

  const [savedList, setSavedList] = useState<SavedCircuitRecord[]>([]);
  const [newCircuitName, setNewCircuitName] = useState(circuitName || 'My Logic Circuit');
  const [newDescription, setNewDescription] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Load all saved circuits from localStorage on open
  useEffect(() => {
    loadSavedRecords();
  }, []);

  const loadSavedRecords = () => {
    const list: SavedCircuitRecord[] = [];

    // 1. Check autosave
    try {
      const autoStr = localStorage.getItem(AUTOSAVE_KEY);
      if (autoStr) {
        const parsed: CircuitData = JSON.parse(autoStr);
        if (parsed.components && parsed.components.length > 0) {
          list.push({
            id: 'autosave_slot',
            name: `${parsed.name || 'Untitled'} (Auto-Saved)`,
            description: 'Continuously auto-saved session snapshot',
            savedAt: parsed.updatedAt || parsed.createdAt || Date.now(),
            data: parsed,
            isAutosave: true,
          });
        }
      }
    } catch (e) {
      console.warn('Error reading autosave:', e);
    }

    // 2. Check saved circuits collection
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LIST);
      if (stored) {
        const parsed: SavedCircuitRecord[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          list.push(...parsed);
        }
      }
    } catch (e) {
      console.warn('Error reading saved circuits collection:', e);
    }

    // 3. Check legacy slot if not already in list
    try {
      const legacyStr = localStorage.getItem(LEGACY_SAVED_KEY);
      if (legacyStr && !list.some((r) => r.id === 'legacy_slot')) {
        const parsed: CircuitData = JSON.parse(legacyStr);
        if (parsed.components && parsed.components.length > 0) {
          list.push({
            id: 'legacy_slot',
            name: parsed.name || 'Quick-Saved Circuit',
            description: 'Saved via Quick Local Storage slot',
            savedAt: parsed.updatedAt || parsed.createdAt || Date.now(),
            data: parsed,
          });
        }
      }
    } catch (e) {
      console.warn('Error reading legacy saved slot:', e);
    }

    setSavedList(list);
  };

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2500);
  };

  // Save current circuit as a new slot
  const handleSaveNewSlot = () => {
    if (!newCircuitName.trim()) {
      showToast('Please enter a circuit title');
      return;
    }

    const currentData: CircuitData = {
      version: '1.0.0',
      name: newCircuitName.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      components,
      wires,
      customGates,
      camera,
    };

    const newRecord: SavedCircuitRecord = {
      id: `saved_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newCircuitName.trim(),
      description: newDescription.trim() || undefined,
      savedAt: Date.now(),
      data: currentData,
    };

    const updated = [newRecord, ...savedList.filter((r) => !r.isAutosave && r.id !== 'legacy_slot')];
    try {
      localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(updated));
      setCircuitName(newCircuitName.trim());
      loadSavedRecords();
      showToast(`Saved "${newCircuitName}" to Local Storage!`);
      setNewDescription('');
    } catch (e) {
      showToast('Storage quota exceeded or save failed');
    }
  };

  // Load a circuit from list
  const handleLoadCircuit = (record: SavedCircuitRecord) => {
    const success = importJson(JSON.stringify(record.data));
    if (success) {
      setCircuitName(record.data.name || record.name);
      showToast(`Loaded "${record.name}"!`);
      setTimeout(() => setActiveModal('none'), 600);
    } else {
      showToast('Could not load circuit data');
    }
  };

  // Overwrite an existing slot
  const handleOverwrite = (recordId: string) => {
    const currentData: CircuitData = {
      version: '1.0.0',
      name: circuitName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      components,
      wires,
      customGates,
      camera,
    };

    const updated = savedList
      .filter((r) => !r.isAutosave && r.id !== 'legacy_slot')
      .map((r) => {
        if (r.id === recordId) {
          return {
            ...r,
            name: circuitName,
            savedAt: Date.now(),
            data: currentData,
          };
        }
        return r;
      });

    try {
      localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(updated));
      loadSavedRecords();
      showToast('Slot updated with current canvas!');
    } catch (e) {
      showToast('Failed to overwrite slot');
    }
  };

  // Delete a saved slot
  const handleDeleteSlot = (recordId: string, isAutosave?: boolean) => {
    if (isAutosave) {
      localStorage.removeItem(AUTOSAVE_KEY);
      loadSavedRecords();
      showToast('Auto-save cache cleared');
      return;
    }

    if (recordId === 'legacy_slot') {
      localStorage.removeItem(LEGACY_SAVED_KEY);
      loadSavedRecords();
      showToast('Slot removed');
      return;
    }

    const updated = savedList.filter((r) => r.id !== recordId && !r.isAutosave && r.id !== 'legacy_slot');
    try {
      localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(updated));
      loadSavedRecords();
      showToast('Circuit removed from local storage');
    } catch (e) {
      showToast('Failed to delete slot');
    }
  };

  // Export JSON file for a record
  const handleExportRecord = (record: SavedCircuitRecord) => {
    const jsonStr = JSON.stringify(record.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${record.name.toLowerCase().replace(/\s+/g, '_')}_circuit.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded JSON file!');
  };

  const filtered = savedList.filter((r) =>
    r.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div
      id="saved-circuits-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={() => setActiveModal('none')}
    >
      <div
        id="saved-circuits-dialog"
        className="w-full max-w-2xl bg-[#0f172a] border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100 animate-scale-up touch-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#0b111e]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-950">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                Saved Circuits Manager
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                  Local Storage
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Load, manage, overwrite, or save your circuit diagrams securely on this device
              </p>
            </div>
          </div>

          <button
            id="close-saved-circuits-btn"
            onClick={() => setActiveModal('none')}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Save Current Section */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5" />
            <span>Save Current Canvas ({components.length} Gates, {wires.length} Wires)</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Circuit Name..."
              value={newCircuitName}
              onChange={(e) => setNewCircuitName(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Optional notes / description..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            <button
              id="save-new-slot-btn"
              onClick={handleSaveNewSlot}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 cursor-pointer shrink-0 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Save New Slot</span>
            </button>
          </div>
        </div>

        {/* Search & List */}
        <div className="px-4 pt-3 pb-1 flex items-center justify-between gap-2 border-b border-slate-800/60">
          <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <FolderOpen className="w-4 h-4 text-slate-400" />
            <span>Saved Diagram Slots ({savedList.length})</span>
          </div>
          <input
            type="text"
            placeholder="Filter saved circuits..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-md text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none max-w-44"
          />
        </div>

        {/* Scrollable Saved Slots List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-80 overscroll-contain">
          {filtered.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
              <Archive className="w-8 h-8 text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">No saved circuits found</p>
              <p className="text-xs text-slate-500 max-w-sm">
                Save your current circuit diagram using the form above to store it permanently in your browser.
              </p>
            </div>
          ) : (
            filtered.map((record) => {
              const compCount = record.data?.components?.length || 0;
              const wireCount = record.data?.wires?.length || 0;
              const formattedDate = new Date(record.savedAt).toLocaleString();

              return (
                <div
                  key={record.id}
                  id={`saved-slot-${record.id}`}
                  className="p-3 bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-100 truncate">
                        {record.name}
                      </span>
                      {record.isAutosave && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium shrink-0">
                          Auto-Save Slot
                        </span>
                      )}
                    </div>

                    {record.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {record.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-slate-400" />
                        {compCount} {compCount === 1 ? 'Gate' : 'Gates'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-slate-400" />
                        {wireCount} {wireCount === 1 ? 'Wire' : 'Wires'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formattedDate}
                      </span>
                    </div>
                  </div>

                  {/* Actions for this slot */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleLoadCircuit(record)}
                      className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/40 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                      title="Load this circuit into canvas"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Load</span>
                    </button>

                    {!record.isAutosave && (
                      <button
                        onClick={() => handleOverwrite(record.id)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
                        title="Overwrite this slot with current canvas"
                      >
                        Overwrite
                      </button>
                    )}

                    <button
                      onClick={() => handleExportRecord(record)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
                      title="Download JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteSlot(record.id, record.isAutosave)}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 rounded-lg transition-colors border border-rose-500/20"
                      title="Delete this saved slot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Credit & Status */}
        <div className="p-3 bg-[#0b111e] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">
              Crafted with passion and precision by <strong className="text-emerald-400">Devashish and Sriyans</strong>
            </span>
            <a
              href="mailto:sriyansraj02@gmail.com"
              className="text-[10px] text-emerald-400 hover:underline font-mono"
            >
              sriyansraj02@gmail.com
            </a>
          </div>

          <button
            onClick={() => setActiveModal('none')}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>

        {/* Toast alert */}
        {feedback && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in font-semibold">
            <Check className="w-4 h-4" />
            <span>{feedback}</span>
          </div>
        )}
      </div>
    </div>
  );
};
