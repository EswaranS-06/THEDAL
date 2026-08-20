import { apiClient } from "./client";
import {
  LabItem,
  LabDetail,
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
  }) =>
    apiClient<ApiResponse>("/api/learning/progress", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  search: (query: string) =>
    apiClient<{ query: string; results: SearchResult[] }>(
      `/api/learning/search?q=${encodeURIComponent(query)}`
    ),
};
