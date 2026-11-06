/**
 * GUILDA DOS MERCENÁRIOS (plano do onboarding velado §11, M1–M5; 30/10/2026)
 * ==========================================================================
 *
 * Por dia do jogador o jogo oferece UMA missão, de UMA Ordem principal (Filtradores = Benevolência,
 * Tecelões = Harmonia, Rompentes = Poder; D22: "Ordem", não "clã"). A tarefa é sorteada DENTRO da Ordem,
 * do catálogo PRÓPRIO da Guilda (`data/mercTarefas.ts`): tarefa pontual, de um dia, uma vez, sem frequência
 * nem hábito (dono, 06/11/2026) e com o benefício em PT/EN. Confirmação pela pergunta de honestidade.
 * Recompensa: só pontos do tipo (3 se `effort` 1, 5 se 2) pelo mesmo caminho do `feedFood`
 * (`powerPoints`… + `attributesSinceLastEvolution`). Sem XP, sem Bits, fora da meta diária.
 * Só a partir do rookie (BB recusa).
 *
 * LINHAS VERMELHAS: a missão é CONVITE. "Ainda não" não custa nada, não há contador de missões
 * perdidas nem sequência. A copy diz o que a atividade É, nunca o que ela cura (L8).
 *
 * Estado: `GameState.mercMission {day, ordem, activityId, done}` (leitura tolerante abaixo; espelho
 * em `functions/api/_mercMission.js`, paridade em `mercMission.parity.test.js`).
 */
import { MERC_TAREFAS, MERC_TAREFAS_BY_ID, mercTarefaValida, type MercTarefa } from '../data/mercTarefas';
import type { BranchType } from '../types/attributes';
import { isBBStage } from './bbStage';

import { MERC_ORDENS, sanitizeMercMission, type MercOrdem, type MercMissionState } from './mercMissionSave';
export { MERC_ORDENS, sanitizeMercMission, type MercOrdem, type MercMissionState };

/** Tipo (atributo) de cada Ordem principal. */
export const MERC_TIPO: Record<MercOrdem, BranchType> = {
  filtrador: 'benevolence', tecelao: 'harmony', rompente: 'power',
};

export const MERC_NOME: Record<MercOrdem, { pt: string; en: string; ordemPt: string; ordemEn: string }> = {
  filtrador: { pt: 'Vithor', en: 'Vithor', ordemPt: 'Ordem dos Filtradores', ordemEn: 'Order of the Filterers' },
  tecelao: { pt: 'Pim', en: 'Pim', ordemPt: 'Ordem dos Tecelões', ordemEn: 'Order of the Weavers' },
  rompente: { pt: 'Thassia', en: 'Thassia', ordemPt: 'Ordem dos Rompentes', ordemEn: 'Order of the Breakers' },
};

/** Retratos placeholder esperados (a arte final vem da `/squad-arte`; ausente = silhueta nomeada). */
export const MERC_RETRATO: Record<MercOrdem, string> = {
  filtrador: 'lider-filtradores.png', tecelao: 'lider-teceloes.png', rompente: 'lider-rompentes.png',
};

/** Tarefas elegíveis da Ordem: só as que passam no porteiro (um dia, sem frequência, sem promessa de saúde, com benefício PT/EN). */
export function mercPool(ordem: MercOrdem): MercTarefa[] {
  return MERC_TAREFAS
    .filter(t => t.ordem === ordem && mercTarefaValida(t))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}

/** Sorteio determinístico: semente = dia do jogador + Ordem. Reabrir o app não troca a missão. */
export function sortearMerc(dayKey: string, ordem: MercOrdem): MercTarefa | undefined {
  const pool = mercPool(ordem);
  return pool.length ? pool[fnv1a(`${dayKey}|${ordem}`) % pool.length] : undefined;
}

/** Pontos de tipo (M4): 3 se o `effort` é 1, 5 se 2. */
export function pontosMerc(item: Pick<MercTarefa, 'effort'>): 3 | 5 {
  return item.effort === 1 ? 3 : 5;
}

/**
 * A tarefa que a missão guardada mostra. Proposta que não é do catálogo da Guilda (save antigo, que
 * guardava o id de um hábito do catálogo geral, ou id adulterado) e ainda NÃO foi cumprida é DESCARTADA
 * e sorteada de novo para o mesmo dia e Ordem (determinístico). Já cumprida fica como está: foi paga.
 */
export function tarefaDaMissao(m: MercMissionState): MercTarefa | undefined {
  const t = MERC_TAREFAS_BY_ID[m.activityId];
  if (t && t.ordem === m.ordem && mercTarefaValida(t)) return t;
  return m.done ? undefined : sortearMerc(m.day, m.ordem);
}

/** Troca a proposta pendente fora da regra pela sorteada; devolve o MESMO objeto se nada mudou. */
export function renovarMercPendente<T extends { mercMission?: MercMissionState }>(s: T): T {
  const m = s.mercMission;
  if (!m || m.done) return s;
  const t = tarefaDaMissao(m);
  if (!t) return { ...s, mercMission: undefined };
  return t.id === m.activityId ? s : { ...s, mercMission: { ...m, activityId: t.id } };
}

export type MercRecusa = 'bb' | 'ja-escolheu' | 'sem-atividade';

type MercState = {
  evolutionStage?: unknown;
  mercMission?: MercMissionState;
  powerPoints: number; harmonyPoints: number; benevolencePoints: number;
  attributesSinceLastEvolution?: { power: number; harmony: number; benevolence: number };
};

/** A missão de HOJE (a de outro dia não conta: o convite renova sozinho, sem castigo). */
export function mercDeHoje(s: Pick<MercState, 'mercMission'>, dayKey: string): MercMissionState | null {
  return s.mercMission && s.mercMission.day === dayKey ? s.mercMission : null;
}

/** Escolhe a Ordem do dia. Recusa BB (M5), 2ª escolha no dia (M1) e Ordem sem atividade elegível. Pura. */
export function escolherMerc<T extends MercState>(s: T, ordem: MercOrdem, dayKey: string): { state: T; recusa?: MercRecusa } {
  if (isBBStage(s.evolutionStage)) return { state: s, recusa: 'bb' };
  if (mercDeHoje(s, dayKey)) return { state: s, recusa: 'ja-escolheu' };
  const item = sortearMerc(dayKey, ordem);
  if (!item) return { state: s, recusa: 'sem-atividade' };
  return { state: { ...s, mercMission: { day: dayKey, ordem, activityId: item.id, done: false } } };
}

/** Soma pontos de tipo pelo MESMO caminho do `feedFood`: totais + `attributesSinceLastEvolution`. */
export function darPontosDeTipo<T extends MercState>(s: T, tipo: BranchType, pts: number): T {
  const add = { power: 0, harmony: 0, benevolence: 0, [tipo]: pts };
  const since = s.attributesSinceLastEvolution;
  return {
    ...s,
    powerPoints: s.powerPoints + add.power,
    harmonyPoints: s.harmonyPoints + add.harmony,
    benevolencePoints: s.benevolencePoints + add.benevolence,
    attributesSinceLastEvolution: {
      power: (since?.power ?? 0) + add.power,
      harmony: (since?.harmony ?? 0) + add.harmony,
      benevolence: (since?.benevolence ?? 0) + add.benevolence,
    },
  };
}

/** "Sim, fiz": fecha a missão de hoje e paga uma vez só (idempotente: 2ª chamada é no-op). */
export function concluirMerc<T extends MercState>(s: T, dayKey: string): T {
  const m = mercDeHoje(s, dayKey);
  if (!m || m.done || isBBStage(s.evolutionStage)) return s;
  const item = tarefaDaMissao(m);
  const pago = item ? darPontosDeTipo(s, MERC_TIPO[m.ordem], pontosMerc(item)) : s;
  return { ...pago, mercMission: { ...m, activityId: item?.id ?? m.activityId, done: true } };
}
