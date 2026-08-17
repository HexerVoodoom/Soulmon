// ---------------------------------------------------------------------------
// Cascata geracional — a RÉPLICA MÍNIMA da regra do class-system que a ficha
// do Soulmon precisa para distribuir pontos como um jogador distribuiria.
//
// Regra (fonte da verdade: `Class-System/src/engine/cascata.ts` +
// `registry/geracoes.ts`, PR HexerVoodoom/Class-System#5):
//
//   passivos(par) = min(floor(a/5), floor(b/5))   — 5 fogo + 5 água → 1 vapor
//   destravado(par) = passivos >= 10              — aceita ponto direto
//   custo do ponto direto num par = 2 de orçamento (base = 1)
//
// O Soulmon modela DE PROPÓSITO só as gerações 1 e 2: a linguagem de essência
// do pet são os 17 base + 136 pares (essenceLabels PT+EN); triplas/quádruplas
// são capacidade do class-system e continuam alcançáveis por quem levar a
// ficha exportada para lá. Footgun 9 (regra copiada): o teste de paridade em
// `cascata.parity.test.ts` compara esta réplica com fixtures calculados pelo
// MOTOR REAL no sync (`npm run sync:oracle-data`) — se o class-system mudar o
// dial, o sync regenera os fixtures e o teste acusa a divergência. Os quatro
// diais abaixo são afirmados um a um contra o bloco `geracoes` do snapshot
// (copiado do `taxonomy.json` v2 do class-system): fixture de comportamento
// não pega PREÇO, e `CUSTO_PONTO_PAR` sobrevivia a qualquer mutação sem
// derrubar um único teste.
// ---------------------------------------------------------------------------

import type { ClassElementId } from '../types';
import { DERIVED_ELEMENT_PAIRS, type DerivedElementDef } from '../derivedElements';

/** Espelhos dos diais de `Class-System/src/registry/geracoes.ts` (gen 1–2). */
export const DIVISOR_CASCATA_PAR = 5;
export const LIMIAR_DESTRAVAMENTO_PAR = 10;
export const CUSTO_PONTO_BASE = 1;
/** Paridade com os pais ({1,2,3,4} no class-system pós-auditoria): +1 nível
 *  no par via direto custa o mesmo que +1 em cada componente. */
export const CUSTO_PONTO_PAR = 2;

export interface CascataPar {
  def: DerivedElementDef;
  passivos: number;
  destravado: boolean;
}

/** A cascata de todos os pares tocados pela ficha (passivos > 0). */
export function cascataDosPares(
  bases: Partial<Record<ClassElementId, number>>,
): CascataPar[] {
  const saida: CascataPar[] = [];
  for (const def of DERIVED_ELEMENT_PAIRS) {
    const [a, b] = def.componentes;
    const passivos = Math.min(
      Math.floor((bases[a] ?? 0) / DIVISOR_CASCATA_PAR),
      Math.floor((bases[b] ?? 0) / DIVISOR_CASCATA_PAR),
    );
    if (passivos <= 0) continue;
    saida.push({ def, passivos, destravado: passivos >= LIMIAR_DESTRAVAMENTO_PAR });
  }
  return saida;
}
