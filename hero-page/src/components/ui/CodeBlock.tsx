import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  className?: string;
  showLineNumbers?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'bash',
  title,
  className = '',
  showLineNumbers = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const lines = code.trim().split('\n');

  return (
    <div className={`rounded-lg border border-slate-800 bg-[#060d1b] overflow-hidden text-xs font-mono shadow-xl ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-800 bg-slate-900/60 text-slate-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium text-slate-200">{title}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
            {language}
          </span>
        </div>
      )}

      <div className="relative p-3.5 group flex items-start justify-between gap-4">
        <pre className="overflow-x-auto text-slate-200 leading-relaxed flex-1 select-all">
          <code>
            {showLineNumbers
              ? lines.map((line, i) => (
                  <div key={i} className="flex">
                    <span className="select-none text-slate-600 mr-4 w-6 text-right">{i + 1}</span>
                    <span className="text-cyan-300">{line}</span>
                  </div>
                ))
              : code}
          </code>
        </pre>

        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-all shrink-0 border ${
            copied
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
          }`}
          title="Copy to clipboard"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-bold">COPIED</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>COPY</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
