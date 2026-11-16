// ---------------------------------------------------------------------------
// COMPANHEIRO INVOCADO — simulados e NPCs (PR 1, 16/11/2026). Decisões do dono (16/11):
//
//  · SIMULADOS (`sim_`, sem ficha): gatilho por ESCOLA derivada do elemento + linha, com a MESMA tabela papel→escola do Oráculo
//    (`ROLE_SCHOOL_BY_ALIGNMENT`, importada de `buildSheet`, nunca copiada). O que falta ao simulado é o PAPEL: a tabela
//    elemento→papel abaixo (`PAPEL_POR_ELEMENTO`) é a única regra nova e está aqui, documentada. A `line` do simulado
//    (poder|harmonia|benevolencia) faz o papel do caminho. Evocação = (tanque e line ≠ poder) ou (mágico e line = benevolência):
//    ~45 dos 170 (docs/LISTA-RECEBE-COMPANHEIRO-2026-11-16.md, opção B).
//  · NPCs INIMIGOS: só CHEFES e MINI-BOSSES NOMEADOS invocam, por LISTA EXPLÍCITA de ids (`CHEFES_NOMEADOS_INVOCAM`), nunca por
//    elemento. Hoje só os 3 desafiantes nomeados do Torneio existem como NPC com id próprio; chefe novo entra aqui, à mão.
//  · ARENA EM GRUPO: 1 companheiro invocado POR COMBATENTE (cada evocador do grupo tem o seu em cena): `COMPANHEIROS_POR_COMBATENTE`.
//
// A criatura (uma das 32) do simulado/NPC é fixa por `hash(id)` entre as de afinidade com o elemento (todas, se nenhuma tem).
// Tudo guardado pela flag `COMPANHEIRO_INVOCADO`; nada é lido pelo combate neste PR. Espelho no servidor (simulados duelam) = PR 2.
// ---------------------------------------------------------------------------

import type { AlignmentId, RoleId } from './oracle';
import { ROLE_SCHOOL_BY_ALIGNMENT } from './soulProfile/ficha/buildSheet';
import { COMPANHEIRO_INVOCADO, ESCOLA_EVOCACAO } from './companheiroInvocado';
import { criaturaPorId } from './companheiroCriatura';

// NPCs nomeados e `criaturaPorId` moram em `companheiroCriatura.ts` (módulo pequeno, que as telas de luta importam sem o CLASS_DATA).
export { CHEFES_NOMEADOS_INVOCAM, companheiroDoNpc, criaturaPorId, eNpcInvocador } from './companheiroCriatura';

/** Quantos companheiros invocados cabem por combatente (decisão do dono, 16/11: Arena em grupo = 1 POR COMBATENTE). */
export const COMPANHEIROS_POR_COMBATENTE = 1;

/** Papel do simulado a partir do elemento (proposta da lista de 16/11, aceita pelo dono). Fora da tabela = mágico. */
export const PAPEL_POR_ELEMENTO: Readonly<Record<string, RoleId>> = {
  terra: 'tanque', planta: 'tanque', vida: 'tanque', vigor: 'tanque', industrial: 'tanque',
  agua: 'suporte', luz: 'suporte',
  fogo: 'fisico', marcial: 'fisico',
  ar: 'alcance',
};
const PAPEL_PADRAO: RoleId = 'magico';

const LINHAS: ReadonlySet<string> = new Set(['poder', 'harmonia', 'benevolencia']);

/** Escola dominante derivada de um simulado (elemento + linha), ou `null` se a linha é inválida. */
export function escolaDoSimulado(elemento: string | null | undefined, linha: string | null | undefined): string | null {
  if (typeof linha !== 'string' || !LINHAS.has(linha)) return null;
  const papel = typeof elemento === 'string' && Object.prototype.hasOwnProperty.call(PAPEL_POR_ELEMENTO, elemento)
    ? PAPEL_POR_ELEMENTO[elemento] : PAPEL_PADRAO;
  return ROLE_SCHOOL_BY_ALIGNMENT[papel][linha as AlignmentId];
}

/** O simulado (elemento + linha) é evocador? Flag desligada = false. */
export function eEvocadorPorLinha(elemento: string | null | undefined, linha: string | null | undefined, ligado: boolean = COMPANHEIRO_INVOCADO): boolean {
  return ligado && escolaDoSimulado(elemento, linha) === ESCOLA_EVOCACAO;
}

/** O companheiro de um simulado, ou `null` (não evocador ou flag desligada). */
export function companheiroDoSimulado(simId: string, elemento: string | null | undefined, linha: string | null | undefined, ligado: boolean = COMPANHEIRO_INVOCADO): string | null {
  return eEvocadorPorLinha(elemento, linha, ligado) ? criaturaPorId(simId, elemento) : null;
}
