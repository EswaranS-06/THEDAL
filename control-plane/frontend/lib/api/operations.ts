import { apiClient } from "./client";
import { OperationDetail, OperationLogMeta, SystemStatus } from "../types/api";

export const operationsApi = {
  getSystemStatus: () =>
    apiClient<SystemStatus>("/api/status"),

  listOperations: () =>
    apiClient<{ active_operation: string | null; logs: OperationLogMeta[] }>("/api/operations/list"),

  getOperationDetail: (filename: string) =>
    apiClient<OperationDetail>(`/api/operations/detail/${filename}`),

  getDownloadUrl: (filename: string) =>
    `/api/logs/download?file=${encodeURIComponent(filename)}`,

  startWazuhTunnel: () =>
    apiClient<{ success: boolean; port?: number; message?: string; error?: string }>("/api/wazuh/tunnel/start", {
      method: "POST",
    }),
};
