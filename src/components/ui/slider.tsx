'use client';

import { cn } from '@/lib/utils';

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

function Slider({ value, onValueChange, min = 0, max = 100, step = 1, className }: SliderProps) {
  const currentValue = value[0] ?? min;
  const percentage = ((currentValue - min) / (max - min)) * 100;

  return (
    <div className={cn('relative w-full', className)}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={(e) => onValueChange([Number(e.target.value)])}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#27272A] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#84CC16] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#84CC16] [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#84CC16] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#84CC16]"
        style={{
          background: `linear-gradient(to right, #84CC16 0%, #84CC16 ${percentage}%, #27272A ${percentage}%, #27272A 100%)`,
        }}
      />
    </div>
  );
}

export { Slider };
