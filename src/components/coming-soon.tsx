import Link from 'next/link';

interface ComingSoonProps {
  title?: string;
  description?: string;
}

export function ComingSoon({
  title = 'Coming Soon',
  description = 'This section is under development. Check back later.',
}: ComingSoonProps) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-56px)] bg-[#0A0A0B]">
      <div className="text-center space-y-6 max-w-md px-6">
        <div className="mx-auto w-14 h-14 bg-[#111113] border border-[#27272A] rounded-[10px] flex items-center justify-center">
          <span className="font-mono text-2xl text-[#84CC16]">N</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-[#FAFAFA] tracking-tight">{title}</h1>
          <p className="text-sm text-[#A1A1AA] leading-relaxed">{description}</p>
        </div>
        <div className="pt-2">
          <Link
            href="/app/demand"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#84CC16] text-black text-sm font-medium rounded-md hover:bg-[#65A30D] transition-colors"
          >
            Browse GPUs
          </Link>
        </div>
      </div>
    </div>
  );
}
