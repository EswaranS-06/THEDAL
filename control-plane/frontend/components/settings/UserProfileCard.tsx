"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Edit3,
  RefreshCw,
  X,
  AlertTriangle,
  Lock,
  Server,
  Layers,
} from "lucide-react";
import { profileApi } from "../../lib/api/profile";
import { UserProfileDetails } from "../../lib/types/api";
import { useToast } from "../ui/Toast";

interface UserProfileCardProps {
  onProfileUpdated?: () => void;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  onProfileUpdated,
}) => {
  const { success, error, info } = useToast();

  const [profile, setProfile] = useState<UserProfileDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplay, setEditDisplay] = useState("");
  const [editUser, setEditUser] = useState("");
  const [editPass, setEditPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [scope, setScope] = useState<"profile_only" | "future_deployments" | "rotate_existing">("future_deployments");
  const [isSaving, setIsSaving] = useState(false);

  const loadProfile = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await profileApi.getDetails();
      setProfile(res);
    } catch (err: any) {
      error("Failed to load profile", err.message);
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleCopyPassword = () => {
    if (!profile?.password) return;
    navigator.clipboard.writeText(profile.password);
    setCopied(true);
    info("Password Copied", "Central password copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartEdit = () => {
    if (!profile) return;
    setEditDisplay(profile.display_name);
    setEditUser(profile.username);
    setEditPass("");
    setConfirmPass("");
    setScope("future_deployments");
    setIsEditing(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDisplay.trim() || !editUser.trim()) {
      error("Validation Error", "Display Name and Username are required.");
      return;
    }

    if (editPass && editPass.length < 8) {
      error("Weak Password", "New password must be at least 8 characters.");
      return;
    }

    if (editPass && editPass !== confirmPass) {
      error("Password Mismatch", "Passwords do not match.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await profileApi.updateProfile({
        display_name: editDisplay.trim(),
        username: editUser.trim(),
        password: editPass.trim() || undefined,
        scope,
      });

      success("Profile Updated", res.message || "Operator profile updated successfully.");
      setIsEditing(false);
      loadProfile();
      if (onProfileUpdated) onProfileUpdated();
    } catch (err: any) {
      error("Update Failed", err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="p-4 rounded-md bg-panel border border-border-subtle animate-pulse space-y-3">
        <div className="h-4 bg-surface rounded w-1/3" />
        <div className="h-10 bg-surface rounded" />
      </div>
    );
  }

  const maskedPassword = profile?.password ? "•".repeat(Math.min(profile.password.length, 16)) : "••••••••••••";

  return (
    <div className="p-4 rounded-md bg-panel border border-border-subtle space-y-4 text-xs font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary/15 border border-primary/40 flex items-center justify-center text-primary font-bold">
            <User className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold font-mono text-text-primary uppercase tracking-wider">
              Operator Profile & Central Password
            </h3>
            <p className="text-[10px] text-text-muted">
              Single source of truth credentials used for Control Plane access and automated provisioning.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleStartEdit}
          className="soc-btn-secondary flex items-center gap-1 text-[11px]"
        >
          <Edit3 className="w-3 h-3" />
          <span>Edit Profile / Password</span>
        </button>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px]">
        {/* Display Name */}
        <div className="p-3 rounded bg-surface border border-border-subtle space-y-1">
          <span className="text-[10px] text-text-muted uppercase">Display Name</span>
          <div className="text-text-primary font-bold text-xs">
            {profile?.display_name || "Analyst"}
          </div>
          <span className="text-[9px] text-text-muted font-sans">Used for UI greeting & header</span>
        </div>

        {/* Username */}
        <div className="p-3 rounded bg-surface border border-border-subtle space-y-1">
          <span className="text-[10px] text-text-muted uppercase">Operator Username</span>
          <div className="text-text-primary font-bold text-xs">
            {profile?.username || "admin"}
          </div>
          <span className="text-[9px] text-text-muted font-sans">Primary local user</span>
        </div>

        {/* Central Password (Masked/Unmasked) */}
        <div className="p-3 rounded bg-surface border border-border-subtle space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-muted uppercase">Central Password</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-text-muted hover:text-text-primary transition-colors p-0.5"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={handleCopyPassword}
                className="text-text-muted hover:text-text-primary transition-colors p-0.5"
                title="Copy password"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div className="text-text-primary font-bold text-xs select-all">
            {showPassword ? profile?.password || "None" : maskedPassword}
          </div>
          <span className="text-[9px] text-text-muted font-sans">Persisted in secrets.yml (0600)</span>
        </div>
      </div>

      {/* Edit Profile & Password Modal */}
      {isEditing && (
        <form onSubmit={handleSaveEdit} className="p-4 rounded bg-surface border border-primary/40 shadow-xl space-y-4 font-sans animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
            <div className="text-xs font-bold font-mono text-primary flex items-center gap-1.5 uppercase">
              <Edit3 className="w-4 h-4" />
              <span>Update Operator Profile & Credentials</span>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="p-1 rounded hover:bg-panel text-text-muted hover:text-text-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
            <div className="space-y-1">
              <label className="text-[10px] text-text-muted uppercase">Display Name *</label>
              <input
                type="text"
                required
                value={editDisplay}
                onChange={(e) => setEditDisplay(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-panel border border-border-subtle text-xs text-text-primary focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-text-muted uppercase">Username *</label>
              <input
                type="text"
                required
                value={editUser}
                onChange={(e) => setEditUser(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-panel border border-border-subtle text-xs text-text-primary focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-text-muted uppercase">
                New Password <span className="text-text-muted text-[9px]">(Leave blank to keep current)</span>
              </label>
              <input
                type="password"
                placeholder="Leave blank to keep existing"
                value={editPass}
                onChange={(e) => setEditPass(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-panel border border-border-subtle text-xs text-text-primary focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-text-muted uppercase">Confirm New Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-panel border border-border-subtle text-xs text-text-primary focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Scope Selector */}
          <div className="space-y-2 border-t border-border-subtle pt-3">
            <label className="text-[11px] font-mono font-bold text-text-primary uppercase flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-accent-blue" />
              <span>Update Scope:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label
                className={`p-2.5 rounded border cursor-pointer transition-colors space-y-1 ${
                  scope === "future_deployments"
                    ? "bg-primary/10 border-primary text-text-primary"
                    : "bg-panel border-border-subtle text-text-muted hover:border-border-default"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="scope"
                    checked={scope === "future_deployments"}
                    onChange={() => setScope("future_deployments")}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="font-bold text-[11px] font-mono text-text-primary">
                    Central & Future (Recommended)
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary pl-5 leading-tight">
                  Updates local profile and updates <code className="text-primary font-mono">secrets.yml</code> for subsequent provisioning.
                </p>
              </label>

              <label
                className={`p-2.5 rounded border cursor-pointer transition-colors space-y-1 ${
                  scope === "rotate_existing"
                    ? "bg-accent-yellow/10 border-accent-yellow text-text-primary"
                    : "bg-panel border-border-subtle text-text-muted hover:border-border-default"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="scope"
                    checked={scope === "rotate_existing"}
                    onChange={() => setScope("rotate_existing")}
                    className="text-accent-yellow focus:ring-accent-yellow"
                  />
                  <span className="font-bold text-[11px] font-mono text-text-primary">
                    Rotate Live Infrastructure
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary pl-5 leading-tight">
                  Updates central secrets and triggers immediate live credential synchronization with Wazuh Manager & Dashboard.
                </p>
              </label>

              <label
                className={`p-2.5 rounded border cursor-pointer transition-colors space-y-1 ${
                  scope === "profile_only"
                    ? "bg-primary/10 border-primary text-text-primary"
                    : "bg-panel border-border-subtle text-text-muted hover:border-border-default"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="scope"
                    checked={scope === "profile_only"}
                    onChange={() => setScope("profile_only")}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="font-bold text-[11px] font-mono text-text-primary">
                    THEDAL Profile Only
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary pl-5 leading-tight">
                  Updates operator display name and Control Plane login only.
                </p>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="soc-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="soc-btn-primary flex items-center gap-1.5"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
              <span>Save & Apply Changes</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
