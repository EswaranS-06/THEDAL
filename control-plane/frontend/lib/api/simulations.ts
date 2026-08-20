import {
  SimulationCatalog,
  SimulationRunResult,
  SimulationHistoryItem,
} from "../types/api";

export const simulationsApi = {
  async getCatalog(): Promise<SimulationCatalog> {
    const res = await fetch("/api/simulations/catalog", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to fetch simulation catalog: ${res.statusText}`);
    }
    return res.json();
  },

  async runSimulation(
    simulationType: "atomic" | "web" | "baseline",
    identifier: string,
    confirmation: boolean = true
  ): Promise<SimulationRunResult> {
    const res = await fetch("/api/simulations/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        simulation_type: simulationType,
        identifier,
        confirmation,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Simulation execution failed.");
    }
    return res.json();
  },

  async getHistory(limit: number = 10): Promise<SimulationHistoryItem[]> {
    const res = await fetch(`/api/simulations/history?limit=${limit}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error("Failed to fetch simulation history");
    }
    const data = await res.json();
    return data.history || [];
  },
};
