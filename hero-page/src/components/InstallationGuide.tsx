import React, { useState } from 'react';
import {
  Download,
  Terminal,
  CheckCircle,
  Cpu,
  Layers,
  Sparkles,
  Server,
  ArrowRight,
  Shield,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import { CodeBlock } from './ui/CodeBlock';

export const InstallationGuide: React.FC = () => {
  const [installMode, setInstallMode] = useState<'native' | 'docker'>('native');

  const nativeCommands = `# 1. Clone the repository
git clone https://github.com/EswaranS-06/THEDAL.git
cd THEDAL

# 2. Run the universal installer
./install.sh --mode native

# 3. Launch the Control Plane dashboard
make control-plane
# Open in your browser: http://127.0.0.1:8080`;

  const dockerCommands = `# 1. Clone the repository
git clone https://github.com/EswaranS-06/THEDAL.git
cd THEDAL

# 2. Launch containerized control plane (No host Terraform/Ansible required)
./install.sh --mode docker

# 3. Access the Web Dashboard
# Open in your browser: http://127.0.0.1:8080`;

  const makefileSteps = [
    {
      step: '01',
      cmd: 'make preflight',
      desc: 'Validates AWS CLI credentials, Python 3.11+, Terraform, Ansible, and SSH keys.',
    },
    {
      step: '02',
      cmd: 'make deploy',
      desc: 'Executes `terraform apply` to provision VPC, private subnets, security groups, and 5 EC2 instances with static IPs.',
    },
    {
      step: '03',
      cmd: 'make inventory',
      desc: 'Extracts live public Bastion IP and private host IPs into `ansible/inventory/hosts.ini`.',
    },
    {
      step: '04',
      cmd: 'make provision',
      desc: 'Executes Ansible playbooks sequentially (Bastion -> Linux -> Wazuh -> Windows Sysmon -> Web -> Red Team).',
    },
    {
      step: '05',
      cmd: 'make tunnel',
      desc: 'Establishes encrypted background SSH tunnel to OpenSearch Dashboards on `https://localhost:8443`.',
    },
  ];

  return (
    <section id="install" className="py-20 lg:py-28 bg-[#040816] relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold">
            <Download className="w-3.5 h-3.5" />
            <span>DEPLOYMENT & SETUP GUIDE</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
            Deploy Your Cyber Range in <span className="text-gradient-cyan">3 Simple Steps</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Choose between direct native execution or a zero-configuration containerized browser deployment.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="mt-12 flex justify-center">
          <div className="p-1.5 rounded-2xl bg-slate-950 border border-slate-800 flex gap-2">
            <button
              onClick={() => setInstallMode('native')}
              className={`px-5 py-2.5 rounded-xl font-mono text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                installMode === 'native'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-[0_0_20px_rgba(0,242,254,0.35)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Option A: Native Linux / VM (Full CLI)</span>
            </button>
            <button
              onClick={() => setInstallMode('docker')}
              className={`px-5 py-2.5 rounded-xl font-mono text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                installMode === 'docker'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-[0_0_20px_rgba(0,242,254,0.35)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Server className="w-4 h-4" />
              <span>Option B: Docker Container (Browser-First)</span>
            </button>
          </div>
        </div>

        {/* Installation Instructions Box */}
        <div className="mt-8 max-w-4xl mx-auto">
          <div className="p-6 sm:p-8 rounded-2xl bg-[#060e1d] border border-cyan-500/30 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold font-mono text-white flex items-center gap-2">
                  <span>{installMode === 'native' ? 'Native Installation (Linux, WSL2, macOS)' : 'Docker Containerized Deployment'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {installMode === 'native'
                    ? 'Recommended for engineers who want hands-on CLI access to Terraform & Ansible'
                    : 'Recommended for Windows/macOS users who want zero local Python/Terraform tooling'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800">
                1-Command Install
              </span>
            </div>

            <CodeBlock
              code={installMode === 'native' ? nativeCommands : dockerCommands}
              language="bash"
              title="Terminal Installation Commands"
              showLineNumbers
            />

            {/* Prerequisites Checklist */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Prerequisites Checklist:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 font-mono">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>AWS Account (EC2 / VPC / IAM permissions)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>SSH Key Pair (`~/.ssh/thedal_key`)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Configured AWS CLI (`aws configure`)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Node.js v18+ / Python 3.11+ (Native mode only)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lifecycle Makefile Workflow */}
        <div className="mt-14 max-w-5xl mx-auto">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold font-mono text-white">
              End-to-End Orchestration Lifecycle
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Under the hood, THEDAL automates the entire multi-tier cloud deployment workflow:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {makefileSteps.map((s, idx) => (
              <div
                key={s.step}
                className="p-4 rounded-xl bg-[#060e1d] border border-slate-800 space-y-2 font-mono text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-cyan-400 font-bold">
                    <span>STEP {s.step}</span>
                    <span className="text-[9px] text-slate-500">make</span>
                  </div>
                  <code className="text-emerald-400 font-bold block mt-1.5 text-[11px] bg-slate-950 p-1.5 rounded border border-slate-800">
                    {s.cmd}
                  </code>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
