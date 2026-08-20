import { apiClient } from "./client";
import { EC2InstanceInfo, NetworkTopology, HostDetailInfo, ApiResponse } from "../types/api";

export const awsApi = {
  getResources: () =>
    apiClient<{ instances: EC2InstanceInfo[]; network: NetworkTopology }>("/api/resources"),

  getHostDetail: (hostKey: string) =>
    apiClient<HostDetailInfo>(`/api/infrastructure/hosts/${hostKey}`),

  startInstances: () =>
    apiClient<ApiResponse>("/api/ec2/start", { method: "POST" }),

  stopInstances: () =>
    apiClient<ApiResponse>("/api/ec2/stop", { method: "POST" }),
};
