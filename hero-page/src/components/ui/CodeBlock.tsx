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
      setTimeout(() => setCopied(false), 1800);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const lines = code.trim().split('\n');

  return (
    <div className={`rounded-lg border border-white/[0.08] bg-[#090b0e] overflow-hidden text-xs font-mono shadow-sm ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/[0.06] bg-[#0d0f12] text-[#8E959F]">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-[#4F8CFF]" />
            <span className="font-medium text-[#F5F7FA] text-[11px]">{title}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-[#8E959F] font-semibold px-1.5 py-0.5 rounded bg-[#12151a] border border-white/[0.06]">
            {language}
          </span>
        </div>
      )}

      <div className="relative p-3.5 group flex items-start justify-between gap-4">
        <pre className="overflow-x-auto text-[#F5F7FA] leading-relaxed flex-1 select-all">
          <code>
            {showLineNumbers
              ? lines.map((line, i) => (
                  <div key={i} className="flex">
                    <span className="select-none text-[#525866] mr-4 w-5 text-right">{i + 1}</span>
                    <span className="text-[#E2E8F0]">{line}</span>
                  </div>
                ))
              : code}
          </code>
        </pre>

        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono transition-all shrink-0 border ${
            copied
              ? 'bg-[#12151a] text-[#4ADE80] border-[#4ADE80]/30'
              : 'bg-[#12151a] hover:bg-[#181b21] text-[#8E959F] hover:text-[#F5F7FA] border-white/[0.08]'
          }`}
          title="Copy code"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-[#4ADE80]" />
              <span className="text-[10px] text-[#4ADE80] font-semibold">COPIED</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-[#8E959F]" />
              <span className="text-[10px]">COPY</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
