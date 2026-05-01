'use client';

import { useState, useEffect, useCallback } from 'react';
import { TelemetryData } from '@/lib/types';

function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function useFakeTelemetry(
  gpuCount: number,
  vramGB: number,
  seed: number = 42
): TelemetryData[] {
  const [telemetry, setTelemetry] = useState<TelemetryData[]>(() =>
    Array.from({ length: gpuCount }, (_, i) => ({
      gpuIndex: i,
      utilization: 70 + seededRandom(seed + i) * 20,
      vramUsed: (vramGB * 0.6) + seededRandom(seed + i + 100) * (vramGB * 0.3),
      vramTotal: vramGB,
      temperature: 55 + seededRandom(seed + i + 200) * 20,
      powerDraw: 300 + seededRandom(seed + i + 300) * 150,
      history: Array.from({ length: 60 }, (_, j) => 
        60 + seededRandom(seed + i + j) * 30
      ),
    }))
  );

  const updateTelemetry = useCallback(() => {
    setTelemetry((prev) =>
      prev.map((gpu, i) => {
        const timeSeed = Date.now() / 1000 + i;
        const noise = (seededRandom(timeSeed) - 0.5) * 10;
        
        const newUtil = clamp(gpu.utilization + noise, 40, 99);
        const newVram = clamp(
          gpu.vramUsed + (seededRandom(timeSeed + 100) - 0.5) * 2,
          vramGB * 0.4,
          vramGB * 0.95
        );
        const newTemp = clamp(
          gpu.temperature + (seededRandom(timeSeed + 200) - 0.5) * 3,
          50,
          85
        );
        const newPower = clamp(
          gpu.powerDraw + (seededRandom(timeSeed + 300) - 0.5) * 30,
          250,
          500
        );

        return {
          ...gpu,
          utilization: newUtil,
          vramUsed: newVram,
          temperature: newTemp,
          powerDraw: newPower,
          history: [...gpu.history.slice(1), newUtil],
        };
      })
    );
  }, [vramGB]);

  useEffect(() => {
    const interval = setInterval(updateTelemetry, 2000);
    return () => clearInterval(interval);
  }, [updateTelemetry]);

  return telemetry;
}
