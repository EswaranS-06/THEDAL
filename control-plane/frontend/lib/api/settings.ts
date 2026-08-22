import { apiClient } from "./client";
import {
  SettingsConfig,
  DynamicCommand,
  DynamicCommandGroup,
  AWSProfile,
  AutoStopStatus,
  ApiResponse,
  AWSProfileCreateInput,
  AWSProfileUpdateInput,
  AWSProfileOperationResponse,
} from "../types/api";

export const settingsApi = {
  getConfig: () =>
    apiClient<SettingsConfig>("/api/settings/config"),

  getDynamicCommands: () =>
    apiClient<DynamicCommand[]>("/api/commands/dynamic"),

  getProfiles: () =>
    apiClient<AWSProfile[]>("/api/aws/profiles"),

  createProfile: (payload: AWSProfileCreateInput) =>
    apiClient<AWSProfileOperationResponse>("/api/aws/profiles/create", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateProfile: (payload: AWSProfileUpdateInput) =>
    apiClient<AWSProfileOperationResponse>("/api/aws/profiles/update", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  validateProfile: (profileName: string) =>
    apiClient<AWSProfileOperationResponse>("/api/aws/profiles/validate", {
      method: "POST",
      body: JSON.stringify({ profile_name: profileName }),
    }),

  deleteProfile: (profileName: string) =>
    apiClient<AWSProfileOperationResponse>(`/api/aws/profiles/${encodeURIComponent(profileName)}`, {
      method: "DELETE",
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
