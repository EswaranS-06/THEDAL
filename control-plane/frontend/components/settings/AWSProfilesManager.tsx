"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Shield,
  Plus,
  MoreVertical,
  Edit3,
  Trash2,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Key,
  Globe,
  X,
} from "lucide-react";
import { settingsApi } from "../../lib/api/settings";
import { AWSProfile } from "../../lib/types/api";
import { StatusBadge } from "../ui/StatusBadge";
import { useToast } from "../ui/Toast";

interface AWSProfilesManagerProps {
  profiles: AWSProfile[];
  onRefresh: () => void;
}

export const AWSProfilesManager: React.FC<AWSProfilesManagerProps> = ({
  profiles,
  onRefresh,
}) => {
  const { success, error, info } = useToast();

  // Menu State
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Add Profile State
  const [isAdding, setIsAdding] = useState(false);
  const [addName, setAddName] = useState("");
  const [addKey, setAddKey] = useState("");
  const [addSecret, setAddSecret] = useState("");
  const [addRegion, setAddRegion] = useState("ap-south-1");
  const [isSaving, setIsSaving] = useState(false);

  // Edit Profile State
  const [editingProfile, setEditingProfile] = useState<AWSProfile | null>(null);
  const [editName, setEditName] = useState("");
  const [editKey, setEditKey] = useState("");
  const [editSecret, setEditSecret] = useState("");
  const [editRegion, setEditRegion] = useState("ap-south-1");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Confirmation State
  const [deletingProfile, setDeletingProfile] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Validating Profile State
  const [validatingProfile, setValidatingProfile] = useState<string | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addKey.trim() || !addSecret.trim()) {
      error("Missing Fields", "Profile name, access key ID, and secret access key are required.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await settingsApi.createProfile({
        profile_name: addName.trim(),
        access_key_id: addKey.trim(),
        secret_access_key: addSecret.trim(),
        region: addRegion.trim() || "ap-south-1",
      });

      if (res.success) {
        success("Profile Saved & Validated", `Profile '${addName}' authenticated with AWS account ${res.account || ""}`);
      } else {
        error("Profile Saved with Error", res.error || "Profile written to ~/.aws/credentials, but STS validation failed.");
      }

      setIsAdding(false);
      setAddName("");
      setAddKey("");
      setAddSecret("");
      onRefresh();
    } catch (err: any) {
      error("Failed to Create Profile", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = (profile: AWSProfile) => {
    setActiveMenu(null);
    setEditingProfile(profile);
    setEditName(profile.name);
    setEditKey("");
    setEditSecret("");
    setEditRegion(profile.region || "ap-south-1");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile || !editName.trim()) {
      error("Validation Error", "Profile name is required.");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await settingsApi.updateProfile({
        old_profile_name: editingProfile.name,
        profile_name: editName.trim(),
        access_key_id: editKey.trim() || undefined,
        secret_access_key: editSecret.trim() || undefined,
        region: editRegion.trim() || "ap-south-1",
      });

      if (res.success) {
        success("Profile Updated", `Profile '${editName}' updated and validated with AWS.`);
      } else {
        error("Profile Updated with Error", res.error || "Profile saved, but STS validation failed.");
      }

      setEditingProfile(null);
      onRefresh();
    } catch (err: any) {
      error("Failed to Update Profile", err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleValidate = async (profileName: string) => {
    setActiveMenu(null);
    setValidatingProfile(profileName);
    try {
      const res = await settingsApi.validateProfile(profileName);
      if (res.valid) {
        success("Profile Validated", `Profile '${profileName}' verified. Account: ${res.account}`);
      } else {
        error("Validation Failed", res.error || `Profile '${profileName}' credentials are invalid.`);
      }
      onRefresh();
    } catch (err: any) {
      error("Validation Error", err.message);
    } finally {
      setValidatingProfile(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingProfile) return;
    setIsDeleting(true);
    try {
      await settingsApi.deleteProfile(deletingProfile);
      success("Profile Deleted", `Profile '${deletingProfile}' was removed from ~/.aws/credentials.`);
      setDeletingProfile(null);
      onRefresh();
    } catch (err: any) {
      error("Failed to Delete Profile", err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 rounded-md bg-panel border border-border-subtle space-y-4 text-xs font-sans">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-accent-blue" />
          <div>
            <h3 className="text-xs font-bold font-mono text-text-primary uppercase tracking-wider">
              AWS Named Profiles
            </h3>
            <p className="text-[10px] text-text-muted">
              Live credentials verified via AWS STS <code className="font-mono text-text-primary">get-caller-identity</code> in <code className="font-mono text-text-primary">~/.aws/credentials</code>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingProfile(null);
          }}
          className="soc-btn-secondary flex items-center gap-1 text-[11px]"
        >
          <Plus className="w-3 h-3" />
          <span>Add Profile</span>
        </button>
      </div>

      {/* Profile List */}
      <div className="space-y-2.5 font-mono text-[11px]">
        {profiles.length === 0 ? (
          <div className="p-4 text-center text-text-muted italic bg-surface/40 rounded border border-border-subtle">
            No named AWS profiles found in ~/.aws/credentials. Click &quot;Add Profile&quot; to configure one.
          </div>
        ) : (
          profiles.map((p) => {
            const isValid = p.valid === true || p.status === "VALID";
            const isCurrentValidating = validatingProfile === p.name;

            return (
              <div
                key={p.name}
                className="p-3 rounded bg-surface border border-border-subtle hover:border-border-default transition-colors space-y-2 relative"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text-primary text-xs">{p.name}</span>
                      {p.name === "default" && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/30 uppercase font-semibold">
                          Default
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-text-muted flex flex-wrap items-center gap-3">
                      {p.account_id && (
                        <span>
                          Account: <strong className="text-text-secondary">{p.account_id}</strong>
                        </span>
                      )}
                      <span>
                        Region: <strong className="text-text-secondary">{p.region || "ap-south-1"}</strong>
                      </span>
                      {p.access_key_preview && (
                        <span>
                          Key: <strong className="text-text-secondary">{p.access_key_preview}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* True Live Validation Badge */}
                    {isCurrentValidating ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-surface text-text-muted border border-border-subtle flex items-center gap-1 animate-pulse">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        <span>Validating...</span>
                      </span>
                    ) : (
                      <StatusBadge status={isValid ? "VALID" : "INVALID"} size="sm" />
                    )}

                    {/* Vertical Three Dots Options Menu */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveMenu(activeMenu === p.name ? null : p.name)}
                        className="p-1 rounded hover:bg-panel text-text-muted hover:text-text-primary transition-colors border border-transparent hover:border-border-subtle"
                        title="Profile Options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenu === p.name && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 top-7 z-30 w-44 rounded-md bg-panel border border-border-subtle shadow-xl py-1 text-left space-y-0.5 font-sans animate-in fade-in zoom-in-95 duration-100"
                        >
                          <button
                            type="button"
                            onClick={() => handleValidate(p.name)}
                            disabled={isCurrentValidating}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
                          >
                            <Activity className="w-3.5 h-3.5 text-accent-blue" />
                            <span>Validate / Test STS</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartEdit(p)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-primary" />
                            <span>Edit Profile</span>
                          </button>

                          <div className="border-t border-border-subtle my-1" />

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenu(null);
                              setDeletingProfile(p.name);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-accent-red hover:bg-accent-red/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Profile</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Error Banner when Invalid */}
                {!isValid && p.error && (
                  <div className="p-2 rounded bg-accent-red/10 border border-accent-red/30 text-accent-red text-[10px] flex items-start gap-1.5 font-sans leading-tight">
                    <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                    <div>
                      <strong>Authentication Failed:</strong> {p.error}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Profile Form */}
      {isAdding && (
        <form onSubmit={handleCreate} className="p-3.5 rounded bg-surface border border-border-subtle space-y-3">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
            <div className="text-xs font-bold font-mono text-text-primary">
              Register New AWS Named Profile
            </div>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="p-1 rounded hover:bg-panel text-text-muted hover:text-text-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-text-muted uppercase">Profile Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. thedal-lab"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-panel border border-border-subtle font-mono text-xs text-text-primary focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-text-muted uppercase">Default Region *</label>
              <input
                type="text"
                required
                value={addRegion}
                onChange={(e) => setAddRegion(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-panel border border-border-subtle font-mono text-xs text-text-primary focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-text-muted uppercase">AWS Access Key ID *</label>
              <input
                type="text"
                required
                placeholder="AKIA..."
                value={addKey}
                onChange={(e) => setAddKey(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-panel border border-border-subtle font-mono text-xs text-text-primary focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-text-muted uppercase">AWS Secret Access Key *</label>
              <input
                type="password"
                required
                placeholder="••••••••••••••••••••"
                value={addSecret}
                onChange={(e) => setAddSecret(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-panel border border-border-subtle font-mono text-xs text-text-primary focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="soc-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="soc-btn-primary flex items-center gap-1.5"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
              <span>Save & Validate Profile</span>
            </button>
          </div>
        </form>
      )}

      {/* Edit Profile Modal / Form */}
      {editingProfile && (
        <form onSubmit={handleUpdate} className="p-3.5 rounded bg-surface border border-primary/40 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
            <div className="text-xs font-bold font-mono text-primary flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit AWS Profile: {editingProfile.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setEditingProfile(null)}
              className="p-1 rounded hover:bg-panel text-text-muted hover:text-text-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-text-muted uppercase">Profile Name *</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-panel border border-border-subtle font-mono text-xs text-text-primary focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-text-muted uppercase">Default Region *</label>
              <input
                type="text"
                required
                value={editRegion}
                onChange={(e) => setEditRegion(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-panel border border-border-subtle font-mono text-xs text-text-primary focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-text-muted uppercase">
                New Access Key ID <span className="text-text-muted text-[9px]">(Leave blank to keep existing)</span>
              </label>
              <input
                type="text"
                placeholder={editingProfile.access_key_preview || "Leave blank to keep current key"}
                value={editKey}
                onChange={(e) => setEditKey(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-panel border border-border-subtle font-mono text-xs text-text-primary focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-text-muted uppercase">
                New Secret Access Key <span className="text-text-muted text-[9px]">(Leave blank to keep existing)</span>
              </label>
              <input
                type="password"
                placeholder="••••••••••••••••••••"
                value={editSecret}
                onChange={(e) => setEditSecret(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-panel border border-border-subtle font-mono text-xs text-text-primary focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => setEditingProfile(null)}
              className="soc-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="soc-btn-primary flex items-center gap-1.5"
            >
              {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Save & Validate Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="w-full max-w-sm rounded-md bg-panel border border-accent-red/40 shadow-2xl p-4 space-y-3 font-sans">
            <div className="flex items-center gap-2 text-accent-red font-bold text-xs">
              <Trash2 className="w-4 h-4" />
              <span>DELETE AWS NAMED PROFILE</span>
            </div>

            <p className="text-[11px] text-text-secondary leading-relaxed">
              Are you sure you want to delete profile <code className="font-mono text-text-primary px-1 py-0.5 rounded bg-surface">{deletingProfile}</code>? This will permanently remove its credentials from <code className="text-text-muted">~/.aws/credentials</code>.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setDeletingProfile(null)}
                disabled={isDeleting}
                className="soc-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="soc-btn-danger flex items-center gap-1.5"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? "Deleting..." : "Delete Profile"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
