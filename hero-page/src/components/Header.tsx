import React, { useState, useEffect } from 'react';
import {
  Github,
  Menu,
  X,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 16);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Architecture', href: '#architecture' },
    { name: 'Simulations', href: '#simulations' },
    { name: 'Curriculum', href: '#curriculum' },
    { name: 'Installation', href: '#install' },
    { name: 'Mission', href: '#overview' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-200 ${
        scrolled
          ? 'bg-[#08090b]/90 backdrop-blur-md border-b border-white/[0.06]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Version */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-md bg-[#12151a] border border-white/[0.08] flex items-center justify-center text-[#4F8CFF] group-hover:border-[#4F8CFF]/50 transition-colors">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-[2.2]">
                <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
                <path d="M12 8v8" strokeLinecap="round" />
                <path d="M8 12h8" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-[#F5F7FA]">
                THEDAL
              </span>
              <span className="text-[10px] font-mono text-[#8E959F] px-1.5 py-0.5 rounded bg-[#12151a] border border-white/[0.06]">
                Trail & Testing
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#8E959F]">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="hover:text-[#F5F7FA] transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Action Area */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href="https://github.com/EswaranS-06/THEDAL"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#12151a] hover:bg-[#181b21] text-xs font-medium text-[#8E959F] hover:text-[#F5F7FA] border border-white/[0.08] hover:border-white/[0.14] transition-all"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>

            <a
              href="#install"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#4F8CFF] hover:bg-[#6EA0FF] text-[#08090B] text-xs font-medium transition-all shadow-sm"
            >
              <span>Deploy Range</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Mobile Navigation Trigger */}
          <div className="flex sm:hidden items-center gap-2">
            <a
              href="#install"
              className="px-2.5 py-1 rounded bg-[#4F8CFF] text-[#08090B] text-xs font-medium"
            >
              Deploy
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-md bg-[#12151a] border border-white/[0.08] text-[#8E959F] hover:text-white"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-white/[0.06] bg-[#08090b]/98 backdrop-blur-xl px-4 py-4 space-y-3">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1.5 text-xs font-medium text-[#8E959F] hover:text-white transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="pt-2 border-t border-white/[0.06] flex items-center gap-2">
            <a
              href="https://github.com/EswaranS-06/THEDAL"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md bg-[#12151a] border border-white/[0.08] text-xs text-[#8E959F]"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
            <a
              href="https://pro.eswaransk.qzz.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 px-3 py-2 rounded-md bg-[#12151a] border border-white/[0.08] text-xs text-[#8E959F]"
            >
              <span>Portfolio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
