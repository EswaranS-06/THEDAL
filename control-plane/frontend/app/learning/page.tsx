"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  CheckCircle2,
  Clock,
  Search,
  ArrowRight,
  ShieldAlert,
  BookOpen,
  Filter,
  Layers,
  Sparkles,
} from "lucide-react";
import { learningApi } from "../../lib/api/learning";
import { LabItem, CurriculumStats, SearchResult } from "../../lib/types/api";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { CardSkeleton } from "../../components/ui/LoadingSkeleton";
import { ErrorState } from "../../components/ui/ErrorState";

export default function LearningPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [labs, setLabs] = useState<LabItem[]>([]);
  const [stats, setStats] = useState<CurriculumStats | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const loadLearningData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await learningApi.getLabs();
      setLabs(res.labs || []);
      setStats(res.stats || null);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load learning curriculum.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLearningData();
  }, []);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q || q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await learningApi.search(q);
      setSearchResults(res.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  if (loading && labs.length === 0) {
    return (
      <div className="space-y-6">
        <CardSkeleton className="h-36" />
        <CardSkeleton className="h-64" />
      </div>
    );
  }

  if (errorMsg && labs.length === 0) {
    return (
      <ErrorState
        title="Failed to Load Learning Portal"
        message={errorMsg}
        onRetry={loadLearningData}
      />
    );
  }

  const level1Labs = labs.filter((l) => l.level_code === "1");
  const level2Labs = labs.filter((l) => l.level_code === "2");
  const level3Labs = labs.filter((l) => l.level_code === "3");

  return (
    <div className="space-y-6">
      {/* 1. Header & Curriculum Progress */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span>SOC Analyst Learning & Investigation Curriculum</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            14 hands-on labs & 3 mystery challenges mapped to MITRE ATT&CK techniques and live telemetry indexes.
          </p>
        </div>

        <Link
          href="/learning/challenges"
          className="px-3.5 py-1.5 rounded bg-amber-950/40 hover:bg-amber-900/60 text-xs font-semibold text-amber-300 border border-amber-600/40 transition-colors flex items-center gap-1.5"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Mystery Challenges (3)</span>
        </Link>
      </div>

      {/* 2. Progress Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Curriculum */}
        <div className="p-4 rounded border border-border-subtle bg-card/60 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Overall Progress</span>
            <span className="font-mono text-primary font-bold">
              {stats?.percent_completed || 0}%
            </span>
          </div>
          <ProgressBar value={stats?.percent_completed || 0} showValue={false} size="sm" />
          <div className="text-[11px] text-slate-400 font-mono">
            {stats?.completed || 0} of {stats?.total_labs || 14} Labs Finished
          </div>
        </div>

        {/* Level 1 */}
        <div className="p-4 rounded border border-border-subtle bg-card/60 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Level 1: Foundations</span>
            <span className="font-mono text-slate-200">
              {stats?.level1?.completed || 0} / {stats?.level1?.total || 4}
            </span>
          </div>
          <ProgressBar
            value={
              stats?.level1?.total
                ? (stats.level1.completed / stats.level1.total) * 100
                : 0
            }
            showValue={false}
            size="sm"
          />
          <div className="text-[11px] text-slate-500">Log anatomy & Sysmon</div>
        </div>

        {/* Level 2 */}
        <div className="p-4 rounded border border-border-subtle bg-card/60 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Level 2: Investigation</span>
            <span className="font-mono text-slate-200">
              {stats?.level2?.completed || 0} / {stats?.level2?.total || 4}
            </span>
          </div>
          <ProgressBar
            value={
              stats?.level2?.total
                ? (stats.level2.completed / stats.level2.total) * 100
                : 0
            }
            showValue={false}
            size="sm"
          />
          <div className="text-[11px] text-slate-500">Web AppSec & Auditd</div>
        </div>

        {/* Level 3 */}
        <div className="p-4 rounded border border-border-subtle bg-card/60 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Level 3: Attack Correlation</span>
            <span className="font-mono text-slate-200">
              {stats?.level3?.completed || 0} / {stats?.level3?.total || 6}
            </span>
          </div>
          <ProgressBar
            value={
              stats?.level3?.total
                ? (stats.level3.completed / stats.level3.total) * 100
                : 0
            }
            showValue={false}
            size="sm"
          />
          <div className="text-[11px] text-slate-500">Atomic Red Team & Triage</div>
        </div>
      </div>

      {/* 3. Continue Learning Banner */}
      {stats?.next_lab && (
        <div className="p-4 rounded border border-primary/40 bg-primary/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-primary tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommended Next Lab</span>
            </div>
            <div className="text-sm font-semibold text-slate-100">
              {stats.next_lab.title}
            </div>
            <div className="text-xs text-slate-400">
              {stats.next_lab.level} • MITRE: <span className="font-mono text-slate-300">{stats.next_lab.mitre}</span> • Telemetry: <span className="font-mono text-slate-300">{stats.next_lab.target_index}</span>
            </div>
          </div>

          <Link
            href={`/learning/labs/${stats.next_lab.id}`}
            className="px-4 py-2 rounded bg-primary hover:bg-primary-hover text-xs font-semibold text-white transition-colors flex items-center gap-1.5 flex-shrink-0"
          >
            <span>Start Investigation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 4. Curriculum Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search labs, runbooks, MITRE techniques (e.g., T1059, Sysmon, SQLi)..."
          className="w-full pl-10 pr-4 py-2 rounded bg-surface border border-border-subtle focus:border-primary focus:outline-none text-slate-100 text-xs placeholder:text-slate-500 shadow-sm"
        />
      </div>

      {/* Search Results Dropdown */}
      {searchQuery.trim().length >= 2 && (
        <div className="rounded border border-border-default bg-card p-4 space-y-3 shadow-xl">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>Search Results for &quot;{searchQuery}&quot;</span>
            <span className="font-mono text-[11px] text-slate-500">{searchResults.length} matches</span>
          </div>

          {searchResults.length === 0 ? (
            <div className="text-xs text-slate-500 italic py-2">
              No matching labs or documentation found.
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((res) => (
                <Link
                  key={res.id}
                  href={res.url}
                  className="p-2.5 rounded bg-surface hover:bg-card-hover border border-border-subtle flex items-start justify-between gap-3 transition-colors block"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{res.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{res.snippet}</div>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-slate-300 border border-border-subtle flex-shrink-0">
                    {res.mitre}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Labs Grouped By Level */}
      <div className="space-y-6">
        {/* Level 1 */}
        <div className="rounded border border-border-subtle bg-card/60 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Level 1: SOC Telemetry Foundations
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Core log formats, Windows EventLogs, Sysmon event IDs, and authentication telemetry.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {level1Labs.filter((l) => l.status === "Completed").length} / {level1Labs.length} Done
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {level1Labs.map((lab) => (
              <Link
                key={lab.id}
                href={`/learning/labs/${lab.id}`}
                className="p-3.5 rounded bg-surface hover:bg-card-hover border border-border-subtle flex items-start justify-between gap-3 transition-all group"
              >
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-primary transition-colors">
                    {lab.title}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Source: <span className="font-mono text-slate-300">{lab.source}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    Index: {lab.target_index} • MITRE: {lab.mitre}
                  </div>
                </div>
                <StatusBadge status={lab.status || "Not Started"} size="sm" />
              </Link>
            ))}
          </div>
        </div>

        {/* Level 2 */}
        <div className="rounded border border-border-subtle bg-card/60 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Level 2: Web Application Security & Linux Triage
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Investigate SQL Injection, Command Injection, LFI, and Docker container attacks.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {level2Labs.filter((l) => l.status === "Completed").length} / {level2Labs.length} Done
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {level2Labs.map((lab) => (
              <Link
                key={lab.id}
                href={`/learning/labs/${lab.id}`}
                className="p-3.5 rounded bg-surface hover:bg-card-hover border border-border-subtle flex items-start justify-between gap-3 transition-all group"
              >
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-primary transition-colors">
                    {lab.title}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Source: <span className="font-mono text-slate-300">{lab.source}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    Index: {lab.target_index} • MITRE: {lab.mitre}
                  </div>
                </div>
                <StatusBadge status={lab.status || "Not Started"} size="sm" />
              </Link>
            ))}
          </div>
        </div>

        {/* Level 3 */}
        <div className="rounded border border-border-subtle bg-card/60 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Level 3: Adversary Correlation & Incident Reconstruction
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Atomic Red Team multi-stage attacks, true-vs-false positive triage, and end-to-end incident timeline reconstruction.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {level3Labs.filter((l) => l.status === "Completed").length} / {level3Labs.length} Done
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {level3Labs.map((lab) => (
              <Link
                key={lab.id}
                href={`/learning/labs/${lab.id}`}
                className="p-3.5 rounded bg-surface hover:bg-card-hover border border-border-subtle flex items-start justify-between gap-3 transition-all group"
              >
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-primary transition-colors">
                    {lab.title}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Source: <span className="font-mono text-slate-300">{lab.source}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    Index: {lab.target_index} • MITRE: {lab.mitre}
                  </div>
                </div>
                <StatusBadge status={lab.status || "Not Started"} size="sm" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
