import React from 'react';
import {
  Github,
  ExternalLink,
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#08090b] border-t border-white/[0.06] text-[#8E959F] font-sans text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Col 1: Brand Info */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#12151a] border border-white/[0.08] flex items-center justify-center text-[#4F8CFF]">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]">
                  <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
                </svg>
              </div>
              <span className="font-semibold text-sm tracking-tight text-[#F5F7FA]">
                THEDAL
              </span>
            </div>
            <p className="text-xs text-[#8E959F] leading-relaxed max-w-sm">
              Threat Hunting, Exploration, Detection, Analysis and Learn. An open-source, reproducible 5-node AWS cloud cyber range for hands-on SOC and detection engineering training.
            </p>
            <div className="text-[11px] font-mono text-[#525866]">
              MIT License • Built with Open-Source Focus
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="md:col-span-3 space-y-2.5 font-mono text-xs">
            <div className="text-[11px] font-semibold text-[#F5F7FA] uppercase tracking-wider">
              Navigation
            </div>
            <ul className="space-y-1.5 text-xs text-[#8E959F]">
              <li>
                <a href="#overview" className="hover:text-[#F5F7FA] transition-colors">
                  Overview & Mission
                </a>
              </li>
              <li>
                <a href="#architecture" className="hover:text-[#F5F7FA] transition-colors">
                  5-Node AWS Topology
                </a>
              </li>
              <li>
                <a href="#curriculum" className="hover:text-[#F5F7FA] transition-colors">
                  14 Guided Labs & Curriculum
                </a>
              </li>
              <li>
                <a href="#simulations" className="hover:text-[#F5F7FA] transition-colors">
                  1-Click Emulation Engine
                </a>
              </li>
              <li>
                <a href="#install" className="hover:text-[#F5F7FA] transition-colors">
                  Installation Guide
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Creator & Community Info */}
          <div className="md:col-span-4 space-y-2.5 font-mono text-xs">
            <div className="text-[11px] font-semibold text-[#F5F7FA] uppercase tracking-wider">
              Creator & Project
            </div>
            <p className="text-xs text-[#8E959F] leading-relaxed font-sans">
              Designed and engineered by <strong className="text-[#F5F7FA]">Eswaran S</strong> to provide accessible, reproducible cloud security training for defenders worldwide.
            </p>
            <div className="pt-1 flex flex-col gap-1.5">
              <a
                href="https://pro.eswaransk.qzz.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#4F8CFF] hover:text-[#6EA0FF] transition-colors"
              >
                <span>Creator Portfolio: <strong className="underline">pro.eswaransk.qzz.io</strong></span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <a
                href="https://github.com/EswaranS-06/THEDAL"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#8E959F] hover:text-[#F5F7FA] transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub Repository</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-[#525866]">
          <div>
            © 2026 THEDAL. Open source under MIT License.
          </div>
          <div className="flex items-center gap-1">
            <span>Powered by</span>
            <span className="text-[#8E959F]">Terraform • Ansible • Wazuh • Sysmon • React</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
