import { apiClient } from "./client";

export interface TerminalSnippet {
  category: string;
  title: string;
  command: string;
  description: string;
}

export interface TerminalSnippetsResponse {
  bastion_ip: string;
  snippets: TerminalSnippet[];
}

export interface TerminalSessionInfo {
  session_id: string;
  title: string;
  cols: number;
  rows: number;
  created_at: string;
  alive: boolean;
}

export interface TerminalSessionsResponse {
  sessions: TerminalSessionInfo[];
}

export interface TerminalExecuteRequest {
  command: string;
  cwd?: string;
  timeout?: number;
}

export interface TerminalExecuteResponse {
  command: string;
  exit_code: number;
  output: string;
  status: "COMPLETED" | "FAILED" | "TIMED_OUT" | "ERROR";
  started_at: string;
  finished_at: string;
  cwd: string;
}

export const terminalApi = {
  getSnippets: () => apiClient<TerminalSnippetsResponse>("/terminal/snippets"),

  listSessions: () => apiClient<TerminalSessionsResponse>("/terminal/sessions"),

  createSession: (title?: string, cols?: number, rows?: number) =>
    apiClient<TerminalSessionInfo>("/terminal/session/create", {
      method: "POST",
      body: JSON.stringify({ title, cols, rows }),
    }),

  closeSession: (sessionId: string) =>
    apiClient<{ session_id: string; closed: boolean }>(`/terminal/session/${sessionId}`, {
      method: "DELETE",
    }),

  executeCommand: (req: TerminalExecuteRequest) =>
    apiClient<TerminalExecuteResponse>("/terminal/execute", {
      method: "POST",
      body: JSON.stringify(req),
    }),
};
