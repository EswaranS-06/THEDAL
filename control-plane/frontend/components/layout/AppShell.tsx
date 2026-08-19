"use client";

import React, { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { ToastProvider } from "../ui/Toast";
import { operationsApi } from "../../lib/api/operations";
import { SystemStatus } from "../../lib/types/api";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface AppShellProps {
  children: ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | undefined>(undefined);
  const [isOffline, setIsOffline] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStatus = async () => {
    setIsRefreshing(true);
    try {
      const res = await operationsApi.getSystemStatus();
      setSystemStatus(res);
      setIsOffline(false);
    } catch (err: any) {
      if (err.data?.isNetworkError || err.status === 0) {
        setIsOffline(true);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000); // 15s gentle polling
    return () => clearInterval(interval);
  }, []);

  return (
    <ToastProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background text-slate-100 font-sans">
        {/* Sidebar */}
        <Sidebar systemStatus={systemStatus} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar
            onRefresh={fetchStatus}
            isRefreshing={isRefreshing}
            activeOperation={systemStatus?.active_operation}
            status={systemStatus?.environment_health}
          />

          {/* Backend Offline Warning Banner */}
          {isOffline && (
            <div className="bg-rose-950/80 border-b border-rose-800/60 px-6 py-2.5 flex items-center justify-between text-xs text-rose-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>
                  <strong>THEDAL backend is unavailable.</strong> Ensure the FastAPI server is running on <code className="font-mono text-rose-100">127.0.0.1:8080</code>.
                </span>
              </div>
              <button
                onClick={fetchStatus}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-900 hover:bg-rose-800 text-rose-100 text-xs font-semibold transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry Connection</span>
              </button>
            </div>
          )}

          {/* Scrollable Page Body */}
          <main className="flex-1 overflow-y-auto p-6 bg-background">
            <div className="max-w-7xl mx-auto w-full space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
};
