import React from 'react';
import {
  GitPullRequest,
  BookOpen,
  Code,
  Github,
  ArrowRight,
} from 'lucide-react';

export const ContributionGuide: React.FC = () => {
  const contributionPaths = [
    {
      title: 'Add Attack Scenarios & Atomics',
      desc: 'Create new Atomic Red Team test wrappers or simulated adversary scripts in `attacks/atomics/`.',
      target: 'attacks/',
    },
    {
      title: 'Author Detection Rules & Decoders',
      desc: 'Contribute high-signal Wazuh rules and OpenSearch SIEM dashboard visualizations in `detection/rules/`.',
      target: 'detection/',
    },
    {
      title: 'Expand Investigation Labs',
      desc: 'Submit guided threat hunting lab questions, mystery challenges, and walkthrough solutions.',
      target: 'docs/curriculum/',
    },
    {
      title: 'Enhance Cloud Automation',
      desc: 'Optimize Terraform modules, Ansible playbooks, or add multi-cloud support (Azure / GCP).',
      target: 'terraform/ & ansible/',
    },
  ];

  return (
    <section id="contribute" className="py-20 lg:py-28 bg-[#08090b] relative border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#12151a] border border-white/[0.08] text-[11px] font-mono tracking-wide-eyebrow text-[#8E959F] uppercase">
            <span>Open-Source Community</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight-title text-[#F5F7FA]">
            Contribute to the Future of Open Security Training
          </h2>
          <p className="text-sm sm:text-base text-[#8E959F] leading-relaxed">
            THEDAL is 100% open source under the MIT license. We welcome contributions from detection engineers, red teamers, and SOC analysts worldwide.
          </p>
        </div>

        {/* Contribution Paths Grid */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {contributionPaths.map((path) => (
            <div
              key={path.title}
              className="p-5 rounded-xl bg-[#0d0f12] border border-white/[0.08] hover:border-white/[0.14] transition-all space-y-2.5 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="text-[10px] font-mono text-[#4F8CFF] px-2 py-0.5 rounded bg-[#12151a] border border-white/[0.06] inline-block">
                  {path.target}
                </div>
                <h3 className="text-sm font-semibold text-[#F5F7FA]">
                  {path.title}
                </h3>
                <p className="text-xs text-[#8E959F] leading-relaxed">
                  {path.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Bar */}
        <div className="mt-8 p-5 rounded-xl bg-[#0d0f12] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#12151a] border border-white/[0.08] flex items-center justify-center text-[#4F8CFF] shrink-0">
              <GitPullRequest className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-semibold text-[#F5F7FA]">
                Ready to submit a pull request?
              </div>
              <div className="text-xs text-[#8E959F]">
                Check out the contribution guidelines and open issues on GitHub.
              </div>
            </div>
          </div>

          <a
            href="https://github.com/EswaranS-06/THEDAL/blob/main/CONTRIBUTING.md"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary px-4 py-2 rounded-md text-xs font-mono inline-flex items-center gap-2 shrink-0"
          >
            <Github className="w-3.5 h-3.5" />
            <span>View Contributing Guide</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
};
