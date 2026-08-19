# ProdSquad Lifecycle

Six phases. Each has a goal, an investor lens, lead personas, inputs, outputs, and an
**exit bar** that the human checkpoint enforces. The modes (prototyper … maintainer) are
how the squad *operates* in that phase — not separate people.

## 0 · discovery
- **Goal:** turn a fuzzy idea into a sharp, shared brief + a commercial thesis.
- **Investor lens:** *"Is this a real problem and a real business?"*
- **Lead:** `product-manager` (problem, JTBD, riskiest assumption, north-star) + `business-strategist` (market, thesis, rough economics).
- **In:** the idea, `memory/company.md`.
- **Out:** `product-context.md` (filled), `market-sizing.md` (v0), problem framing.
- **Exit bar:** riskiest assumption named; north-star defined; a one-line thesis + the 3 numbers exist.

## 1 · prototyper
- **Goal:** the fastest possible artifact that *tests the riskiest assumption*. Throwaway-OK.
- **Investor lens:** *"Can it even work?"*
- **Lead:** `principal-architect` (thin design) + `staff-frontend` & `staff-backend` (one real vertical slice) + `product-designer` (lo-fi flow).
- **In:** discovery artifacts.
- **Out:** a working spike + a written result — did the assumption hold?
- **Exit bar:** the riskiest assumption is empirically answered (yes/no), cheaply. No production polish expected.

## 2 · builder
- **Goal:** build the real thing — the MVP that ships.
- **Investor lens:** *"Is this real?"*
- **Lead:** `product-manager` (PRD, roadmap) + `principal-architect` (ADRs, contracts) + `staff-frontend` & `staff-backend` (production slice) + `product-designer` (design system) + `security-architect` (threat model + security requirements).
- **In:** validated prototype, discovery brief.
- **Out:** `prd.md`, ADRs, the built MVP, design system, `threat-model.md`.
- **Exit bar:** the MVP delivers the core JTBD end-to-end; decisions are ADR'd; UI is on-brand with all states.

## 3 · sweeper
- **Goal:** make it solid — find what breaks, harden it.
- **Investor lens:** *"Is this solid?"*
- **Lead:** `qa-sweeper` (audit + tests + security + a11y + perf), supported by `staff-frontend` / `staff-backend` (fixes).
- **In:** the built MVP.
- **Out:** test suite, hardening fixes, a release-readiness checklist with evidence.
- **Exit bar:** demo survives bad input + flaky network; no known criticals; every real bug regression-locked.

## 4 · grower
- **Goal:** find the repeatable growth path and prove the economics at scale.
- **Investor lens:** *"Will this grow — and pay?"*
- **Lead:** `growth-engineer` (funnel, activation, experiments) + `business-strategist` (`unit-economics.md`, pricing) + `principal-architect` (scale + cost curve).
- **In:** a solid product.
- **Out:** funnel + activation definition, first experiments, `unit-economics.md`, scale/cost note.
- **Exit bar:** measurable activation moment; a channel with a CAC < LTV/3 path; experiments are falsifiable.

## 5 · maintainer
- **Goal:** make it durable to run without heroics.
- **Investor lens:** *"Is this durable?"*
- **Lead:** `qa-sweeper` + `staff-backend` / `staff-frontend` (observability, runbooks, deps).
- **In:** a growing product.
- **Out:** observability/alerting plan, runbook, dependency & on-call hygiene, tech-debt ledger.
- **Exit bar:** the product is debuggable in prod without new code; a new engineer can operate it from the runbook.

## Adversarial review (cross-cutting)
At **every** checkpoint, before the human gate, `investor-skeptic` attacks the phase's artifacts
against the investor bar (`references/revision-loop.md`). The lead persona revises against the
surviving objections until the bar is met. This grade→attack→revise→re-grade loop is what a single
flat prompt cannot do — and it is the squad's structural edge.

## Design review (cross-cutting)
Whenever a phase produces a **design artifact or prototype** (`prototyper`, `builder`, and design
fixes in `sweeper`), `design-critic` reviews it before the human gate — catching what the author
missed or prototyped wrong, validating against accessibility / design-system / usability rules, and
holding it to the **proven market pattern for the client's domain** (`memory/company.md`). The
`product-designer` revises against the surviving findings. Design review runs alongside the
adversarial review at the checkpoint; `design-critic` critiques and prescribes, it never authors.

## Security by design (cross-cutting)
Security is designed in, not audited on at the end. `security-architect` engages from **discovery**
(data classification + regulatory scope — LGPD by default), threat-models the risky slice in
**prototyper**, and in **builder** produces `threat-model.md` (STRIDE + LINDDUN, controls mapped to
OWASP ASVS, LGPD/ISO 27001/SOC 2) plus the security requirements the engineers build to. In
**sweeper** it reviews the hardening while `qa-sweeper` tests it — the architect **designs and
verifies** controls, `qa-sweeper` **executes** the tests. Every accepted residual risk is named.

## Pitch (cross-cutting)
At any point, `business-strategist` assembles `pitch-narrative.md` from the artifacts
produced so far. Because the squad *is* the product, the pitch compounds as phases complete.
