import { RuntimeStatus } from "../types/api";

export const runtimeApi = {
  async getStatus(): Promise<RuntimeStatus> {
    const res = await fetch("/api/runtime/status", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to fetch runtime status: ${res.statusText}`);
    }
    return res.json();
  },

  async setMode(mode: "native" | "docker"): Promise<any> {
    const res = await fetch("/api/runtime/mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to update runtime mode.");
    }
    return res.json();
  },
};
