// DONO ÚNICO do TETO e da PRIORIDADE dos pushes do dia (REGISTRO §113/§114).
//
// Por que mora em `functions/api/` (ESM puro, sem dependência): a MESMA conta
// precisa valer no cliente (planejador `src/utils/petPushEvents.ts`, alarmes do
// APK), no worker de push (deploy manual — lê o `x` da inscrição e cala o que o
// planejador cortou) e no teste que varre as 48 passadas em cinco fusos. É o
// mesmo motivo de `_mealRhythm.js` e `_pushCopy.js` (footgun 9).
//
// A regra, em uma frase: NO MÁXIMO `PUSH_DAILY_CAP` pushes por dia; quando os
// candidatos estouram, sai o de MENOR prioridade primeiro.
//
//   cocô > fome > energia cheia > carta > lembrete de deitar > refeição >
//   convite genérico (10h/16h/22h) > progresso
//
// A ordem do dono (modal de 19/10/2026) é `cocô > fome > energia cheia > carta >
// refeição > progresso`. Suposição S-7b (declarada): o lembrete de deitar entra
// entre `carta` e `refeição` (protege a noite armada do §99/§101) e os convites
// genéricos de hora fixa entre `refeição` e `progresso` (só existem para quem
// desligou o ritmo). Progresso ainda é o último e no MÁXIMO 1×/dia.
//
// NADA aqui lê o que a pessoa fez no dia: o corte é por TIPO e por HORA, nunca
// por desempenho.

import { PUSH_DAILY_CAP } from './_mealRhythm.js';

/** Do MAIS prioritário ao menos. A posição é a prioridade. */
export const PUSH_KINDS_BY_PRIORITY = [
  'poop', 'hunger', 'energyFull', 'letter', 'sleep', 'meal', 'generic', 'progress',
];

/** Push de progresso: no máximo 1 por dia, só no fechamento (D-06). */
export const PROGRESS_PUSH_MAX_PER_DAY = 1;

/** Prioridade numérica (0 = a mais alta). Tipo desconhecido vai para o fim. */
export function pushPriority(kind) {
  const i = PUSH_KINDS_BY_PRIORITY.indexOf(kind);
  return i === -1 ? PUSH_KINDS_BY_PRIORITY.length : i;
}

/**
 * ENTRADA DA CARTA (W4-B): um push de carta de NPC conta no MESMO teto chamando
 * `letterPushCandidate(id, atMs)` e passando o resultado em `extra` de
 * `planDayPushes` (`src/utils/petPushEvents.ts`). `atMs` é o instante (epoch ms)
 * em que a carta aparece. A prioridade (`letter`) já está na lista acima.
 */
export function letterPushCandidate(id, atMs) {
  return { id: String(id), kind: 'letter', at: atMs };
}

/**
 * Aplica o teto. `candidates`: `{ id, kind, at, committed? }`.
 *  · `committed` = já foi entregue hoje (ou é inevitável, como o convite de hora
 *    fixa do worker): SEMPRE fica e CONTA no teto — não dá para desenviar.
 *  · os demais entram por prioridade (menor primeiro) e, dentro da mesma
 *    prioridade, pela hora mais cedo, até acabar a vaga.
 *  · `progress` nunca passa de `PROGRESS_PUSH_MAX_PER_DAY`.
 * Devolve `{ kept, dropped }`, ambos ordenados pela hora. Entrada nunca é mutada.
 */
export function capPushes(candidates, cap = PUSH_DAILY_CAP) {
  const list = Array.isArray(candidates) ? candidates.filter(c => c && typeof c.id === 'string') : [];
  const byAt = (a, b) => (a.at - b.at) || (pushPriority(a.kind) - pushPriority(b.kind));
  const committed = list.filter(c => c.committed);
  const rest = list.filter(c => !c.committed)
    .sort((a, b) => (pushPriority(a.kind) - pushPriority(b.kind)) || (a.at - b.at));
  const kept = [...committed];
  const dropped = [];
  let progress = committed.filter(c => c.kind === 'progress').length;
  for (const c of rest) {
    const progressFull = c.kind === 'progress' && progress >= PROGRESS_PUSH_MAX_PER_DAY;
    if (kept.length >= cap || progressFull) { dropped.push(c); continue; }
    if (c.kind === 'progress') progress++;
    kept.push(c);
  }
  return { kept: kept.sort(byAt), dropped: dropped.sort(byAt) };
}
