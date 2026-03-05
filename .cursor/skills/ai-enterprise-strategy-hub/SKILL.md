---
name: ai-enterprise-strategy-hub
description: Builds enterprise AI strategy packages with architecture review, phased roadmap, KPI and ROI model, and governance controls. Use when users ask for AI strategic planning, hub-and-spoke architecture design, executive AI assistant planning, marketing AI flow planning, risk matrix, or implementation roadmap.
---

# AI Enterprise Strategy Hub

## Purpose

Use this skill to turn raw business context into a decision-ready AI strategy package:
- Strategic direction and use-case prioritization
- Architecture and security design review
- 6-12 month implementation roadmap
- KPI and ROI modeling
- Governance and stop conditions

## Required Inputs

Collect these inputs before drafting:
1. Business model and operating countries/markets
2. Core systems (ERP, CRM, ads channels, data platform)
3. Team capacity (Data, AI, Dev, Infra, BA)
4. Priority use cases and expected impact
5. Security/compliance constraints (PII, RBAC, audit)
6. Budget guardrails (CAPEX/OPEX)

If details are missing, continue with explicit assumptions.

## Standard Workflow

1. **Context intake**
   - Summarize company scope, tech stack, and near-term business goals.
2. **Problem framing**
   - Identify data fragmentation, decision latency, cost leakage, and security exposure.
3. **Architecture decisions**
   - Propose a hub-and-spoke pattern with decoupled brain and execution layers.
   - Keep AI read-only against curated data marts; route write actions through controlled workflows.
4. **Use-case design**
   - Design 1-2 high-ROI assistants (typically Marketing Flow + Executive Assistant).
   - Define module-level inputs, outputs, expected cycle time, and value impact.
5. **Risk and deflection handling**
   - Build deflection scenarios, control points, and fallback behavior.
6. **Roadmap planning**
   - Split into phases (foundation, pilot, rollout, scale) with weekly/monthly deliverables.
7. **KPI and ROI model**
   - Set baseline, 3-month target, 6-month target, and yearly ROI view.
8. **Governance and gates**
   - Add hard stop conditions, role ownership, and review cadence.

## Non-Negotiable Architecture Rules

Apply these rules by default unless user overrides them:
- Data must be flattened into AI-facing marts before LLM access.
- AI orchestration layer stays read-only to source-of-record systems.
- Action execution must go through narrow APIs with full audit logs.
- PII scrubbing must happen before external model calls.
- RBAC and session isolation are mandatory for multi-role usage.
- Semantic cache and rate limits must be placed before expensive LLM calls.

## Deliverable Format

Produce output in this section order:
1. Executive objective and scope
2. Business context
3. Core challenges
4. Target architecture and key decisions
5. Use case A (Marketing Flow Assistant)
6. Use case B (Executive Assistant)
7. Risk matrix and deflection plans
8. Cost, KPI, ROI model
9. Implementation roadmap (phased)
10. Governance, hard limits, and success criteria
11. Final recommendation and next 30-day actions

Use the full template from [templates.md](templates.md).

## Quality Gates Before Finalizing

Run these checks:
- Every critical recommendation includes rationale and control mechanism.
- Every automation path has a human-approval boundary where needed.
- Every KPI has baseline and time-bound targets.
- Every ROI claim shows assumptions.
- Every security-sensitive flow has RBAC + audit + leak prevention.

Use the validation checklist in [checklists.md](checklists.md).

## Writing Rules

- Be concrete and operational, avoid generic AI advice.
- Prefer quantified assumptions over vague claims.
- Flag confidence level for uncertain estimates.
- Keep terminology consistent across architecture, roadmap, and KPI sections.

## Output Tone

- Executive-friendly first, technical depth second.
- Direct recommendations, explicit trade-offs, and clear go/no-go criteria.
