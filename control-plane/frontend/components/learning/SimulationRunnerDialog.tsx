"use client";

import React, { useEffect, useState } from "react";
import {
  Sparkles,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Terminal,
  Shield,
  ExternalLink,
  X,
  Target,
  Server,
  Layers,
} from "lucide-react";
import { simulationsApi } from "../../lib/api/simulations";
import {
  SimulationCatalog,
  SimulationItem,
  SimulationRunResult,
} from "../../lib/types/api";
import { StatusBadge } from "../ui/StatusBadge";
import { useToast } from "../ui/Toast";

interface SimulationRunnerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTechnique?: string;
  onSuccess?: () => void;
}

export const SimulationRunnerDialog: React.FC<SimulationRunnerDialogProps> = ({
  isOpen,
  onClose,
  defaultTechnique,
  onSuccess,
}) => {
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<SimulationCatalog | null>(null);
  const [selectedType, setSelectedType] = useState<"atomic" | "web" | "baseline">("atomic");
  const [selectedItem, setSelectedItem] = useState<SimulationItem | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SimulationRunResult | null>(null);

  const loadCatalog = React.useCallback(async () => {
    try {
      setLoading(true);
      const cat = await simulationsApi.getCatalog();
      setCatalog(cat);

      // Select default or first item
      if (defaultTechnique) {
        const found = cat.atomic_tests.find((t) => t.technique === defaultTechnique);
        if (found) {
          setSelectedType("atomic");
          setSelectedItem(found);
          return;
        }
      }

      if (cat.atomic_tests.length > 0) {
        setSelectedType("atomic");
        setSelectedItem(cat.atomic_tests[0]);
      }
    } catch (err: any) {
      error("Catalog Error", err.message || "Failed to load simulation catalog.");
    } finally {
      setLoading(false);
    }
  }, [defaultTechnique, error]);

  useEffect(() => {
    if (isOpen) {
      loadCatalog();
    }
  }, [isOpen, loadCatalog]);

  const handleRun = async () => {
    if (!selectedItem) return;
    const identifier = selectedItem.technique || selectedItem.scenario || selectedItem.event_type;
    if (!identifier) return;

    setIsRunning(true);
    setResult(null);
    try {
      const res = await simulationsApi.runSimulation(selectedType, identifier, true);
      setResult(res);
      if (res.status === "COMPLETED") {
        success("Simulation Completed", `${res.name} executed successfully.`);
      } else {
        error("Simulation Alert", `Simulation finished with exit code ${res.exit_code}`);
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      error("Execution Failed", err.message);
    } finally {
      setIsRunning(false);
    }
  };

  if (!isOpen) return null;

  const currentList =
    selectedType === "atomic"
      ? catalog?.atomic_tests || []
      : selectedType === "web"
      ? catalog?.web_scenarios || []
      : catalog?.baseline_events || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div
        className="w-full max-w-2xl bg-panel border border-border-default rounded-md shadow-2xl overflow-hidden font-sans text-xs flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-surface shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/15 border border-primary/40 flex items-center justify-center text-primary font-bold">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold font-mono text-text-primary tracking-wide">
                ADVERSARY LAB SIMULATION ENGINE
              </h3>
              <p className="text-[10px] text-text-muted">
                Execute controlled threat events from the Attack Host to generate live Wazuh telemetry
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
          {/* Category Tabs */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedType("atomic");
                if (catalog?.atomic_tests.length) setSelectedItem(catalog.atomic_tests[0]);
              }}
              className={`p-2 rounded border text-center transition-all ${
                selectedType === "atomic"
                  ? "bg-primary/12 border-primary text-primary font-bold"
                  : "bg-surface border-border-subtle text-text-secondary hover:border-border-default"
              }`}
            >
              <div className="text-[11px]">MITRE Atomic Tests</div>
              <div className="text-[9px] text-text-muted">Windows / Linux Telemetry</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedType("web");
                if (catalog?.web_scenarios.length) setSelectedItem(catalog.web_scenarios[0]);
              }}
              className={`p-2 rounded border text-center transition-all ${
                selectedType === "web"
                  ? "bg-primary/12 border-primary text-primary font-bold"
                  : "bg-surface border-border-subtle text-text-secondary hover:border-border-default"
              }`}
            >
              <div className="text-[11px]">Web Attacks (DVWA/Juice)</div>
              <div className="text-[9px] text-text-muted">SQLi, XSS, Cmd Injection</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedType("baseline");
                if (catalog?.baseline_events.length) setSelectedItem(catalog.baseline_events[0]);
              }}
              className={`p-2 rounded border text-center transition-all ${
                selectedType === "baseline"
                  ? "bg-primary/12 border-primary text-primary font-bold"
                  : "bg-surface border-border-subtle text-text-secondary hover:border-border-default"
              }`}
            >
              <div className="text-[11px]">Baseline Traffic</div>
              <div className="text-[9px] text-text-muted">Benign User Events</div>
            </button>
          </div>

          {/* Test Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-text-muted uppercase">
              Select Threat Scenario
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto scrollbar-thin p-1 bg-surface rounded border border-border-subtle">
              {currentList.map((item) => {
                const id = item.technique || item.scenario || item.event_type;
                const isSelected =
                  (selectedItem?.technique && selectedItem.technique === item.technique) ||
                  (selectedItem?.scenario && selectedItem.scenario === item.scenario) ||
                  (selectedItem?.event_type && selectedItem.event_type === item.event_type);

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className={`p-2 rounded text-left border transition-all ${
                      isSelected
                        ? "bg-primary/15 border-primary text-text-primary font-semibold"
                        : "bg-panel border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-default"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold text-primary">{id}</span>
                      {item.category && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-surface border border-border-subtle text-text-muted">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] truncate text-text-primary mt-0.5">{item.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Item Details */}
          {selectedItem && (
            <div className="p-3 rounded bg-surface border border-border-subtle space-y-2 font-mono text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-text-primary font-bold">{selectedItem.name}</span>
                <span className="text-[10px] text-accent-blue">{selectedItem.target}</span>
              </div>
              <p className="text-[10px] text-text-secondary leading-relaxed font-sans">
                {selectedItem.description}
              </p>
              {selectedItem.expected_index && (
                <div className="pt-1 flex items-center gap-2 text-[10px]">
                  <span className="text-text-muted">Target SIEM Index:</span>
                  <span className="text-primary font-bold">{selectedItem.expected_index}</span>
                </div>
              )}
            </div>
          )}

          {/* Execution Result Terminal Box */}
          {result && (
            <div className="p-3 rounded bg-[#071017] border border-border-subtle space-y-2">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-primary" />
                  <span className="text-text-primary font-bold">Execution Output:</span>
                  <span className="text-text-muted">ID: {result.simulation_id}</span>
                </div>
                <StatusBadge status={result.status} size="sm" />
              </div>
              <pre className="p-2 rounded bg-surface font-mono text-[10px] text-text-secondary max-h-40 overflow-y-auto whitespace-pre-wrap select-all scrollbar-thin">
                {result.output_preview || "Execution completed without stdout output."}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 border-t border-border-subtle bg-surface flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="soc-btn-secondary text-[11px]"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning || !selectedItem}
            className="soc-btn-primary flex items-center gap-1.5 text-[11px] disabled:opacity-50"
          >
            {isRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isRunning ? "Simulating Threat..." : "Confirm & Run Simulation"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
