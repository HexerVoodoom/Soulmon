// Anel de vantagens entre elementos, fora de `arena.ts` (que arrasta o motor de combate): `soulmonIntro.ts` (entrada) só precisa
// desta tabela (orçamento de bytes, REGISTRO §497). `arena.ts` reexporta `COUNTERS`.

/**
 * Counter chart over the 20 base elements — a curated RING where each element
 * counters the NEXT TWO and is countered by the PREVIOUS TWO. Building it as
 * a ring is what makes the coverage symmetric by construction (every element
 * counters exactly 2 and is countered by exactly 2 — locked by test).
 *
 * The ring (attacker → the two it beats):
 *   fogo     → planta, vida       (fire burns the field and the living)
 *   planta   → vida, terra        (the wild chokes the living, roots crack stone)
 *   vida     → terra, gravidade   (life takes root anywhere, defies weight)
 *   terra    → gravidade, ar      (earth grounds gravity and blocks wind)
 *   gravidade→ ar, som            (gravity pulls air down, crushes waves)
 *   ar       → som, eletricidade  (wind scatters sound and insulates)
 *   som      → eletricidade, industrial (resonance disrupts current, cracks machines)
 *   eletricidade → industrial, fada (short-circuits machines, zaps wings)
 *   industrial → fada, agua       (cold iron breaks the fae, pumps dry the water)
 *   fada     → agua, marcial      (charms the tide, disarms the fighter)
 *   agua     → marcial, arcano    (rusts steel, washes away sigils)
 *   marcial  → arcano, tempo      (cuts through casting, strikes first)
 *   arcano   → tempo, espaco      (magic bends time and space)
 *   tempo    → espaco, luz        (time outlasts space, dims all light)
 *   espaco   → luz, sombra        (the void swallows light and shadow)
 *   luz      → sombra, morte      (light banishes shadow and undeath)
 *   sombra   → morte, vileza      (shadow claims the dead and the vile)
 *   morte    → vileza, vigor      (death humbles the cruel and the strong)
 *   vileza   → vigor, fogo        (venom saps strength, smothers flame)
 *   vigor    → fogo, planta       (endurance outlasts fire, uproots the wild)
 *
 * 25/10/2026: fada, industrial e planta entram no anel (20 elementos) sem
 * quebrar a simetria 2-e-2 — vale para qualquer N, é a forma do anel.
 */
const COUNTER_RING: string[] = [
  'fogo', 'planta', 'vida', 'terra', 'gravidade', 'ar', 'som', 'eletricidade', 'industrial', 'fada', 'agua',
  'marcial', 'arcano', 'tempo', 'espaco', 'luz', 'sombra', 'morte', 'vileza', 'vigor',
];

export const COUNTERS: Record<string, [string, string]> = Object.fromEntries(
  COUNTER_RING.map((id, i) => [
    id,
    [COUNTER_RING[(i + 1) % COUNTER_RING.length], COUNTER_RING[(i + 2) % COUNTER_RING.length]],
  ]),
) as Record<string, [string, string]>;
