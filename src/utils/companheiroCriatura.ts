// ---------------------------------------------------------------------------
// COMPANHEIRO INVOCADO — a CRIATURA de quem não tem save próprio (simulados e NPCs nomeados). Módulo PEQUENO de propósito: as telas
// de luta (Torneio, Duelo) importam daqui em vez de `companheiroInvocadoLinhas.ts`, que arrasta o `CLASS_DATA` inteiro
// (`classSystem.data.json` + `buildSheet`) só para ler 32 listas de afinidade. A tabela abaixo é o recorte desse snapshot; o teste
// `companheiroCriatura.test.ts` a confronta com `CLASS_DATA.criaturas` (some/entra/muda afinidade = vermelho).
// A regra é a de sempre: `hash(id)` entre as criaturas de afinidade com o elemento (as 32 se nenhuma tem). Sem flag aqui: quem
// chama decide se o lado invoca (`eEvocadorPorLinha` / `eNpcInvocador`, ambos atrás de `COMPANHEIRO_INVOCADO`).
// ---------------------------------------------------------------------------

import { hashString } from './oracle/base';
import { COMPANHEIRO_INVOCADO } from './companheiroInvocado';
import type { DuelSide } from './combate/duel';

/** Afinidades de elemento de cada uma das 32 criaturas (recorte de `classSystem.data.json › criaturas`). */
export const AFINIDADES_CRIATURA: Readonly<Record<string, readonly string[]>> = {
  lobo: ['vida', 'vigor'], urso: ['vida', 'vigor'], felino: ['vida', 'sombra'], javali: ['vigor', 'terra'],
  falcao: ['ar', 'vida'], coruja: ['ar', 'arcano'], serpente_marinha: ['agua'], tubarao: ['agua', 'sombra'],
  salamandra: ['fogo'], cao_de_lava: ['fogo', 'terra'], fenix_menor: ['fogo', 'vida'], ghoul: ['morte'],
  cavaleiro_morto: ['morte', 'marcial'], sombra_rastejante: ['sombra'], olho_vil: ['vileza', 'arcano'], trevo_carnivoro: ['vida', 'terra'],
  ent: ['vida', 'terra'], fada: ['arcano', 'luz'], anjo_menor: ['luz'], espectro: ['morte', 'arcano'],
  golem_pedra: ['terra'], automato: ['eletricidade', 'marcial'], imp: ['vileza'], demonio_maior: ['vileza', 'fogo'],
  wyvern: ['ar', 'fogo'], dragao_jovem: ['fogo', 'arcano'], troll_montanhes: ['vigor', 'terra'], ciclope_forjador: ['vigor', 'fogo'],
  gosma_acida: ['agua', 'vileza'], slime_cristalino: ['terra', 'agua'], batedor_orc: ['marcial', 'vigor'], arauto_elfico: ['arcano', 'ar'],
};

const TODAS: readonly string[] = Object.keys(AFINIDADES_CRIATURA).sort();

/** Criatura fixa de um combatente sem ficha: `hash(id)` entre as de afinidade com o elemento (todas as 32 se nenhuma tem). */
export function criaturaPorId(id: string, elemento?: string | null): string {
  const afins = typeof elemento === 'string' ? TODAS.filter((c) => AFINIDADES_CRIATURA[c].includes(elemento)) : [];
  const lista = afins.length > 0 ? afins : TODAS;
  return lista[hashString(`${id}|companheiro-invocado`) % lista.length];
}

/** Chefes e mini-bosses NOMEADOS que invocam (lista explícita; nunca por elemento). Hoje: os 3 desafiantes do Torneio. */
export const CHEFES_NOMEADOS_INVOCAM: readonly string[] = ['npc-espina', 'npc-quartzo', 'npc-mare'];

/** O NPC inimigo invoca? Só id da lista. Flag desligada = false. */
export function eNpcInvocador(npcId: string | null | undefined, ligado: boolean = COMPANHEIRO_INVOCADO): boolean {
  return ligado && typeof npcId === 'string' && CHEFES_NOMEADOS_INVOCAM.includes(npcId);
}

/** O companheiro de um NPC nomeado, ou `null`. */
export function companheiroDoNpc(npcId: string, elemento: string | null | undefined, ligado: boolean = COMPANHEIRO_INVOCADO): string | null {
  return eNpcInvocador(npcId, ligado) ? criaturaPorId(npcId, elemento) : null;
}

/**
 * O lado do oponente que o SERVIDOR mandou, com a criatura preenchida quando faltar. O servidor decide `invoca` (pelo save ou pela
 * tabela dos simulados) e manda `companheiro` só para jogador real; para o simulado ele manda `invoca: true` sem criatura, e a cena a
 * tira daqui: `hash(id)` entre as de afinidade com o elemento (mesma regra de `companheiroDoSimulado`). Sem `invoca` ou já com
 * criatura = devolve o MESMO objeto; `invoca` com id/elemento inúteis cai nas 32 (nunca quebra, nunca fica sem criatura).
 */
export function comCriaturaDoOponente(lado: DuelSide, oppId: string | null | undefined, elemento?: string | null): DuelSide {
  if (lado.invoca !== true || lado.companheiro) return lado;
  return { ...lado, companheiro: criaturaPorId(oppId ?? '', elemento ?? lado.fx?.elBasica ?? null) };
}
