# Nava — Product Requirements Document

**Version:** 1.0  
**Date:** May 11, 2026  
**Author:** Product Team  
**Status:** Draft  
**Prototype:** https://nava-gpu-marketplace.vercel.app

---

## 1. Problem Statement

The GPU compute market has a fundamental supply-demand mismatch. On one side, ML researchers and AI startups face 3–6 month waitlists for bare-metal GPU access from hyperscalers. On the other, thousands of GPU nodes sit idle across small datacenters, crypto-adjacent operators, and AI startups with spare capacity between training runs.

There is no efficient marketplace connecting these two sides. Existing options force buyers into either long-term reserved instances (expensive, inflexible) or shared multi-tenant environments (noisy, limited). Sellers have no channel to monetize idle hardware without building their own sales pipeline and infrastructure.

---

## 2. Target Users

### 2.1 Demand Side (GPU Renters)

**Primary persona: ML Engineer / AI Startup Infra Lead**

- Works at a 5–50 person AI startup or research lab
- Needs bare-metal GPU access for training runs, fine-tuning, or inference serving
- Currently uses Modal, Lambda, RunPod, CoreWeave, or spot instances on AWS/GCP
- CLI-fluent, reads GPU spec sheets, skeptical of marketing claims
- Cares about: price transparency, SSH root access, NVLink topology, NCCL benchmarks

**Pain points:**
1. **Availability:** H100/B200 nodes are backordered for months from major providers
2. **Pricing opacity:** Hyperscaler pricing is complex with hidden egress fees and commitment requirements
3. **Inflexibility:** Minimum commitments of weeks/months when they need hours/days
4. **Multi-tenancy noise:** Shared environments introduce unpredictable performance variance
5. **No hardware verification:** Can't validate actual interconnect bandwidth or GPU health before committing

### 2.2 Supply Side (GPU Providers)

**Primary persona: Small Datacenter Operator / AI Startup with Idle Clusters**

- Operates 1–20 GPU nodes (H100, A100, or consumer-grade)
- Hardware sits idle 30–70% of the time between internal workloads
- Has no sales team or marketplace presence to find short-term renters
- Technically capable but doesn't want to build provisioning infrastructure

**Pain points:**
1. **Idle capital:** $200K–$2M in hardware earning nothing during off-hours
2. **No demand channel:** Finding short-term renters requires sales effort they can't staff
3. **Provisioning complexity:** Securely onboarding/offboarding tenants requires custom tooling
4. **Trust asymmetry:** Renters don't trust unknown providers; providers don't trust unknown renters
5. **Pricing uncertainty:** No market signal for what their hardware is worth per hour

---

## 3. Market Context

| Segment | Players | Gap Nava Fills |
|---------|---------|----------------|
| Hyperscaler GPU cloud | AWS, GCP, Azure, CoreWeave | Long waitlists, high minimums, no bare-metal SSH |
| Serverless GPU | Modal, Replicate, Together AI | No bare-metal access, abstracted away from hardware |
| GPU marketplaces | Vast.ai, RunPod | Consumer-grade focus, limited verification, no managed deployment |
| Enterprise GPU | Lambda, Crusoe | Long-term contracts, enterprise sales cycles |

Nava targets the gap between serverless (too abstracted) and enterprise (too committed) — short-term, verified, bare-metal GPU access with optional managed model deployment.

---

## 4. Proposed Solution

Nava is a two-sided GPU marketplace that aggregates fragmented bare-metal GPU supply and matches it to short-term demand from ML teams.

**Interactive prototype:** https://nava-gpu-marketplace.vercel.app

### 4.1 Core Value Propositions

**For Demand (Renters):**
- Browse verified GPU nodes with real NCCL/GEMM benchmarks
- Filter by GPU model, interconnect topology, region, supplier tier, and model compatibility
- Reserve for hours to weeks — no long-term commitment
- Get root SSH access to bare metal within minutes
- Optionally deploy open models (Llama, Qwen, DeepSeek) with one click
- See optimality scores and memory allocation before committing

**For Supply (Providers):**
- List hardware in under 10 minutes via guided onboarding
- Automated diagnostics agent handles benchmarking and health monitoring
- Tier-based pricing rewards reliability (Platinum providers earn 25% more)
- Nava handles tenant provisioning, key injection, and secure wipe
- Real-time earnings dashboard with utilization tracking

### 4.2 Key Differentiators

1. **Hardware verification:** Every listing has measured NCCL, GEMM, and HBM benchmarks — not self-reported specs
2. **Interconnect-accurate topology:** Listings reflect real NVLink/NVSwitch/PCIe configurations based on actual NVIDIA hardware constraints
3. **Supplier tiering:** Anonymous providers ranked by reliability metrics (uptime SLA, response time, ECC errors) — not names or brands
4. **Managed model deployment:** One-click deployment of quantized open models with predicted performance metrics (TTFT, tok/sec, cost/1M tokens)
5. **Intelligence layer:** Optimality scoring and HBM allocation visualization help users pick the right hardware-model combination

---

## 5. User Journeys

### 5.1 Demand: Rent a GPU and Deploy a Model

1. Land on marketplace → Browse GPU catalogue
2. Filter by model compatibility (e.g., "Llama 3.1 70B") → see only GPUs with sufficient VRAM
3. Filter by supplier tier (Gold+) for reliability guarantees
4. Open listing → review topology diagram, benchmarks, supplier uptime
5. Enable "Deploy a model" → select Llama 3.1 70B FP8 → see optimality score (77/100) and HBM allocation
6. Choose duration (24h) → Reserve node
7. Provisioning animation → SSH credentials + model API endpoint ready
8. Live session: telemetry dashboard, deployed model status, activity log

### 5.2 Supply: List Hardware and Start Earning

1. Start onboarding → Provider profile (type, location)
2. Hardware configuration → GPU model, count, interconnect, host specs → live topology preview
3. Install Nava agent → run curl command on node → verify connection
4. Run diagnostics → automated NCCL/NVLink/network tests → verification report
5. See tier assignment (Bronze for new) → understand upgrade path to Platinum (+25% earnings)
6. Set availability schedule and pricing → see tier-based pricing chart with 30-day projection
7. Review and publish → listing goes live on marketplace

---

## 6. Feature Scope (MVP)

### Must Have (P0)
- GPU catalogue with filtering (model, count, interconnect, region, tier, VRAM compatibility)
- Listing detail with topology diagram, benchmarks, and booking flow
- Supplier onboarding wizard (7 steps including agent install)
- Supplier tiering system (Platinum/Gold/Silver/Bronze) with pricing multipliers
- Model deployment configurator with quantization selection
- Optimality score and HBM allocation visualization
- Active session view with live telemetry and SSH credentials
- Billing pages for both sides

### Should Have (P1)
- Real-time availability calendar with drag-to-select
- Compare tray for side-by-side GPU evaluation
- Notification system for rental events
- Command palette (Cmd+K) for power users
- Multi-node rental (reserve across multiple listings)

### Nice to Have (P2)
- Spot pricing with auction mechanism
- Auto-scaling model deployment across multiple nodes
- Custom base image upload
- API-first rental creation (programmatic access)
- Referral program for supply acquisition

---

## 7. Success Metrics

| Metric | Target (6 months) | Rationale |
|--------|-------------------|-----------|
| Listed GPU nodes | 200+ | Critical mass for demand-side value |
| Monthly active renters | 500+ | Validates demand-side PMF |
| Avg utilization (supply) | >60% | Proves marketplace efficiency |
| Time to first SSH | <5 minutes | Core UX promise |
| Renter NPS | >50 | Retention indicator |
| Supply-side churn | <10%/month | Provider satisfaction |
| GMV | $500K/month | Business viability |

---

## 8. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cold start (no supply = no demand) | High | Seed with 10–20 partner operators; offer first-month fee waiver |
| Hardware fraud (fake specs) | High | Mandatory agent install + automated benchmarks; tier demotion for anomalies |
| Renter misuse (crypto mining, abuse) | Medium | Workload policies, auto-wipe, renter tiering |
| Pricing race to bottom | Medium | Tier-based pricing floors; quality differentiation |
| Hyperscaler price drops | Medium | Focus on availability speed and bare-metal access as differentiators |
| Agent security vulnerabilities | High | Open-source agent, security audits, minimal privilege model |

---

## 9. Technical Architecture (High Level)

- **Frontend:** Next.js 14, React, Tailwind CSS (this prototype)
- **Agent:** Lightweight daemon on provider nodes (Linux, communicates over HTTPS)
- **Backend:** API service handling matching, scheduling, billing, telemetry ingestion
- **Provisioning:** Automated image flashing, SSH key injection, secure wipe via agent
- **Model serving:** vLLM/TGI/TensorRT-LLM orchestrated by agent on provider hardware
- **Payments:** Stripe Connect for two-sided marketplace payouts

---

## 10. Go-to-Market

**Phase 1 (Months 1–3): Supply Seeding**
- Partner with 10–20 small datacenter operators and AI startups with idle H100/A100 clusters
- Offer zero platform fee for first 3 months
- Focus on NA-East and NA-West regions

**Phase 2 (Months 3–6): Demand Acquisition**
- Target ML engineers at Series A–C AI startups via technical content (benchmarks, comparisons)
- Integrate with common ML workflows (Weights & Biases, MLflow)
- Launch managed model deployment as differentiator vs. raw GPU rental

**Phase 3 (Months 6–12): Marketplace Flywheel**
- Introduce spot pricing for cost-sensitive workloads
- Expand to EU and APAC regions
- Launch API-first access for programmatic rental
- Build enterprise tier with SLAs and dedicated account management

---

## Appendix: Prototype Walkthrough

The interactive prototype at https://nava-gpu-marketplace.vercel.app demonstrates the complete user experience for both sides of the marketplace. Key screens:

- `/` — Landing page with value proposition
- `/app/demand` — GPU catalogue with filters, tier badges, model compatibility filter
- `/app/demand/listing/lst-0001` — Listing detail with topology, benchmarks, model deployment configurator
- `/app/demand/rentals/rnt-new?from=lst-0001` — Active session with telemetry and deployed model
- `/app/demand/billing` — Consumer billing dashboard
- `/app/supply` — Supplier dashboard with earnings and hardware health
- `/app/supply/onboard` — 7-step supplier onboarding wizard
- `/app/supply/billing` — Provider earnings and payout management
