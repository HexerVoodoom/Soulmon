/**
 * "Visto" do tutorial da 1ª abertura dos jogos do Ateliê da Mente (26/10/2026). Campo `mindGameTutorials` do save:
 * `{ eco?: true, zip?: true, patches?: true }`. Gravado AO MOSTRAR (REGISTRO §42; pular ou fechar pelo X já está coberto).
 * Leitura tolerante: só chaves conhecidas com `true` literal sobrevivem; lixo/ausente = `{}` (mostra uma vez, curto e pulável).
 * Rollback: ignorar o campo — versão antiga o descarta sem efeito; nenhuma chave existente foi renomeada.
 */
export type MindGameId = 'eco' | 'zip' | 'patches';
export const MIND_GAME_IDS: readonly MindGameId[] = ['eco', 'zip', 'patches'];
export type MindGameTutorials = Partial<Record<MindGameId, true>>;

export function sanitizeMindGameTutorials(raw: unknown): MindGameTutorials {
  const out: MindGameTutorials = {};
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const id of MIND_GAME_IDS) if ((raw as Record<string, unknown>)[id] === true) out[id] = true;
  }
  return out;
}

/** Marca (idempotente: devolve o MESMO objeto quando já estava). */
export function markMindGameTutorial(cur: MindGameTutorials | undefined, id: MindGameId): MindGameTutorials {
  return cur?.[id] === true ? cur : { ...(cur ?? {}), [id]: true };
}
