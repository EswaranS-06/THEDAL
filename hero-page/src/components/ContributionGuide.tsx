import React from 'react';
import {
  GitPullRequest,
  GitBranch,
  Shield,
  FileCode,
  Terminal,
  Heart,
  Github,
  ArrowRight,
  Sparkles,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { CodeBlock } from './ui/CodeBlock';

export const ContributionGuide: React.FC = () => {
  const contributionWorkflow = `# 1. Fork and clone the repository
git clone https://github.com/<YOUR_USERNAME>/THEDAL.git
cd THEDAL

# 2. Create a dedicated feature branch
git checkout -b feat/new-detection-rule-t1059

# 3. Add your rule / lab / test scenario and run tests
make lint
make test-control-plane

# 4. Commit and submit a Pull Request
git commit -m "feat(detection): add custom Wazuh rule for T1059.001 ScriptBlock"
git push origin feat/new-detection-rule-t1059`;

  const waysToContribute = [
    {
      title: 'Author Custom Detection Rules',
      icon: Shield,
      color: 'text-cyan-400',
      description: 'Write custom Wazuh XML decoders and correlation rules in `detection/rules/` to detect new adversary techniques.',
    },
    {
      title: 'Add Atomic Red Team Simulations',
      icon: Terminal,
      color: 'text-emerald-400',
      description: 'Expand `attacks/run-atomic-test` with new MITRE ATT&CK techniques for Windows and Linux endpoints.',
    },
    {
      title: 'Create Investigation Labs & Runbooks',
      icon: FileCode,
      color: 'text-amber-400',
      description: 'Design new guided investigation walkthroughs and triage runbooks in `docs/labs/` and `docs/runbooks/`.',
    },
    {
      title: 'Enhance Control Plane & UI',
      icon: GitPullRequest,
      color: 'text-purple-400',
      description: 'Improve the FastAPI backend or React frontend with new diagnostic widgets, metrics, and automation tools.',
    },
  ];

  return (
    <section id="contribute" className="py-20 lg:py-28 bg-[#040817] relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>OPEN-SOURCE COMMUNITY & CONTRIBUTION</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
            Built by Defenders, for <span className="text-gradient-cyan">Defenders</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            THEDAL is completely open source under the MIT License. Whether you are a student, detection engineer, SOC analyst, or educator, we welcome your contributions!
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: 4 Ways to Contribute */}
          <div className="lg:col-span-5 space-y-4">
            <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider mb-2">
              Ways You Can Contribute:
            </div>
            {waysToContribute.map((item, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-xl bg-[#060e1d] border border-slate-800 hover:border-slate-700 transition-colors flex items-start gap-3.5"
              >
                <div className={`p-2.5 rounded-lg bg-slate-950 border border-slate-800 ${item.color} shrink-0`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold font-mono text-white">{item.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Contribution Workflow & Code */}
          <div className="lg:col-span-7 space-y-5">
            <div className="p-6 sm:p-8 rounded-2xl bg-[#060e1d] border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-white">
                    Standard Contribution Workflow
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  MIT Licensed
                </span>
              </div>

              <CodeBlock
                code={contributionWorkflow}
                language="bash"
                title="Git Pull Request Steps"
                showLineNumbers
              />

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <a
                  href="https://github.com/EswaranS-06/THEDAL/issues/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-mono text-xs font-semibold transition-all"
                >
                  <Github className="w-4 h-4" />
                  <span>Submit an Issue or Idea</span>
                </a>

                <a
                  href="https://github.com/EswaranS-06/THEDAL/pulls"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,242,254,0.3)]"
                >
                  <GitPullRequest className="w-4 h-4" />
                  <span>View Open Pull Requests</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
