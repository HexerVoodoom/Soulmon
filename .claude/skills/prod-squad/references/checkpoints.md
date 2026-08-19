# Checkpoint Protocol

The human gate between phases. Non-negotiable. **Never auto-advance.**

## At every phase end, present exactly:

**1 · What was produced**
- Artifact paths under `product/<run-id>/<phase>/`, one line each.

**2 · Investor-bar self-grade**
- Score the phase's artifacts against `investor-bar.md`, dimension by dimension:
  🟢 / 🟡 / 🔴 + one line of evidence each. Be honest — 🔴 is information, not failure.

**3 · Risks & open questions**
- What's unproven, assumed, or deferred. Name the **single biggest risk**.

**4 · The gate**
- Ask the human: **continuar / ajustar / parar** (AskUserQuestion).

## Handling the response

- **continuar** → advance to the next lifecycle phase.
- **ajustar** → capture the feedback, re-dispatch the relevant persona(s) with it, re-grade,
  and re-present this same checkpoint. Loop until continuar / parar.
- **parar** → persist `state/<run-id>.json` (status `checkpoint`), summarize where we stopped
  and how to resume (`/prod-squad resume`).

## Rules

- **One checkpoint per phase.** No batching phases past a gate.
- The self-grade is shown **before** asking — the human decides with evidence, not vibes.
- A 🔴 on a make-or-break dimension (economics, riskiest-assumption) is surfaced as an
  explicit recommendation to `ajustar` or `parar` — never glossed over to keep momentum.
