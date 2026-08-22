"use client";

import React, { ReactNode, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { ToastProvider } from "../ui/Toast";
import { operationsApi } from "../../lib/api/operations";
import { profileApi } from "../../lib/api/profile";
import { SystemStatus } from "../../lib/types/api";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface AppShellProps {
  children: ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();

  const [systemStatus, setSystemStatus] = useState<SystemStatus | undefined>(undefined);
  const [isOffline, setIsOffline] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSetupChecked, setIsSetupChecked] = useState(false);

  // Check setup state once on mount
  useEffect(() => {
    profileApi
      .getStatus()
      .then((status) => {
        if (!status.setup_complete && pathname !== "/setup") {
          router.replace("/setup");
        } else if (status.setup_complete && pathname === "/setup") {
          router.replace("/");
        }
        setIsSetupChecked(true);
      })
      .catch(() => {
        setIsSetupChecked(true);
      });
  }, [pathname, router]);

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

  // If on the setup wizard page, render full screen without app shell chrome
  if (pathname === "/setup") {
    return (
      <ToastProvider>
        {children}
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background text-text-primary font-sans antialiased">
        {/* Persistent Collapsible Left Sidebar */}
        {isSidebarOpen && <Sidebar systemStatus={systemStatus} />}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar
            onRefresh={fetchStatus}
            isRefreshing={isRefreshing}
            activeOperation={systemStatus?.active_operation}
            status={systemStatus?.environment_health}
            systemStatus={systemStatus}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />

          {/* Backend Offline Warning Banner */}
          {isOffline && (
            <div className="bg-accent-red/20 border-b border-accent-red/40 px-4 py-2 flex items-center justify-between text-xs text-accent-red">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Control Plane backend disconnected.</strong> Ensure FastAPI is active on port 8080.
                </span>
              </div>
              <button
                onClick={fetchStatus}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-accent-red text-white text-[11px] font-semibold transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Scrollable Main Workspace */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-5 bg-background scrollbar-thin">
            <div className="max-w-7xl mx-auto w-full space-y-5">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
};
