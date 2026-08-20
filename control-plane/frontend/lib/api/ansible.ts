import { apiClient } from "./client";
import { ApiResponse } from "../types/api";

export const ansibleApi = {
  generateInventory: () =>
    apiClient<ApiResponse>("/api/inventory/generate", { method: "POST" }),

  runPlaybook: (playbookKey: string, confirmation: boolean = true) =>
    apiClient<ApiResponse>("/api/ansible/playbook", {
      method: "POST",
      body: JSON.stringify({
        action: "playbook",
        target: playbookKey,
        confirmation,
      }),
    }),

  runFullProvision: (confirmation: boolean = true) =>
    apiClient<ApiResponse>("/api/ansible/provision", {
      method: "POST",
      body: JSON.stringify({ action: "full_provision", confirmation }),
    }),
};
