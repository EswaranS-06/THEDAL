import React, { useState } from 'react';
import {
  Terminal,
  Play,
  Shield,
  Zap,
  Server,
  Database,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  Cpu,
  Flame,
  Activity,
  Layers
} from 'lucide-react';
import { StatBadge } from './ui/StatBadge';

export const Hero: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'powershell' | 'sqli' | 'task'>('powershell');
  const [simState, setSimState] = useState<'idle' | 'running' | 'completed'>('idle');

  const scenarios = {
    powershell: {
      technique: 'T1059.001',
      title: 'PowerShell Encoded ScriptBlock',
      category: 'Execution & Defense Evasion',
      cmd: 'pwsh -EncodedCommand JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdAAg... -NonInteractive',
      target: 'THEDAL-windows (10.10.10.20)',
      index: 'socforge-powershell-*',
      event: {
        event_id: 4104,
        channel: 'Microsoft-Windows-PowerShell/Operational',
        scriptblock: 'Invoke-Mimikatz -DumpCreds (Simulation Hook)',
        parent_process: 'explorer.exe (PID: 3412)',
        detection_rule: 'Wazuh Rule 91802: PowerShell Suspicious Encoded Payload',
        severity: 'HIGH (Level 12)',
      },
    },
    sqli: {
      technique: 'T1190',
      title: 'DVWA Boolean SQL Injection',
      category: 'Initial Access / Public Web Exploitation',
      cmd: "curl -s 'http://10.10.30.10:8000/vulnerabilities/sqli/?id=1%27+OR+%271%27%3D%271&Submit=Submit'",
      target: 'THEDAL-web (10.10.30.10:8000)',
      index: 'socforge-nginx-access-*',
      event: {
        event_id: 'HTTP_200_INJECTION',
        uri: '/vulnerabilities/sqli/?id=1\' OR \'1\'=\'1',
        src_ip: '10.10.20.10 (THEDAL-attack)',
        detection_rule: 'Wazuh Rule 31101: Web SQL Injection Pattern Detected',
        severity: 'CRITICAL (Level 14)',
      },
    },
    task: {
      technique: 'T1053.005',
      title: 'Scheduled Task Persistence',
      category: 'Persistence & Privilege Escalation',
      cmd: 'schtasks /create /tn "SOCUpdater" /tr "powershell.exe -w hidden" /sc onlogon',
      target: 'THEDAL-windows (10.10.10.20)',
      index: 'socforge-sysmon-*',
      event: {
        event_id: 1,
        image: 'C:\\Windows\\System32\\schtasks.exe',
        command_line: 'schtasks.exe /create /tn SOCUpdater /tr powershell.exe',
        detection_rule: 'Wazuh Rule 61603: Scheduled Task Creation for Persistence',
        severity: 'HIGH (Level 10)',
      },
    },
  };

  const current = scenarios[activeTab];

  const handleTriggerSim = () => {
    if (simState === 'running') return;
    setSimState('running');
    setTimeout(() => {
      setSimState('completed');
      setTimeout(() => setSimState('idle'), 6000);
    }, 1200);
  };

  return (
    <section className="relative pt-24 sm:pt-32 pb-16 lg:pb-24 cyber-grid overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] radial-glow-cyan pointer-events-none" />
      <div className="absolute top-10 right-10 w-96 h-96 radial-glow-purple pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Eyebrow Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium shadow-[0_0_15px_rgba(0,242,254,0.15)] animate-pulse-slow">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>OPEN-SOURCE AWS SOC CYBER RANGE & DETECTION LAB</span>
          </div>
        </div>

        {/* Hero Main Headline */}
        <div className="text-center mt-6 max-w-4xl mx-auto space-y-4">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-display leading-[1.15]">
            Master Real-World Threat Hunting with{' '}
            <span className="text-gradient-cyan">Live SOC Telemetry</span>
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            A fully reproducible, 5-node cloud laboratory engineered with Terraform, Ansible, Wazuh SIEM, Sysmon v15, and Atomic Red Team. Deploy in one command and investigate live attacks in OpenSearch Dashboards.
          </p>

          {/* Philosophy Banner Quote */}
          <div className="pt-2 pb-1">
            <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-950/60 via-slate-900/90 to-blue-950/60 border border-cyan-500/30 shadow-lg">
              <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                🛡️ DEFENDER PHILOSOPHY
              </span>
              <span className="hidden sm:inline text-slate-600">|</span>
              <span className="text-xs sm:text-sm font-mono font-extrabold text-white tracking-wider">
                TRY <span className="text-cyan-400">•</span> BREAK <span className="text-amber-400">•</span> DETECT <span className="text-emerald-400">•</span> REPEAT
              </span>
            </div>
          </div>
        </div>

        {/* Primary Call-to-Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#install"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black font-bold font-mono text-sm transition-all shadow-[0_0_25px_rgba(0,242,254,0.4)] hover:shadow-[0_0_35px_rgba(0,242,254,0.6)] active:scale-95"
          >
            <Zap className="w-4 h-4 fill-black" />
            <span>DEPLOY LAB (1-COMMAND)</span>
          </a>

          <a
            href="#curriculum"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold font-mono text-sm border border-slate-700 hover:border-cyan-500/40 transition-all hover:shadow-[0_0_15px_rgba(56,189,248,0.2)]"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>EXPLORE 14 LABS</span>
          </a>

          <a
            href="https://github.com/EswaranS-06/THEDAL"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 font-mono text-xs border border-slate-800 transition-all"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>View Source on GitHub</span>
          </a>
        </div>

        {/* Live Interactive Telemetry Emulation Widget */}
        <div className="mt-12 lg:mt-16 max-w-5xl mx-auto">
          <div className="rounded-2xl border border-cyan-500/30 bg-[#060e1c] shadow-[0_0_40px_rgba(0,242,254,0.15)] overflow-hidden">
            {/* Widget Header & Tab Switcher */}
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono text-slate-300 font-semibold ml-2 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  Live Adversary Simulation Playground
                </span>
              </div>

              {/* Technique Switcher Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => { setActiveTab('powershell'); setSimState('idle'); }}
                  className={`px-3 py-1 rounded transition-all ${
                    activeTab === 'powershell'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  T1059.001 PowerShell
                </button>
                <button
                  onClick={() => { setActiveTab('sqli'); setSimState('idle'); }}
                  className={`px-3 py-1 rounded transition-all ${
                    activeTab === 'sqli'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  T1190 Web SQLi
                </button>
                <button
                  onClick={() => { setActiveTab('task'); setSimState('idle'); }}
                  className={`px-3 py-1 rounded transition-all ${
                    activeTab === 'task'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  T1053.005 Persistence
                </button>
              </div>
            </div>

            {/* Widget Body */}
            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#040914]">
              {/* Left Column: Command & Trigger */}
              <div className="lg:col-span-6 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase">
                      {current.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      Target: {current.target}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    <span>{current.title}</span>
                  </h3>
                </div>

                <div className="p-3 rounded-lg bg-[#02050b] border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Adversary Emulation Command (Attack Node 10.10.20.10):</span>
                    <span className="text-emerald-400 font-bold">1-CLICK EXECUTION</span>
                  </div>
                  <pre className="text-cyan-300 text-[11px] leading-relaxed whitespace-pre-wrap break-all">
                    <code>{current.cmd}</code>
                  </pre>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleTriggerSim}
                    disabled={simState === 'running'}
                    className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      simState === 'running'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 cursor-wait animate-pulse'
                        : simState === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    }`}
                  >
                    {simState === 'running' ? (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                        <span>DISPATCHING ADVERSARY PAYLOAD...</span>
                      </>
                    ) : simState === 'completed' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>TELEMETRY INGESTED IN OPENSEARCH!</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-black text-black" />
                        <span>FIRE 1-CLICK SIMULATION</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column: Live OpenSearch & Sysmon Telemetry Inspector */}
              <div className="lg:col-span-6 rounded-xl bg-[#02050b] border border-slate-800 p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-slate-300 font-semibold text-[11px]">Wazuh & OpenSearch Telemetry Stream</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800">
                    Index: {current.index}
                  </span>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="flex items-start justify-between gap-2 p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400">Triggered Rule:</span>
                    <span className="text-amber-400 font-bold text-right">{current.event.detection_rule}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400">Rule Severity:</span>
                    <span className="text-rose-400 font-bold">{current.event.severity}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300 space-y-1 overflow-x-auto">
                    <div className="text-slate-400 font-semibold text-[9px] uppercase tracking-wider">
                      Normalized JSON Event Document:
                    </div>
                    <pre className="text-emerald-400 font-mono leading-relaxed">
                      {JSON.stringify(current.event, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metric Badges Grid */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBadge
            label="AWS Infrastructure"
            value="5 Nodes"
            sublabel="Static Internal IPs (10.10.0.0/16)"
            icon={Server}
            variant="cyan"
          />
          <StatBadge
            label="Hands-On Curriculum"
            value="14 Guided Labs"
            sublabel="Plus 3 Mystery Challenges"
            icon={Flame}
            variant="amber"
          />
          <StatBadge
            label="Telemetry Sources"
            value="100% Native"
            sublabel="Sysmon v15, PowerShell, Nginx, Auditd"
            icon={Cpu}
            variant="emerald"
          />
          <StatBadge
            label="Architecture Cost"
            value="$0 NAT Gateway"
            sublabel="Squid Forward Proxy on Bastion"
            icon={Lock}
            variant="purple"
          />
        </div>
      </div>
    </section>
  );
};
