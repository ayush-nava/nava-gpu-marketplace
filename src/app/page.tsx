'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { featuredListings } from '@/lib/mock';
import { LiveDot } from '@/components/ui/live-dot';

const regionLabels: Record<string, string> = {
  'na-east': 'NA-East',
  'na-west': 'NA-West',
  eu: 'EU',
  apac: 'APAC',
  in: 'IN',
};

const navLinks = [
  { label: 'Docs', href: '#' },
  { label: 'Pricing', href: '#' },
  { label: 'GitHub', href: '#' },
];

const demandSteps = [
  {
    number: '01',
    title: 'Browse catalogue',
    description: 'Filter by GPU model, region, interconnect, and price. See real benchmarks before you commit.',
  },
  {
    number: '02',
    title: 'Deploy models or SSH in',
    description: 'Deploy Llama, Qwen, DeepSeek with one click — or get root SSH access to bare metal in minutes.',
  },
  {
    number: '03',
    title: 'Pay for what you use',
    description: 'Per-hour billing with managed model deployment. No commitments, no reserved-instance lock-in.',
  },
];

const supplySteps = [
  {
    number: '01',
    title: 'List your hardware',
    description: 'Describe your node — GPU model, count, interconnect, host specs. Takes under five minutes.',
  },
  {
    number: '02',
    title: 'Run diagnostics',
    description: 'Automated NCCL, GEMM, and HBM benchmarks verify your hardware and build buyer trust.',
  },
  {
    number: '03',
    title: 'Earn while idle',
    description: 'Set your price, availability windows, and policies. Nava handles matching and payments.',
  },
];

export default function LandingPage() {
  // Double the listings for seamless infinite scroll
  const tickerListings = [...featuredListings, ...featuredListings];

  return (
    <div className="min-h-screen bg-base text-primary font-sans">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-border-subtle bg-base/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-accent">
                <span className="text-sm font-bold text-accent-foreground">N</span>
              </div>
              <span className="text-sm font-semibold tracking-tight">nava</span>
            </Link>

            {/* Nav links */}
            <nav className="hidden items-center gap-5 sm:flex">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-tertiary transition-colors hover:text-secondary"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/app/demand"
              className="rounded-[6px] bg-elevated px-3.5 py-1.5 text-sm text-secondary transition-colors hover:bg-hover hover:text-primary"
            >
              Browse GPUs
            </Link>
            <Link
              href="/app/supply/onboard"
              className="rounded-[6px] border border-border-default px-3.5 py-1.5 text-sm text-secondary transition-colors hover:border-border-strong hover:text-primary"
            >
              List Hardware
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Subtle gradient — the only one */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-base via-base to-surface" />

        <div className="relative mx-auto max-w-3xl px-6 pb-20 pt-24 text-center sm:pt-32">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl"
          >
            Bare-metal GPUs from people who aren&apos;t using theirs.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 font-mono text-lg text-accent"
          >
            Spin up an 8xH100 node in minutes. Not Q3.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-secondary"
          >
            Nava aggregates idle GPU supply from operators, startups, and labs — and routes it to
            teams that need bare-metal SSH access for hours, days, or weeks.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex items-center justify-center gap-3"
          >
            <Link
              href="/app/demand"
              className="rounded-[6px] bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-dim"
            >
              Browse GPUs
            </Link>
            <Link
              href="/app/supply/onboard"
              className="rounded-[6px] border border-border-default px-5 py-2.5 text-sm font-medium text-secondary transition-colors hover:border-border-strong hover:text-primary"
            >
              List your hardware
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Live Ticker ── */}
      <section className="border-y border-border-subtle bg-surface py-6">
        <div className="relative overflow-hidden">
          <div className="ticker-track flex w-max gap-4">
            {tickerListings.map((listing, i) => (
              <div
                key={`${listing.id}-${i}`}
                className="flex shrink-0 items-center gap-4 rounded-[6px] border border-border-subtle bg-elevated px-4 py-3"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-sm font-medium text-primary">
                    {listing.gpu.count}x {listing.gpu.model}
                  </span>
                  <span className="text-xs text-tertiary">
                    {regionLabels[listing.region] ?? listing.region.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-accent">
                    ${listing.pricePerHour.toFixed(2)}/hr
                  </span>
                  <LiveDot color="success" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-2xl font-semibold tracking-tight">How it works</h2>

        <div className="mt-14 grid gap-12 md:grid-cols-2 md:gap-16">
          {/* Demand column */}
          <div>
            <h3 className="mb-8 text-xs font-medium uppercase tracking-widest text-accent">
              For Demand
            </h3>
            <div className="space-y-8">
              {demandSteps.map((step) => (
                <div key={step.number} className="flex gap-4">
                  <span className="mt-0.5 font-mono text-sm text-tertiary">{step.number}</span>
                  <div>
                    <h4 className="text-sm font-medium text-primary">{step.title}</h4>
                    <p className="mt-1 text-sm leading-relaxed text-secondary">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supply column */}
          <div>
            <h3 className="mb-8 text-xs font-medium uppercase tracking-widest text-accent">
              For Supply
            </h3>
            <div className="space-y-8">
              {supplySteps.map((step) => (
                <div key={step.number} className="flex gap-4">
                  <span className="mt-0.5 font-mono text-sm text-tertiary">{step.number}</span>
                  <div>
                    <h4 className="text-sm font-medium text-primary">{step.title}</h4>
                    <p className="mt-1 text-sm leading-relaxed text-secondary">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border-subtle bg-base">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <span className="text-sm font-semibold tracking-tight text-tertiary">nava</span>
          <div className="flex items-center gap-5">
            <a href="#" className="text-xs text-tertiary transition-colors hover:text-secondary">
              Docs
            </a>
            <a href="#" className="text-xs text-tertiary transition-colors hover:text-secondary">
              GitHub
            </a>
            <a href="#" className="text-xs text-tertiary transition-colors hover:text-secondary">
              Terms
            </a>
            <span className="text-xs text-tertiary">
              {'\u00A9'} {new Date().getFullYear()} Nava
            </span>
          </div>
        </div>
      </footer>

      {/* Ticker animation styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          animation: ticker-scroll 40s linear infinite;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}} />
    </div>
  );
}
