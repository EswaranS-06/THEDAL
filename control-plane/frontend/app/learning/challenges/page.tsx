"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  Key,
  HelpCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { learningApi } from "../../../lib/api/learning";
import { LabItem } from "../../../lib/types/api";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { CardSkeleton } from "../../../components/ui/LoadingSkeleton";
import { ErrorState } from "../../../components/ui/ErrorState";

export default function ChallengesPage() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<LabItem[]>([]);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await learningApi.getChallenges();
      setChallenges(res.challenges || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load mystery challenges.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, []);

  if (loading && challenges.length === 0) {
    return (
      <div className="space-y-6">
        <CardSkeleton className="h-28" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton className="h-64" />
          <CardSkeleton className="h-64" />
          <CardSkeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (errorMsg && challenges.length === 0) {
    return (
      <ErrorState
        title="Failed to Load Challenges"
        message={errorMsg}
        onRetry={loadChallenges}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="space-y-2">
        <Link
          href="/learning"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Curriculum Overview</span>
        </Link>

        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>Mystery Investigation Challenges</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Unguided threat hunting scenarios. Formulate hypotheses, craft OpenSearch queries, and analyze real security events.
          </p>
        </div>
      </div>

      {/* Challenge Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {challenges.map((c) => (
          <div
            key={c.id}
            className="rounded border border-border-subtle bg-card/60 p-5 flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-colors"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-600/30 uppercase font-semibold">
                  Mystery Tier
                </span>
                <StatusBadge status={c.status || "Not Started"} size="sm" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">{c.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Source: <span className="font-mono text-slate-300">{c.source}</span>
                <br />
                Target Index: <span className="font-mono text-slate-300">{c.target_index}</span>
              </p>
            </div>

            <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Solutions Protected</span>
              <Link
                href={`/learning/challenges/${c.id}`}
                className="px-3.5 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
              >
                <span>Enter Scenario</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
