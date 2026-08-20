import { apiClient } from "./client";
import {
  LabItem,
  LabDetail,
  LabWorkspaceData,
  EvidenceItem,
  CurriculumStats,
  ChallengeSolution,
  SearchResult,
  ApiResponse,
} from "../types/api";

export const learningApi = {
  getLabs: () =>
    apiClient<{ labs: LabItem[]; stats: CurriculumStats }>("/api/learning/labs"),

  getLabDetail: (labId: string) =>
    apiClient<LabDetail>(`/api/learning/labs/${labId}`),

  getWorkspace: (labId: string) =>
    apiClient<LabWorkspaceData>(`/api/learning/labs/${labId}/workspace`),

  getChallenges: () =>
    apiClient<{ challenges: LabItem[] }>("/api/learning/challenges"),

  getChallengeDetail: (challengeId: string) =>
    apiClient<LabDetail>(`/api/learning/challenges/${challengeId}`),

  getChallengeSolution: (challengeId: string) =>
    apiClient<ChallengeSolution>(`/api/learning/challenges/${challengeId}/solution`),

  getStats: () =>
    apiClient<CurriculumStats>("/api/learning/stats"),

  updateProgress: (payload: {
    lab_id: string;
    status?: "Not Started" | "In Progress" | "Completed";
    notes?: string;
    bookmarked?: boolean;
    current_step?: number;
  }) =>
    apiClient<ApiResponse>("/api/learning/progress", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  addEvidence: (payload: {
    lab_id: string;
    source: string;
    event_id?: string;
    timestamp?: string;
    finding: string;
  }) =>
    apiClient<EvidenceItem>("/api/learning/evidence", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  deleteEvidence: (id: number) =>
    apiClient<{ success: boolean; deleted_id: number }>(`/api/learning/evidence/${id}`, {
      method: "DELETE",
    }),

  saveChecklist: (payload: { lab_id: string; checklist: string[] }) =>
    apiClient<{ success: boolean; lab_id: string; checklist: string[] }>("/api/learning/checklist", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  saveVerdict: (payload: { lab_id: string; verdict: string }) =>
    apiClient<{ success: boolean; lab_id: string; verdict: string }>("/api/learning/verdict", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  submitAnswer: (payload: {
    lab_id: string;
    question_id: string;
    selected_option: string;
    is_correct: boolean;
  }) =>
    apiClient<{ success: boolean; question_id: string; is_correct: boolean }>("/api/learning/answers", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  resetLab: (labId: string) =>
    apiClient<{ success: boolean; lab_id: string; message: string }>(`/api/learning/reset/${labId}`, {
      method: "POST",
    }),

  startRequiredHosts: (hostKeys: string[]) =>
    apiClient<{ success: boolean; message?: string }>("/api/learning/start-required-hosts", {
      method: "POST",
      body: JSON.stringify({ host_keys: hostKeys }),
    }),

  search: (query: string) =>
    apiClient<{ query: string; results: SearchResult[] }>(
      `/api/learning/search?q=${encodeURIComponent(query)}`
    ),
};
