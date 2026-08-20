import { apiClient } from "./client";
import {
  SettingsConfig,
  DynamicCommandGroup,
  AWSProfile,
  AutoStopStatus,
  ApiResponse,
} from "../types/api";

export const settingsApi = {
  getConfig: () =>
    apiClient<SettingsConfig>("/api/settings/config"),

  getDynamicCommands: () =>
    apiClient<DynamicCommandGroup[]>("/api/commands/dynamic"),

  getProfiles: () =>
    apiClient<AWSProfile[]>("/api/aws/profiles"),

  createProfile: (payload: {
    profile_name: string;
    access_key_id: string;
    secret_access_key: string;
    region?: string;
  }) =>
    apiClient<ApiResponse>("/api/aws/profiles/create", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getAutoStop: () =>
    apiClient<AutoStopStatus>("/api/safety/autostop"),

  configureAutoStop: (payload: { enabled: boolean; grace_period_minutes?: number }) =>
    apiClient<ApiResponse>("/api/safety/autostop", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  ensureSshKey: () =>
    apiClient<ApiResponse>("/api/ssh/ensure-key", { method: "POST" }),
};
