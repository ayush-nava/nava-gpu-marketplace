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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
            <Select value={selectedModelId} onValueChange={(v) => v && handleModelChange(v)}>
              <SelectTrigger className="w-full bg-[#18181B] border-[#27272A] text-[#FAFAFA] rounded-[6px] h-8 text-xs">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent className="bg-[#18181B] border-[#27272A]">
                {Object.entries(groupedModels).map(([family, models]) => (
                  <SelectGroup key={family}>
                    <SelectLabel className="text-[10px] uppercase text-[#71717A] tracking-wide">
                      {MODEL_FAMILIES[family] ?? family}
                    </SelectLabel>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.id} className="text-xs text-[#FAFAFA]">
                        <span>{model.name}</span>
                        <span className="ml-1.5 font-mono text-[#71717A]">{model.parameterCount}</span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
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

          {/* Runtime Selector (skip in compact) */}
          {!compact && (
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
          )}

          {/* Use Case Preset (skip in compact) */}
          {!compact && (
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
          )}

          {/* Predicted Metrics Panel */}
          {metrics && (
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wide text-[#71717A]">Predicted Metrics</label>
              {compact ? (
                <div className="flex items-center gap-3 px-2.5 py-1.5 rounded-[6px] border border-[#1F1F23] bg-[#18181B]">
                  <span className="font-mono text-xs text-[#FAFAFA]">{metrics.ttft_ms}ms TTFT</span>
                  <span className="text-[#27272A]">·</span>
                  <span className="font-mono text-xs text-[#FAFAFA]">{metrics.tokensPerSec} tok/s</span>
                  <span className="text-[#27272A]">·</span>
                  <span className="font-mono text-xs text-[#A1A1AA]">${metrics.costPerMTok}/1M tok</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  <MetricCell label="TTFT" value={`${metrics.ttft_ms}ms`} />
                  <MetricCell label="Tok/sec" value={`${metrics.tokensPerSec}`} />
                  <MetricCell label="GPU Util" value={`${metrics.gpuUtil}%`} />
                  <MetricCell label="$/1M tok" value={`$${metrics.costPerMTok.toFixed(2)}`} />
                  <MetricCell label="GPU price" value={`$${pricePerHour.toFixed(2)}/hr`} />
                  <MetricCell label="Precision" value={metrics.precision} />
                </div>
              )}
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

          {/* SDK Snippet (skip in compact) */}
          {!compact && selectedModel && selectedVariant && (
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
        </div>
      )}
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
