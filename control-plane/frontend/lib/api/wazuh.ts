import { WazuhDetailedHealth, WazuhRepairResult } from "../types/api";

export const wazuhApi = {
  async getDetailedHealth(): Promise<WazuhDetailedHealth> {
    const res = await fetch("/api/wazuh/health", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to fetch Wazuh detailed health: ${res.statusText}`);
    }
    return res.json();
  },

  async verifyAuth(): Promise<any> {
    const res = await fetch("/api/wazuh/verify-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Authentication verification failed.");
    }
    return res.json();
  },

  async repairConfiguration(): Promise<WazuhRepairResult> {
    const res = await fetch("/api/wazuh/repair", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Wazuh configuration repair failed.");
    }
    return res.json();
  },

  async rotateCredentials(): Promise<WazuhRepairResult> {
    const res = await fetch("/api/wazuh/rotate-credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Credential rotation failed.");
    }
    return res.json();
  },
};
