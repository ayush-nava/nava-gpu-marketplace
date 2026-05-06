'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  AI_MODELS,
  AIModel,
  RUNTIMES,
  USE_CASES,
  estimateMetrics,
  DEPLOYMENT_PRICING,
} from '@/lib/mock/models';
import { GPUModel } from '@/lib/types';

interface ModelDeployCardProps {
  gpuModel: string;
  gpuCount: number;
  vramPerGPU: number;
  pricePerHour: number;
  onConfigChange?: (config: { modelId: string; variantId: string; runtime: string; useCase: string } | null) => void;
  compact?: boolean;
}

const QUANT_TAGS: Record<string, { label: string; color: string }> = {
  FP16: { label: 'native', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  FP8: { label: 'near-native', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  INT8: { label: 'quantized', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  INT4: { label: 'quantized', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  'AWQ-4bit': { label: 'quantized', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  'GPTQ-4bit': { label: 'quantized', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
};

const MODEL_FAMILIES: Record<string, string> = {
  llama: 'Meta Llama',
  qwen: 'Alibaba Qwen',
  mistral: 'Mistral AI',
  deepseek: 'DeepSeek',
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#84CC16';
  if (score >= 60) return '#3B82F6';
  if (score >= 40) return '#EAB308';
  return '#EF4444';
}

export function ModelDeployCard({
  gpuModel,
  gpuCount,
  vramPerGPU,
  pricePerHour,
  onConfigChange,
  compact = false,
}: ModelDeployCardProps) {
  const [enabled, setEnabled] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [selectedRuntime, setSelectedRuntime] = useState<string>('vllm');
  const [selectedUseCase, setSelectedUseCase] = useState<string>('high-throughput');

  const totalVRAM = gpuCount * vramPerGPU;

  const selectedModel = useMemo(
    () => AI_MODELS.find((m) => m.id === selectedModelId) ?? null,
    [selectedModelId]
  );

  const selectedVariant = useMemo(
    () => selectedModel?.variants.find((v) => v.id === selectedVariantId) ?? null,
    [selectedModel, selectedVariantId]
  );

  const metrics = useMemo(() => {
    if (!selectedVariant) return null;
    return estimateMetrics(
      gpuModel as GPUModel,
      gpuCount,
      selectedVariant,
      selectedUseCase,
      pricePerHour
    );
  }, [gpuModel, gpuCount, selectedVariant, selectedUseCase, pricePerHour]);

  const isPremiumModel = DEPLOYMENT_PRICING.premiumModels.includes(selectedModelId);

  const groupedModels = useMemo(() => {
    const groups: Record<string, AIModel[]> = {};
    for (const model of AI_MODELS) {
      if (!groups[model.family]) groups[model.family] = [];
      groups[model.family].push(model);
    }
    return groups;
  }, []);

  // Optimality score calculation
  const optimalityData = useMemo(() => {
    if (!metrics || !selectedVariant) return null;

    const latencyScore = clamp(100 - (metrics.ttft_ms - 50) * 0.5, 0, 100);
    const throughputScore = clamp(metrics.tokensPerSec / 20, 0, 100);
    const costScore = clamp(100 - metrics.costPerMTok * 50, 0, 100);

    const weightsGB = selectedVariant.sizeGB;
    const freeVRAM = totalVRAM - weightsGB;
    const memoryScore = clamp((freeVRAM / totalVRAM) * 100, 0, 100);

    const overall = Math.round((latencyScore + throughputScore + costScore + memoryScore) / 4);

    return {
      overall,
      latency: Math.round(latencyScore),
      throughput: Math.round(throughputScore),
      cost: Math.round(costScore),
      memory: Math.round(memoryScore),
    };
  }, [metrics, selectedVariant, totalVRAM]);

  // HBM allocation calculation
  const hbmData = useMemo(() => {
    if (!selectedVariant) return null;

    const weightsGB = selectedVariant.sizeGB;
    const remaining = totalVRAM - weightsGB;
    const kvCacheGB = remaining * 0.15;
    const activationsGB = remaining * 0.05;
    const freeGB = remaining - kvCacheGB - activationsGB;

    return {
      totalVRAM,
      weightsGB,
      kvCacheGB,
      activationsGB,
      freeGB,
    };
  }, [selectedVariant, totalVRAM]);

  function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    if (!next) {
      onConfigChange?.(null);
    }
  }

  function handleModelChange(modelId: string) {
    setSelectedModelId(modelId);
    setSelectedVariantId('');
    onConfigChange?.(null);
  }

  function handleVariantChange(variantId: string) {
    setSelectedVariantId(variantId);
    if (selectedModelId && variantId) {
      onConfigChange?.({
        modelId: selectedModelId,
        variantId,
        runtime: selectedRuntime,
        useCase: selectedUseCase,
      });
    }
  }

  function handleRuntimeChange(runtime: string) {
    setSelectedRuntime(runtime);
    if (selectedModelId && selectedVariantId) {
      onConfigChange?.({
        modelId: selectedModelId,
        variantId: selectedVariantId,
        runtime,
        useCase: selectedUseCase,
      });
    }
  }

  function handleUseCaseChange(useCase: string) {
    setSelectedUseCase(useCase);
    if (selectedModelId && selectedVariantId) {
      onConfigChange?.({
        modelId: selectedModelId,
        variantId: selectedVariantId,
        runtime: selectedRuntime,
        useCase,
      });
    }
  }

  const hardwareSlug = `${gpuModel.toLowerCase().replace(/\s+/g, '-')}-${gpuCount}x`;

  return (
    <div className="rounded-[10px] border border-[#1F1F23] bg-[#111113] p-3 space-y-3">
      {/* Toggle */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <button
          type="button"
          role="checkbox"
          aria-checked={enabled}
          onClick={handleToggle}
          className={cn(
            'relative h-5 w-9 rounded-full border transition-colors',
            enabled
              ? 'bg-[#84CC16] border-[#84CC16]'
              : 'bg-[#18181B] border-[#27272A]'
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform',
              enabled && 'translate-x-4'
            )}
          />
        </button>
        <span className="text-sm font-medium text-[#FAFAFA]">Deploy a model</span>
      </label>

      {enabled && (
        <div className="space-y-3">
          {/* Model Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wide text-[#71717A]">Model</label>
            <select
              value={selectedModelId}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full h-8 px-2.5 bg-[#18181B] border border-[#3F3F46] text-[#FAFAFA] rounded-[6px] text-xs outline-none focus:border-[#84CC16] appearance-none cursor-pointer"
            >
              <option value="" disabled>Select a model</option>
              {Object.entries(groupedModels).map(([family, models]) => (
                <optgroup key={family} label={MODEL_FAMILIES[family] ?? family}>
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.parameterCount})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Quantization Selector */}
          {selectedModel && (
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wide text-[#71717A]">Quantization</label>
              <div className="space-y-1">
                {selectedModel.variants.map((variant) => {
                  const fits = variant.minVRAMGB <= totalVRAM;
                  const isSelected = selectedVariantId === variant.id;
                  const tag = QUANT_TAGS[variant.quantization];

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      disabled={!fits}
                      onClick={() => handleVariantChange(variant.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] border text-left transition-colors',
                        isSelected
                          ? 'border-[#84CC16] bg-[#84CC16]/10'
                          : fits
                          ? 'border-[#27272A] bg-[#18181B] hover:border-[#3F3F46]'
                          : 'border-[#1F1F23] bg-[#111113] opacity-50 cursor-not-allowed'
                      )}
                    >
                      <span className={cn('text-xs font-mono font-medium', isSelected ? 'text-[#84CC16]' : 'text-[#FAFAFA]')}>
                        {variant.quantization}
                      </span>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', tag?.color)}>
                        {tag?.label}
                      </span>
                      <span className="ml-auto flex items-center gap-2">
                        <span className="font-mono text-[10px] text-[#A1A1AA]">{variant.sizeGB}GB</span>
                        <span className="font-mono text-[10px] text-[#71717A]">Q{variant.qualityScore}</span>
                      </span>
                      {!fits && (
                        <span className="text-[10px] text-red-400 ml-1">Exceeds VRAM</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Compact mode: one-line metrics summary */}
          {compact && metrics && (
            <div className="flex items-center gap-3 px-2.5 py-1.5 rounded-[6px] border border-[#1F1F23] bg-[#18181B]">
              <span className="font-mono text-xs text-[#FAFAFA]">{metrics.ttft_ms}ms TTFT</span>
              <span className="text-[#27272A]">·</span>
              <span className="font-mono text-xs text-[#FAFAFA]">{metrics.tokensPerSec} tok/s</span>
              <span className="text-[#27272A]">·</span>
              <span className="font-mono text-xs text-[#A1A1AA]">${metrics.costPerMTok}/1M tok</span>
            </div>
          )}

          {/* Non-compact: full layout */}
          {!compact && (
            <>
              {/* Optimality Score */}
              {optimalityData && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wide text-[#71717A]">Optimality Score</label>
                  <div className="rounded-[10px] border border-[#1F1F23] bg-[#18181B] p-3">
                    <div className="flex items-center gap-4">
                      {/* Circular Progress Ring */}
                      <div className="relative flex-shrink-0">
                        <svg width="72" height="72" viewBox="0 0 72 72">
                          {/* Background ring */}
                          <circle
                            cx="36"
                            cy="36"
                            r="30"
                            fill="none"
                            stroke="#27272A"
                            strokeWidth="6"
                          />
                          {/* Score ring */}
                          <circle
                            cx="36"
                            cy="36"
                            r="30"
                            fill="none"
                            stroke={getScoreColor(optimalityData.overall)}
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={`${(optimalityData.overall / 100) * 188.5} 188.5`}
                            transform="rotate(-90 36 36)"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span
                            className="font-mono text-lg font-bold"
                            style={{ color: getScoreColor(optimalityData.overall) }}
                          >
                            {optimalityData.overall}
                          </span>
                        </div>
                      </div>

                      {/* Sub-scores */}
                      <div className="flex-1 space-y-1.5">
                        <SubScoreRow label="Latency" score={optimalityData.latency} />
                        <SubScoreRow label="Throughput" score={optimalityData.throughput} />
                        <SubScoreRow label="Cost" score={optimalityData.cost} />
                        <SubScoreRow label="Memory" score={optimalityData.memory} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* HBM Allocation Bar */}
              {hbmData && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wide text-[#71717A]">
                    HBM Allocation · {hbmData.totalVRAM} GB Total
                  </label>
                  <div className="rounded-[10px] border border-[#1F1F23] bg-[#18181B] p-3 space-y-2">
                    {/* Stacked bar */}
                    <div className="h-4 w-full rounded-[6px] overflow-hidden flex">
                      <div
                        className="h-full"
                        style={{
                          width: `${(hbmData.weightsGB / hbmData.totalVRAM) * 100}%`,
                          backgroundColor: '#6366F1',
                        }}
                      />
                      <div
                        className="h-full"
                        style={{
                          width: `${(hbmData.kvCacheGB / hbmData.totalVRAM) * 100}%`,
                          backgroundColor: '#38BDF8',
                        }}
                      />
                      <div
                        className="h-full"
                        style={{
                          width: `${(hbmData.activationsGB / hbmData.totalVRAM) * 100}%`,
                          backgroundColor: '#F59E0B',
                        }}
                      />
                      <div
                        className="h-full"
                        style={{
                          width: `${(hbmData.freeGB / hbmData.totalVRAM) * 100}%`,
                          backgroundColor: '#27272A',
                        }}
                      />
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <LegendItem color="#6366F1" label="Weights" value={`${hbmData.weightsGB.toFixed(1)} GB`} />
                      <LegendItem color="#38BDF8" label="KV Cache" value={`${hbmData.kvCacheGB.toFixed(1)} GB`} />
                      <LegendItem color="#F59E0B" label="Activations" value={`${hbmData.activationsGB.toFixed(1)} GB`} />
                      <LegendItem color="#27272A" label="Free" value={`${hbmData.freeGB.toFixed(1)} GB`} />
                    </div>
                  </div>
                </div>
              )}

              {/* Runtime Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wide text-[#71717A]">Runtime</label>
                <div className="flex gap-1.5">
                  {RUNTIMES.map((rt) => (
                    <button
                      key={rt.id}
                      type="button"
                      onClick={() => handleRuntimeChange(rt.id)}
                      className={cn(
                        'px-2.5 py-1 rounded-[6px] border text-xs font-medium transition-colors',
                        selectedRuntime === rt.id
                          ? 'border-[#84CC16] bg-[#84CC16]/10 text-[#84CC16]'
                          : 'border-[#27272A] bg-[#18181B] text-[#A1A1AA] hover:border-[#3F3F46]'
                      )}
                    >
                      {rt.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Use Case Preset */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wide text-[#71717A]">Use Case</label>
                <div className="flex flex-wrap gap-1.5">
                  {USE_CASES.map((uc) => (
                    <button
                      key={uc.id}
                      type="button"
                      onClick={() => handleUseCaseChange(uc.id)}
                      className={cn(
                        'px-2.5 py-1 rounded-[6px] border text-xs font-medium transition-colors',
                        selectedUseCase === uc.id
                          ? 'border-[#84CC16] bg-[#84CC16]/10 text-[#84CC16]'
                          : 'border-[#27272A] bg-[#18181B] text-[#A1A1AA] hover:border-[#3F3F46]'
                      )}
                    >
                      {uc.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Predicted Metrics Panel */}
              {metrics && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wide text-[#71717A]">Predicted Metrics</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <MetricCell label="TTFT" value={`${metrics.ttft_ms}ms`} />
                    <MetricCell label="Tok/sec" value={`${metrics.tokensPerSec}`} />
                    <MetricCell label="GPU Util" value={`${metrics.gpuUtil}%`} />
                    <MetricCell label="$/1M tok" value={`${metrics.costPerMTok.toFixed(2)}`} />
                    <MetricCell label="GPU price" value={`${pricePerHour.toFixed(2)}/hr`} />
                    <MetricCell label="Precision" value={metrics.precision} />
                  </div>
                </div>
              )}

              {/* Pricing Note */}
              {selectedVariant && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#71717A] px-0.5">
                  <span>Managed deployment: <span className="font-mono text-[#A1A1AA]">+${DEPLOYMENT_PRICING.managedServiceFee.toFixed(2)}/hr</span></span>
                  {isPremiumModel && (
                    <span>Premium model: <span className="font-mono text-[#A1A1AA]">+${DEPLOYMENT_PRICING.premiumModelSurcharge.toFixed(2)}/hr</span></span>
                  )}
                </div>
              )}

              {/* SDK Snippet */}
              {selectedModel && selectedVariant && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wide text-[#71717A]">SDK</label>
                  <pre className="rounded-[6px] border border-[#1F1F23] bg-[#0A0A0C] p-2.5 text-[11px] font-mono text-[#A1A1AA] overflow-x-auto">
{`nava.deploy(
  model="${selectedModel.id}",
  quantization="${selectedVariant.quantization.toLowerCase()}",
  runtime="${selectedRuntime}",
  hardware="${hardwareSlug}"
)`}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SubScoreRow({ label, score }: { label: string; score: number }) {
  const color = getScoreColor(score);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[#A1A1AA] w-[60px]">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-[#27272A] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-mono text-[10px] w-[26px] text-right" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

function LegendItem({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <span className="text-[10px] text-[#A1A1AA]">{label}</span>
      <span className="font-mono text-[10px] text-[#71717A]">{value}</span>
    </div>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[6px] border border-[#1F1F23] bg-[#18181B] px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wide text-[#71717A]">{label}</div>
      <div className="font-mono text-xs text-[#FAFAFA] mt-0.5">{value}</div>
    </div>
  );
}
