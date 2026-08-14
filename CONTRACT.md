# ProdSquad Contract

Single source of truth for how agents and the orchestrator fit together.
`scripts/validate_squad.py` (Phase 4) enforces every **MUST** rule below — this is the
blast-radius control for a markdown-driven system.

## 1. Agent files

- **Location:** `.claude/agents/<id>.md`, `<id>` = kebab-case, unique.
- **Frontmatter (YAML) MUST have:**
  - `name` — display name
  - `description` — when to dispatch this agent (one line, action-oriented)
- **Frontmatter MAY have:**
  - `tools` — comma-separated allow-list; omit for all
  - `model` — `inherit` | `opus` | `sonnet` | `haiku` (default `inherit`)
- **Body MUST contain these H2 sections** (validator checks the headings exist):
  - `## Mandate` — one-paragraph charter + the single responsibility (YAGNI: exactly one)
  - `## Operational Framework` — the numbered process this agent follows
  - `## Investor Bar` — what "YC / McKinsey-grade" means for THIS discipline's outputs
  - `## Anti-Patterns` — what it must never do
  - `## Voice` — tone + vocabulary (always / never)

## 2. Roster (canonical — orchestrator MUST match this exactly)

| id                    | discipline            | lead in phases                |
| --------------------- | --------------------- | ----------------------------- |
| `business-strategist` | Strategy / economics  | discovery, grower             |
| `product-manager`     | Product (PM/PO)       | discovery, builder            |
| `principal-architect` | Architecture          | prototyper, builder, grower   |
| `staff-frontend`      | Frontend eng          | prototyper, builder           |
| `staff-backend`       | Backend eng           | prototyper, builder           |
| `product-designer`    | Design                | prototyper, builder           |
| `growth-engineer`     | Growth                | grower                        |
| `qa-sweeper`          | QA / hardening        | sweeper, maintainer           |
| `security-architect`  | Security by design    | discovery, builder, sweeper   |
| `investor-skeptic`    | Adversarial critique  | all checkpoints (cross-cutting) |
| `design-critic`       | Design critique       | design checkpoints (cross-cutting) |

## 3. Orchestrator

- **Location:** `.claude/skills/prod-squad/SKILL.md`. Invoked `/prod-squad`.
- **Dispatch:** an agent is dispatched via the Agent tool with `subagent_type: <id>`.
- **Phases (lifecycle modes):** `discovery, prototyper, builder, sweeper, grower, maintainer`.
- **Per phase:** (a) state goal + investor lens, (b) dispatch lead agent(s), (c) write
  artifact(s) to `product/<run-id>/`, (d) **HUMAN CHECKPOINT** before advancing.

## 4. Checkpoint protocol

At each phase end, present:
1. **What was produced** (artifact paths).
2. **Investor-bar self-grade** (per `references/investor-bar.md`).
3. **Risks / open questions.**
4. **Explicit choice:** `continuar / ajustar / parar`.

Never auto-advance a phase. The human gate is non-negotiable.

## 5. State

`state/<run-id>.json`:
```json
{ "run": "<id>", "product": "<name>", "phase": { "current": 0, "total": 6, "label": "" },
  "status": "idle|running|checkpoint|done", "updatedAt": "<iso>" }
```

## 6. Artifacts & investor bar

- Templates in `.claude/skills/prod-squad/templates/`.
- Every artifact is graded against `.claude/skills/prod-squad/references/investor-bar.md`.

## 7. Invariants (the validator asserts these)

1. Every roster `id` has a matching `.claude/agents/<id>.md`.
2. Every agent file has the required frontmatter keys + body H2 sections.
3. The orchestrator roster equals the CONTRACT roster (no drift).
4. No template or reference named by the orchestrator is missing on disk.
