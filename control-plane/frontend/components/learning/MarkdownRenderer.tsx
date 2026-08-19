"use client";

import React, { useEffect, useRef } from "react";

interface MarkdownRendererProps {
  contentHtml?: string;
  rawMarkdown?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  contentHtml,
  rawMarkdown,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add copy buttons to code blocks inside the rendered HTML
    if (!containerRef.current) return;

    const preElements = containerRef.current.querySelectorAll("pre");
    preElements.forEach((pre) => {
      if (pre.parentElement?.classList.contains("code-block-wrap")) {
        // Already structured
        return;
      }
      // Add copy button
      const button = document.createElement("button");
      button.className =
        "copy-code-btn px-2 py-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors absolute top-2 right-2";
      button.innerText = "Copy";
      button.onclick = () => {
        const codeText = pre.querySelector("code")?.innerText || pre.innerText;
        navigator.clipboard.writeText(codeText).then(() => {
          button.innerText = "Copied!";
          setTimeout(() => {
            button.innerText = "Copy";
          }, 2000);
        });
      };
      pre.style.position = "relative";
      pre.appendChild(button);
    });
  }, [contentHtml]);

  if (!contentHtml && !rawMarkdown) {
    return <div className="text-xs text-slate-500 italic">No content to display.</div>;
  }

  return (
    <div
      ref={containerRef}
      className="prose-dark max-w-none text-slate-200 text-xs leading-relaxed"
      dangerouslySetInnerHTML={{ __html: contentHtml || rawMarkdown || "" }}
    />
  );
};
