import { cn } from '@/lib/utils';

interface SpecRow {
  label: string;
  value: string | number;
}

interface SpecTableProps {
  rows: SpecRow[];
  className?: string;
  columns?: 1 | 2;
}

export function SpecTable({ rows, className, columns = 1 }: SpecTableProps) {
  if (columns === 2) {
    const midpoint = Math.ceil(rows.length / 2);
    const leftRows = rows.slice(0, midpoint);
    const rightRows = rows.slice(midpoint);

    return (
      <div className={cn('grid grid-cols-2 gap-x-8 gap-y-2', className)}>
        <div className="space-y-2">
          {leftRows.map((row, i) => (
            <div key={i} className="flex justify-between items-baseline gap-4">
              <span className="text-sm text-tertiary">{row.label}</span>
              <span className="font-mono text-sm text-primary">{row.value}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {rightRows.map((row, i) => (
            <div key={i} className="flex justify-between items-baseline gap-4">
              <span className="text-sm text-tertiary">{row.label}</span>
              <span className="font-mono text-sm text-primary">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {rows.map((row, i) => (
        <div key={i} className="flex justify-between items-baseline gap-4">
          <span className="text-sm text-tertiary">{row.label}</span>
          <span className="font-mono text-sm text-primary">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
