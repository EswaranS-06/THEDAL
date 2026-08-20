import {
  ManagementIPStatus,
  ManagementIPPreviewResult,
  ManagementIPSyncResult,
  ManagementIPHistoryItem,
} from "../types/api";

const BASE_URL = "/api/management-ip";

export const managementIpApi = {
  /**
   * Retrieves current status: detected public IP, configured CIDR, mismatch/drift state, and port 22 status.
   */
  async getStatus(): Promise<ManagementIPStatus> {
    const res = await fetch(`${BASE_URL}/status`, { cache: "no-store" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to fetch management IP status" }));
      throw new Error(err.detail || "Failed to fetch management IP status");
    }
    return res.json();
  },

  /**
   * Generates a dry-run Terraform plan preview for the proposed CIDR.
   */
  async previewSync(cidr: string): Promise<ManagementIPPreviewResult> {
    const res = await fetch(`${BASE_URL}/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cidr }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to generate Terraform plan preview" }));
      throw new Error(err.detail || "Failed to generate Terraform plan preview");
    }
    return res.json();
  },

  /**
   * Applies the CIDR change via Terraform and verifies TCP port 22 connectivity.
   */
  async applySync(
    cidr: string,
    mode: string = "automatic",
    understandOpenRisk: boolean = false
  ): Promise<ManagementIPSyncResult> {
    const res = await fetch(`${BASE_URL}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cidr,
        mode,
        confirmation: true,
        understand_open_risk: understandOpenRisk,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to apply management IP update" }));
      throw new Error(err.detail || "Failed to apply management IP update");
    }
    return res.json();
  },

  /**
   * Runs an on-demand TCP port 22 check.
   */
  async checkConnectivity(host?: string, port: number = 22): Promise<{ reachable: boolean; host?: string; port: number; message?: string }> {
    const res = await fetch(`${BASE_URL}/check-connectivity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ host, port }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to check port 22 connectivity" }));
      throw new Error(err.detail || "Failed to check port 22 connectivity");
    }
    return res.json();
  },

  /**
   * Retrieves recent management IP sync history.
   */
  async getHistory(limit: number = 5): Promise<ManagementIPHistoryItem[]> {
    const res = await fetch(`${BASE_URL}/history?limit=${limit}`, { cache: "no-store" });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return data.history || [];
  },
};
