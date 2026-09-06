// ---------------------------------------------------------------------------
// WP4.10 — DATAR AS COLEÇÕES.
//
// O jogo já guardava O QUE foi alcançado (`unlockedEvolutions`, `rest.dreams`)
// e nunca QUANDO. Sem data, uma coleção é uma lista; com data, ela é uma
// história — "essa forma foi na primeira semana", "esse sonho foi antes de eu
// mudar de emprego". É a diferença entre um inventário e um álbum, e é o
// insumo do álbum de formas (WP4.6) e das Memórias (WP4.8).
//
// Duas regras, e as duas existem para a data não mentir:
//  · **a primeira data nunca é reescrita.** Uma data que se atualiza registra
//    a ÚLTIMA vez; o que a coleção conta é a primeira.
//  · **ausência não vira data inventada.** Save antigo não tem nada gravado, e
//    a leitura correta ali é "sem data", nunca "hoje" — que envelheceria a
//    coleção inteira para o dia da atualização do app.
// ---------------------------------------------------------------------------

/** Registra a data de um item, se ele ainda não tiver uma. PURA e idempotente. */
export function stampCollected(
  dates: Record<string, string> | undefined,
  id: string,
  dayKey: string,
): Record<string, string> {
  const atual = dates ?? {};
  if (!id || !dayKey || atual[id]) return atual;
  return { ...atual, [id]: dayKey };
}

/** Registra vários de uma vez (ex.: as formas que um save já tinha). */
export function stampAllCollected(
  dates: Record<string, string> | undefined,
  ids: readonly string[],
  dayKey: string,
): Record<string, string> {
  let out = dates ?? {};
  for (const id of ids) out = stampCollected(out, id, dayKey);
  return out;
}

/** A data de um item, ou `null`. `null` é resposta legítima e comum. */
export function collectedAt(
  dates: Record<string, string> | undefined,
  id: string,
): string | null {
  const d = dates?.[id];
  return typeof d === 'string' && d ? d : null;
}
