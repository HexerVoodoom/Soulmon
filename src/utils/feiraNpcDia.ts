/**
 * A FALA DO MERCADOR DEPOIS DO DESAFIO (dono, 16/11/2026): com o desafio do dia cumprido (ou a volta já vista), a sala deixa de
 * oferecer ação e o NPC conta três coisas, só isso: o que o jogador achou hoje, o que o clã achou e que amanhã tem mais.
 *
 * Função PURA. O "que o clã achou" é SÓ o agregado que a sala já recebe (`FeiraResumo`: chefe com a força que resta, marcas do
 * desafio): o servidor não manda quem encontrou o quê (LV-G1), então não há fala por aliado e não se inventa uma.
 */
import { BOSS_ROSTER, bossText } from '../data/bossRoster';
import { feiraText } from './feiraCopy';
import type { FeiraResumo } from './feira';
import type { FeiraVolta } from './feiraVolta';
import type { Language } from './i18n';

export interface FeiraNpcDia { hoje: string; cla: string; amanha: string }

export function feiraNpcDia(language: Language, volta: FeiraVolta | null, resumo: FeiraResumo | null | undefined, hora: string): FeiraNpcDia {
  const isPt = language === 'pt-BR';
  const nomeDe = (bossId: string) => {
    const e = BOSS_ROSTER.find(b => b.id === bossId);
    return e ? bossText(e, isPt).name : bossId;
  };
  let hoje: string;
  if (!volta) hoje = feiraText(language, 'npc.hoje.geral');
  else if (volta.kind === 'evento') {
    const ev = volta.evento;
    hoje = ev.kind === 'boss' ? feiraText(language, 'npc.hoje.boss', { name: nomeDe(ev.bossId) })
      : ev.kind === 'trail' ? feiraText(language, 'npc.hoje.trail') : feiraText(language, 'npc.hoje.rest');
  } else if (volta.kind === 'loja') hoje = feiraText(language, 'npc.hoje.loja');
  else if (volta.kind === 'achado') hoje = feiraText(language, 'npc.hoje.achado');
  else hoje = feiraText(language, 'npc.hoje.nada');

  let cla: string;
  if (resumo?.state === 'boss') {
    const name = nomeDe(resumo.bossId);
    const pct = Math.round(resumo.bossHpPct);
    cla = pct <= 0 ? feiraText(language, 'npc.cla.boss.caiu', { name }) : feiraText(language, 'npc.cla.boss', { name, pct });
  } else if (resumo?.state === 'trail') {
    cla = resumo.marks > 0 ? feiraText(language, 'npc.cla.trail', { n: resumo.marks }) : feiraText(language, 'npc.cla.trail.zero');
  } else if (resumo?.state === 'rest') cla = feiraText(language, 'npc.cla.rest');
  else cla = feiraText(language, 'npc.cla.geral');

  return { hoje, cla, amanha: feiraText(language, 'npc.amanha', { hora }) };
}
