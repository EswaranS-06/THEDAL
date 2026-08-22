import {
  UserProfileStatus,
  UserProfileDetails,
  InitialSetupInput,
  ProfileUpdateInput,
  ApiResponse,
} from "../types/api";

export const profileApi = {
  async getStatus(): Promise<UserProfileStatus> {
    const res = await fetch("/api/profile/status", { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Failed to fetch profile status");
    }
    return res.json();
  },

  async getDetails(): Promise<UserProfileDetails> {
    const res = await fetch("/api/profile/details", { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Failed to fetch profile details");
    }
    return res.json();
  },

  async setupInitial(payload: InitialSetupInput): Promise<ApiResponse> {
    const res = await fetch("/api/profile/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Initial setup failed");
    }
    return res.json();
  },

  async updateProfile(payload: ProfileUpdateInput): Promise<ApiResponse> {
    const res = await fetch("/api/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Profile update failed");
    }
    return res.json();
  },
};
