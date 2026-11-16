// ---------------------------------------------------------------------------
// Cache `soulmonEvocacao` — a ponte entre a FICHA (que não vai ao save) e o gatilho do companheiro invocado
// (`utils/companheiroInvocado.ts`, que só lê o cache). Pura: mesma entrada = mesma saída.
//
// A escola dominante aqui INCLUI Evocação: argmax sobre TODAS as escolas da ficha (`EscolaId`). Não dá para reusar
// `skills.ts` › `escolaDominante`, que olha só `ESCOLAS_SKILL` (sem evocação: evocação não é escola de skill). Empate = a
// primeira na ordem canônica de `EscolaId`; ficha sem ponto de escola = nenhuma dominante. O arquétipo vem do `ClassTitle`.
// ---------------------------------------------------------------------------

import type { Ficha } from './types';
import { FICHA_STAGE_ORDER } from './types';
import { arquetipoIdDoTitulo } from './classTitle';
import { eEvocador, type EvocacaoPorEstagio } from '../../companheiroInvocado';

const ORDEM_ESCOLAS = ['combate_fisico', 'longo_alcance', 'evocacao', 'conjuracao', 'benca', 'maldicao'] as const;

/** Escola de maior pontuação da ficha, Evocação incluída; `null` se nenhuma tem ponto. */
export function escolaDominanteComEvocacao(ficha: Ficha): (typeof ORDEM_ESCOLAS)[number] | null {
  let melhor: (typeof ORDEM_ESCOLAS)[number] | null = null;
  let melhorPts = 0;
  for (const escola of ORDEM_ESCOLAS) {
    const pts = ficha.escolas[escola] ?? 0;
    if (pts > melhorPts) { melhor = escola; melhorPts = pts; }
  }
  return melhor;
}

/**
 * Para cada estágio que tem ficha, grava o veredito (`evocador`) e o arquétipo de origem. `classTitles` ausente/parcial não
 * impede: sem arquétipo, vale a escola dominante.
 */
export function derivarEvocacao(
  fichaByStage: Partial<Record<string, Ficha>>,
  classTitles?: Partial<Record<string, unknown>> | null,
): EvocacaoPorEstagio {
  const out: EvocacaoPorEstagio = {};
  for (const estagio of FICHA_STAGE_ORDER) {
    const ficha = fichaByStage[estagio];
    if (!ficha) continue;
    const arquetipoId = arquetipoIdDoTitulo(classTitles?.[estagio]);
    const evocador = eEvocador(estagio, { arquetipoId, escolaDominante: escolaDominanteComEvocacao(ficha) });
    out[estagio] = arquetipoId ? { evocador, arquetipoId } : { evocador };
  }
  return out;
}
