'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Availability } from '@/lib/types';

interface AvailabilityStripProps {
  availability: Availability;
  className?: string;
  days?: number;
}

export function AvailabilityStrip({ availability, className, days = 7 }: AvailabilityStripProps) {
  const hours = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const slots: { hour: number; day: number; booked: boolean }[] = [];

    for (let d = 0; d < days; d++) {
      for (let h = 0; h < 24; h++) {
        const slotStart = new Date(startOfDay.getTime() + d * 86400000 + h * 3600000);
        const slotEnd = new Date(slotStart.getTime() + 3600000);
        
        const isBooked = availability.bookedSlots.some(([start, end]) => {
          const bookStart = new Date(start);
          const bookEnd = new Date(end);
          return slotStart < bookEnd && slotEnd > bookStart;
        });

        slots.push({ hour: h, day: d, booked: isBooked });
      }
    }

    return slots;
  }, [availability, days]);

  const dayLabels = useMemo(() => {
    const labels: string[] = [];
    const now = new Date();
    for (let d = 0; d < days; d++) {
      const date = new Date(now.getTime() + d * 86400000);
      labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
    }
    return labels;
  }, [days]);

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex gap-0.5">
        {dayLabels.map((label, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-tertiary font-mono">
            {label}
          </div>
        ))}
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: days }).map((_, dayIndex) => (
          <div key={dayIndex} className="flex-1 flex gap-px">
            {hours
              .filter((h) => h.day === dayIndex)
              .map((slot, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex-1 h-3 rounded-sm transition-colors',
                    slot.booked ? 'bg-border-default' : 'bg-accent/40 hover:bg-accent/60'
                  )}
                  title={`${dayLabels[dayIndex]} ${slot.hour}:00 - ${slot.booked ? 'Booked' : 'Available'}`}
                />
              ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 text-[10px] text-tertiary">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-accent/40" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-border-default" />
          <span>Booked</span>
        </div>
      </div>
    </div>
  );
}
