"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Terminal as TerminalIcon,
  Plus,
  X,
  Play,
  Copy,
  Maximize2,
  Minimize2,
  Trash2,
  Sparkles,
  Search,
  Code
} from "lucide-react";
import { terminalApi, TerminalSnippet } from "../../lib/api/terminal";
import { useToast } from "../../components/ui/Toast";

interface TabSession {
  id: string;
  title: string;
  history: string[];
  historyIndex: number;
  output: string;
  isRunning: boolean;
  wsConnected: boolean;
}

export default function TerminalPage() {
  const { success, warning, info, error } = useToast();
  const [tabs, setTabs] = useState<TabSession[]>([
    {
      id: "term-1",
      title: "Shell 1",
      history: [],
      historyIndex: -1,
      output: "\x1b[36m=================================================================\n THEDAL Interactive Web Terminal — Multi-Session PTY\n Target Directory: /home/rex/Documents/Projects\n Type 'help', run commands, or use the Quick Snippets below.\n=================================================================\x1b[0m\n\n",
      isRunning: false,
      wsConnected: false,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>("term-1");
  const [currentInput, setCurrentInput] = useState<string>("");
  const [snippets, setSnippets] = useState<TerminalSnippet[]>([]);
  const [bastionIp, setBastionIp] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(13);
  const [autoScroll] = useState<boolean>(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [searchSnippet, setSearchSnippet] = useState<string>("");

  const wsMapRef = useRef<{ [key: string]: WebSocket }>({});
  const outputContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Load snippets on mount
  useEffect(() => {
    async function loadSnippets() {
      try {
        const res = await terminalApi.getSnippets();
        setSnippets(res.snippets || []);
        setBastionIp(res.bastion_ip || "");
      } catch (err) {
        console.error("Failed to load snippets", err);
      }
    }
    loadSnippets();
  }, []);

  const appendOutput = useCallback((tabId: string, text: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, output: t.output + text } : t))
    );
  }, []);

  // Initialize or maintain WebSocket connection for active tab
  useEffect(() => {
    if (!activeTabId) return;

    if (wsMapRef.current[activeTabId] && wsMapRef.current[activeTabId].readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/ws/terminal/${activeTabId}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setTabs((prev) =>
          prev.map((t) => (t.id === activeTabId ? { ...t, wsConnected: true } : t))
        );
      };

      ws.onmessage = (event) => {
        let text = "";
        if (typeof event.data === "string") {
          text = event.data;
        } else if (event.data instanceof Blob) {
          event.data.text().then((t) => {
            appendOutput(activeTabId, t);
          });
          return;
        }
        appendOutput(activeTabId, text);
      };

      ws.onclose = () => {
        setTabs((prev) =>
          prev.map((t) => (t.id === activeTabId ? { ...t, wsConnected: false } : t))
        );
      };

      ws.onerror = () => {
        setTabs((prev) =>
          prev.map((t) => (t.id === activeTabId ? { ...t, wsConnected: false } : t))
        );
      };

      wsMapRef.current[activeTabId] = ws;
    } catch (err) {
      console.warn("WebSocket not supported or failed to connect, using direct REST execution fallback.", err);
    }
  }, [activeTabId, appendOutput]);

  // Auto-scroll on output update
  useEffect(() => {
    if (autoScroll && outputContainerRef.current) {
      outputContainerRef.current.scrollTop = outputContainerRef.current.scrollHeight;
    }
  }, [activeTab?.output, autoScroll]);

  // Create new Tab
  const handleCreateTab = (customTitle?: string) => {
    const newId = `term-${Date.now().toString().slice(-5)}`;
    const newTitle = customTitle || `Shell ${tabs.length + 1}`;
    const newTab: TabSession = {
      id: newId,
      title: newTitle,
      history: [],
      historyIndex: -1,
      output: `\x1b[32m[Session ${newTitle} initialized]\x1b[0m\n$ `,
      isRunning: false,
      wsConnected: false,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Close Tab
  const handleCloseTab = (tabId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (tabs.length === 1) {
      warning("Cannot close the only open terminal tab.");
      return;
    }
    const ws = wsMapRef.current[tabId];
    if (ws) {
      ws.close();
      delete wsMapRef.current[tabId];
    }
    terminalApi.closeSession(tabId).catch(() => {});

    const remaining = tabs.filter((t) => t.id !== tabId);
    setTabs(remaining);
    if (activeTabId === tabId) {
      setActiveTabId(remaining[0].id);
    }
  };

  // Send Command to Active Tab
  const handleSendCommand = async (commandToSend?: string) => {
    const cmd = (commandToSend !== undefined ? commandToSend : currentInput).trim();
    if (!cmd) return;

    const targetTabId = activeTabId;
    setCurrentInput("");

    // Update command history
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id === targetTabId) {
          const newHist = [cmd, ...t.history.filter((h) => h !== cmd)];
          return {
            ...t,
            history: newHist,
            historyIndex: -1,
            output: t.output + `\x1b[1;36m$ ${cmd}\x1b[0m\n`,
            isRunning: true,
          };
        }
        return t;
      })
    );

    const ws = wsMapRef.current[targetTabId];
    if (ws && ws.readyState === WebSocket.OPEN) {
      // Send via interactive WebSocket PTY
      ws.send(cmd + "\n");
      setTabs((prev) =>
        prev.map((t) => (t.id === targetTabId ? { ...t, isRunning: false } : t))
      );
    } else {
      // Fallback: Synchronous REST execution
      try {
        const res = await terminalApi.executeCommand({ command: cmd });
        setTabs((prev) =>
          prev.map((t) => {
            if (t.id === targetTabId) {
              const statusColor = res.exit_code === 0 ? "\x1b[32m" : "\x1b[31m";
              return {
                ...t,
                output:
                  t.output +
                  res.output +
                  `\n${statusColor}[Process exited with code ${res.exit_code}]\x1b[0m\n\n$ `,
                isRunning: false,
              };
            }
            return t;
          })
        );
      } catch (err: any) {
        setTabs((prev) =>
          prev.map((t) => {
            if (t.id === targetTabId) {
              return {
                ...t,
                output:
                  t.output +
                  `\x1b[31m[Execution Error: ${err.message || "Failed to run command"}]\x1b[0m\n\n$ `,
                isRunning: false,
              };
            }
            return t;
          })
        );
      }
    }
  };

  // Keyboard navigation for command history
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendCommand();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!activeTab.history.length) return;
      const nextIndex = Math.min(activeTab.history.length - 1, activeTab.historyIndex + 1);
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, historyIndex: nextIndex } : t))
      );
      setCurrentInput(activeTab.history[nextIndex]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (activeTab.historyIndex <= 0) {
        setTabs((prev) =>
          prev.map((t) => (t.id === activeTabId ? { ...t, historyIndex: -1 } : t))
        );
        setCurrentInput("");
      } else {
        const nextIndex = activeTab.historyIndex - 1;
        setTabs((prev) =>
          prev.map((t) => (t.id === activeTabId ? { ...t, historyIndex: nextIndex } : t))
        );
        setCurrentInput(activeTab.history[nextIndex]);
      }
    } else if (e.ctrlKey && e.key === "c") {
      // Send Ctrl+C
      e.preventDefault();
      const ws = wsMapRef.current[activeTabId];
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send("\x03");
      }
      appendOutput(activeTabId, "^C\n$ ");
    } else if (e.ctrlKey && e.key === "l") {
      // Clear screen
      e.preventDefault();
      handleClearOutput();
    }
  };

  const handleClearOutput = () => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, output: "$ " } : t))
    );
  };

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(activeTab.output.replace(/\x1b\[[0-9;]*m/g, ""));
    success("Terminal output copied to clipboard");
  };

  // Simple ANSI text formatter to HTML
  const renderAnsi = (text: string) => {
    const clean = text
      .replace(/\x1b\[0m/g, "</span>")
      .replace(/\x1b\[1m/g, '<span class="font-bold">')
      .replace(/\x1b\[31m/g, '<span class="text-rose-400">')
      .replace(/\x1b\[32m/g, '<span class="text-emerald-400">')
      .replace(/\x1b\[33m/g, '<span class="text-amber-400">')
      .replace(/\x1b\[34m/g, '<span class="text-blue-400">')
      .replace(/\x1b\[35m/g, '<span class="text-purple-400">')
      .replace(/\x1b\[36m/g, '<span class="text-cyan-400">')
      .replace(/\x1b\[1;36m/g, '<span class="font-bold text-cyan-300">')
      .replace(/\x1b\[1;32m/g, '<span class="font-bold text-emerald-300">')
      .replace(/\x1b\[1;31m/g, '<span class="font-bold text-rose-300">');

    return { __html: clean };
  };

  const filteredSnippets = snippets.filter(
    (s) =>
      s.title.toLowerCase().includes(searchSnippet.toLowerCase()) ||
      s.command.toLowerCase().includes(searchSnippet.toLowerCase()) ||
      s.category.toLowerCase().includes(searchSnippet.toLowerCase())
  );

  return (
    <div
      className={`flex flex-col h-full bg-[#030712] text-slate-100 font-sans ${
        isFullscreen ? "fixed inset-0 z-50 p-3" : "p-4 space-y-3"
      }`}
    >
      {/* Top Header & Node Quick-Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#081120] border border-slate-800 p-3 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <TerminalIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold font-mono text-white">
                Web Terminal Shell
              </h1>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {activeTab.wsConnected ? "LIVE PTY WS" : "REST EXECUTION"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Working Dir: <code className="text-cyan-400">~/THEDAL</code> • Bastion:{" "}
              <code className="text-amber-400">{bastionIp || "10.10.1.10"}</code>
            </p>
          </div>
        </div>

        {/* Quick Actions & Snippets Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all ${
              isDrawerOpen
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Quick Commands ({snippets.length})</span>
          </button>

          <button
            onClick={() => handleCreateTab()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono text-xs font-bold transition-all shadow-[0_0_12px_rgba(0,242,254,0.3)]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Shell Tab</span>
          </button>
        </div>
      </div>

      {/* Main Terminal Body Layout */}
      <div className="flex-1 flex gap-3 min-h-0">
        {/* Terminal Container */}
        <div className="flex-1 flex flex-col rounded-xl border border-slate-800 bg-[#040814] overflow-hidden shadow-2xl">
          {/* Multi-Tab Navigation Bar */}
          <div className="flex items-center justify-between bg-[#060d1b] border-b border-slate-800 px-2 pt-2">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1">
              {tabs.map((tab) => {
                const isActive = tab.id === activeTabId;
                return (
                  <div
                    key={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
                    className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-lg font-mono text-xs cursor-pointer border-t border-x transition-all select-none ${
                      isActive
                        ? "bg-[#040814] border-slate-700 text-cyan-300 font-bold border-b-[#040814] relative z-10"
                        : "bg-[#081326]/60 border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#081326]"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        tab.isRunning
                          ? "bg-amber-400 animate-ping"
                          : tab.wsConnected
                          ? "bg-emerald-400"
                          : "bg-cyan-400"
                      }`}
                    />
                    <span>{tab.title}</span>
                    <button
                      onClick={(e) => handleCloseTab(tab.id, e)}
                      className="p-0.5 rounded hover:bg-slate-700 text-slate-500 hover:text-rose-400 opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              <button
                onClick={() => handleCreateTab()}
                className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors ml-1"
                title="Open new terminal tab"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Terminal Window Controls */}
            <div className="flex items-center gap-1.5 pb-1 text-slate-400 text-xs font-mono">
              <button
                onClick={() => setFontSize(Math.max(10, fontSize - 1))}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[11px] border border-slate-800"
                title="Decrease font size"
              >
                A-
              </button>
              <button
                onClick={() => setFontSize(Math.min(18, fontSize + 1))}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[11px] border border-slate-800"
                title="Increase font size"
              >
                A+
              </button>
              <button
                onClick={handleClearOutput}
                className="p-1 rounded bg-slate-900 hover:bg-slate-800 hover:text-white border border-slate-800"
                title="Clear terminal (Ctrl+L)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCopyOutput}
                className="p-1 rounded bg-slate-900 hover:bg-slate-800 hover:text-emerald-400 border border-slate-800"
                title="Copy output"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1 rounded bg-slate-900 hover:bg-slate-800 hover:text-cyan-400 border border-slate-800"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Interactive Shell Output Stream */}
          <div
            ref={outputContainerRef}
            style={{ fontSize: `${fontSize}px` }}
            className="flex-1 p-4 overflow-y-auto font-mono text-slate-200 leading-relaxed select-text whitespace-pre-wrap break-all"
            onClick={() => inputRef.current?.focus()}
          >
            <div dangerouslySetInnerHTML={renderAnsi(activeTab.output)} />
          </div>

          {/* Command Prompt Input Bar */}
          <div className="p-2.5 bg-[#060e1d] border-t border-slate-800 flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-cyan-400 shrink-0 select-none">
              rex@thedal:~/THEDAL$
            </span>
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type command (e.g. make ping, terraform output, or ssh) and press Enter..."
              className="flex-1 bg-transparent text-white font-mono text-xs focus:outline-none placeholder:text-slate-600"
              autoFocus
            />
            <button
              onClick={() => handleSendCommand()}
              disabled={!currentInput.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:hover:bg-cyan-500 text-black font-mono text-xs font-bold transition-all shrink-0"
            >
              <Play className="w-3 h-3 fill-black" />
              <span>RUN</span>
            </button>
          </div>
        </div>

        {/* Quick Command Snippets Sidebar / Drawer */}
        {isDrawerOpen && (
          <div className="w-80 sm:w-96 rounded-xl border border-slate-800 bg-[#060d1b] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-3 border-b border-slate-800 bg-[#081326] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-white">
                  Quick Command Matrix
                </span>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded hover:bg-slate-700 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-2 border-b border-slate-800 bg-[#040914]">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchSnippet}
                  onChange={(e) => setSearchSnippet(e.target.value)}
                  placeholder="Filter commands..."
                  className="bg-transparent text-white font-mono text-xs focus:outline-none w-full"
                />
              </div>
            </div>

            {/* Snippets List */}
            <div className="flex-1 p-2 space-y-2 overflow-y-auto scrollbar-thin">
              {filteredSnippets.map((snippet, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-[#040816] border border-slate-800 hover:border-cyan-500/40 transition-colors space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white text-[11px]">
                      {snippet.title}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {snippet.category}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                    {snippet.description}
                  </p>

                  <pre className="p-1.5 rounded bg-slate-950 text-cyan-300 font-mono text-[10px] whitespace-pre-wrap break-all border border-slate-800/80">
                    <code>{snippet.command}</code>
                  </pre>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(snippet.command);
                        success("Command copied");
                      }}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300"
                    >
                      COPY
                    </button>
                    <button
                      onClick={() => {
                        handleSendCommand(snippet.command);
                        info(`Dispatched to ${activeTab.title}`);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>PASTE & RUN</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
