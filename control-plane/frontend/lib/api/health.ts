import { apiClient } from "./client";
import { HealthCheckSummary, ApiResponse } from "../types/api";

export const healthApi = {
  getSummary: () =>
    apiClient<HealthCheckSummary>("/api/health"),

  runCheck: () =>
    apiClient<{ success: boolean; health: HealthCheckSummary }>("/api/health/check", {
      method: "POST",
    }),
};
