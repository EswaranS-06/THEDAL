"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  User,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Terminal,
  Lock,
} from "lucide-react";
import { profileApi } from "../../lib/api/profile";
import { useToast } from "../../components/ui/Toast";

export default function SetupPage() {
  const router = useRouter();
  const { success, error } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  // If setup is already complete, redirect to dashboard
  useEffect(() => {
    profileApi
      .getStatus()
      .then((status) => {
        if (status.setup_complete) {
          router.replace("/");
        } else {
          setCheckingSetup(false);
        }
      })
      .catch(() => {
        setCheckingSetup(false);
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim() || !username.trim() || !password.trim()) {
      error("Missing Information", "Please fill in all required setup fields.");
      return;
    }

    if (password.length < 8) {
      error("Weak Password", "Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      error("Password Mismatch", "Password and Confirmation do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await profileApi.setupInitial({
        display_name: displayName.trim(),
        username: username.trim(),
        password: password.trim(),
      });

      success("Setup Complete", `Welcome, ${displayName}! THEDAL is ready.`);
      router.replace("/");
    } catch (err: any) {
      error("Setup Failed", err.message || "Could not complete initial setup.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingSetup) {
    return (
      <div className="min-h-screen bg-[#050B10] flex items-center justify-center">
        <div className="flex items-center gap-2 text-primary font-mono text-xs">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Verifying THEDAL initialization status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050B10] text-text-primary flex flex-col items-center justify-center p-4 selection:bg-primary/30 selection:text-white">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/40 text-primary shadow-lg shadow-primary/10 mb-2">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold font-mono tracking-wider text-text-primary">
            THEDAL INITIAL SETUP
          </h1>
          <p className="text-xs text-text-muted max-w-md mx-auto leading-relaxed">
            Welcome to <strong>THEDAL</strong> (Threat Hunting, Exploration, Detection, Analysis & Learn). Configure your operator profile and central credential source below.
          </p>
        </div>

        {/* Setup Card */}
        <div className="p-6 rounded-lg bg-panel border border-border-subtle shadow-2xl space-y-5">
          <div className="border-b border-border-subtle pb-3">
            <h2 className="text-xs font-bold font-mono text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              <span>Operator Profile & Central Password</span>
            </h2>
            <p className="text-[10px] text-text-muted mt-0.5">
              These credentials become the single source of truth for the Control Plane and compatible lab services.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-text-muted uppercase flex items-center justify-between">
                <span>Display Name *</span>
                <span className="text-[10px] text-text-muted font-sans">(e.g. Rex, Analyst Alex)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded bg-surface border border-border-subtle font-mono text-xs text-text-primary focus:border-primary focus:outline-none"
                />
                <User className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-text-muted uppercase flex items-center justify-between">
                <span>Primary Username *</span>
                <span className="text-[10px] text-text-muted font-sans">(Used for operator authentication)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. rex or admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded bg-surface border border-border-subtle font-mono text-xs text-text-primary focus:border-primary focus:outline-none"
                />
                <Shield className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Central Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-text-muted uppercase flex items-center justify-between">
                <span>Central Password *</span>
                <span className="text-[10px] text-text-muted font-sans">(Minimum 8 characters)</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded bg-surface border border-border-subtle font-mono text-xs text-text-primary focus:border-primary focus:outline-none"
                />
                <KeyRound className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-text-muted uppercase">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded bg-surface border border-border-subtle font-mono text-xs text-text-primary focus:border-primary focus:outline-none"
                />
                <Lock className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Informational Callout */}
            <div className="p-3 rounded bg-surface/80 border border-border-subtle space-y-1 text-[11px] text-text-secondary leading-relaxed">
              <div className="flex items-center gap-1.5 text-primary font-bold font-mono text-[10px] uppercase">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Single Source of Truth Architecture</span>
              </div>
              <p>
                Your central password will be saved in your local secured environment (<code className="font-mono text-text-primary">ansible/inventory/secrets.yml</code> with <code className="font-mono text-text-primary">0600</code> permissions) and injected into automated deployments. You can view or change this password anytime in <strong>Settings</strong>.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded bg-primary hover:bg-primary-hover font-mono text-xs font-bold text-white flex items-center justify-center gap-2 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Initializing THEDAL...</span>
                </>
              ) : (
                <>
                  <span>Complete Setup & Launch THEDAL</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-[10px] font-mono text-text-muted">
          THEDAL Laboratory Platform • Local First Architecture
        </p>
      </div>
    </div>
  );
}
