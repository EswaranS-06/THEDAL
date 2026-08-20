import { apiClient } from "./client";
import { ApiResponse } from "../types/api";

export const terraformApi = {
  getStatus: () =>
    apiClient<{ status: any; outputs: any; version: string }>("/api/terraform"),

  plan: () =>
    apiClient<ApiResponse>("/api/terraform/plan", { method: "POST" }),

  apply: (confirmation: boolean = true) =>
    apiClient<ApiResponse>("/api/terraform/apply", {
      method: "POST",
      body: JSON.stringify({ action: "apply", confirmation }),
    }),

  destroy: (confirmation: boolean, confirmationPhrase: string) =>
    apiClient<ApiResponse>("/api/terraform/destroy", {
      method: "POST",
      body: JSON.stringify({
        action: "destroy",
        confirmation,
        confirmation_phrase: confirmationPhrase,
      }),
    }),
};
