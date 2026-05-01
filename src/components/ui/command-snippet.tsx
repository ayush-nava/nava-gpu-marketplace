'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Copy, Check } from 'lucide-react';

interface CommandSnippetProps {
  code: string;
  className?: string;
}

export function CommandSnippet({ code, className }: CommandSnippetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'relative group bg-base border border-border-default rounded-md overflow-hidden',
        className
      )}
    >
      <pre className="p-4 pr-12 overflow-x-auto">
        <code className="font-mono text-sm text-primary">{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className={cn(
          'absolute top-3 right-3 p-1.5 rounded transition-all duration-150',
          'hover:bg-hover',
          copied ? 'text-accent' : 'text-tertiary hover:text-secondary'
        )}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}
