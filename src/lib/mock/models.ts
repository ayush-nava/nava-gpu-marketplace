import { GPUModel } from '../types';

export interface AIModel {
  id: string;
  name: string;
  family: 'llama' | 'qwen' | 'mistral' | 'deepseek';
  parameterCount: string; // e.g. "70B"
  parameterCountNum: number; // in billions
  variants: ModelVariant[];
  contextWindow: number;
  description: string;
}

export interface ModelVariant {
  id: string;
  quantization: 'FP16' | 'FP8' | 'INT8' | 'INT4' | 'AWQ-4bit' | 'GPTQ-4bit';
  sizeGB: number; // weight size in GB
  minVRAMGB: number; // minimum VRAM needed
  speedMultiplier: number; // relative to FP16 baseline
  qualityScore: number; // 0-100, FP16 = 100
}

export interface DeploymentConfig {
  model: AIModel;
  variant: ModelVariant;
  runtime: 'vllm' | 'tgi' | 'tensorrt-llm';
  useCase: 'low-latency' | 'high-throughput' | 'cost-optimized' | 'massive-context';
}

export interface DeploymentMetrics {
  ttft_ms: number; // time to first token
  tokensPerSec: number;
  gpuUtil: number;
  costPerMTok: number; // $/1M tokens
  precision: string;
}

export interface RuntimeOption {
  id: 'vllm' | 'tgi' | 'tensorrt-llm';
  name: string;
  description: string;
}

export const RUNTIMES: RuntimeOption[] = [
  { id: 'vllm', name: 'vLLM', description: 'High-throughput serving with PagedAttention' },
  { id: 'tgi', name: 'TGI', description: 'HuggingFace Text Generation Inference' },
  { id: 'tensorrt-llm', name: 'TensorRT-LLM', description: 'NVIDIA optimized inference engine' },
];

export const USE_CASES = [
  { id: 'low-latency', name: 'Ultra Low Latency', description: 'Minimize TTFT for real-time apps' },
  { id: 'high-throughput', name: 'High Throughput', description: 'Maximize tokens/sec for batch' },
  { id: 'massive-context', name: 'Massive Context', description: 'Extended context with RoPE scaling' },
  { id: 'cost-optimized', name: 'Cost Optimized', description: 'Minimum cost for dev/staging' },
] as const;

export const AI_MODELS: AIModel[] = [
  {
    id: 'llama-3.1-8b',
    name: 'Llama 3.1 8B Instruct',
    family: 'llama',
    parameterCount: '8B',
    parameterCountNum: 8,
    contextWindow: 128000,
    description: 'Fast, efficient model for chat and code generation',
    variants: [
      { id: 'llama-3.1-8b-fp16', quantization: 'FP16', sizeGB: 16, minVRAMGB: 20, speedMultiplier: 1.0, qualityScore: 100 },
      { id: 'llama-3.1-8b-fp8', quantization: 'FP8', sizeGB: 8, minVRAMGB: 12, speedMultiplier: 1.4, qualityScore: 99 },
      { id: 'llama-3.1-8b-int8', quantization: 'INT8', sizeGB: 8, minVRAMGB: 12, speedMultiplier: 1.3, qualityScore: 97 },
      { id: 'llama-3.1-8b-int4', quantization: 'INT4', sizeGB: 4.5, minVRAMGB: 8, speedMultiplier: 1.8, qualityScore: 92 },
      { id: 'llama-3.1-8b-awq', quantization: 'AWQ-4bit', sizeGB: 4.5, minVRAMGB: 8, speedMultiplier: 1.9, qualityScore: 93 },
    ],
  },
  {
    id: 'llama-3.1-70b',
    name: 'Llama 3.1 70B Instruct',
    family: 'llama',
    parameterCount: '70B',
    parameterCountNum: 70,
    contextWindow: 128000,
    description: 'High-quality reasoning and instruction following',
    variants: [
      { id: 'llama-3.1-70b-fp16', quantization: 'FP16', sizeGB: 140, minVRAMGB: 160, speedMultiplier: 1.0, qualityScore: 100 },
      { id: 'llama-3.1-70b-fp8', quantization: 'FP8', sizeGB: 70, minVRAMGB: 80, speedMultiplier: 1.5, qualityScore: 99 },
      { id: 'llama-3.1-70b-int8', quantization: 'INT8', sizeGB: 70, minVRAMGB: 80, speedMultiplier: 1.3, qualityScore: 97 },
      { id: 'llama-3.1-70b-int4', quantization: 'INT4', sizeGB: 37, minVRAMGB: 48, speedMultiplier: 2.0, qualityScore: 90 },
      { id: 'llama-3.1-70b-awq', quantization: 'AWQ-4bit', sizeGB: 37, minVRAMGB: 48, speedMultiplier: 2.1, qualityScore: 91 },
    ],
  },
  {
    id: 'llama-3.1-405b',
    name: 'Llama 3.1 405B Instruct',
    family: 'llama',
    parameterCount: '405B',
    parameterCountNum: 405,
    contextWindow: 128000,
    description: 'Frontier-class open model for complex reasoning',
    variants: [
      { id: 'llama-3.1-405b-fp16', quantization: 'FP16', sizeGB: 810, minVRAMGB: 900, speedMultiplier: 1.0, qualityScore: 100 },
      { id: 'llama-3.1-405b-fp8', quantization: 'FP8', sizeGB: 405, minVRAMGB: 480, speedMultiplier: 1.4, qualityScore: 99 },
      { id: 'llama-3.1-405b-int4', quantization: 'INT4', sizeGB: 210, minVRAMGB: 256, speedMultiplier: 2.0, qualityScore: 88 },
    ],
  },
  {
    id: 'qwen-2.5-7b',
    name: 'Qwen 2.5 7B Instruct',
    family: 'qwen',
    parameterCount: '7B',
    parameterCountNum: 7,
    contextWindow: 131072,
    description: 'Multilingual model with strong coding abilities',
    variants: [
      { id: 'qwen-2.5-7b-fp16', quantization: 'FP16', sizeGB: 14, minVRAMGB: 18, speedMultiplier: 1.0, qualityScore: 100 },
      { id: 'qwen-2.5-7b-fp8', quantization: 'FP8', sizeGB: 7, minVRAMGB: 10, speedMultiplier: 1.4, qualityScore: 99 },
      { id: 'qwen-2.5-7b-int4', quantization: 'INT4', sizeGB: 4, minVRAMGB: 6, speedMultiplier: 1.9, qualityScore: 93 },
      { id: 'qwen-2.5-7b-awq', quantization: 'AWQ-4bit', sizeGB: 4, minVRAMGB: 6, speedMultiplier: 2.0, qualityScore: 94 },
    ],
  },
  {
    id: 'qwen-2.5-72b',
    name: 'Qwen 2.5 72B Instruct',
    family: 'qwen',
    parameterCount: '72B',
    parameterCountNum: 72,
    contextWindow: 131072,
    description: 'State-of-the-art open model rivaling GPT-4 class',
    variants: [
      { id: 'qwen-2.5-72b-fp16', quantization: 'FP16', sizeGB: 144, minVRAMGB: 160, speedMultiplier: 1.0, qualityScore: 100 },
      { id: 'qwen-2.5-72b-fp8', quantization: 'FP8', sizeGB: 72, minVRAMGB: 80, speedMultiplier: 1.5, qualityScore: 99 },
      { id: 'qwen-2.5-72b-int8', quantization: 'INT8', sizeGB: 72, minVRAMGB: 80, speedMultiplier: 1.3, qualityScore: 97 },
      { id: 'qwen-2.5-72b-int4', quantization: 'INT4', sizeGB: 38, minVRAMGB: 48, speedMultiplier: 2.0, qualityScore: 89 },
    ],
  },
  {
    id: 'mistral-7b',
    name: 'Mistral 7B Instruct v0.3',
    family: 'mistral',
    parameterCount: '7B',
    parameterCountNum: 7,
    contextWindow: 32768,
    description: 'Efficient model with sliding window attention',
    variants: [
      { id: 'mistral-7b-fp16', quantization: 'FP16', sizeGB: 14, minVRAMGB: 18, speedMultiplier: 1.0, qualityScore: 100 },
      { id: 'mistral-7b-fp8', quantization: 'FP8', sizeGB: 7, minVRAMGB: 10, speedMultiplier: 1.4, qualityScore: 99 },
      { id: 'mistral-7b-int4', quantization: 'INT4', sizeGB: 4, minVRAMGB: 6, speedMultiplier: 1.8, qualityScore: 92 },
      { id: 'mistral-7b-gptq', quantization: 'GPTQ-4bit', sizeGB: 4, minVRAMGB: 6, speedMultiplier: 1.7, qualityScore: 91 },
    ],
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3',
    family: 'deepseek',
    parameterCount: '671B MoE',
    parameterCountNum: 671,
    contextWindow: 128000,
    description: 'Mixture-of-experts model with 37B active parameters',
    variants: [
      { id: 'deepseek-v3-fp8', quantization: 'FP8', sizeGB: 340, minVRAMGB: 400, speedMultiplier: 1.0, qualityScore: 99 },
      { id: 'deepseek-v3-int4', quantization: 'INT4', sizeGB: 180, minVRAMGB: 220, speedMultiplier: 1.6, qualityScore: 92 },
    ],
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    family: 'deepseek',
    parameterCount: '671B MoE',
    parameterCountNum: 671,
    contextWindow: 128000,
    description: 'Reasoning-focused model with chain-of-thought',
    variants: [
      { id: 'deepseek-r1-fp8', quantization: 'FP8', sizeGB: 340, minVRAMGB: 400, speedMultiplier: 1.0, qualityScore: 99 },
      { id: 'deepseek-r1-int4', quantization: 'INT4', sizeGB: 180, minVRAMGB: 220, speedMultiplier: 1.6, qualityScore: 92 },
    ],
  },
];

/**
 * Given a GPU config, returns which model variants can fit.
 */
export function getCompatibleVariants(
  gpuModel: GPUModel,
  gpuCount: number,
  vramPerGPU: number
): { model: AIModel; variant: ModelVariant; fitsNatively: boolean }[] {
  const totalVRAM = gpuCount * vramPerGPU;
  const results: { model: AIModel; variant: ModelVariant; fitsNatively: boolean }[] = [];

  for (const model of AI_MODELS) {
    for (const variant of model.variants) {
      if (variant.minVRAMGB <= totalVRAM) {
        results.push({
          model,
          variant,
          fitsNatively: variant.quantization === 'FP16' || variant.quantization === 'FP8',
        });
      }
    }
  }

  return results;
}

/**
 * Estimate deployment metrics based on hardware and model config.
 */
export function estimateMetrics(
  gpuModel: GPUModel,
  gpuCount: number,
  variant: ModelVariant,
  useCase: string,
  gpuPricePerHour: number
): DeploymentMetrics {
  // Base tokens/sec estimates per GPU type for a 70B FP16 model
  const baseTps: Record<GPUModel, number> = {
    'H100 SXM5': 240,
    'H100 PCIe': 180,
    'A100 SXM': 120,
    'A100 PCIe': 100,
    'B200': 380,
    'L40S': 80,
    'RTX 4090': 70,
    'RTX 6000 Ada': 75,
  };

  const baseTtft: Record<GPUModel, number> = {
    'H100 SXM5': 85,
    'H100 PCIe': 110,
    'A100 SXM': 140,
    'A100 PCIe': 160,
    'B200': 55,
    'L40S': 180,
    'RTX 4090': 190,
    'RTX 6000 Ada': 185,
  };

  let tps = baseTps[gpuModel] * variant.speedMultiplier * Math.sqrt(gpuCount);
  let ttft = baseTtft[gpuModel] / variant.speedMultiplier;

  // Use case adjustments
  if (useCase === 'low-latency') {
    ttft *= 0.7;
    tps *= 0.85;
  } else if (useCase === 'high-throughput') {
    tps *= 1.4;
    ttft *= 1.3;
  } else if (useCase === 'cost-optimized') {
    tps *= 0.9;
    ttft *= 1.1;
  }

  const gpuUtil = Math.min(99, 70 + variant.speedMultiplier * 10 + (useCase === 'high-throughput' ? 15 : 0));
  const costPerMTok = (gpuPricePerHour / (tps * 3.6)) * 1000; // $/1M tokens

  return {
    ttft_ms: Math.round(ttft),
    tokensPerSec: Math.round(tps),
    gpuUtil: Math.round(gpuUtil),
    costPerMTok: Math.round(costPerMTok * 100) / 100,
    precision: variant.quantization,
  };
}

/** Additional pricing for managed model deployment */
export const DEPLOYMENT_PRICING = {
  managedServiceFee: 0.15, // $/hr flat fee for managed deployment
  premiumModels: ['deepseek-v3', 'deepseek-r1', 'llama-3.1-405b'], // extra $0.10/hr
  premiumModelSurcharge: 0.10,
};
