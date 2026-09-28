// ---------------------------------------------------------------------------
// A FORMA da manifestação no SAVE — tipos + higienização, e NADA mais.
//
// Separado de `manifestacao.ts` de propósito: aquele módulo importa o
// snapshot do class-system (`buildSheet.ts`, que arrasta o `oracle.ts`) e
// `essenceLabels.ts` para RESOLVER talento/profissão; o `GameStateContext`
// só precisa validar o que veio do save/nuvem, e importar o resolvedor daqui
// custava ~7 KB no chunk de entrada (`orcamentoDeBytes.contract.test.ts`).
// Quem resolve (o `App`, na primeira abertura) importa `manifestacao.ts` por
// import dinâmico. Este arquivo importa só `./types` (constantes, sem peso).
// ---------------------------------------------------------------------------

import { FICHA_STAGE_ORDER, type FichaStage } from './types';

export interface ManifestacaoDoEstagio {
  /** O talento de MAIOR rank na ficha do estágio (desempate por `id`, para
   *  não depender da ordem de inserção). `null` só numa ficha sem talento. */
  talento: string | null;
  /** A profissão da ficha — decidida uma vez, na escala rookie, e estável
   *  (`buildSheet.ts`); repetida por estágio porque a leitura é por estágio. */
  profissao: string | null;
  /** O NOME do ofício, PT (snapshot) + EN (`PROFISSAO_EN`), resolvido em
   *  `manifestacao.ts` — quem mostra (a masmorra) não importa o snapshot;
   *  recebe a palavra pronta pelo cache. */
  profissaoNome: { pt: string; en: string } | null;
}

export type Manifestacao = Record<FichaStage, ManifestacaoDoEstagio>;

/** Higieniza o que veio do save/nuvem — objeto por estágio com os campos
 *  acima; qualquer outra forma vira `undefined` (`?? padrão`). */
export function sanitizeManifestacao(raw: unknown): Manifestacao | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const saida: Partial<Manifestacao> = {};
  for (const stage of FICHA_STAGE_ORDER) {
    const v = (raw as Record<string, unknown>)[stage] as { talento?: unknown; profissao?: unknown; profissaoNome?: unknown } | undefined;
    if (!v || typeof v !== 'object') return undefined;
    const talento = typeof v.talento === 'string' ? v.talento : null;
    const profissao = typeof v.profissao === 'string' ? v.profissao : null;
    const n = v.profissaoNome as { pt?: unknown; en?: unknown } | null | undefined;
    const profissaoNome = n && typeof n === 'object' && typeof n.pt === 'string' && typeof n.en === 'string'
      ? { pt: n.pt, en: n.en }
      : null;
    saida[stage] = { talento, profissao, profissaoNome };
  }
  return saida as Manifestacao;
}
