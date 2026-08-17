// ---------------------------------------------------------------------------
// Ponte lazy com o motor DE VERDADE do class-system — o pedaço comum a
// qualquer feature que precise chamar `calcularProgressao`/`calcularSkill`
// sobre uma ficha real (poder de skill, classe da criatura, o que vier).
//
// Uma `Ficha` já É um `Personagem` válido do class-system — mesmos ids (ver
// `ficha/types.ts`); só falta `bestiario`, que nada aqui consulta ainda.
//
// Import DINÂMICO: o motor completo (registro de elementos/talentos/
// arquétipos) só entra no bundle quando a página do Pet precisa dele — mesmo
// padrão da astronomy-engine em `soulProfile/`.
// ---------------------------------------------------------------------------

import type { Ficha } from './types';

export interface RealPersonagem {
  engine: typeof import('class-system');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  personagem: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prog: any;
}

/** Monta o `Personagem` real e roda `calcularProgressao` sobre ele. */
export async function buildRealPersonagem(ficha: Ficha): Promise<RealPersonagem> {
  const engine = await import('class-system');
  const personagem = {
    nome: ficha.nome,
    elementos: ficha.elementos,
    escolas: ficha.escolas,
    recursos: ficha.recursos,
    talentos: ficha.talentos,
    profissoes: ficha.profissoes,
    bestiario: [],
  };
  const prog = engine.calcularProgressao(personagem);
  return { engine, personagem, prog };
}
