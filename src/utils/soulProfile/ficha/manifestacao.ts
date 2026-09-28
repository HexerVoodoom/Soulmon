// ---------------------------------------------------------------------------
// MANIFESTAÇÃO da ficha — o que do class-system o jogador SENTE sem nunca ver
// a ficha (PLANO-ORACULO.md §3, Fase 3):
//
//   · talento  → traço de personalidade na FALA do pet (`utils/talentoVoice.ts`)
//   · profissão → jeito de agir na MASMORRA (`utils/profissaoMasmorra.ts`)
//
// "Regra nova: nenhum cálculo novo sem manifestação" (§3). Talento e
// profissão eram alocados em `buildSheet.ts` para os 5 estágios e morriam ali
// (profissão virava uma palavra na linha de essência do reveal; talento,
// nada). Este módulo é o DONO de qual talento e qual profissão se manifestam
// em cada estágio — puro, determinístico pela ficha, sem React.
//
// O que ele NÃO expõe: ranks, orçamento, pré-requisito. Só o `id` do talento
// e o `id` da profissão — os módulos de manifestação traduzem para fala e
// para modificador. Ficha continua invisível (decisão 3).
// ---------------------------------------------------------------------------

import { FICHA_STAGE_ORDER, type Ficha, type FichaStage } from './types';
import { CLASS_DATA } from './buildSheet';
import { PROFISSAO_EN } from '../essenceLabels';
import type { LText } from '../../oracle';
import type { Manifestacao } from './manifestacaoSave';

// A forma no save (tipos + `sanitizeManifestacao`) mora em
// `manifestacaoSave.ts`, sem dependência pesada — o `GameStateContext` importa
// de lá. Re-exportada aqui para quem já resolve a ficha.
export { sanitizeManifestacao, type Manifestacao, type ManifestacaoDoEstagio } from './manifestacaoSave';

export function profissaoNome(id: string | null): LText | null {
  if (!id) return null;
  const pt = CLASS_DATA.profissoes[id as keyof typeof CLASS_DATA.profissoes]?.nome ?? id;
  return { pt, en: PROFISSAO_EN[id] ?? pt };
}

export function talentoDominante(ficha: Pick<Ficha, 'talentos'>): string | null {
  let melhor: string | null = null;
  let melhorRanks = 0;
  for (const [id, ranks] of Object.entries(ficha.talentos ?? {})) {
    const r = ranks ?? 0;
    if (r <= 0) continue;
    if (r > melhorRanks || (r === melhorRanks && melhor !== null && id < melhor)) {
      melhor = id;
      melhorRanks = r;
    }
  }
  return melhor;
}

export function profissaoDaFicha(ficha: Pick<Ficha, 'profissoes'>): string | null {
  let melhor: string | null = null;
  let melhorPts = -1;
  for (const [id, pts] of Object.entries(ficha.profissoes ?? {})) {
    const p = pts ?? 0;
    if (p > melhorPts || (p === melhorPts && melhor !== null && id < melhor)) {
      melhor = id;
      melhorPts = p;
    }
  }
  return melhor;
}

export function manifestacaoDaFicha(fichaByStage: Record<FichaStage, Ficha>): Manifestacao {
  return Object.fromEntries(
    FICHA_STAGE_ORDER.map(stage => {
      const profissao = profissaoDaFicha(fichaByStage[stage]);
      return [stage, {
        talento: talentoDominante(fichaByStage[stage]),
        profissao,
        profissaoNome: profissaoNome(profissao),
      }];
    }),
  ) as Manifestacao;
}
