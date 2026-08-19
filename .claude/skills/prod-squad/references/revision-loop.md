# Grade-Driven Revision Loop

The capability a single flat prompt **cannot replicate**: the squad doesn't just grade — it
**closes the loop**. Produce → grade → attack → revise → re-grade, until the bar is met.

## The loop (per artifact, inside a phase)

1. **Produce.** The lead persona writes the artifact + its investor-bar self-grade.
2. **Attack.** Dispatch `investor-skeptic` on the artifact → ranked objections + a survive/fatal verdict.
3. **Triage.**
   - Any **fatal** objection on a make-or-break dimension → surface to the human **now**. Do not
     auto-revise around a fatal flaw.
   - Otherwise collect every dimension graded 🟡/🔴 + every **fixable** objection.
4. **Revise.** Re-dispatch the lead persona with the *specific* gap:
   *"raise dimension X to 🟢 — the skeptic's objection is Y — here's what a 🟢 answer needs."*
   One concrete gap at a time.
5. **Re-grade.** The persona re-grades its revised artifact. Repeat from step 2, **max 2 passes**
   (returns diminish past that).
6. **Stop when:** every owned dimension is 🟢 — or honestly 🟡 with the reason 🟢 is impossible now
   (e.g. needs user research that doesn't exist yet) — and **no fatal objection stands**.

## Why this is the moat

A flat one-shot prompt answers once and stops. The squad answers, gets **attacked by a hostile
reviewer**, and revises against named objections — the same loop a real product org runs, compressed.
What reaches the human gate has **already survived its first hostile partner meeting**.

## Honesty rule (non-negotiable)

The loop raises grades by **improving the work**, never by relabeling. If a 🟡 can't become 🟢
without evidence that doesn't exist yet, it **stays 🟡 with the reason**. Laundering a grade is a
dimension-8 (evidence-over-assertion) violation and defeats the entire purpose.
