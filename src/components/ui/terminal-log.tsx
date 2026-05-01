'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from './scroll-area';

interface LogLine {
  timestamp: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface TerminalLogProps {
  lines: LogLine[];
  className?: string;
  maxHeight?: string;
}

export function TerminalLog({ lines, className, maxHeight = '200px' }: TerminalLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const typeColors = {
    info: 'text-tertiary',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-danger',
  };

  return (
    <div
      className={cn(
        'bg-base border border-border-default rounded-md overflow-hidden',
        className
      )}
    >
      <ScrollArea className="w-full" style={{ maxHeight }}>
        <div ref={scrollRef} className="p-3 space-y-0.5">
          {lines.map((line, i) => (
            <div key={i} className="font-mono text-xs flex gap-2">
              <span className="text-tertiary shrink-0">[{line.timestamp}]</span>
              <span className={cn(typeColors[line.type || 'info'])}>
                {line.message}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
