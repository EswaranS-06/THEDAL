import React from 'react';
import {
  Shield,
  Github,
  Heart,
  ExternalLink,
  Code,
  Layers,
  Terminal,
  BookOpen
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#02050c] border-t border-slate-900 text-slate-400 font-sans text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Col 1: Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg font-mono tracking-wider text-white">
                THEDAL
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Threat Hunting, Exploration, Detection, Analysis and Learn. An open-source, reproducible 5-node AWS cloud cyber range for hands-on SOC and detection engineering training.
            </p>
            <div className="text-[11px] font-mono text-slate-500">
              MIT License • Built with Open-Source Passion
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="md:col-span-3 space-y-3 font-mono">
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              Navigation
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#overview" className="hover:text-cyan-400 transition-colors">
                  Overview & Pillars
                </a>
              </li>
              <li>
                <a href="#architecture" className="hover:text-cyan-400 transition-colors">
                  5-Node AWS Topology
                </a>
              </li>
              <li>
                <a href="#curriculum" className="hover:text-cyan-400 transition-colors">
                  14 Guided Labs & Curriculum
                </a>
              </li>
              <li>
                <a href="#simulations" className="hover:text-cyan-400 transition-colors">
                  1-Click Emulation Engine
                </a>
              </li>
              <li>
                <a href="#install" className="hover:text-cyan-400 transition-colors">
                  Installation Guide
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Creator & Community Info */}
          <div className="md:col-span-4 space-y-3 font-mono">
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              Creator & Community
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Designed and engineered by <strong className="text-slate-200">Eswaran S</strong> to provide accessible, reproducible cloud security training for aspiring defenders worldwide.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <a
                href="https://pro.eswaransk.qzz.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors group"
              >
                <span>Creator Portfolio: <strong className="underline group-hover:text-cyan-200">pro.eswaransk.qzz.io</strong></span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href="https://github.com/EswaranS-06/THEDAL"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors"
              >
                <Github className="w-3.5 h-3.5 text-slate-400" />
                <span>GitHub Repository & Issues</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-slate-500">
          <div>
            © 2026 THEDAL. All rights reserved. Open source under MIT License.
          </div>
          <div className="flex items-center gap-1">
            <span>Powered by</span>
            <span className="text-slate-400 font-semibold">Terraform • Ansible • Wazuh • Sysmon • React</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
