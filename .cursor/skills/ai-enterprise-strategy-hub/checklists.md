# Validation Checklists

## 1) Architecture Checklist

- [ ] Hub-and-spoke model is explicitly defined.
- [ ] AI reads from curated data marts, not raw transactional schema.
- [ ] Reasoning and execution layers are separated.
- [ ] Write operations go through controlled workflow/API with audit logs.
- [ ] PII scrubbing is placed before any external model call.
- [ ] RBAC scope is defined by role and market/unit.
- [ ] Session or runtime isolation is specified for concurrent users.
- [ ] Semantic cache is placed before LLM invocation.
- [ ] Rate limiting and circuit breaker behavior are defined.

## 2) Risk and Deflection Checklist

- [ ] At least 5 deflection scenarios are listed.
- [ ] Each deflection includes trigger, response policy, and owner.
- [ ] Critical recommendations include confidence and source/citation rule.
- [ ] High-impact actions require human approval boundaries.
- [ ] Security violations define block + alert + incident flow.
- [ ] Fallback behavior exists for cache/API/data-lag outages.

## 3) KPI and ROI Checklist

- [ ] Every KPI has baseline and 3/6 month targets.
- [ ] KPI definitions are measurable and operational.
- [ ] Cost model includes one-time and recurring costs.
- [ ] ROI assumptions are explicit and testable.
- [ ] ROI confidence level is stated (high/medium/low).
- [ ] Adoption KPI is present for each target user group.

## 4) Roadmap Checklist

- [ ] Plan includes foundation, pilot, rollout, and scale phases.
- [ ] Each phase has clear deliverables and owners.
- [ ] Each phase has objective acceptance criteria.
- [ ] Decision gate exists between pilot and rollout.
- [ ] Security and data-quality milestones are in early phases.
- [ ] Scale phase includes cost optimization and model validation.

## 5) Governance Checklist

- [ ] Governance roles are explicitly named (Product, Tech, Data, Security).
- [ ] Review cadence is set (weekly, monthly, quarterly).
- [ ] Hard stop conditions are defined with thresholds.
- [ ] Incident response owner is defined for security breaches.
- [ ] Final recommendation includes go/no-go and next 30-day actions.
