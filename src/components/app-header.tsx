'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bell, Command, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PortalToggle } from './portal-toggle';
import { LiveDot } from './ui/live-dot';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [nodesOnline, setNodesOnline] = useState(47);
  const [utilization, setUtilization] = useState(31);

  const portal = pathname.startsWith('/app/supply') ? 'supply' : 'demand';

  useEffect(() => {
    const interval = setInterval(() => {
      setNodesOnline((prev) => prev + Math.floor(Math.random() * 3) - 1);
      setUtilization((prev) => Math.max(20, Math.min(60, prev + Math.floor(Math.random() * 5) - 2)));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handlePortalChange = (value: 'demand' | 'supply') => {
    if (value === 'demand') {
      router.push('/app/demand');
    } else {
      router.push('/app/supply');
    }
  };

  const demandNav = [
    { href: '/app/demand', label: 'Browse' },
    { href: '/app/demand/rentals', label: 'Rentals' },
  ];

  const supplyNav = [
    { href: '/app/supply', label: 'Dashboard' },
    { href: '/app/supply/listings', label: 'Listings' },
    { href: '/app/supply/onboard', label: 'Add Hardware' },
  ];

  const nav = portal === 'demand' ? demandNav : supplyNav;

  return (
    <header className="sticky top-0 z-50 bg-base/80 backdrop-blur-sm border-b border-border-subtle">
      <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Left: Logo + Portal Toggle + Nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-accent rounded flex items-center justify-center">
              <span className="font-mono font-semibold text-base text-black">N</span>
            </div>
            <span className="font-semibold text-primary text-lg tracking-tight">nava</span>
          </Link>

          <PortalToggle value={portal} onChange={handlePortalChange} />

          <nav className="hidden md:flex items-center gap-1">
            {nav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'text-primary bg-elevated'
                      : 'text-secondary hover:text-primary hover:bg-hover'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Center: Live Status */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-surface border border-border-subtle rounded-md">
          <LiveDot color="success" />
          <span className="font-mono text-xs text-secondary">
            <motion.span
              key={nodesOnline}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              className="text-primary"
            >
              {nodesOnline}
            </motion.span>
            {' nodes online'}
          </span>
          <span className="text-border-strong">·</span>
          <span className="font-mono text-xs text-secondary">
            <motion.span
              key={utilization}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              className="text-primary"
            >
              {utilization}%
            </motion.span>
            {' utilization'}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button className="p-2 text-tertiary hover:text-secondary hover:bg-hover rounded-md transition-colors">
            <Command className="w-4 h-4" />
          </button>
          <button className="relative p-2 text-tertiary hover:text-secondary hover:bg-hover rounded-md transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-danger rounded-full" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="w-8 h-8 bg-elevated border border-border-default rounded-full flex items-center justify-center hover:border-border-strong transition-colors cursor-pointer">
                <User className="w-4 h-4 text-secondary" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-surface border-border-default">
              <DropdownMenuItem className="text-secondary">Settings</DropdownMenuItem>
              <DropdownMenuItem className="text-secondary">API Keys</DropdownMenuItem>
              <DropdownMenuItem className="text-secondary">Billing</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border-subtle" />
              <DropdownMenuItem className="text-secondary">Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
