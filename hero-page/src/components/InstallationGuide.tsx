import React, { useState } from 'react';
import {
  Terminal,
  CheckCircle,
  Server,
  Download,
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
      desc: 'Executes `terraform apply` to provision VPC, private subnets, and 5 EC2 instances with static IPs.',
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
    <section id="install" className="py-20 lg:py-28 bg-[#08090b] relative border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#12151a] border border-white/[0.08] text-[11px] font-mono tracking-wide-eyebrow text-[#8E959F] uppercase">
            <span>Deployment Guide</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight-title text-[#F5F7FA]">
            Deploy Your Cyber Range in 3 Simple Steps
          </h2>
          <p className="text-sm sm:text-base text-[#8E959F] leading-relaxed">
            Choose between direct native execution or a zero-configuration containerized browser deployment.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="mt-8 flex">
          <div className="p-1 rounded-lg bg-[#0d0f12] border border-white/[0.08] flex gap-1">
            <button
              onClick={() => setInstallMode('native')}
              className={`px-3.5 py-1.5 rounded-md font-mono text-xs transition-all flex items-center gap-1.5 ${
                installMode === 'native'
                  ? 'bg-[#181b21] text-[#F5F7FA] border border-white/[0.08] shadow-sm'
                  : 'text-[#8E959F] hover:text-[#F5F7FA]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Native CLI (Linux / WSL2 / macOS)</span>
            </button>
            <button
              onClick={() => setInstallMode('docker')}
              className={`px-3.5 py-1.5 rounded-md font-mono text-xs transition-all flex items-center gap-1.5 ${
                installMode === 'docker'
                  ? 'bg-[#181b21] text-[#F5F7FA] border border-white/[0.08] shadow-sm'
                  : 'text-[#8E959F] hover:text-[#F5F7FA]'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Docker Container (Zero Tooling)</span>
            </button>
          </div>
        </div>

        {/* Installation Instructions Card */}
        <div className="mt-4">
          <div className="p-5 sm:p-6 rounded-xl bg-[#0d0f12] border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-semibold font-mono text-[#F5F7FA]">
                  {installMode === 'native' ? 'Native Installation (Linux / macOS)' : 'Docker Containerized Deployment'}
                </h3>
                <p className="text-xs text-[#8E959F] mt-0.5">
                  {installMode === 'native'
                    ? 'Recommended for engineers who want direct CLI access to Terraform & Ansible'
                    : 'Recommended for users who want zero local Python/Terraform tooling required'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#4F8CFF] px-2 py-0.5 rounded bg-[#12151a] border border-white/[0.06]">
                1-Command Setup
              </span>
            </div>

            <CodeBlock
              code={installMode === 'native' ? nativeCommands : dockerCommands}
              language="bash"
              title="Terminal Commands"
              showLineNumbers
            />

            {/* Prerequisites Checklist */}
            <div className="p-3.5 rounded-lg bg-[#08090b] border border-white/[0.06] space-y-2">
              <div className="text-xs font-mono font-semibold text-[#8E959F] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#4ADE80]" />
                <span>Prerequisites Checklist</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#8E959F] font-mono">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-[#4F8CFF] shrink-0" />
                  <span>AWS Account (EC2 / VPC / IAM permissions)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-[#4F8CFF] shrink-0" />
                  <span>SSH Key Pair (`~/.ssh/thedal_key`)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-[#4F8CFF] shrink-0" />
                  <span>Configured AWS CLI (`aws configure`)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-[#4F8CFF] shrink-0" />
                  <span>Python 3.11+ / Node.js 18+ (Native mode only)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Makefile Lifecycle */}
        <div className="mt-12">
          <div className="mb-4">
            <h3 className="text-sm sm:text-base font-semibold font-mono text-[#F5F7FA]">
              End-to-End Orchestration Lifecycle
            </h3>
            <p className="text-xs text-[#8E959F] mt-0.5">
              Under the hood, THEDAL automates the entire multi-tier cloud deployment workflow:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {makefileSteps.map((s) => (
              <div
                key={s.step}
                className="p-4 rounded-lg bg-[#0d0f12] border border-white/[0.08] space-y-2 font-mono text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[#8E959F]">
                    <span className="text-[11px] font-semibold text-[#4F8CFF]">STEP {s.step}</span>
                    <span className="text-[10px] text-[#525866]">make</span>
                  </div>
                  <code className="text-[#F5F7FA] font-medium block mt-1.5 text-[11px] bg-[#08090b] p-1.5 rounded border border-white/[0.06]">
                    {s.cmd}
                  </code>
                  <p className="text-[11px] text-[#8E959F] mt-2 leading-relaxed font-sans">
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
